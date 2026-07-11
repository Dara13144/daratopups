import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import multer from 'multer';
import prisma from './prisma';

// Route Imports
import authRouter from './routes/auth';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import adminRouter from './routes/admin';
import { checkBakongPaymentStatus } from './utils/paymentMock';

// Load environmental variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Middleware configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve uploaded product images statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Base health route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    sandbox: process.env.SANDBOX_MODE === 'true',
  });
});

// Mounting Sub-Routers
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

// ── Product Image Upload Endpoint ────────────────────────────────────────────
import { authenticateJWT, requireAdmin } from './middleware/auth';
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'public', 'uploads', 'products'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

app.post(
  '/api/admin/upload-image',
  authenticateJWT,
  requireAdmin,
  upload.single('image'),
  (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/products/${req.file.filename}`;
    return res.status(200).json({ imageUrl });
  }
);

// Express Error Handling Middleware fallback
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND PAYMENT SWEEPER
// Checks every 10 seconds for any UNPAID BAKONG orders and verifies via
// khpay.site. If paid → auto-delivers product and marks order COMPLETED.
// This ensures payments are never missed even if the browser tab was closed.
// ─────────────────────────────────────────────────────────────────────────────
const SWEEP_INTERVAL_MS = 3_000; // 3 seconds — real-time MD5 check
const BAKONG_RELAY_URL   = process.env.BAKONG_RELAY_URL   || 'https://api.bakongrelay.com/v1';
const BAKONG_RELAY_TOKEN = process.env.BAKONG_RELAY_TOKEN  || process.env.BAKONG_TOKEN || '';

// Track in-progress sweeps to prevent overlapping runs
let sweepRunning = false;

async function checkRelayStatus(md5: string, khpayTxnId?: string): Promise<boolean> {
  return checkBakongPaymentStatus(md5, khpayTxnId);
}

async function runPaymentSweep() {
  if (sweepRunning) return;
  sweepRunning = true;
  try {
    // Find all UNPAID BAKONG orders created within the last 24 hours (no point checking old ones)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingOrders = await prisma.order.findMany({
      where: {
        paymentStatus: 'UNPAID',
        paymentMethod: 'BAKONG',
        createdAt: { gte: cutoff },
      },
      include: {
        package: { include: { product: true } },
      },
    });

    if (pendingOrders.length === 0) {
      sweepRunning = false;
      return;
    }

    console.log(`[Sweeper] Checking ${pendingOrders.length} pending BAKONG order(s)...`);

    for (const order of pendingOrders) {
      try {
        const md5 = order.paymentMd5;
        if (!md5) continue;

        const khpayTxnId = order.paymentTxnId?.startsWith('bk_') ? order.paymentTxnId : undefined;
        const isPaid = await checkRelayStatus(md5, khpayTxnId);

        if (isPaid) {
          console.log(`[Sweeper] ✅ Payment confirmed for order ${order.paymentTxnId}. Auto-delivering...`);

          // Re-verify it's still UNPAID (prevent double delivery in race condition)
          const freshOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { package: { include: { product: true } } },
          });
          if (!freshOrder || freshOrder.paymentStatus === 'PAID') {
            console.log(`[Sweeper] Order ${order.paymentTxnId} already processed. Skipping.`);
            continue;
          }

          // Mark as PAID first (prevents race condition)
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID', status: 'PROCESSING', gatewayRef: `SWEEP-${md5}` },
          });

          // Deliver product
          const { deliverTopup } = await import('./utils/gameProviderMock');
          const { sendTelegramNotification } = await import('./utils/telegram');
          const category = order.package.product.category;
          let deliveredCode: string | null = null;
          let deliverySuccess = false;
          let providerRef = '';

          if (category === 'VOUCHER') {
            const stockItem = await prisma.stock.findFirst({
              where: { packageId: order.packageId, isUsed: false },
            });
            if (stockItem) {
              await prisma.stock.update({
                where: { id: stockItem.id },
                data: { isUsed: true, orderId: order.id },
              });
              deliveredCode = stockItem.code;
              deliverySuccess = true;
              providerRef = stockItem.id;
            }
          } else {
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
            }
          }

          const finalStatus = deliverySuccess ? 'SUCCESS' : 'FAILED';
          await prisma.order.update({
            where: { id: order.id },
            data: { status: finalStatus, stockDeliveredCode: deliveredCode },
          });

          await sendTelegramNotification(
            `${deliverySuccess ? '✅ <b>Order Completed (Auto-Sweep)</b>' : '⚠️ <b>Delivery Failed (Auto-Sweep)</b>'}\n` +
            `-----------------------------------------\n` +
            `<b>Txn ID:</b> <code>${order.paymentTxnId}</code>\n` +
            `<b>Game:</b> ${order.package.product.name}\n` +
            `<b>Package:</b> ${order.package.name}\n` +
            `<b>Player:</b> <code>${order.playerId}</code>\n` +
            `<b>Amount:</b> $${order.price.toFixed(2)}\n` +
            `<b>Status:</b> ${finalStatus}\n` +
            `${deliveredCode ? `<b>Code:</b> <code>${deliveredCode}</code>\n` : ''}` +
            `${providerRef ? `<b>Ref:</b> <code>${providerRef}</code>\n` : ''}`
          );

          console.log(`[Sweeper] Order ${order.paymentTxnId} finalized → ${finalStatus}`);
        }
      } catch (err) {
        console.error(`[Sweeper] Error checking order ${order.paymentTxnId}:`, err);
      }
    }
  } catch (err) {
    console.error('[Sweeper] Fatal sweep error:', err);
  } finally {
    sweepRunning = false;
  }
}

// Start Express Server (Trigger nodemon restart)
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Top-Up Server is running on port ${PORT}`);
  console.log(`🛠️ Mode: ${process.env.SANDBOX_MODE === 'true' ? 'SANDBOX / SIMULATOR' : 'PRODUCTION'}`);
  console.log(`🌐 API Endpoint: http://localhost:${PORT}`);
  console.log(`===============================================`);

  // Start background payment sweeper
  setInterval(runPaymentSweep, SWEEP_INTERVAL_MS);
  console.log(`🔄 Payment sweeper started — checking every ${SWEEP_INTERVAL_MS / 1000}s`);
});

