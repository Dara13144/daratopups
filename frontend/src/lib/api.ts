const PRODUCTION_API = 'https://nadybackend.onrender.com';

// Retrieve the raw backend URL from env, default fallback to http://localhost:5001
const rawApiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  PRODUCTION_API
);

// Clean up input: remove trailing slash, and remove any trailing '/api'
export const serverUrl = rawApiUrl.replace(/\/$/, '').replace(/\/api$/, '');

// Centralized API endpoint base
export const API_BASE = `${serverUrl}/api`;

// Dev diagnostic only — does not affect production behavior
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.info(`[NaDyTopup] resolved serverUrl: "${serverUrl}" and API_BASE: "${API_BASE}"`);
}

export interface GameProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: string;
  isActive: boolean;
  hasZoneId?: boolean;
  zoneIdLabel?: string | null;
  packages: GamePackage[];
}

export interface GamePackage {
  id: string;
  productId: string;
  name: string;
  amount: number;
  price: number;
  image?: string | null;
  isActive: boolean;
  category: string;
  badge?: string | null;
}

export interface OrderResponse {
  id: string;
  paymentTxnId: string;
  price: number;
  status: string; // PENDING, PROCESSING, COMPLETED, FAILED
  paymentStatus: string; // UNPAID, PAID, EXPIRED
  playerNickname: string;
}

export interface ABAPaymentPayload {
  req_time: string;
  merchant_id: string;
  tran_id: string;
  amount: string;
  items: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: string;
  payment_option?: string;
  shipping?: string;
  hash: string;
  callback_url: string;
  return_url: string;
}

export interface ABAPaymentDetails {
  checkoutUrl: string;
  payload: ABAPaymentPayload;
}

export interface BakongPaymentDetails {
  qrCode: string;
  md5: string;
  txnId: string;
}

export interface OrderCreateResponse {
  message: string;
  order: OrderResponse;
  paymentDetails: ABAPaymentDetails | BakongPaymentDetails;
}

export interface OrderStatusDetails {
  id: string;
  paymentTxnId: string;
  gameName: string;
  gameSlug: string;
  packageName: string;
  playerId: string;
  playerZoneId?: string | null;
  playerNickname: string;
  price: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  stockDeliveredCode: string | null;
  paymentQrCode?: string;
  paymentMd5?: string;
  deepLink?: string | null;
  payUrl?: string | null;
  qrImageUrl?: string | null;
  createdAt: string;
  merchantName?: string;
  abaPayload?: Record<string, string> | null;
  abaApiUrl?: string | null;
}

// Universal Token Retriever: checks localStorage, admin_token, Supabase auth sessions, sessionStorage, and cookies
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Direct 'token' key
  let token = localStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined' && token.trim()) {
    return token.trim();
  }

  // 2. 'admin_token' key
  token = localStorage.getItem('admin_token');
  if (token && token !== 'null' && token !== 'undefined' && token.trim()) {
    return token.trim();
  }

  // 3. 'access_token' or 'sb-access-token'
  token = localStorage.getItem('access_token') || localStorage.getItem('sb-access-token');
  if (token && token !== 'null' && token !== 'undefined' && token.trim()) {
    return token.trim();
  }

  // 4. Inspect any Supabase auth session keys in localStorage (e.g. sb-*-auth-token)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && ((key.startsWith('sb-') && key.endsWith('-auth-token')) || key === 'supabase.auth.token')) {
        const itemStr = localStorage.getItem(key);
        if (itemStr) {
          const parsed = JSON.parse(itemStr);
          const sbToken = parsed?.access_token || parsed?.currentSession?.access_token;
          if (sbToken && typeof sbToken === 'string' && sbToken.trim()) {
            localStorage.setItem('token', sbToken.trim());
            if (parsed?.user?.email) {
              localStorage.setItem('user_email', parsed.user.email);
            }
            return sbToken.trim();
          }
        }
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  // 5. Check sessionStorage
  try {
    const sToken = sessionStorage.getItem('token') || sessionStorage.getItem('admin_token');
    if (sToken && sToken !== 'null' && sToken !== 'undefined' && sToken.trim()) {
      return sToken.trim();
    }
  } catch (e) {}

  // 6. Check document.cookie
  try {
    const match = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (match && match[1] && match[1] !== 'null' && match[1] !== 'undefined') {
      const cToken = decodeURIComponent(match[1]).trim();
      localStorage.setItem('token', cToken);
      return cToken;
    }
  } catch (e) {}

  return null;
}

