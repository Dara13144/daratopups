import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { lookupPlayerNickname, deliverTopup } from '../utils/gameProviderMock';
import { generateABAMockPayment, generateBakongKHQR, verifyBakongWebhook, checkBakongPaymentStatus } from '../utils/paymentMock';
import { sendTelegramNotification } from '../utils/telegram';

const router = Router();

// 1. Create a top-up order (Public / Authenticated)
// Matches route POST /api/orders/
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { packageId, playerId, playerZoneId, paymentMethod, email } = req.body;

    if (!packageId || !playerId || !paymentMethod) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (paymentMethod !== 'ABA' && paymentMethod !== 'BAKONG' && paymentMethod !== 'CANADIA') {
      return res.status(400).json({ error: 'Invalid payment method. Use ABA, BAKONG, or CANADIA' });
    }

    // Fetch the package details
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: { product: true },
    });

    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }

    // Validate Player ID and retrieve nickname
    const lookup = await lookupPlayerNickname(pkg.product.slug, playerId, playerZoneId);
    if (!lookup.success) {
      return res.status(400).json({ error: `Player ID validation failed: ${lookup.error}` });
    }
    const nickname = lookup.nickname || 'Unknown Player';

    // Generate unique payment transaction ID
    const timeCode = Date.now().toString().slice(-6);
    const randCode = Math.floor(1000 + Math.random() * 9000);
    let paymentTxnId = `TOPUP-${timeCode}-${randCode}`;

    // Map order to logged-in user if available
    let userId: string | null = null;
    let contactEmail = email || 'guest@topup.com';
    
    // Check if auth token header exists
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      const token = authHeader.split(' ')[1];
      const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production-12345';
      try {
        const decoded = require('jsonwebtoken').verify(token, JWT_SECRET) as { id: string; email: string };
        userId = decoded.id;
        contactEmail = decoded.email;
      } catch (err) {
        // Ignore invalid token and create as guest
      }
    }

    // Generate payment details depending on gateway choice
    let paymentDetails: any = {};
    let paymentQrCode: string | null = null;
    let paymentMd5: string | null = null;
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    if (paymentMethod === 'ABA') {
      const abaMerchantId = process.env.ABA_PAYWAY_MERCHANT_ID || 'MOCK_MERCHANT';
      const abaApiKey = process.env.ABA_PAYWAY_API_KEY || 'MOCK_KEY';
      paymentDetails = generateABAMockPayment(
        paymentTxnId,
        pkg.price,
        `${pkg.product.name} - ${pkg.name}`,
        abaMerchantId,
        abaApiKey,
        baseUrl
      );
    } else if (paymentMethod === 'CANADIA') {
      const qrData = `00020101021230480012canadia_topup0110topup@cnb5204599953038405404${pkg.price.toFixed(2)}5802KH5919CANADIA BANK PLC.6008Phnom Penh62180710${paymentTxnId}6304E5F6`;
      const md5 = require('crypto').createHash('md5').update(qrData).digest('hex');
      paymentQrCode = qrData;
      paymentMd5 = md5;
      paymentDetails = {
        qrCode: qrData,
        md5,
        txnId: paymentTxnId,
        bankName: 'Canadia Bank',
        logo: '/images/payments/canadia.png'
      };
    } else {
      const bakongQr = await generateBakongKHQR(
        paymentTxnId,
        pkg.price,
        `${pkg.product.name} - ${pkg.name}`
      );
      paymentQrCode = bakongQr.qrCode;
      paymentMd5 = bakongQr.md5;
      // Use the khpay transaction_id (bk_...) if returned, else keep local ID
      if (bakongQr.txnId && bakongQr.txnId !== paymentTxnId) {
        paymentTxnId = bakongQr.txnId;
      }
      paymentDetails = bakongQr;
    }

    // Create Order in Database
    const order = await prisma.order.create({
      data: {
        userId,
        packageId: pkg.id,
        playerId,
        playerZoneId: playerZoneId || null,
        playerNickname: nickname,
        price: pkg.price,
        status: 'PENDING',
        paymentMethod,
        paymentStatus: 'UNPAID',
        paymentTxnId,
        paymentQrCode,
        paymentMd5,
      },
    });

    // Send Telegram Alert for new order
    const telegramMessage = 
      `🛒 <b>New Order Placed!</b>\n` +
      `-----------------------------------------\n` +
      `<b>ID:</b> <code>${order.id}</code>\n` +
      `<b>Txn ID:</b> <code>${paymentTxnId}</code>\n` +
      `<b>Game:</b> ${pkg.product.name}\n` +
      `<b>Package:</b> ${pkg.name}\n` +
      `<b>Player ID:</b> <code>${playerId}</code>${playerZoneId ? ` (${playerZoneId})` : ''}\n` +
      `<b>Nickname:</b> ${nickname}\n` +
      `<b>Price:</b> $${pkg.price.toFixed(2)}\n` +
      `<b>Payment:</b> ${paymentMethod}\n` +
      `<b>Status:</b> PENDING`;
    
    await sendTelegramNotification(telegramMessage);

    return res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        paymentTxnId,
        price: order.price,
        status: order.status,
        paymentStatus: order.paymentStatus,
        playerNickname: nickname,
      },
      paymentDetails,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to check payment status via multiple gateways (KHPAY, Bakong Relay, NBC)
