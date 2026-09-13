import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://ueziueclbgymbynuxpby.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_jIdjx8vma3dtMGCMwlizMA__G9TpoAi';

// Create a robust singleton Supabase Client
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Authentication Methods
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sign in with Google using Supabase Auth
 */
export async function signInWithSupabaseGoogle() {
  try {
    const client = getSupabaseClient();
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined;
    
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[Supabase Auth] Google OAuth warning:', err);
    throw err;
  }
}

/**
 * Sign in with Email and Password using Supabase Auth
 */
export async function signInWithSupabaseEmail(email: string, password: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign up with Email and Password using Supabase Auth
 */
export async function signUpWithSupabaseEmail(email: string, password: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out from Supabase
 */
export async function signOutSupabase() {
  try {
    const client = getSupabaseClient();
    await client.auth.signOut().catch(() => {});
  } catch (err) {
    console.warn('[Supabase Auth] Sign out warning:', err);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_email');
      localStorage.removeItem('supabase_token');
    }
  }
}

/**
 * Get current Supabase user session
 */
export async function getSupabaseUser() {
  try {
    const client = getSupabaseClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Realtime Subscriptions (Thread-Safe & React Strict Mode Safe)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Real-time listener for order status changes by paymentTxnId
 */
export function subscribeToOrderRealtime(
  paymentTxnId: string,
  onOrderUpdate: (payload: any) => void
) {
  try {
    const client = getSupabaseClient();
    const uniqueChannelName = `order-rt-${paymentTxnId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const channel = client
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order',
          filter: `paymentTxnId=eq.${paymentTxnId}`,
        },
        (payload) => {
          if (payload?.new) {
            onOrderUpdate(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Supabase Realtime] Subscribed to order: ${paymentTxnId}`);
        }
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch (e) {
        console.warn('[Supabase Realtime] Order channel unsubscribe warning:', e);
      }
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize order realtime channel:', err);
    return () => {};
  }
}

/**
 * Real-time listener for Product updates or live catalog sync
 */
export function subscribeToProductsRealtime(onProductChange: (payload: any) => void) {
  try {
    const client = getSupabaseClient();
    const uniqueChannelName = `products-catalog-rt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const channel = client
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Product',
        },
        (payload) => {
          if (payload) {
            onProductChange(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Subscribed to products catalog channel');
        }
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch (e) {
        console.warn('[Supabase Realtime] Products channel unsubscribe warning:', e);
      }
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize products realtime channel:', err);
    return () => {};
  }
}

/**
 * Upload image to Supabase Storage bucket
 */
export async function uploadToSupabaseStorage(
  bucket: string,
  filePath: string,
  file: File | Blob
): Promise<string> {
  const client = getSupabaseClient();
  
  const { data, error } = await client.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  const { data: publicUrlData } = client.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}