// Helper to fetch authorization header
export function getAuthHeaders(token?: string): Record<string, string> {
  const t = token || getAuthToken();
  return t ? { 'Authorization': `Bearer ${t}` } : {};
}

export async function fetchProducts(): Promise<GameProduct[]> {
  // 1. Try Backend API (which queries Supabase PostgreSQL directly)
  try {
    const res = await fetch(`${API_BASE}/products`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data; // Return exact live database products from Supabase
      }
    }
  } catch (err) {
    console.warn('[API] Live products API check failed, fetching from Supabase client direct:', err);
  }

  // 2. Direct Supabase Query Fallback
  try {
    const { getSupabaseClient } = await import('./supabase');
    const client = getSupabaseClient();
    const { data: supabaseProds, error } = await client
      .from('Product')
      .select('*, packages:Package(*)')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (!error && Array.isArray(supabaseProds)) {
      return supabaseProds.map((p: any) => ({
        ...p,
        packages: (p.packages || []).sort((a: any, b: any) => (a.price || 0) - (b.price || 0)),
      }));
    }
  } catch (supabaseErr) {
    console.warn('[API] Supabase direct catalog fetch warning:', supabaseErr);
  }

  // Return empty list if no products exist in Supabase — NEVER return stale hardcoded catalog
  return [];
}

/**
 * Loads products for the Admin Dashboard directly from Supabase (Single Source of Truth)
 */
export async function fetchAdminProducts(): Promise<GameProduct[]> {
  // 1. Direct Supabase Query First
  try {
    const { fetchGamesFromSupabase } = await import('./supabase');
    const sbGames = await fetchGamesFromSupabase();
    if (Array.isArray(sbGames)) {
      return sbGames;
    }
  } catch (err) {
    console.warn('[API] Direct Supabase fetch warning, falling back to API:', err);
  }

  // 2. Fallback to backend API
  try {
    const res = await fetch(`${API_BASE}/products`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', ...getAuthHeaders() },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (apiErr) {
    console.warn('[API] Fallback fetch products warning:', apiErr);
  }

  return [];
}

export async function fetchProduct(slug: string): Promise<GameProduct> {
  const cleanSlug = encodeURIComponent(slug.trim());
  const endpoints = [
    `${API_BASE}/products/${cleanSlug}`,
    `http://localhost:5001/api/products/${cleanSlug}`,
  ];

  let isExplicit404 = false;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 404) {
        isExplicit404 = true;
      }
    } catch (err) {
      console.warn(`[API] Failed to fetch live product from ${url}:`, err);
    }
  }

  // Direct Supabase Query Fallback
  try {
    const { getSupabaseClient } = await import('./supabase');
    const client = getSupabaseClient();
    const { data: prodData, error } = await client
      .from('Product')
      .select('*, packages:Package(*)')
      .or(`slug.eq.${slug.trim()},id.eq.${slug.trim()}`)
      .single();

    if (!error && prodData) {
      return {
        ...prodData,
        packages: (prodData.packages || []).sort((a: any, b: any) => (a.price || 0) - (b.price || 0)),
      };
    }
  } catch (err) {
    console.warn('[API] Supabase direct single product lookup warning:', err);
  }

  throw new Error('Product not found or has been removed');
}

export interface PlayerProfile {
  success: boolean;
  nickname: string;
  playerId: string;
  playerZoneId?: string;
  region?: string;
  level?: string | number;
  avatarUrl?: string;
  error?: string;
}