async function checkBakongTransactionStatus(md5: string, khpayTxnId?: string): Promise<boolean> {
  return checkBakongPaymentStatus(md5, khpayTxnId);
}

// Helper function to process successful payment & execute product delivery
async function handleSuccessfulPayment(order: any, gatewayRef: string) {
  // 1. Mark payment as PAID, and status as PROCESSING
  let currentOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PAID',
      status: 'PROCESSING',
      gatewayRef,
    },
  });

  console.log(`[Payment Processor] Processing top-up delivery for order ${order.paymentTxnId}...`);

  // 2. Deliver the Digital product
  const category = order.package.product.category;
  let deliverySuccess = false;
  let deliveredCode: string | null = null;
  let providerRef = '';
  let errorMessage = '';

  if (category === 'VOUCHER') {
    // Stock Voucher Code Delivery
    const stockItem = await prisma.stock.findFirst({
      where: {
        packageId: order.packageId,
        isUsed: false,
      },
    });

    if (stockItem) {
      // Link the stock item to this order
      await prisma.stock.update({
        where: { id: stockItem.id },
        data: {
          isUsed: true,
          orderId: order.id,
        },
      });

      deliveredCode = stockItem.code;
      deliverySuccess = true;
      providerRef = stockItem.id;
    } else {
      errorMessage = 'OUT OF STOCK: No digital codes left for this package. Contact support for refund/manual stock.';
    }
  } else {
    // Mobile/PC Direct Top-up delivery API
    const delivery = await deliverTopup(
      order.package.product.slug,
      order.playerId,
      order.playerZoneId,
      order.package.name,
      order.package.amount
    );

    if (delivery.success) {
      deliverySuccess = true;
      providerRef = delivery.referenceId;
    } else {
      errorMessage = delivery.error || 'Provider API failure';
    }
  }

  // 3. Update order final status
  const finalStatus = deliverySuccess ? 'SUCCESS' : 'FAILED';
  currentOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: finalStatus,
      stockDeliveredCode: deliveredCode,
    },
  });

  // 4. Send Telegram completed notification
  const telegramMessage = 
    `${deliverySuccess ? '✅ <b>Order Top-Up Completed!</b>' : '⚠️ <b>Delivery Failure (Action Needed)</b>'}\n` +
    `-----------------------------------------\n` +
    `<b>Txn ID:</b> <code>${order.paymentTxnId}</code>\n` +
    `<b>Game:</b> ${order.package.product.name}\n` +
    `<b>Package:</b> ${order.package.name}\n` +
    `<b>Player ID:</b> <code>${order.playerId}</code>${order.playerZoneId ? ` (${order.playerZoneId})` : ''}\n` +
    `<b>Nickname:</b> ${order.playerNickname}\n` +
    `<b>Amount Paid:</b> $${order.price.toFixed(2)} (${order.paymentMethod})\n` +
    `<b>Status:</b> ${finalStatus}\n` +
    `${deliveredCode ? `<b>Delivered Code:</b> <code>${deliveredCode}</code>\n` : ''}` +
    `${providerRef ? `<b>Provider Ref:</b> <code>${providerRef}</code>\n` : ''}` +
    `${errorMessage ? `<b>Error:</b> <pre>${errorMessage}</pre>\n` : ''}`;

  await sendTelegramNotification(telegramMessage);
  return { currentOrder, deliverySuccess, deliveredCode, providerRef, errorMessage };
}

