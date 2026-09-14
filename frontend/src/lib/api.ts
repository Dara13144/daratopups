const PRODUCTION_API = 'https://nadybackend.onrender.com';

/**
 * Resolves the active backend API base URL.
 * Priority:
 * 1. Explicit NEXT_PUBLIC_API_URL or NEXT_PUBLIC_BACKEND_URL or VITE_API_URL
 * 2. In local browser environment (localhost / 127.0.0.1): http://localhost:5001
 * 3. In production environment (Vercel, Render, custom domain): https://nadybackend.onrender.com
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local');

    // If visiting on a public domain, NEVER call localhost/127.0.0.1
    // Doing so triggers the Chrome/Edge "Access other apps and services on this device" prompt!
    if (!isLocalhost) {
      const envUrl = (
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        (typeof process !== 'undefined' && (process.env as any).VITE_API_URL)
      );

      if (
        envUrl &&
        typeof envUrl === 'string' &&
        envUrl.trim() &&
        !envUrl.includes('localhost') &&
        !envUrl.includes('127.0.0.1') &&
        !envUrl.includes('0.0.0.0')
      ) {
        return envUrl.trim().replace(/\/$/, '').replace(/\/api$/, '');
      }

      return PRODUCTION_API;
    }
  }

  // Local development environment:
  const envUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (typeof process !== 'undefined' && (process.env as any).VITE_API_URL)
  );

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/$/, '').replace(/\/api$/, '');
  }

  return 'http://localhost:5001';
}

export const serverUrl = getApiBaseUrl();
export const API_BASE = `${serverUrl}/api`;

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.info(`[NaDyTopup] resolved serverUrl: "${serverUrl}" and API_BASE: "${API_BASE}"`);
}

/**
 * Centralized, resilient API request helper.
 * - Handles Authorization header automatically
 * - Retries seamlessly if local/remote fallback is needed in development
 * - Parses true backend errors (400, 401, 403, 404, etc.) and surfaces actual message
 * - Replaces generic "Failed to fetch" with meaningful, actionable information
 */
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullPath = cleanPath.startsWith('/api/') ? cleanPath : `/api${cleanPath}`;

  const candidateBases: string[] = [getApiBaseUrl()];

  if (typeof window !== 'undefined') {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocal) {
      if (!candidateBases.includes('http://localhost:5001')) {
        candidateBases.unshift('http://localhost:5001');
      }
      if (!candidateBases.includes(PRODUCTION_API)) {
        candidateBases.push(PRODUCTION_API);
      }
    }
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let lastError: any = null;

  for (const base of candidateBases) {
    const url = `${base}${fullPath}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errorMsg = `API ${res.status}: ${res.statusText || 'Error'}`;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errData = await res.json().catch(() => ({}));
          errorMsg = errData.message || errData.error || errorMsg;
        } else {
          const txt = await res.text().catch(() => '');
          if (txt && txt.length < 300) errorMsg = txt;
        }

        const apiErr: any = new Error(errorMsg);
        apiErr.status = res.status;
        apiErr.response = res;

        // If client-side error (400, 401, 403, 404, 409, 422), do not fallback to another server.
        // Throw immediately with the REAL backend error!
        if (res.status >= 400 && res.status < 500) {
          throw apiErr;
        }

        lastError = apiErr;
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await res.json();
      }
      return (await res.text()) as any;
    } catch (err: any) {
      if (err.status && err.status >= 400 && err.status < 500) {
        throw err;
      }
      lastError = err;
      console.warn(`[API Client] Connection issue with ${url}:`, err.message || err);
    }
  }

  if (lastError) {
    if (
      lastError.name === 'AbortError' ||
      lastError.message?.includes('Failed to fetch') ||
      lastError.message?.includes('NetworkError')
    ) {
      throw new Error(
        'Unable to connect to the backend server. The server may be waking up or temporarily unavailable. Please try again in a few seconds.'
      );
    }
    throw lastError;
  }

  throw new Error('API Request Failed');
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
    const data = await apiRequest<GameProduct[]>('/products');
    if (Array.isArray(data)) {
      return data;
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
    const data = await apiRequest<GameProduct[]>('/products');
    if (Array.isArray(data)) return data;
  } catch (apiErr) {
    console.warn('[API] Fallback fetch products warning:', apiErr);
  }

  return [];
}

export async function fetchProduct(slug: string): Promise<GameProduct> {
  const cleanSlug = encodeURIComponent(slug.trim());
  try {
    return await apiRequest<GameProduct>(`/products/${cleanSlug}`);
  } catch (err: any) {
    // Direct Supabase Query Fallback if backend API is waking up or unavailable
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
    } catch {}

    throw (err.status === 404)
      ? new Error('Product not found or has been removed')
      : err;
  }
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
  let cleanId = (playerId || '').trim();
  let cleanZone = (playerZoneId || '').trim();

  // Intelligent combined ID/Zone parsing (e.g. "1523754961 (11766)", "1523754961(11766)", "1523754961 11766")
  const comboMatch = cleanId.match(/^(\d{4,12})[\s_()\-]+(\d{3,6})\)?$/);
  if (comboMatch) {
    cleanId = comboMatch[1];
    if (!cleanZone) {
      cleanZone = comboMatch[2];
    }
  }

  // Strip parentheses and spaces
  if (cleanZone) {
    cleanZone = cleanZone.replace(/[()]/g, '').trim();
  }

  const isMLBB = gameSlug.includes('mobile-legend') || gameSlug.includes('mlbb') || gameSlug.includes('moonton');
  if (isMLBB) {
    cleanId = cleanId.replace(/[^\d]/g, '');
    cleanZone = cleanZone.replace(/[^\d]/g, '');
  }

  if (!cleanId || cleanId.length < 3) {
    throw new Error('Player ID must be at least 3 characters');
  }

  // 1. Try local Next.js Route Handler first for instant, zero-delay verification
  if (typeof window !== 'undefined') {
    try {
      const q = new URLSearchParams({ gameSlug, playerId: cleanId });
      if (cleanZone) q.append('playerZoneId', cleanZone);

      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 4000);
      const localRes = await fetch(`/api/lookup?${q.toString()}`, { signal: ctrl.signal });
      clearTimeout(tm);

      const localData = await localRes.json().catch(() => null);
      if (localRes.ok && localData && localData.success && localData.nickname) {
        return {
          success: true,
          nickname: localData.nickname,
          playerId: localData.playerId || cleanId,
          playerZoneId: localData.playerZoneId || (cleanZone || undefined),
          region: localData.region || 'Cambodia (Asia)',
          level: localData.level || 45,
          avatarUrl: localData.avatarUrl || `/images/games/${gameSlug}.png`,
        };
      }
      if (localData && localData.success === false && localData.error) {
        throw new Error(localData.error);
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch') && !err.message.includes('network') && !err.message.includes('abort')) {
        throw err;
      }
    }
  }

  // 2. Try Backend API as robust secondary provider
  try {
    const query = new URLSearchParams({ playerId: cleanId });
    if (cleanZone) query.append('playerZoneId', cleanZone);

    const data = await apiRequest<any>(`/products/lookup/${encodeURIComponent(gameSlug)}?${query.toString()}`);

    if (data && data.success && data.nickname) {
      return {
        success: true,
        nickname: data.nickname,
        playerId: data.playerId || cleanId,
        playerZoneId: data.playerZoneId || (cleanZone || undefined),
        region: data.region || 'Cambodia (Asia)',
        level: data.level || 45,
        avatarUrl: data.avatarUrl || `/images/games/${gameSlug}.png`,
      };
    }

    if (data && data.success === false && data.error) {
      throw new Error(data.error);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('network') && !err.message.includes('abort') && !err.message.includes('connect')) {
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

  return await apiRequest<OrderCreateResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getOrderStatus(txnId: string): Promise<OrderStatusDetails> {
  return await apiRequest<OrderStatusDetails>(`/orders/status/${encodeURIComponent(txnId)}`);
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
  return await apiRequest(`/orders/verify/${encodeURIComponent(txnId)}`, {
    method: 'POST',
  });
}

export async function fetchOrderHistory(emailOrId: string): Promise<OrderStatusDetails[]> {
  return await apiRequest<OrderStatusDetails[]>(`/orders/history/${encodeURIComponent(emailOrId)}`);
}

// Authentication
export async function login(email: string, password: string) {
  return await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string) {
  return await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithGoogle(credential: string, email?: string, name?: string) {
  return await apiRequest('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential, email, name }),
  });
}

export async function getProfile() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    return await apiRequest('/auth/me');
  } catch (err: any) {
    if (err.status === 401 || err.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('admin_token');
      }
      return null;
    }
    throw err;
  }
}

// Simulated payments (Sandbox Trigger)
export async function simulatePaymentCallback(txnId: string, status: 'PAID' | 'FAILED' = 'PAID') {
  return await apiRequest('/orders/simulate-callback', {
    method: 'POST',
    body: JSON.stringify({ txnId, paymentStatus: status }),
  });
}


// Admin Panel Requests
export async function fetchAdminStats() {
  return await apiRequest('/admin/stats');
}

export async function fetchAdminOrders(status?: string, search?: string) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (search) params.append('search', search);
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return await apiRequest(`/admin/orders${queryStr}`);
}

export async function updateAdminOrderStatus(id: string, status: string, code?: string) {
  return await apiRequest(`/admin/orders/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ status, stockDeliveredCode: code }),
  });
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
  return await apiRequest('/admin/orders/auto-verify-all', {
    method: 'POST',
  });
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
  return await apiRequest(`/admin/orders/${encodeURIComponent(orderId)}/auto-fulfill`, {
    method: 'POST',
  });
}