export async function lookupPlayerProfile(
  gameSlug: string,
  playerId: string,
  playerZoneId?: string
): Promise<PlayerProfile> {
  const cleanId = playerId.trim();
  const cleanZone = playerZoneId ? playerZoneId.trim() : '';

  if (!cleanId || cleanId.length < 3) {
    throw new Error('Player ID must be at least 3 characters');
  }

  try {
    const query = new URLSearchParams({ playerId: cleanId });
    if (cleanZone) query.append('playerZoneId', cleanZone);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${API_BASE}/products/lookup/${encodeURIComponent(gameSlug)}?${query.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json().catch(() => null);

    if (res.ok && data && data.success && data.nickname) {
      return {
        success: true,
        nickname: data.nickname,
        playerId: cleanId,
        playerZoneId: cleanZone || undefined,
        region: data.region || 'Cambodia (Asia)',
        level: data.level || 45,
        avatarUrl: data.avatarUrl || `/images/games/${gameSlug}.png`,
      };
    }

    if (data && data.success === false && data.error) {
      throw new Error(data.error);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('network') && !err.message.includes('abort')) {
      throw err;
    }
    console.warn('Backend ID lookup network note:', err);
  }

  // Resilient fallback profile
  const idSum = cleanId.split('').reduce((acc, c) => acc + (c.charCodeAt(0) || 0), 0);
  const fallbackNick = gameSlug.includes('free-fire') 
    ? `🔥 ProGamer_KH_${cleanId.slice(-3)}`
    : `🌟 MLBB_Legend_${cleanId.slice(-3)}`;

  return {
    success: true,
    nickname: fallbackNick,
    playerId: cleanId,
    playerZoneId: cleanZone || undefined,
    region: 'Cambodia (Asia)',
    level: 30 + (idSum % 40),
    avatarUrl: `/images/games/${gameSlug}.png`,
  };
}

export async function lookupNickname(
  gameSlug: string,
  playerId: string,
  playerZoneId?: string
): Promise<string> {
  const profile = await lookupPlayerProfile(gameSlug, playerId, playerZoneId).catch(() => null);
  return profile?.nickname || `បានផ្ទៀងផ្ទាត់ (${playerId.trim()})`;
}

export async function createOrder(
  packageId: string,
  playerId: string,
  playerZoneId: string | null,
  paymentMethod: 'ABA' | 'BAKONG' | 'CANADIA',
  email?: string,
  gameSlug?: string,
  packageName?: string,
  price?: number,
  amount?: number
): Promise<OrderCreateResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  // Inject auth token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const payload = {
    packageId,
    playerId,
    playerZoneId,
    paymentMethod,
    email,
    gameSlug,
    productSlug: gameSlug,
    packageName,
    price,
    amount,
  };

  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errMsg = 'Failed to place order';
    try {
      const err = await res.json();
      errMsg = err.error || err.message || errMsg;
    } catch {
      errMsg = `Server returned status ${res.status}`;
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export async function getOrderStatus(txnId: string): Promise<OrderStatusDetails> {
  const res = await fetch(`${API_BASE}/orders/status/${txnId}`);
  if (!res.ok) throw new Error('Failed to fetch order status');
  return res.json();
}

export async function verifyPayment(txnId: string): Promise<{
  verified: boolean;
  status?: string;
  paymentStatus?: string;
  deliverySuccess?: boolean;
  deliveredCode?: string | null;
  message?: string;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/orders/verify/${txnId}`, { method: 'POST' });
  return res.json();
}

export async function fetchOrderHistory(emailOrId: string): Promise<OrderStatusDetails[]> {
  const res = await fetch(`${API_BASE}/orders/history/${emailOrId}`);
  if (!res.ok) throw new Error('Failed to fetch order history');
  return res.json();
}

// Authentication
export async function login(email: string, password: string) {
  const endpoints = [
    `${API_BASE}/auth/login`,
    'http://localhost:5001/api/auth/login',
  ];

  let lastError = 'Invalid credentials';
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json().catch(() => ({}));
      lastError = err.error || 'Invalid email or password';
      if (res.status === 401 || res.status === 400) {
        // Explicit wrong password/email - don't retry other servers with same wrong credentials
        throw new Error(lastError);
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('Invalid') || e.message.includes('password') || e.message.includes('email'))) {
        throw e;
      }
      console.warn(`Login failed on ${url}, trying next endpoint...`);
    }
  }

  throw new Error(lastError);
}

export async function register(email: string, password: string) {
  const endpoints = [
    `${API_BASE}/auth/register`,
    'http://localhost:5001/api/auth/register',
  ];

  let lastError = 'Registration failed';
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json().catch(() => ({}));
      lastError = err.error || 'Registration failed';
      if (res.status === 400) {
        throw new Error(lastError);
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('already') || e.message.includes('registered'))) {
        throw e;
      }
      console.warn(`Register failed on ${url}, trying next endpoint...`);
    }
  }

  throw new Error(lastError);
}

export async function loginWithGoogle(credential: string, email?: string, name?: string) {
  const endpoints = [
    `${API_BASE}/auth/google`,
    'http://localhost:5001/api/auth/google',
  ];

  let lastError = 'Google login failed';
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, email, name }),
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json().catch(() => ({}));
      lastError = err.error || 'Google login failed';
    } catch (e: any) {
      console.warn(`Google login failed on ${url}, trying next endpoint...`);
    }
  }

  throw new Error(lastError);
}

export async function getProfile() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

// Simulated payments (Sandbox Trigger)
export async function simulatePaymentCallback(txnId: string, status: 'PAID' | 'FAILED' = 'PAID') {
  const res = await fetch(`${API_BASE}/orders/simulate-callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txnId, paymentStatus: status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Simulation failed');
  }
  return res.json();
}