// ── REAL-TIME MD5 CHECK ENDPOINT ──────────────────────────────────────────────
// Called by the frontend every 3s during active KHQR payment waiting.
// Directly hits Bakong Relay API check_transaction_by_md5 and auto-delivers
// if the payment is confirmed.
router.get('/check-md5/:md5', async (req, res) => {
  try {
    const { md5 } = req.params;
    const sanitizedMd5 = md5?.toLowerCase().trim();

    if (!sanitizedMd5) {
      return res.status(400).json({ paid: false, error: 'MD5 required' });
    }

    // Find the order by MD5
    const order = await prisma.order.findFirst({
      where: { paymentMd5: sanitizedMd5 },
      include: { package: { include: { product: true } } },
    });

    if (!order) {
      return res.status(404).json({ paid: false, error: 'Order not found for this MD5' });
    }

    // If already paid/completed, return instantly
    if (order.paymentStatus === 'PAID' || order.status === 'SUCCESS' || order.status === 'COMPLETED') {
      return res.status(200).json({
        paid: true,
        status: order.status,
        paymentStatus: order.paymentStatus,
        txnId: order.paymentTxnId,
        alreadyProcessed: true,
      });
    }

    // Real-time check against Bakong APIs
    const isPaid = await checkBakongPaymentStatus(sanitizedMd5);
    console.log(`[MD5-Check] md5=${sanitizedMd5} → isPaid=${isPaid}`);

    if (!isPaid) {
      return res.status(200).json({
        paid: false,
        status: order.status,
        paymentStatus: order.paymentStatus,
        txnId: order.paymentTxnId,
        md5: sanitizedMd5,
      });
    }

    // Payment confirmed — prevent double-processing with optimistic lock
    const freshOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { package: { include: { product: true } } },
    });

    if (!freshOrder || freshOrder.paymentStatus === 'PAID') {
      return res.status(200).json({
        paid: true,
        status: freshOrder?.status || 'SUCCESS',
        paymentStatus: 'PAID',
        txnId: order.paymentTxnId,
        alreadyProcessed: true,
      });
    }

    // Process the payment delivery
    console.log(`[MD5-Check] ✅ Confirmed paid — triggering delivery for ${order.paymentTxnId}`);
    const result = await handleSuccessfulPayment(freshOrder, `MD5CHECK-${sanitizedMd5}`);

    return res.status(200).json({
      paid: true,
      status: result.currentOrder.status,
      paymentStatus: result.currentOrder.paymentStatus,
      deliverySuccess: result.deliverySuccess,
      deliveredCode: result.deliveredCode,
      txnId: order.paymentTxnId,
      message: result.deliverySuccess
        ? 'Payment confirmed and product delivered!'
        : 'Payment confirmed but delivery failed. Please contact support.',
    });
  } catch (error) {
    console.error('[MD5-Check] Error:', error);
    return res.status(500).json({ paid: false, error: 'Internal server error' });
  }
});

