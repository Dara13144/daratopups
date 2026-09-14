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
  onOrderUpdate: (order: any) => void
) {
  if (typeof window === 'undefined' || !paymentTxnId) return () => {};
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
  if (typeof window === 'undefined') return () => {};
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
 * Directly deletes a game and its associated packages from Supabase
 * Performs verification to guarantee the game no longer exists in Supabase.
 */
export async function deleteGameFromSupabase(id: string): Promise<boolean> {
  if (!id) {
    console.error('[Supabase] Missing game ID for delete');
    return false;
  }

  console.log('[Supabase] Deleting game from database with ID:', id);
  const client = getSupabaseClient();

  try {
    // 1. Delete associated packages first to be safe
    await client.from('Package').delete().eq('productId', id);

    // 2. Delete the product record using real primary key
    const { error } = await client.from('Product').delete().eq('id', id);

    if (error) {
      console.error('[Supabase] Failed to delete game:', error);
      throw error;
    }

    // 3. Post-delete verification: confirm record no longer exists in Supabase
    const { data: deletedCheck, error: checkError } = await client
      .from('Product')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.warn('[Supabase] Delete verification query warning:', checkError);
    }

    if (deletedCheck) {
      console.error('[Supabase] GAME WAS NOT ACTUALLY DELETED FROM SUPABASE:', deletedCheck);
      throw new Error(`Game with ID "${id}" was not deleted from Supabase`);
    }

    console.log('[Supabase] Game verified deleted from Supabase:', id);
    return true;
  } catch (err: any) {
    console.error('[Supabase] Delete game error:', err);
    throw err;
  }
}

/**
 * Direct fetch of all games and packages from Supabase (Single Source of Truth)
 */
export async function fetchGamesFromSupabase(): Promise<any[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('Product')
    .select('*, packages:Package(*)')
    .order('name', { ascending: true });

  if (error) {
    console.error('[Supabase] Failed to load games from Supabase:', error);
    throw error;
  }

  return (data || []).map((p: any) => ({
    ...p,
    packages: (p.packages || []).sort((a: any, b: any) => (a.price || 0) - (b.price || 0)),
  }));
}

/**
 * Directly deletes a package from Supabase
 */
export async function deletePackageFromSupabase(id: string): Promise<boolean> {
  if (!id) {
    console.error('[Supabase] Missing package ID for delete');
    return false;
  }

  console.log('[Supabase] Deleting package from database with ID:', id);
  const client = getSupabaseClient();

  try {
    const { error } = await client.from('Package').delete().eq('id', id);
    if (error) {
      console.error('[Supabase] Failed to delete package:', error);
      throw error;
    }
    console.log('[Supabase] Package deleted successfully from Supabase:', id);
    return true;
  } catch (err: any) {
    console.error('[Supabase] Delete package error:', err);
    throw err;
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

/**
 * Submit Contact Message directly to Supabase ContactMessage table
 */
export async function submitContactMessageSupabase(messageData: {
  name: string;
  email: string;
  phone?: string;
  telegram?: string;
  subject: string;
  message: string;
  txnId?: string;
}) {
  const client = getSupabaseClient();
  const id = 'cm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const { data, error } = await client
    .from('ContactMessage')
    .insert([{
      id,
      name: messageData.name.trim(),
      email: messageData.email.trim().toLowerCase(),
      phone: messageData.phone?.trim() || null,
      telegram: messageData.telegram?.trim() || null,
      subject: messageData.subject.trim(),
      message: messageData.message.trim(),
      txnId: messageData.txnId?.trim() || null,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Real-time subscription to Contact Messages for Admin Dashboard
 */
export function subscribeToContactMessagesRealtime(onMessage: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {};
  try {
    const client = getSupabaseClient();
    const uniqueChannelName = `contact-msg-rt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const channel = client
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ContactMessage',
        },
        (payload) => {
          if (payload) {
            onMessage(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Subscribed to ContactMessage channel');
        }
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch (e) {
        console.warn('[Supabase Realtime] Contact channel unsubscribe warning:', e);
      }
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize contact realtime channel:', err);
    return () => {};
  }
}

/**
 * Real-time listener for Package updates or live catalog sync (INSERT, UPDATE, DELETE)
 */
export function subscribeToPackagesRealtime(onPackageChange: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {};
  try {
    const client = getSupabaseClient();
    const uniqueChannelName = `packages-rt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const channel = client
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Package',
        },
        (payload) => {
          if (payload) {
            onPackageChange(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Subscribed to packages channel');
        }
      });

    return () => {
      try {
        client.removeChannel(channel);
      } catch (e) {
        console.warn('[Supabase Realtime] Packages channel unsubscribe warning:', e);
      }
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize packages realtime channel:', err);
    return () => {};
  }
}

/**
 * Universal real-time subscription for all tables (Product, Package, Order, ContactMessage)
 * Handles live INSERT, UPDATE, and DELETE across the whole site!
 */
export function subscribeToAllRealtime(callbacks: {
  onProductChange?: (payload: any) => void;
  onPackageChange?: (payload: any) => void;
  onOrderChange?: (payload: any) => void;
  onContactChange?: (payload: any) => void;
}) {
  if (typeof window === 'undefined') return () => {};
  try {
    const client = getSupabaseClient();
    const uniqueChannelName = `global-sync-rt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    let channel = client.channel(uniqueChannelName);

    if (callbacks.onProductChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Product' },
        (payload) => callbacks.onProductChange!(payload)
      );
    }

    if (callbacks.onPackageChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Package' },
        (payload) => callbacks.onPackageChange!(payload)
      );
    }

    if (callbacks.onOrderChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Order' },
        (payload) => callbacks.onOrderChange!(payload)
      );
    }

    if (callbacks.onContactChange) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ContactMessage' },
        (payload) => callbacks.onContactChange!(payload)
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Supabase Realtime] Connected to Global Realtime Sync Channel (DELETE / INSERT / UPDATE)');
      }
    });

    return () => {
      try {
        client.removeChannel(channel);
      } catch (e) {
        console.warn('[Supabase Realtime] Global channel unsubscribe warning:', e);
      }
    };
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to initialize global realtime channel:', err);
    return () => {};
  }
}