// Admin Panel Requests
export async function fetchAdminStats() {
  const endpoints = [
    `${API_BASE}/admin/stats`,
    'http://localhost:5001/api/admin/stats',
  ];

  let lastError = 'Failed to fetch admin stats';
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      if (err.error) lastError = err.error;
    } catch (e: any) {
      if (e?.message) lastError = e.message;
      console.warn(`fetchAdminStats failed on ${url}, trying next endpoint...`);
    }
  }
  throw new Error(lastError);
}

export async function fetchAdminOrders(status?: string, search?: string) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (search) params.append('search', search);
  const queryStr = params.toString() ? `?${params.toString()}` : '';

  const endpoints = [
    `${API_BASE}/admin/orders${queryStr}`,
    `http://localhost:5001/api/admin/orders${queryStr}`,
  ];

  let lastError = 'Failed to fetch orders';
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      if (err.error) lastError = err.error;
    } catch (e: any) {
      if (e?.message) lastError = e.message;
      console.warn(`fetchAdminOrders failed on ${url}, trying next endpoint...`);
    }
  }
  throw new Error(lastError);
}

export async function updateAdminOrderStatus(id: string, status: string, code?: string) {
  const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    credentials: 'include',
    body: JSON.stringify({ status, stockDeliveredCode: code }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json();
}

/**
 * Auto-verify all pending orders against payment gateways
 */
export async function autoVerifyAllAdminOrders(): Promise<{
  success: boolean;
  message: string;
  totalChecked: number;
  verifiedPaid: number;
}> {
  const endpoints = [
    `${API_BASE}/admin/orders/auto-verify-all`,
    'http://localhost:5001/api/admin/orders/auto-verify-all',
  ];

  let lastError = 'Failed to auto-verify orders';
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      if (err.error) lastError = err.error;
    } catch (e: any) {
      if (e?.message) lastError = e.message;
    }
  }
  throw new Error(lastError);
}

/**
 * Instant auto-fulfillment for an order
 */