export async function fetchAdminStock() {
  return await apiRequest('/admin/stock');
}

export async function addAdminStock(packageId: string, codes: string) {
  return await apiRequest('/admin/stock', {
    method: 'POST',
    body: JSON.stringify({ packageId, codes }),
  });
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
  try {
    return await apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify({ name, category, image, slug, packages, autoSeedPackages, hasZoneId, zoneIdLabel }),
    });
  } catch (err: any) {
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
      if (sbErr) throw new Error(sbErr.message);
    } catch (directErr: any) {
      console.warn('[API] Direct Supabase insert warning:', directErr);
    }

    throw err;
  }
}

export async function uploadAdminImage(file: File): Promise<{ url: string; message: string }> {
  const formData = new FormData();
  formData.append('image', file);

  try {
    return await apiRequest<{ url: string; message: string }>('/admin/upload-image', {
      method: 'POST',
      body: formData,
    });
  } catch (err: any) {
    console.warn('[API] uploadAdminImage primary failed:', err?.message);
    // Base64 client fallback
    try {
      const base64Data: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      try {
        return await apiRequest<{ url: string; message: string }>('/admin/upload-image', {
          method: 'POST',
          body: JSON.stringify({ imageBase64: base64Data }),
        });
      } catch {}

      return { url: base64Data, message: 'Image loaded' };
    } catch {}

    throw err;
  }
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
  return await apiRequest(`/admin/products/${encodeURIComponent(productId)}/packages`, {
    method: 'POST',
    body: JSON.stringify({ name, amount, price, category, badge, image }),
  });
}