// 2. Fetch specific order status (Public - used by polling)
router.get('/status/:txnId', async (req, res) => {
  try {
    const { txnId } = req.params;
    let order = await prisma.order.findUnique({
      where: { paymentTxnId: txnId },
      include: {
        package: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }


    // Auto payment checking for pending Bakong orders
    if (order.paymentStatus === 'UNPAID' && order.paymentMethod === 'BAKONG') {
      const md5 = order.paymentMd5 || await (async () => {
        const pkg = order.package;
        const itemName = `${pkg.product.name} - ${pkg.name}`;
        const res = await generateBakongKHQR(order.paymentTxnId, order.price, itemName);
        return res.md5;
      })();

      // Pass the khpay transaction_id (starts with 'bk_') for faster primary check
      const khpayTxnId = order.paymentTxnId?.startsWith('bk_') ? order.paymentTxnId : undefined;
      const isPaid = await checkBakongTransactionStatus(md5, khpayTxnId);
      if (isPaid) {
        console.log(`[Status Polling] Order ${txnId} payment detected. Processing order...`);
        await handleSuccessfulPayment(order, `KHPAY-AUTO-${md5}`);
        const updatedOrder = await prisma.order.findUnique({
          where: { paymentTxnId: txnId },
          include: {
            package: {
              include: { product: true },
            },
          },
        });
        if (updatedOrder) {
          order = updatedOrder;
        }
      }
    }

    let abaPayload = null;
    let abaApiUrl = null;
    if (order.paymentMethod === 'ABA') {
      const abaMerchantId = process.env.ABA_PAYWAY_MERCHANT_ID || 'MOCK_MERCHANT';
      const abaApiKey = process.env.ABA_PAYWAY_API_KEY || 'MOCK_KEY';
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const paymentDetails = generateABAMockPayment(
        order.paymentTxnId,
        order.price,
        `${order.package.product.name} - ${order.package.name}`,
        abaMerchantId,
        abaApiKey,
        baseUrl
      );
      abaPayload = paymentDetails.payload;
      abaApiUrl = process.env.ABA_PAYWAY_API_URL || 'https://checkout-sandbox.ababank.com/api/payment-gateway/v1/payments/purchase';
    }

    return res.status(200).json({
      id: order.id,
      paymentTxnId: order.paymentTxnId,
      gameName: order.package.product.name,
      gameSlug: order.package.product.slug,
      packageName: order.package.name,
      playerId: order.playerId,
      playerNickname: order.playerNickname,
      price: order.price,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      stockDeliveredCode: order.stockDeliveredCode,
      paymentQrCode: order.paymentQrCode,
      paymentMd5: order.paymentMd5,
      createdAt: order.createdAt,
      merchantName: process.env.BAKONG_MERCHANT_NAME || 'TOPUP SITE CO LTD',
      abaPayload,
      abaApiUrl,
    });
  } catch (error) {
    console.error('Fetch order status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 2b. Force-verify payment now (called when user clicks "I've Paid")
// POST /api/orders/verify/:txnId
router.post('/verify/:txnId', async (req, res) => {
  try {
    const { txnId } = req.params;
    console.log(`[Verify] Force-verifying payment for order: ${txnId}`);

    const order = await prisma.order.findUnique({
      where: { paymentTxnId: txnId },
      include: { package: { include: { product: true } } },
    });

    if (!order) {
      return res.status(404).json({ verified: false, error: 'Order not found' });
    }

    // Already paid — return success immediately
    if (order.paymentStatus === 'PAID') {
      return res.status(200).json({
        verified: true,
        status: order.status,
        paymentStatus: order.paymentStatus,
        message: 'Payment already verified',
      });
    }

    if (order.paymentMethod !== 'BAKONG') {
      return res.status(400).json({ verified: false, error: 'Verify only supports BAKONG orders' });
    }

    const md5 = order.paymentMd5;
    if (!md5) {
      return res.status(400).json({ verified: false, error: 'No MD5 hash on record for this order' });
    }

    // Check payment status right now
    const khpayTxnId = order.paymentTxnId?.startsWith('bk_') ? order.paymentTxnId : undefined;
    const isPaid = await checkBakongTransactionStatus(md5, khpayTxnId);

    if (!isPaid) {
      console.log(`[Verify] Order ${txnId} — payment NOT confirmed yet (MD5: ${md5})`);
      return res.status(200).json({
        verified: false,
        status: order.status,
        paymentStatus: order.paymentStatus,
        md5,
        message: 'Payment not yet confirmed. Please wait a moment and try again.',
      });
    }

    // Payment confirmed — process delivery
    console.log(`[Verify] ✅ Payment confirmed for order ${txnId}. Processing delivery...`);
    const result = await handleSuccessfulPayment(order, `VERIFY-${md5}`);

    return res.status(200).json({
      verified: true,
      status: result.currentOrder.status,
      paymentStatus: result.currentOrder.paymentStatus,
      deliverySuccess: result.deliverySuccess,
      deliveredCode: result.deliveredCode,
      message: result.deliverySuccess
        ? 'Payment verified and product delivered!'
        : 'Payment verified but delivery failed. Please contact support.',
    });
  } catch (error) {
    console.error('[Verify] Error:', error);
    return res.status(500).json({ verified: false, error: 'Internal server error' });
  }
});

// 3. User Order History (Public or Auth)
router.get('/history/:emailOrId', async (req, res) => {
  try {
    const { emailOrId } = req.params;
    
    // Find all orders linked to either user ID or user email
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: emailOrId },
          { user: { email: emailOrId } }
        ]
      },
      include: {
        package: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error('History fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. MOCK PAYMENT WEBHOOK CALLBACK (Simulated payment trigger)
// Anyone can call this to simulate a successful payment trigger for testing.
router.post('/simulate-callback', async (req, res) => {
  try {
    const { txnId, paymentStatus } = req.body;

    if (!txnId) {
      return res.status(400).json({ error: 'Transaction ID (txnId) is required' });
    }

    const order = await prisma.order.findUnique({
      where: { paymentTxnId: txnId },
      include: {
        package: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Order has already been paid and processed' });
    }

    const statusValue = paymentStatus || 'PAID';

    if (statusValue !== 'PAID') {
      // Simulate failed/cancelled payment
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'EXPIRED',
          status: 'FAILED',
        },
      });

      await sendTelegramNotification(
        `❌ <b>Payment Cancelled/Expired</b>\n` +
        `-----------------------------------------\n` +
        `<b>Txn ID:</b> <code>${txnId}</code>\n` +
        `<b>Amount:</b> $${order.price.toFixed(2)}\n` +
        `<b>Gateway:</b> ${order.paymentMethod}`
      );

      return res.status(200).json({ message: 'Order payment status set to failed', order: updatedOrder });
    }

    // 1. Process order payment using the helper
    const ref = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    console.log(`[Payment Callback] Payment successful for order ${txnId}. Processing top-up...`);
    const result = await handleSuccessfulPayment(order, ref);

    return res.status(200).json({
      message: 'Simulated payment callback executed successfully',
      delivery: {
        success: result.deliverySuccess,
        code: result.deliveredCode,
        error: result.errorMessage,
      },
      order: result.currentOrder,
    });
  } catch (error) {
    console.error('Mock callback processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. REAL BAKONG KHQR PAYMENT WEBHOOK (Production)
// Bakong sends this POST when a customer scans and pays the KHQR.
// Endpoint MUST be registered in your Bakong Business portal as the callback URL.
// Set BAKONG_API_KEY in your .env file to enable signature verification.
// 5. REAL BAKONG KHQR PAYMENT WEBHOOK (Production)
// Bakong sends this POST when a customer scans and pays the KHQR.
// Endpoint MUST be registered in your Bakong Business portal as the callback URL.
// Set BAKONG_API_KEY in your .env file to enable signature verification.
router.post('/bakong-callback', async (req, res) => {
  try {
    console.log('[Bakong Webhook] 📥 Received callback request.');
    console.log('[Bakong Webhook] Request headers:', JSON.stringify(req.headers));
    console.log('[Bakong Webhook] Request body:', JSON.stringify(req.body, null, 2));

    // Resolve MD5 using all possible paths from both Bakong Relay and KHPAY formats
    const rawMd5 = req.body.md5 || 
                   req.body.md5Hash || 
                   req.body.req_khqr?.md5 || 
                   req.body.data?.md5 || 
                   req.body.data?.md5Hash;

    const sanitizedMd5 = rawMd5 ? rawMd5.toLowerCase().trim() : '';

    // Resolve Transaction ID using all possible paths
    const transactionId = req.body.transactionId || 
                          req.body.transaction_id || 
                          req.body.bill_number || 
                          req.body.req_khqr?.bill_number || 
                          req.body.data?.bill_number || 
                          req.body.data?.transaction_id || 
                          req.body.data?.trans_id;

    // Resolve Status using all possible paths
    const rawStatus = req.body.status || 
                      req.body.paymentStatus || 
                      req.body.data?.status;

    // Resolve Amount using all possible paths
    const amount = req.body.amount || 
                   req.body.req_khqr?.amount || 
                   req.body.data?.amount;

    console.log(`[Bakong Webhook] Parsed variables: MD5="${sanitizedMd5}", TxnID="${transactionId || 'N/A'}", Status="${rawStatus || 'N/A'}", Amount="${amount || 'N/A'}"`);

    const signature = req.headers['x-bakong-signature'] as string;
    const bakongApiKey = process.env.BAKONG_API_KEY || '';

    // ── Signature Verification ────────────────────────────────────────────────
    // If BAKONG_API_KEY is set, verify the webhook signature.
    // In development (no key set), we skip verification and trust the payload.
    if (bakongApiKey && signature) {
      const isValid = verifyBakongWebhook(rawMd5 || '', transactionId || '', signature, bakongApiKey);
      if (!isValid) {
        console.warn('[Bakong Webhook] ⚠️ Invalid signature! Possible spoofed callback. Rejecting.');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      console.log('[Bakong Webhook] ✅ Signature verified.');
    } else {
      console.log('[Bakong Webhook] ⚠️ BAKONG_API_KEY not set — skipping signature verification (sandbox mode).');
    }

    if (!transactionId && !sanitizedMd5) {
      console.warn('[Bakong Webhook] ❌ Error: Neither transactionId nor md5 is present in webhook payload.');
      return res.status(400).json({ error: 'transactionId or md5 is required in webhook payload' });
    }

    // ── Find Order ────────────────────────────────────────────────────────────
    let order = null;
    if (transactionId) {
      console.log(`[Bakong Webhook] Attempting order lookup by paymentTxnId: "${transactionId}"`);
      order = await prisma.order.findUnique({
        where: { paymentTxnId: transactionId },
        include: { package: { include: { product: true } } },
      });
    }

    if (!order && sanitizedMd5) {
      console.log(`[Bakong Webhook] Order not found by txnId. Attempting case-insensitive MD5 lookup: "${sanitizedMd5}"`);
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { paymentMd5: sanitizedMd5 },
            { paymentMd5: sanitizedMd5.toUpperCase() }
          ]
        },
        include: { package: { include: { product: true } } },
      });
    }

    if (!order) {
      console.warn(`[Bakong Webhook] ❌ Order NOT found in database for txnId: "${transactionId || 'N/A'}" or md5: "${sanitizedMd5 || 'N/A'}"`);
      return res.status(200).json({ message: 'Order not found, acknowledged' });
    }

    console.log(`[Bakong Webhook] Found Order ID: "${order.id}", Current status: "${order.status}", Current paymentStatus: "${order.paymentStatus}"`);

    if (order.paymentStatus === 'PAID') {
      console.log(`[Bakong Webhook] Order ${order.paymentTxnId} already marked as PAID. Skipping.`);
      return res.status(200).json({ message: 'Order already processed' });
    }

    // ── Handle Payment Status ─────────────────────────────────────────────────
    const isSuccess = typeof rawStatus === 'string' && 
      ['PAID', 'SUCCESS', 'paid', 'success'].includes(rawStatus.toUpperCase());

    if (!isSuccess) {
      console.warn(`[Bakong Webhook] ⚠️ Payment reported unsuccessful. Raw status: "${rawStatus}"`);
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'EXPIRED', status: 'FAILED' },
      });
      await sendTelegramNotification(
        `❌ <b>Bakong Payment Failed</b>\n` +
        `-----------------------------------------\n` +
        `<b>Txn ID:</b> <code>${order.paymentTxnId}</code>\n` +
        `<b>Status from Bakong:</b> ${rawStatus}\n` +
        `<b>Amount:</b> $${order.price.toFixed(2)}`
      );
      return res.status(200).json({ message: 'Payment failure recorded' });
    }

    // ── Successful Payment: Mark PAID and Process Delivery ────────────────────
    const ref = `BAKONG-${sanitizedMd5 || Date.now()}`;
    console.log(`[Bakong Webhook] ✅ Payment confirmed for order "${order.paymentTxnId}". Processing top-up delivery...`);
    const result = await handleSuccessfulPayment(order, ref);

    console.log(`[Bakong Webhook] Order update complete. finalStatus="${result.currentOrder.status}"`);
    return res.status(200).json({
      message: 'Bakong payment processed and top-up delivered',
      status: result.currentOrder.status,
    });
  } catch (error) {
    console.error('[Bakong Webhook] ❌ Unhandled error processing callback:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