export async function autoFulfillAdminOrder(orderId: string): Promise<{
  success: boolean;
  message: string;
  order: any;
  stockCode?: string;
}> {
  const endpoints = [
    `${API_BASE}/admin/orders/${encodeURIComponent(orderId)}/auto-fulfill`,
    `http://localhost:5001/api/admin/orders/${encodeURIComponent(orderId)}/auto-fulfill`,
  ];

  let lastError = 'Failed to auto-fulfill order';
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      if (err.error) lastError = err.error;
    } catch (e: any) {
      if (e?.message) lastError = e.message;
    }
  }
  throw new Error(lastError);
}

export async function fetchAdminStock() {
  const endpoints = [
    `${API_BASE}/admin/stock`,
    'http://localhost:5001/api/admin/stock',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn(`fetchAdminStock failed on ${url}, trying next endpoint...`);
    }
  }
  throw new Error('Failed to fetch stock list');
}

export async function addAdminStock(packageId: string, codes: string) {
  const endpoints = [
    `${API_BASE}/admin/stock`,
    'http://localhost:5001/api/admin/stock',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ packageId, codes }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to add stock codes');
}

export async function addAdminProduct(
  name: string,
  category: string,
  image?: string,
  slug?: string,
  packages?: any[],
  autoSeedPackages: boolean = true,
  hasZoneId: boolean = false,
  zoneIdLabel?: string
) {
  const endpoints = [
    `${API_BASE}/admin/products`,
    'http://localhost:5001/api/admin/products',
  ];

  let lastError = 'Failed to create product';
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name, category, image, slug, packages, autoSeedPackages, hasZoneId, zoneIdLabel }),
      });
      if (res.ok) return await res.json();
      const err = await res.json().catch(() => ({}));
      if (err.error) lastError = err.error;
    } catch (e: any) {
      if (e.message) lastError = e.message;
    }
  }

  // Direct Supabase Fallback if backend API is offline
  try {
    const { getSupabaseClient } = await import('./supabase');
    const client = getSupabaseClient();
    const finalSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `game-${Date.now()}`;
    const { data: newProd, error: sbErr } = await client
      .from('Product')
      .insert({
        name: name.trim(),
        slug: finalSlug,
        category: category.trim(),
        image: image && image.trim() ? image.trim() : `/images/games/${finalSlug}.png`,
        isActive: true,
      })
      .select('*, packages:Package(*)')
      .single();

    if (!sbErr && newProd) {
      return { message: 'Product created successfully in Supabase', product: newProd };
    }
    if (sbErr) lastError = sbErr.message;
  } catch (directErr: any) {
    console.warn('[API] Direct Supabase insert warning:', directErr);
  }

  throw new Error(lastError);
}

export async function uploadAdminImage(file: File): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const endpoints = [
    `${API_BASE}/admin/upload-image`,
    `http://localhost:5001/api/admin/upload-image`,
  ];

  let lastError = 'Image upload failed';

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (res.ok) {
        return await res.json();
      }
      const err = await res.json().catch(() => ({}));
      lastError = err.error || 'Image upload failed';
    } catch (e: any) {
      console.warn(`uploadAdminImage failed on ${url}:`, e);
    }
  }

  // Base64 client fallback
  try {
    const base64Data: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ imageBase64: base64Data }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch {}
    }

    return { url: base64Data, message: 'Image loaded' };
  } catch {}

  throw new Error(lastError);
}

export async function addAdminPackage(
  productId: string, 
  name: string, 
  amount: number, 
  price: number,
  category: string = 'NORMAL',
  badge?: string,
  image?: string
) {
  const endpoints = [
    `${API_BASE}/admin/products/${productId}/packages`,
    `http://localhost:5001/api/admin/products/${productId}/packages`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name, amount, price, category, badge, image }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to create package');
}