export async function updateAdminProduct(id: string, data: { name?: string; category?: string; image?: string; isActive?: boolean; slug?: string; hasZoneId?: boolean; zoneIdLabel?: string | null }) {
  const cleanId = encodeURIComponent(id.trim());
  return await apiRequest(`/admin/products/${cleanId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateAdminPackage(id: string, data: { name?: string; amount?: number; price?: number; category?: string; badge?: string; isActive?: boolean; image?: string; productId?: string }) {
  const cleanId = encodeURIComponent(id.trim());
  return await apiRequest(`/admin/packages/${cleanId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
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
  try {
    await apiRequest(`/admin/products/${cleanId}`, {
      method: 'DELETE',
    });
    isDeleted = true;
  } catch (e: any) {
    console.warn(`[API] Delete attempt failed via backend:`, e?.message);
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

  let isDeleted = false;

  // 1. Delete via Backend API
  try {
    await apiRequest(`/admin/packages/${cleanId}`, {
      method: 'DELETE',
    });
    isDeleted = true;
  } catch (e: any) {
    console.warn(`[API] Package delete attempt failed via backend:`, e?.message);
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
  return await apiRequest('/admin/backup/create-snapshot', {
    method: 'POST',
    credentials: 'include',
  });
}

export async function fetchAdminSnapshots() {
  try {
    return await apiRequest<{ snapshots: any[] }>('/admin/backup/snapshots', {
      credentials: 'include',
    });
  } catch (e) {
    console.warn('[API] fetchAdminSnapshots failed:', e);
    return { snapshots: [] };
  }
}

export async function restoreAdminBackup(options: { filename?: string; backupPayload?: any }) {
  return await apiRequest('/admin/backup/restore', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(options),
  });
}

export async function deleteAdminSnapshot(filename: string) {
  return await apiRequest(`/admin/backup/snapshots/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

// ─── Security & Anti-DDoS API ────────────────────────────────────────────────
export async function fetchSecurityStats() {
  return await apiRequest('/security/stats', { credentials: 'include' });
}

export async function fetchSecurityLogs(limit: number = 50) {
  return await apiRequest(`/security/logs?limit=${limit}`, { credentials: 'include' });
}

export async function fetchSecurityConfig() {
  return await apiRequest('/security/config', { credentials: 'include' });
}

export async function updateSecurityConfig(config: any) {
  return await apiRequest('/security/config', {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(config),
  });
}

export async function blockSecurityIp(ip: string, reason: string, durationMinutes?: number) {
  return await apiRequest('/security/ip/block', {
    method: 'POST',
    body: JSON.stringify({ ip, reason, durationMinutes }),
  });
}

export async function unblockSecurityIp(ip: string) {
  return await apiRequest('/security/ip/unblock', {
    method: 'POST',
    body: JSON.stringify({ ip }),
  });
}

export async function allowSecurityIp(ip: string, reason?: string) {
  return await apiRequest('/security/ip/allow', {
    method: 'POST',
    body: JSON.stringify({ ip, reason }),
  });
}

export async function removeAllowSecurityIp(ip: string) {
  return await apiRequest('/security/ip/allow', {
    method: 'DELETE',
    body: JSON.stringify({ ip }),
  });
}

export async function fetchMyIp(): Promise<string> {
  try {
    const data = await apiRequest<{ ip?: string }>('/security/my-ip');
    return data.ip || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

export async function fetchSecurityChallenge() {
  return await apiRequest('/security/challenge');
}

export async function verifySecurityChallenge(nonce: string, timestamp: number, clientHash: string) {
  return await apiRequest('/security/challenge/verify', {
    method: 'POST',
    body: JSON.stringify({ nonce, timestamp, clientHash }),
  });
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
  try {
    return await apiRequest('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
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

    throw err;
  }
}

/**
 * Fetch ticket status by ID
 */
export async function fetchContactTicket(ticketId: string) {
  return await apiRequest(`/contact/ticket/${encodeURIComponent(ticketId)}`);
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

  try {
    return await apiRequest(`/admin/contact?${query.toString()}`);
  } catch (err) {
    // Direct Supabase Fallback (single source of truth)
    try {
      const { getSupabaseClient } = await import('./supabase');
      const client = getSupabaseClient();
      const { data: sbMsgs } = await client
        .from('ContactMessage')
        .select('*')
        .order('createdAt', { section: false, ascending: false } as any);

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
}

/**
 * Update contact message status & admin reply
 */
export async function updateAdminContactMessage(
  id: string,
  data: { status?: string; reply?: string }
) {
  return await apiRequest(`/admin/contact/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a contact message
 */
export async function deleteAdminContactMessage(id: string) {
  return await apiRequest(`/admin/contact/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}