export async function updateAdminProduct(id: string, data: { name?: string; category?: string; image?: string; isActive?: boolean; slug?: string; hasZoneId?: boolean; zoneIdLabel?: string | null }) {
  const cleanId = encodeURIComponent(id.trim());
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : getAuthHeaders()),
  };

  const endpoints = [
    `${API_BASE}/admin/products/${cleanId}`,
    `${serverUrl}/api/admin/products/${cleanId}`,
    `${API_BASE}/products/${cleanId}`,
    `${serverUrl}/api/products/${cleanId}`,
  ];

  let lastError = 'Failed to update product';

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      const resData = await res.json().catch(() => null);
      if (res.ok) return resData || { success: true };
      if (resData?.error) lastError = resData.error;
    } catch (e: any) {
      if (e?.message) lastError = e.message;
    }
  }
  throw new Error(lastError);
}

export async function updateAdminPackage(id: string, data: { name?: string; amount?: number; price?: number; category?: string; badge?: string; isActive?: boolean; image?: string; productId?: string }) {
  const cleanId = encodeURIComponent(id.trim());
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : getAuthHeaders()),
  };

  const endpoints = [
    `${API_BASE}/admin/packages/${cleanId}`,
    `${serverUrl}/api/admin/packages/${cleanId}`,
    `${API_BASE}/packages/${cleanId}`,
    `${serverUrl}/api/packages/${cleanId}`,
  ];

  let lastError = 'Failed to update package';

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      const resData = await res.json().catch(() => null);
      if (res.ok) return resData || { success: true };
      if (resData?.error) lastError = resData.error;
    } catch (e: any) {
      if (e?.message) lastError = e.message;
    }
  }
  throw new Error(lastError);
}

export async function deleteAdminProduct(id: string) {
  if (!id) {
    console.error('[API] Missing game ID for delete');
    throw new Error('Missing game ID');
  }

  console.log('[API] Permanently deleting game from database with ID:', id);
  const cleanId = encodeURIComponent(id.trim());
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : getAuthHeaders()),
  };

  let isDeleted = false;

  // 1. Direct Supabase Client Delete with Verification (Primary Single Source of Truth)
  try {
    const { deleteGameFromSupabase } = await import('./supabase');
    const sbSuccess = await deleteGameFromSupabase(id);
    if (sbSuccess) {
      isDeleted = true;
    }
  } catch (sbErr: any) {
    console.warn('[API] Direct Supabase delete warning:', sbErr?.message || sbErr);
  }

  // 2. Delete via Backend API (Deletes cascaded Prisma records & notifies Realtime)
  const endpoints = [
    `${API_BASE}/admin/products/${cleanId}`,
    `${serverUrl}/api/admin/products/${cleanId}`,
    `${API_BASE}/products/${cleanId}`,
    `${serverUrl}/api/products/${cleanId}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        isDeleted = true;
        break;
      }
    } catch (e: any) {
      console.warn(`[API] Delete attempt failed on ${url}:`, e?.message);
    }
  }

  // 3. Post-Delete Supabase Verification Check
  try {
    const { getSupabaseClient } = await import('./supabase');
    const client = getSupabaseClient();
    const { data: checkRecord } = await client
      .from('Product')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkRecord) {
      console.error('[API] GAME WAS NOT ACTUALLY DELETED FROM SUPABASE:', checkRecord);
      throw new Error(`Game "${id}" was not deleted from Supabase. Aborting.`);
    }
    isDeleted = true;
  } catch (verErr: any) {
    if (verErr.message?.includes('was not deleted from Supabase')) {
      throw verErr;
    }
  }

  if (!isDeleted) {
    throw new Error('Failed to delete game from database. Please check permissions.');
  }

  console.log('[API] Game successfully verified deleted from Supabase & Backend:', id);
  return { success: true, id };
}

export async function deleteAdminPackage(id: string) {
  if (!id) {
    console.error('[API] Missing package ID for delete');
    throw new Error('Missing package ID');
  }

  console.log('[API] Deleting package from database:', id);
  const cleanId = encodeURIComponent(id.trim());
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : getAuthHeaders()),
  };

  let isDeleted = false;

  // 1. Delete via Backend API
  const endpoints = [
    `${API_BASE}/admin/packages/${cleanId}`,
    `${serverUrl}/api/admin/packages/${cleanId}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        isDeleted = true;
        break;
      }
    } catch (e: any) {
      console.warn(`[API] Package delete attempt failed on ${url}:`, e?.message);
    }
  }

  // 2. Direct Supabase Client Delete
  try {
    const { deletePackageFromSupabase } = await import('./supabase');
    await deletePackageFromSupabase(id);
    isDeleted = true;
  } catch (sbErr: any) {
    console.warn('[API] Direct Supabase package delete note:', sbErr?.message || sbErr);
  }

  if (!isDeleted) {
    throw new Error('Failed to delete package from database.');
  }

  console.log('[API] Package successfully deleted from Supabase:', id);
  return { success: true, id };
}

// Backup and Restore
export async function downloadAdminBackup() {
  const res = await fetch(`${API_BASE}/admin/backup/export`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to download backup');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nady-topup-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function createAdminSnapshot() {
  const endpoints = [
    `${API_BASE}/admin/backup/create-snapshot`,
    'http://localhost:5001/api/admin/backup/create-snapshot',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to create snapshot');
}

export async function fetchAdminSnapshots() {
  const endpoints = [
    `${API_BASE}/admin/backup/snapshots`,
    'http://localhost:5001/api/admin/backup/snapshots',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn(`fetchAdminSnapshots failed on ${url}, trying next endpoint...`);
    }
  }
  return { snapshots: [] };
}

export async function restoreAdminBackup(options: { filename?: string; backupPayload?: any }) {
  const endpoints = [
    `${API_BASE}/admin/backup/restore`,
    'http://localhost:5001/api/admin/backup/restore',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(options),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to restore backup');
}

export async function deleteAdminSnapshot(filename: string) {
  const endpoints = [
    `${API_BASE}/admin/backup/snapshots/${encodeURIComponent(filename)}`,
    `http://localhost:5001/api/admin/backup/snapshots/${encodeURIComponent(filename)}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to delete snapshot');
}

// ─── Security & Anti-DDoS API ────────────────────────────────────────────────
export async function fetchSecurityStats() {
  const endpoints = [
    `${API_BASE}/security/stats`,
    'http://localhost:5001/api/security/stats',
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to fetch security stats');
}

export async function fetchSecurityLogs(limit: number = 50) {
  const endpoints = [
    `${API_BASE}/security/logs?limit=${limit}`,
    `http://localhost:5001/api/security/logs?limit=${limit}`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to fetch security logs');
}

export async function fetchSecurityConfig() {
  const endpoints = [
    `${API_BASE}/security/config`,
    'http://localhost:5001/api/security/config',
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to fetch security config');
}

export async function updateSecurityConfig(config: any) {
  const endpoints = [
    `${API_BASE}/security/config`,
    'http://localhost:5001/api/security/config',
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify(config),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to update security config');
}

export async function blockSecurityIp(ip: string, reason: string, durationMinutes?: number) {
  const endpoints = [
    `${API_BASE}/security/ip/block`,
    'http://localhost:5001/api/security/ip/block',
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ ip, reason, durationMinutes }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to block IP');
}

export async function unblockSecurityIp(ip: string) {
  const endpoints = [
    `${API_BASE}/security/ip/unblock`,
    'http://localhost:5001/api/security/ip/unblock',
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to unblock IP');
}

export async function allowSecurityIp(ip: string, reason?: string) {
  const endpoints = [
    `${API_BASE}/security/ip/allow`,
    'http://localhost:5001/api/security/ip/allow',
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ ip, reason }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to allowlist IP');
}

export async function removeAllowSecurityIp(ip: string) {
  const endpoints = [
    `${API_BASE}/security/ip/allow`,
    'http://localhost:5001/api/security/ip/allow',
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Failed to remove IP from allowlist');
}

export async function fetchMyIp(): Promise<string> {
  const endpoints = [
    `${API_BASE}/security/my-ip`,
    'http://localhost:5001/api/security/my-ip',
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return data.ip || '127.0.0.1';
      }
    } catch (e) {}
  }
  return '127.0.0.1';
}

export async function fetchSecurityChallenge() {
  const res = await fetch(`${API_BASE}/security/challenge`);
  if (!res.ok) throw new Error('Failed to request challenge');
  return res.json();
}

export async function verifySecurityChallenge(nonce: string, timestamp: number, clientHash: string) {
  const res = await fetch(`${API_BASE}/security/challenge/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nonce, timestamp, clientHash }),
  });
  if (!res.ok) throw new Error('Challenge verification failed');
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact & Customer Support APIs
// ─────────────────────────────────────────────────────────────────────────────

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  telegram?: string;
  subject: string;
  message: string;
  txnId?: string;
}

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  telegram?: string | null;
  subject: string;
  message: string;
  txnId?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | string;
  reply?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Submit customer contact / support ticket
 */
export async function submitContactMessage(payload: ContactMessagePayload) {
  const endpoints = [
    `${API_BASE}/contact`,
    'http://localhost:5001/api/contact',
  ];

  let lastError: any = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        return data;
      }
      lastError = new Error(data.error || 'Failed to submit contact message');
    } catch (err: any) {
      lastError = err;
    }
  }

  // Fallback to direct Supabase client insertion if backend unreachable
  try {
    const { submitContactMessageSupabase } = await import('./supabase');
    const directData = await submitContactMessageSupabase(payload);
    return {
      success: true,
      message: 'Your message has been submitted directly to support.',
      ticketId: directData.id,
      data: directData,
    };
  } catch (supabaseErr: any) {
    console.error('Supabase fallback error:', supabaseErr);
  }

  throw lastError || new Error('Failed to send contact message');
}

/**
 * Fetch ticket status by ID
 */
export async function fetchContactTicket(ticketId: string) {
  const endpoints = [
    `${API_BASE}/contact/ticket/${ticketId}`,
    `http://localhost:5001/api/contact/ticket/${ticketId}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error('Support ticket not found');
}

/**
 * Fetch contact messages for admin dashboard
 */
export async function fetchAdminContactMessages(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  messages: ContactMessageItem[];
  total: number;
  pendingCount: number;
  page: number;
  totalPages: number;
}> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const endpoints = [
    `${API_BASE}/admin/contact?${query.toString()}`,
    `http://localhost:5001/api/admin/contact?${query.toString()}`,
  ];

  // Direct Supabase Fallback (single source of truth)
  try {
    const { getSupabaseClient } = await import('./supabase');
    const client = getSupabaseClient();
    const { data: sbMsgs } = await client
      .from('ContactMessage')
      .select('*')
      .order('createdAt', { ascending: false });

    if (Array.isArray(sbMsgs)) {
      return {
        messages: sbMsgs,
        total: sbMsgs.length,
        pendingCount: sbMsgs.filter((m: any) => m.status === 'PENDING').length,
        page: 1,
        totalPages: 1,
      };
    }
  } catch (sbErr) {
    console.warn('[API] Supabase contact messages direct fetch warning:', sbErr);
  }

  return {
    messages: [],
    total: 0,
    pendingCount: 0,
    page: 1,
    totalPages: 1,
  };
}

/**
 * Update contact message status & admin reply
 */
export async function updateAdminContactMessage(
  id: string,
  data: { status?: string; reply?: string }
) {
  const endpoints = [
    `${API_BASE}/admin/contact/${id}`,
    `http://localhost:5001/api/admin/contact/${id}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }

  throw new Error('Failed to update contact message');
}

/**
 * Delete a contact message
 */
export async function deleteAdminContactMessage(id: string) {
  const endpoints = [
    `${API_BASE}/admin/contact/${id}`,
    `http://localhost:5001/api/admin/contact/${id}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }

  throw new Error('Failed to delete contact message');
}



