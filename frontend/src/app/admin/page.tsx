'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchAdminStats, fetchAdminOrders, updateAdminOrderStatus,
  fetchProducts, fetchAdminProducts, GameProduct,
  addAdminProduct, addAdminPackage, deleteAdminProduct, deleteAdminPackage,
  updateAdminProduct, updateAdminPackage, uploadAdminImage,
  downloadAdminBackup, createAdminSnapshot, fetchAdminSnapshots,
  restoreAdminBackup, deleteAdminSnapshot,
  fetchAdminContactMessages, updateAdminContactMessage, deleteAdminContactMessage,
  ContactMessageItem,
  serverUrl, API_BASE, verifyPayment, getAuthToken, getAuthHeaders,
  autoVerifyAllAdminOrders, autoFulfillAdminOrder
} from '../../lib/api';
import { subscribeToContactMessagesRealtime, subscribeToAllRealtime } from '../../lib/supabase';
import {
  ShoppingBag, Database, TrendingUp, CheckCircle, Clock, Plus, RefreshCw,
  Search, Trash2, Gem, LogOut, Image as ImageIcon, Upload, Package,
  ChevronRight, BarChart3, X, AlertCircle, Zap, Star, DollarSign,
  HardDrive, Download, ShieldCheck, History, RotateCcw, FileText, Check,
  Pencil, Edit, Eye, EyeOff, SlidersHorizontal, Menu, MessageSquare, Send, Mail, Phone
} from 'lucide-react';
import SecurityDashboard from '../../components/SecurityDashboard';


export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'orders' | 'products' | 'diamonds' | 'contact' | 'backup' | 'security'>('metrics');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [metrics, setMetrics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [popularity, setPopularity] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [allProducts, setAllProducts] = useState<GameProduct[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductSlug, setNewProductSlug] = useState('');
  const [autoSeedPackages, setAutoSeedPackages] = useState(true);
  const [newProductCategory, setNewProductCategory] = useState('MOBILE_GAME');
  const [newProductImage, setNewProductImage] = useState('');
  const [newProductHasZone, setNewProductHasZone] = useState(false);
  const [newProductZoneLabel, setNewProductZoneLabel] = useState('Zone ID');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editIsDragging, setEditIsDragging] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageAmount, setNewPackageAmount] = useState('');
  const [newPackagePrice, setNewPackagePrice] = useState('');
  const [newPackageCategory, setNewPackageCategory] = useState('NORMAL');
  const [newPackageBadge, setNewPackageBadge] = useState('');
  const [newPackageImage, setNewPackageImage] = useState('');
  const [newPackageFile, setNewPackageFile] = useState<File | null>(null);
  const [newPackagePreview, setNewPackagePreview] = useState('');
  const newPackageFileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [promptCode, setPromptCode] = useState('');
  const [activePromptOrderId, setActivePromptOrderId] = useState<string | null>(null);

  // Auto Orders System States
  const [autoSyncOrders, setAutoSyncOrders] = useState(true);
  const [autoVerifyingAll, setAutoVerifyingAll] = useState(false);
  const [autoFulfillingId, setAutoFulfillingId] = useState<string | null>(null);

  // Product Editor Modal State
  const [editingProductModal, setEditingProductModal] = useState<GameProduct | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdCategory, setEditProdCategory] = useState('MOBILE_GAME');
  const [editProdSlug, setEditProdSlug] = useState('');
  const [editProdImage, setEditProdImage] = useState('');
  const [editProdIsActive, setEditProdIsActive] = useState(true);
  const [editProdHasZone, setEditProdHasZone] = useState(false);
  const [editProdZoneLabel, setEditProdZoneLabel] = useState('Zone ID');
  const [editProdModalFile, setEditProdModalFile] = useState<File | null>(null);
  const [editProdModalPreview, setEditProdModalPreview] = useState('');
  const editProdModalFileInputRef = useRef<HTMLInputElement>(null);

  // Package Editor Modal State
  const [editingPackageModal, setEditingPackageModal] = useState<{ pkg: any; product: GameProduct } | null>(null);
  const [editPkgName, setEditPkgName] = useState('');
  const [editPkgAmount, setEditPkgAmount] = useState('');
  const [editPkgPrice, setEditPkgPrice] = useState('');
  const [editPkgCategory, setEditPkgCategory] = useState('NORMAL');
  const [editPkgBadge, setEditPkgBadge] = useState('');
  const [editPkgImage, setEditPkgImage] = useState('');
  const [editPkgFile, setEditPkgFile] = useState<File | null>(null);
  const [editPkgPreview, setEditPkgPreview] = useState('');
  const editPkgFileInputRef = useRef<HTMLInputElement>(null);
  const [editPkgIsActive, setEditPkgIsActive] = useState(true);

  // Quick Add Package to Game Modal State
  const [addPackageModalProd, setAddPackageModalProd] = useState<GameProduct | null>(null);
  const [directPkgName, setDirectPkgName] = useState('');
  const [directPkgAmount, setDirectPkgAmount] = useState('');
  const [directPkgPrice, setDirectPkgPrice] = useState('');
  const [directPkgCategory, setDirectPkgCategory] = useState('NORMAL');
  const [directPkgBadge, setDirectPkgBadge] = useState('');
  const [directPkgImage, setDirectPkgImage] = useState('');
  const [directPkgFile, setDirectPkgFile] = useState<File | null>(null);
  const [directPkgPreview, setDirectPkgPreview] = useState('');
  const directPkgFileInputRef = useRef<HTMLInputElement>(null);

  const openAddPackageModalForGame = (prod: GameProduct) => {
    setAddPackageModalProd(prod);
    setDirectPkgName('');
    setDirectPkgAmount('');
    setDirectPkgPrice('');
    setDirectPkgCategory('NORMAL');
    setDirectPkgBadge('');
    setDirectPkgImage('');
    setDirectPkgFile(null);
    setDirectPkgPreview('');
  };

  const handleSaveDirectPackageModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPackageModalProd) return;
    setActionLoading(true); setError(''); setSuccess('');
    try {
      let finalImg = directPkgImage;
      if (directPkgFile) {
        finalImg = await uploadImageToServer(directPkgFile);
      }
      await addAdminPackage(
        addPackageModalProd.id,
        directPkgName,
        parseInt(directPkgAmount, 10),
        parseFloat(directPkgPrice),
        directPkgCategory,
        directPkgBadge || undefined,
        finalImg || undefined
      );
      setSuccess(`Package "${directPkgName}" added to ${addPackageModalProd.name} successfully!`);
      setAddPackageModalProd(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to add package');
    } finally {
      setActionLoading(false);
    }
  };

  // Product Catalog Search & Filter
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');

  const openEditProductModal = (prod: GameProduct) => {
    setEditingProductModal(prod);
    setEditProdName(prod.name);
    setEditProdCategory(prod.category);
    setEditProdSlug(prod.slug);
    setEditProdImage(prod.image);
    setEditProdIsActive(prod.isActive !== false);
    setEditProdHasZone(!!prod.hasZoneId);
    setEditProdZoneLabel(prod.zoneIdLabel || 'Zone ID');
    setEditProdModalFile(null);
    setEditProdModalPreview('');
  };

  const handleSaveProductModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductModal) return;
    setActionLoading(true); setError(''); setSuccess('');
    try {
      let finalImg = editProdImage;
      if (editProdModalFile) {
        finalImg = await uploadImageToServer(editProdModalFile);
      }
      await updateAdminProduct(editingProductModal.id, {
        name: editProdName,
        category: editProdCategory,
        slug: editProdSlug,
        image: finalImg,
        isActive: editProdIsActive,
        hasZoneId: editProdHasZone,
        zoneIdLabel: editProdHasZone ? editProdZoneLabel : null,
      });
      setSuccess(`Product "${editProdName}" updated successfully!`);
      setEditingProductModal(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditPackageModal = (pkg: any, prod: GameProduct) => {
    setEditingPackageModal({ pkg, product: prod });
    setEditPkgName(pkg.name);
    setEditPkgAmount(String(pkg.amount));
    setEditPkgPrice(String(pkg.price));
    setEditPkgCategory(pkg.category || 'NORMAL');
    setEditPkgBadge(pkg.badge || '');
    setEditPkgImage(pkg.image || '');
    setEditPkgFile(null);
    setEditPkgPreview('');
    setEditPkgIsActive(pkg.isActive !== false);
  };

  const handleSavePackageModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackageModal) return;
    setActionLoading(true); setError(''); setSuccess('');
    try {
      let finalImg = editPkgImage;
      if (editPkgFile) {
        finalImg = await uploadImageToServer(editPkgFile);
      }
      await updateAdminPackage(editingPackageModal.pkg.id, {
        productId: editingPackageModal.product.id,
        name: editPkgName,
        amount: parseInt(editPkgAmount, 10),
        price: parseFloat(editPkgPrice),
        category: editPkgCategory,
        badge: editPkgBadge || '',
        image: finalImg || undefined,
        isActive: editPkgIsActive,
      });
      setSuccess(`Package "${editPkgName}" updated successfully!`);
      setEditingPackageModal(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to update package');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleProductStatus = async (prod: GameProduct) => {
    setActionLoading(true);
    try {
      const newStatus = prod.isActive === false ? true : false;
      await updateAdminProduct(prod.id, { isActive: newStatus });
      setSuccess(`Product "${prod.name}" is now ${newStatus ? 'Active' : 'Disabled'}`);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle product status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePackageStatus = async (pkg: any, prod: GameProduct) => {
    setActionLoading(true);
    try {
      const newStatus = pkg.isActive === false ? true : false;
      await updateAdminPackage(pkg.id, {
        productId: prod.id,
        isActive: newStatus,
      });
      setSuccess(`Package "${pkg.name}" is now ${newStatus ? 'Active' : 'Disabled'}`);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to update package status');
    } finally {
      setActionLoading(false);
    }
  };

  // Dedicated Diamonds / Packages Editor States
  const [diamondGameFilter, setDiamondGameFilter] = useState('ALL');
  const [diamondSearchQuery, setDiamondSearchQuery] = useState('');
  const [diamondCategoryFilter, setDiamondCategoryFilter] = useState('ALL');
  const [quickEditingPkgId, setQuickEditingPkgId] = useState<string | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState('');
  const [quickEditAmount, setQuickEditAmount] = useState('');

  const handleSaveQuickEdit = async (pkg: any, prod: GameProduct) => {
    if (!quickEditPrice || !quickEditAmount) return;
    setActionLoading(true);
    try {
      await updateAdminPackage(pkg.id, {
        productId: prod.id,
        price: parseFloat(quickEditPrice),
        amount: parseInt(quickEditAmount, 10),
      });
      setSuccess(`Package "${pkg.name}" updated!`);
      setQuickEditingPkgId(null);
      await loadAllData();
    } catch (err: any) {
      setError(err.message || 'Failed to update package');
    } finally {
      setActionLoading(false);
    }
  };

  // Backup & Restore states
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoringSnapshot, setRestoringSnapshot] = useState<string | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [backupFileSelected, setBackupFileSelected] = useState<File | null>(null);

  const loadSnapshots = async () => {
    try {
      const res = await fetchAdminSnapshots();
      setSnapshots(res.snapshots || []);
    } catch (e) {
      console.error('Failed to load snapshots:', e);
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      await downloadAdminBackup();
      setSuccess('Backup exported and downloaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to download backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setBackupLoading(true);
    try {
      const res = await createAdminSnapshot();
      setSuccess(res.message || 'Snapshot created successfully!');
      loadSnapshots();
    } catch (err: any) {
      setError(err.message || 'Failed to create snapshot');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreSnapshot = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to restore the system state from snapshot "${filename}"?`)) return;
    setRestoringSnapshot(filename);
    try {
      const res = await restoreAdminBackup({ filename });
      setSuccess(res.message || 'System restored successfully!');
      await loadAllData();
      await loadSnapshots();
    } catch (err: any) {
      setError(err.message || 'Failed to restore snapshot');
    } finally {
      setRestoringSnapshot(null);
    }
  };

  const handleDeleteSnapshot = async (filename: string) => {
    if (!window.confirm(`Delete snapshot "${filename}"?`)) return;
    try {
      await deleteAdminSnapshot(filename);
      setSuccess('Snapshot deleted successfully');
      loadSnapshots();
    } catch (err: any) {
      setError(err.message || 'Failed to delete snapshot');
    }
  };

  const handleUploadBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupFileSelected(file);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!window.confirm(`Restore database from file "${file.name}"? This will update products and packages.`)) return;
        setBackupLoading(true);
        const res = await restoreAdminBackup({ backupPayload: json });
        setSuccess(res.message || 'Backup file restored successfully!');
        await loadAllData();
        await loadSnapshots();
      } catch (err: any) {
        setError('Invalid JSON backup file or restore failed: ' + (err.message || ''));
      } finally {
        setBackupLoading(false);
        setBackupFileSelected(null);
        if (backupFileInputRef.current) backupFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Contact & Support Messages State
  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);
  const [contactPendingCount, setContactPendingCount] = useState(0);
  const [contactStatusFilter, setContactStatusFilter] = useState('ALL');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactMessageItem | null>(null);
  const [contactReplyText, setContactReplyText] = useState('');
  const [contactReplyStatus, setContactReplyStatus] = useState('RESOLVED');
  const [contactActionLoading, setContactActionLoading] = useState(false);

  const loadContactMessages = async () => {
    try {
      const res = await fetchAdminContactMessages();
      setContactMessages(res.messages || []);
      setContactPendingCount(res.pendingCount || 0);
    } catch (e) {
      console.error('Failed to load contact messages:', e);
    }
  };

  const handleReplyContact = async (id: string) => {
    setContactActionLoading(true);
    try {
      await updateAdminContactMessage(id, {
        status: contactReplyStatus,
        reply: contactReplyText.trim() || undefined,
      });
      setSuccess('Contact message status & reply updated successfully!');
      setSelectedContact(null);
      setContactReplyText('');
      await loadContactMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to update contact message');
    } finally {
      setContactActionLoading(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this support message?')) return;
    setContactActionLoading(true);
    try {
      await deleteAdminContactMessage(id);
      setSuccess('Support ticket deleted successfully');
      setSelectedContact(null);
      await loadContactMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to delete contact message');
    } finally {
      setContactActionLoading(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true); setError('');
    try {
      const statsRes = await fetchAdminStats();
      setMetrics(statsRes.metrics); setRecentOrders(statsRes.recentOrders); setPopularity(statsRes.popularity);
      const ordersRes = await fetchAdminOrders(); setOrders(ordersRes);
      const prodRes = await fetchAdminProducts(); setAllProducts(prodRes);
      await loadSnapshots();
      await loadContactMessages();
      if (prodRes.length > 0) {
        setSelectedProductId(prodRes[0].id);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      console.warn('[Admin Dashboard] Load error:', err);
      if (msg.includes('Unauthorized') || msg.includes('No token provided') || msg.includes('Forbidden') || msg.includes('token')) {
        setError('Session expired or unauthorized. Please sign in to continue.');
        localStorage.removeItem('token');
        localStorage.removeItem('admin_token');
        setTimeout(() => {
          router.push('/login?redirect=/admin');
        }, 1500);
      } else {
        setError('Failed to load data. Is backend running?');
      }
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    let unsubRealtime: (() => void) | null = null;

    const verifyAuth = async () => {
      let token = getAuthToken();
      const adminEmails = ['mdara9695@gmail.com', 'admin@nadytopup.com', 'admin@topup.com', 'admin@gmail.com'];
      const email = typeof window !== 'undefined' ? localStorage.getItem('user_email') : null;
      let role = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;

      // 1. If no token in localStorage, try recovering from active Supabase session
      if (!token) {
        try {
          const { supabase } = await import('../../lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            token = session.access_token;
            localStorage.setItem('token', token);
            localStorage.setItem('admin_token', token);
            if (session.user?.email) {
              localStorage.setItem('user_email', session.user.email);
              if (adminEmails.includes(session.user.email.toLowerCase())) {
                role = 'ADMIN';
                localStorage.setItem('user_role', 'ADMIN');
              }
            }
          }
        } catch (e) {
          console.warn('[Admin] Supabase session recovery check error:', e);
        }
      }

      // Check admin eligibility
      const isEligibleAdmin = (role === 'ADMIN') || (email && adminEmails.includes(email.toLowerCase()));

      if (!token || !isEligibleAdmin) {
        if (active) {
          router.push('/login?redirect=/admin');
        }
        return;
      }

      if (email && adminEmails.includes(email.toLowerCase()) && role !== 'ADMIN') {
        localStorage.setItem('user_role', 'ADMIN');
      }

      if (!active) return;
      setIsAdmin(true);
      await loadAllData();

      // Supabase Real-time subscriber for instant sync across all tables on delete / update / insert
      unsubRealtime = subscribeToAllRealtime({
        onProductChange: (payload) => {
          console.log('[Admin Realtime] Product change/delete:', payload.eventType);
          if (payload.eventType === 'DELETE' && payload.old?.id) {
            setAllProducts((prev) => prev.filter((p) => p.id !== payload.old.id && p.slug !== payload.old.slug));
          }
          fetchAdminProducts().then(setAllProducts).catch(() => {});
        },
        onPackageChange: (payload) => {
          console.log('[Admin Realtime] Package change/delete:', payload.eventType);
          fetchAdminProducts().then(setAllProducts).catch(() => {});
        },
        onOrderChange: (payload) => {
          console.log('[Admin Realtime] Order change/delete:', payload.eventType);
          fetchAdminOrders().then(setOrders).catch(() => {});
          fetchAdminStats().then(s => {
            setMetrics(s.metrics);
            setRecentOrders(s.recentOrders);
            setPopularity(s.popularity);
          }).catch(() => {});
        },
        onContactChange: (payload) => {
          console.log('[Admin Realtime] ContactMessage change/delete:', payload.eventType);
          loadContactMessages();
        },
      });
    };

    verifyAuth();

    return () => {
      active = false;
      if (unsubRealtime) unsubRealtime();
    };
  }, [router]);

  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); } }, [error]);

  const uploadImageToServer = async (file: File, bucket = 'games'): Promise<string> => {
    setUploadingImage(true);
    try {
      // 1. Try Supabase Storage first for cloud-hosted CDN asset delivery
      try {
        const { uploadToSupabaseStorage } = await import('../../lib/supabase');
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
        const filePath = `${bucket}/${Date.now()}_${cleanName}`;
        const publicUrl = await uploadToSupabaseStorage(bucket, filePath, file);
        if (publicUrl) {
          console.log('[Upload] Successfully uploaded to Supabase Storage:', publicUrl);
          return publicUrl;
        }
      } catch (sbErr: any) {
        console.warn('[Upload] Supabase Storage upload note (falling back to server upload):', sbErr?.message || sbErr);
      }

      // 2. Fallback to Backend API upload
      const data = await uploadAdminImage(file);
      const rawUrl = data.url;
      if (!rawUrl) throw new Error('No image URL in response');
      return rawUrl.startsWith('http') ? rawUrl : `${serverUrl}${rawUrl}`;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageFileDrop = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setProductImageFile(file); setProductImagePreview(URL.createObjectURL(file)); setNewProductImage('');
  }, []);

  const handleEditImageFileDrop = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setEditImageFile(file); setEditImagePreview(URL.createObjectURL(file));
  }, []);

  const handleUpdateStatus = async (id: string, status: string, code?: string) => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await updateAdminOrderStatus(id, status, code);
      setSuccess(`Order updated to ${status}`); setActivePromptOrderId(null); setPromptCode('');
      await loadAllData();
    } catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleCheckOrderPayment = async (order: any) => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const res = await verifyPayment(order.paymentTxnId);
      if (res && res.verified) {
        setSuccess(`Payment verified! Order #${order.paymentTxnId.slice(0, 10)} updated to ${res.status || 'PAID'}`);
        await loadAllData();
      } else {
        setError(res?.error || res?.message || 'Payment not yet confirmed by bank/gateway.');
      }
    } catch (err: any) {
      setError('Payment verification check failed: ' + (err.message || err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoVerifyAll = async () => {
    setAutoVerifyingAll(true);
    setError('');
    setSuccess('');
    try {
      const res = await autoVerifyAllAdminOrders();
      setSuccess(res.message || 'Auto-check finished!');
      await loadAllData();
    } catch (err: any) {
      setError('Auto-check failed: ' + (err.message || err));
    } finally {
      setAutoVerifyingAll(false);
    }
  };

  const handleAutoFulfillOrder = async (orderId: string) => {
    setAutoFulfillingId(orderId);
    setError('');
    setSuccess('');
    try {
      const res = await autoFulfillAdminOrder(orderId);
      setSuccess(res.message || `Order #${orderId.slice(0, 10)} auto-fulfilled!`);
      await loadAllData();
    } catch (err: any) {
      setError('Auto-fulfill failed: ' + (err.message || err));
    } finally {
      setAutoFulfillingId(null);
    }
  };

  // Live Auto-Sync for Orders tab
  useEffect(() => {
    if (activeTab !== 'orders' || !autoSyncOrders || !isAdmin) return;
    const interval = setInterval(() => {
      fetchAdminOrders(orderFilter || undefined, orderSearch || undefined)
        .then(setOrders)
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [activeTab, autoSyncOrders, isAdmin, orderFilter, orderSearch]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) { setError('Product name required'); return; }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      let imageUrl = newProductImage;
      if (productImageFile) imageUrl = await uploadImageToServer(productImageFile);
      const res = await addAdminProduct(
        newProductName.trim(),
        newProductCategory,
        imageUrl || undefined,
        newProductSlug.trim() || undefined,
        undefined,
        autoSeedPackages,
        newProductHasZone,
        newProductHasZone ? newProductZoneLabel : undefined
      );
      const createdProd = res.product;
      const gameTitle = createdProd?.name || newProductName;
      setSuccess(`Game "${gameTitle}" created successfully with ${createdProd?.packages?.length || 6} top-up packages!`);
      setNewProductName(''); setNewProductSlug(''); setNewProductImage(''); setProductImageFile(null); setProductImagePreview('');
      setNewProductHasZone(false); setNewProductZoneLabel('Zone ID');
      await loadAllData();
      if (createdProd?.id) {
        setSelectedProductId(createdProd.id);
      }
    } catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleUpdateProductImage = async (productId: string) => {
    if (!editImageFile) { setError('Select image first'); return; }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const imageUrl = await uploadImageToServer(editImageFile);
      await updateAdminProduct(productId, { image: imageUrl });
      setSuccess('Image updated!'); setEditingProductId(null); setEditImageFile(null); setEditImagePreview('');
      await loadAllData();
    } catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !newPackageName.trim() || !newPackageAmount || !newPackagePrice) { setError('All fields required'); return; }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      let finalImg = newPackageImage;
      if (newPackageFile) {
        finalImg = await uploadImageToServer(newPackageFile);
      }
      const res = await addAdminPackage(
        selectedProductId,
        newPackageName,
        parseInt(newPackageAmount, 10),
        parseFloat(newPackagePrice),
        newPackageCategory,
        newPackageBadge || undefined,
        finalImg || undefined
      );
      setSuccess(res.message || 'Package created');
      setNewPackageName(''); setNewPackageAmount(''); setNewPackagePrice(''); setNewPackageCategory('NORMAL'); setNewPackageBadge('');
      setNewPackageImage(''); setNewPackageFile(null); setNewPackagePreview('');
      await loadAllData();
    } catch (err: any) { setError('Failed: ' + err.message); }
    finally { setActionLoading(false); }
  };

  const handleDeleteProduct = async (id: string, name?: string) => {
    if (!id) {
      console.error('Missing game ID');
      return;
    }

    const gameName = name || allProducts.find((p) => p.id === id)?.name || id;
    const confirmed = window.confirm(`Are you sure you want to delete "${gameName}" and all associated packages?`);
    if (!confirmed) return;

    console.log("Deleting game:", id);
    setDeletingId(id);
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Call Supabase / Backend API delete operation (with database post-verification)
      await deleteAdminProduct(id);

      // 2. Update React state only after confirmed deletion
      setAllProducts((prevGames) => prevGames.filter((game) => game.id !== id && game.slug !== id));

      // 3. Invalidate any client-side caches
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cached_games');
        sessionStorage.removeItem('products_cache');
        localStorage.removeItem('cached_games');
        localStorage.removeItem('products_cache');
      }

      // 4. Refetch latest authoritative data directly from Supabase / API
      await loadAllData();

      setSuccess(`Game "${gameName}" deleted successfully`);
      console.log("Game deleted successfully from Supabase:", id);
    } catch (err: any) {
      console.error("Delete game error:", err);
      setError(`Failed to delete game: ${err.message || err}`);
      // On error, restore true state from database
      await loadAllData();
    } finally {
      setDeletingId(null);
      setActionLoading(false);
    }
  };

  const handleDeletePackage = async (id: string, name?: string) => {
    if (!id) {
      console.error('Missing package ID');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete package "${name || id}"?`);
    if (!confirmed) return;

    console.log("Deleting package:", id);
    setActionLoading(true);
    setError('');
    setSuccess('');

    // 1. Immediately remove from React state
    setAllProducts((prevProds) =>
      prevProds.map((p) => ({
        ...p,
        packages: (p.packages || []).filter((pkg) => pkg.id !== id),
      }))
    );

    try {
      // 2. Call delete operation
      await deleteAdminPackage(id);

      // 3. Refetch latest data
      await loadAllData();

      setSuccess('Package deleted successfully');
      console.log("Package deleted successfully:", id);
    } catch (err: any) {
      console.error("Delete package error:", err);
      setError('Failed to delete package: ' + (err.message || ''));
      await loadAllData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearchOrders = async () => {
    setLoading(true);
    try { const r = await fetchAdminOrders(orderFilter || undefined, orderSearch || undefined); setOrders(r); }
    catch { setError('Search failed'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    try {
      document.cookie = 'token=; Max-Age=0; path=/;';
      const { supabase } = await import('../../lib/supabase');
      await supabase.auth.signOut().catch(() => {});
    } catch (e) {}
    router.push('/login');
  };

  const getStatusBadge = (status: string) => {
    const b = 'inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border';
    if (status === 'COMPLETED' || status === 'SUCCESS') return <span className={`${b} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>✓ SUCCESS</span>;
    if (status === 'PENDING') return <span className={`${b} bg-amber-500/10 text-amber-400 border-amber-500/20`}>⏳ PENDING</span>;
    if (status === 'PROCESSING') return <span className={`${b} bg-cyan-500/10 text-cyan-400 border-cyan-500/20`}>⚡ PROCESS</span>;
    return <span className={`${b} bg-red-500/10 text-red-400 border-red-500/20`}>✗ FAILED</span>;
  };

  const getProductImgSrc = (img?: string | null) => {
    if (!img) return 'https://placehold.co/48x48/1e293b/94a3b8?text=IMG';
    if (img.startsWith('http') || img.startsWith('blob')) return img;
    if (img.startsWith('/uploads')) return `${API_BASE.replace(/\/api$/, '')}${img}`;
    if (img.startsWith('/')) return img;
    return `${API_BASE.replace(/\/api$/, '')}/${img}`;
  };

  const getPkgImgSrc = (img?: string | null) => {
    if (!img) return '/images/diamond-art.png';
    if (img.startsWith('http') || img.startsWith('blob')) return img;
    if (img.startsWith('/uploads')) return `${API_BASE.replace(/\/api$/, '')}${img}`;
    if (img.startsWith('/')) return img;
    return `${API_BASE.replace(/\/api$/, '')}/${img}`;
  };

  const totalPackagesCount = allProducts.reduce((sum, p) => sum + (p.packages?.length || 0), 0);

  const navItems = [
    { id: 'metrics', icon: BarChart3, label: 'Overview', count: null },
    { id: 'orders', icon: ShoppingBag, label: 'Orders', count: orders.length },
    { id: 'products', icon: Package, label: 'Game Products', count: allProducts.length },
    { id: 'diamonds', icon: Gem, label: 'Diamonds / Packages', count: totalPackagesCount },
    { id: 'contact', icon: MessageSquare, label: 'Customer Inquiries', count: contactPendingCount || (contactMessages.length || null) },
    { id: 'backup', icon: HardDrive, label: 'Backup & Restore', count: snapshots.length || null },
    { id: 'security', icon: ShieldCheck, label: 'Security & DDoS', count: null },
  ] as const;

  if (!isAdmin) return null;

  const panelCls = 'border border-slate-800 rounded-2xl';
  const panelBg = { background: 'rgba(15,23,42,0.65)' };
  const inputCls = 'w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs';
  const btnGrad = { background: 'linear-gradient(to right,#06b6d4,#8b5cf6)' };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ══ SIDEBAR ══════════════════════════════════════════════════════ */}
      <aside 
        style={{ 
          width: isMobile ? 260 : (sidebarOpen ? 240 : 64), 
          transition: 'width .3s, transform .3s', 
          flexShrink: 0 
        }}
        className={`fixed top-0 left-0 h-full z-50 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden ${
          isMobile 
            ? (mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full')
            : 'translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800 min-w-0">
          <div className="flex items-center min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)' }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            {(sidebarOpen || isMobile) && (
              <div className="ml-3 overflow-hidden">
                <div className="text-white font-black text-sm">𝘿𝘼𝙍𝘼-𝙎𝙏𝙊𝙍𝙀</div>
                <div className="text-[10px] text-cyan-400 font-semibold">Admin Panel</div>
              </div>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative min-h-[44px] ${activeTab === item.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
              style={{ gap: 12 }}
            >
              {activeTab === item.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-500 rounded-r-full" />}
              <item.icon className={`h-4 w-4 shrink-0 ${activeTab === item.id ? 'text-cyan-400' : 'text-slate-500'}`} />
              {(sidebarOpen || isMobile) && <>
                <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                {item.count !== null && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === item.id ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>{item.count}</span>}
              </>}
            </button>
          ))}
        </nav>
        {/* Bottom */}
        <div className="px-2 py-4 border-t border-slate-800 space-y-1">
          {!isMobile && (
            <button onClick={() => setSidebarOpen(v => !v)} className="w-full flex items-center px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-all min-h-[44px]" style={{ gap: 12 }}>
              <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
              {sidebarOpen && <span className="whitespace-nowrap">Collapse</span>}
            </button>
          )}
          <button onClick={handleLogout} className="w-full flex items-center px-3 py-2.5 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all min-h-[44px]" style={{ gap: 12 }}>
            <LogOut className="h-4 w-4 shrink-0" />
            {(sidebarOpen || isMobile) && <span className="whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══════════════════════════════════════════════════════════ */}
      <div 
        className="flex-1 flex flex-col min-h-screen overflow-x-hidden w-full transition-all" 
        style={{ marginLeft: isMobile ? 0 : (sidebarOpen ? 240 : 64), transition: 'margin-left .3s' }}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800" style={{ background: 'rgba(2,6,23,.95)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center space-x-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-95"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-white truncate">{navItems.find(n => n.id === activeTab)?.label}</h1>
              <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button onClick={loadAllData} disabled={loading} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-50 min-h-[36px]">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Sync</span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-xs" style={{ background: 'linear-gradient(135deg,#06b6d4,#8b5cf6)' }}>A</div>
          </div>
        </header>

        {/* Mobile Horizontal Quick Tabs */}
        <div className="md:hidden flex items-center space-x-1.5 overflow-x-auto no-scrollbar px-3 py-2 border-b border-slate-800/80 bg-slate-950/80">
          {navItems.map(item => (
            <button
              key={`quick-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all min-h-[36px] ${
                activeTab === item.id 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Toast notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-[90vw]" style={{ width: 320 }}>
          {error && <div className="flex items-start bg-red-950 border border-red-800/70 rounded-xl p-3.5 text-red-300 text-xs shadow-2xl" style={{ gap: 10 }}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span className="flex-1">{error}</span><button onClick={() => setError('')}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
          </div>}
          {success && <div className="flex items-start bg-emerald-950 border border-emerald-800/70 rounded-xl p-3.5 text-emerald-300 text-xs shadow-2xl" style={{ gap: 10 }}>
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /><span className="flex-1">{success}</span><button onClick={() => setSuccess('')}><X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" /></button>
          </div>}
        </div>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-xs">Loading dashboard...</p>
            </div>
          ) : (<>

            {/* ── TAB 1: OVERVIEW ─────────────────────────────────── */}
            {activeTab === 'metrics' && metrics && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Revenue', value: `$${metrics.totalRevenue.toFixed(2)}`, Icon: DollarSign, clr: '#10b981', bg: 'rgba(16,185,129,.08)', sub: 'Completed orders' },
                    { label: 'Completed', value: metrics.completedOrders, Icon: CheckCircle, clr: '#06b6d4', bg: 'rgba(6,182,212,.08)', sub: 'Delivered' },
                    { label: 'Pending', value: metrics.pendingOrders, Icon: Clock, clr: '#f59e0b', bg: 'rgba(245,158,11,.08)', sub: 'Awaiting payment' },
                    { label: 'Total Orders', value: metrics.totalOrders, Icon: ShoppingBag, clr: '#8b5cf6', bg: 'rgba(139,92,246,.08)', sub: 'All time' },
                  ].map(card => (
                    <div key={card.label} className={`${panelCls} p-5 hover:border-slate-700 transition-all`} style={panelBg}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-slate-400 text-xs font-semibold">{card.label}</span>
                        <div className="p-2 rounded-xl" style={{ background: card.bg }}><card.Icon className="h-4 w-4" style={{ color: card.clr }} /></div>
                      </div>
                      <div className="text-3xl font-black text-white mb-1">{card.value}</div>
                      <div className="text-[10px] text-slate-500">{card.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className={`xl:col-span-2 ${panelCls} p-5`} style={panelBg}>
                    <h3 className="text-white font-extrabold text-sm mb-4 flex items-center space-x-2"><TrendingUp className="h-4 w-4 text-cyan-400" /><span>Recent Transactions</span></h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead><tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider">
                          {['Game','Player','Amount','Status'].map(h=><th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-slate-800">
                          {recentOrders.map((o: any, idx: number) => (
                            <tr key={`ro-${o.id || idx}-${idx}`} className="hover:bg-slate-800/20">
                              <td className="py-2.5 pr-4 text-white font-semibold">{o.package?.product?.name||'—'}</td>
                              <td className="py-2.5 pr-4 text-slate-300">
                                <div>{o.playerNickname||o.playerId}</div>
                                {o.playerZoneId && <span className="text-cyan-400 font-mono text-[10px]">({o.playerZoneId})</span>}
                              </td>
                              <td className="py-2.5 pr-4 text-cyan-400 font-bold">${o.price.toFixed(2)}</td>
                              <td className="py-2.5">{getStatusBadge(o.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className={`${panelCls} p-5`} style={panelBg}>
                    <h3 className="text-white font-extrabold text-sm mb-4 flex items-center space-x-2"><Star className="h-4 w-4 text-amber-400" /><span>Popularity</span></h3>
                    <div className="space-y-3">
                      {popularity.map((g: any, i: number) => (
                        <div key={`pop-${g.id || g.name || 'game'}-${i}`} className="flex items-center" style={{ gap: 10 }}>
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                            style={{ background: i===0?'rgba(245,158,11,.2)':'rgba(51,65,85,.5)', color: i===0?'#f59e0b':'#64748b' }}>{i+1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-bold truncate">{g.name}</div>
                            <div className="mt-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width:`${Math.max(5,(g.salesCount/(popularity[0]?.salesCount||1))*100)}%`, background:'linear-gradient(to right,#06b6d4,#8b5cf6)' }} />
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">{g.salesCount}</span>
                        </div>
                      ))}
                      {!popularity.length && <p className="text-slate-600 text-xs text-center py-6">No data yet</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: ORDERS ──────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div className="space-y-5">
                <div className={`flex flex-wrap gap-3 items-center ${panelCls} p-4`} style={panelBg}>
                  <select value={orderFilter} onChange={e=>setOrderFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs px-3 py-2 focus:outline-none focus:border-cyan-500">
                    <option value="">All Statuses</option>
                    {['PENDING','COMPLETED','SUCCESS','FAILED'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex-1 relative" style={{ minWidth: 200 }}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input type="text" placeholder="Search player, txn ID..." value={orderSearch}
                      onChange={e=>setOrderSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearchOrders()}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
                  </div>
                  <button onClick={handleSearchOrders} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background:'rgba(6,182,212,.1)', border:'1px solid rgba(6,182,212,.2)', color:'#06b6d4' }}>Search</button>
                  <button onClick={()=>{setOrderFilter('');setOrderSearch('');loadAllData();}} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold hover:text-white">Reset</button>

                  {/* Auto-Sync Live Orders Toggle */}
                  <button
                    type="button"
                    onClick={() => setAutoSyncOrders(!autoSyncOrders)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                      autoSyncOrders
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                    title="Real-time live sync every 4s"
                  >
                    <span className={`h-2 w-2 rounded-full ${autoSyncOrders ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>Auto-Sync: {autoSyncOrders ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Auto-Check All Pending Orders */}
                  <button
                    type="button"
                    onClick={handleAutoVerifyAll}
                    disabled={autoVerifyingAll || actionLoading}
                    className="px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 active:scale-95 disabled:opacity-50 shadow-cyan-500/10 shadow-sm"
                    title="Automatically verify all pending orders with payment gateways and fulfill paid ones"
                  >
                    <Zap className={`h-3.5 w-3.5 text-cyan-400 ${autoVerifyingAll ? 'animate-spin' : ''}`} />
                    <span>{autoVerifyingAll ? 'Auto-Checking...' : '⚡ Auto-Check All Pending'}</span>
                  </button>

                  <span className="text-xs text-slate-500 ml-auto">{orders.length} records</span>
                </div>
                <div className={`${panelCls} overflow-hidden`} style={panelBg}>
                  <div className="overflow-x-auto" style={{ maxHeight: 580, overflowY:'auto' }}>
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 border-b border-slate-800" style={{ background:'#0f172a' }}>
                        <tr className="text-slate-500 uppercase tracking-wider">
                          {['Txn ID','Game / Package','Player','Amount','Method','Status','Date','Actions'].map(h=><th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {orders.map((o: any, oIdx: number) => (
                          <React.Fragment key={`order-${o.id || oIdx}-${oIdx}`}>
                            <tr className="hover:bg-slate-800/20">
                              <td className="px-4 py-3 font-mono text-slate-400 text-[10px] whitespace-nowrap">{o.paymentTxnId?.slice(0,18)}…</td>
                              <td className="px-4 py-3"><div className="text-white font-semibold whitespace-nowrap">{o.package?.product?.name}</div><div className="text-slate-500 text-[10px]">{o.package?.name}</div></td>
                              <td className="px-4 py-3">
                                <div className="text-slate-200 whitespace-nowrap">{o.playerNickname||'—'}</div>
                                <div className="text-slate-400 font-mono text-[10px] flex items-center gap-1 flex-wrap">
                                  <span>{o.playerId}</span>
                                  {o.playerZoneId && (
                                    <span className="text-cyan-400 font-sans font-bold text-[9px] px-1 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/20">
                                      Zone: {o.playerZoneId}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-cyan-400 font-bold whitespace-nowrap">${o.price.toFixed(2)}</td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{o.paymentMethod}</td>
                              <td className="px-4 py-3">{getStatusBadge(o.status)}</td>
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                {o.status==='PENDING'&&(
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleAutoFulfillOrder(o.id)}
                                      disabled={autoFulfillingId === o.id || actionLoading}
                                      className="px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 transition-all"
                                      style={{ background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', color: '#10b981' }}
                                      title="One-click automatic fulfillment & settlement"
                                    >
                                      <Zap className={`h-2.5 w-2.5 ${autoFulfillingId === o.id ? 'animate-spin' : ''}`} />
                                      <span>⚡ Auto Fulfill</span>
                                    </button>
                                    <button
                                      onClick={() => handleCheckOrderPayment(o)}
                                      disabled={actionLoading}
                                      className="px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 transition-all"
                                      style={{ background: 'rgba(6,182,212,.12)', border: '1px solid rgba(6,182,212,.25)', color: '#06b6d4' }}
                                      title="Check live payment status from bank"
                                    >
                                      <RefreshCw className={`h-2.5 w-2.5 ${actionLoading ? 'animate-spin' : ''}`} />
                                      <span>Check Payment</span>
                                    </button>
                                    <button onClick={()=>setActivePromptOrderId(o.id===activePromptOrderId?null:o.id)} className="px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap" style={{ background:'rgba(56,189,248,.1)', border:'1px solid rgba(56,189,248,.2)', color:'#38bdf8' }}>Manual Code</button>
                                    <button onClick={()=>handleUpdateStatus(o.id,'FAILED')} disabled={actionLoading} className="px-2 py-1 rounded text-[10px] font-bold" style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#ef4444' }}>✗</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                            {activePromptOrderId===o.id&&(
                              <tr><td colSpan={8} className="px-4 pb-3" style={{ background:'rgba(16,185,129,.03)' }}>
                                <div className="flex items-center space-x-2 mt-2">
                                  <input type="text" placeholder="Delivery code (optional)" value={promptCode} onChange={e=>setPromptCode(e.target.value)}
                                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none" />
                                  <button onClick={()=>handleUpdateStatus(o.id,'SUCCESS',promptCode||undefined)} disabled={actionLoading} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background:'rgba(16,185,129,.2)', border:'1px solid rgba(16,185,129,.3)', color:'#10b981' }}>Confirm</button>
                                  <button onClick={()=>setActivePromptOrderId(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold hover:text-white">Cancel</button>
                                </div>
                              </td></tr>
                            )}
                          </React.Fragment>
                        ))}
                        {!orders.length&&<tr><td colSpan={8} className="px-4 py-12 text-center text-slate-600 text-xs">No orders found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


            {/* ── TAB 4: PRODUCTS ──────────────────────────────── */}
            {activeTab==='products'&&(
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Add Product */}
                  <div className={`${panelCls} p-5`} style={panelBg}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-white font-extrabold text-sm flex items-center space-x-2">
                        <Plus className="h-4 w-4 text-cyan-400" />
                        <span>Add New Game</span>
                      </h3>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">
                        Live Catalog
                      </span>
                    </div>

                    <form onSubmit={handleCreateProduct} className="space-y-4">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Game Name / Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Free Fire, Mobile Legends, PUBG Mobile"
                          value={newProductName}
                          onChange={e => {
                            setNewProductName(e.target.value);
                            if (!newProductSlug) {
                              // live auto suggestion
                            }
                          }}
                          className={inputCls}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Category</label>
                          <select
                            value={newProductCategory}
                            onChange={e => setNewProductCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500 text-xs"
                          >
                            <option value="MOBILE_GAME">🎮 Mobile Game</option>
                            <option value="PC_GAME">🖥️ PC Game</option>
                            <option value="VOUCHER">🎟️ Voucher / Card</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 font-semibold mb-1.5 text-xs">
                            Custom Slug <span className="text-slate-600 font-normal">(optional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder={newProductName ? newProductName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'e.g. pubg-mobile'}
                            value={newProductSlug}
                            onChange={e => setNewProductSlug(e.target.value)}
                            className={inputCls}
                          />
                        </div>
                      </div>

                      {/* Instant Starter Packages Checkbox */}
                      <div className="rounded-xl p-3 bg-slate-950/70 border border-slate-800 flex items-start space-x-2.5">
                        <input
                          id="autoSeedCheck"
                          type="checkbox"
                          checked={autoSeedPackages}
                          onChange={e => setAutoSeedPackages(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                        />
                        <label htmlFor="autoSeedCheck" className="text-xs text-slate-300 cursor-pointer">
                          <span className="font-bold text-white block">Auto-generate 6 Starter Top-Up Packages</span>
                          <span className="text-[11px] text-slate-400">Creates 50, 100, 250, 500, 1000, and 2000 Diamonds packages so top-ups work immediately.</span>
                        </label>
                      </div>

                      {/* Zone ID / Server ID Requirement Toggle */}
                      <div className="rounded-xl p-3 bg-slate-950/70 border border-slate-800 space-y-2">
                        <div className="flex items-start space-x-2.5">
                          <input
                            id="newProductHasZoneCheck"
                            type="checkbox"
                            checked={newProductHasZone}
                            onChange={e => setNewProductHasZone(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                          />
                          <label htmlFor="newProductHasZoneCheck" className="text-xs text-slate-300 cursor-pointer">
                            <span className="font-bold text-white block">Requires Zone ID / Server ID (ទាមទារ Zone/Server ID)</span>
                            <span className="text-[11px] text-slate-400">Enable this for games like Mobile Legends (Zone ID) or Genshin Impact (Server ID).</span>
                          </label>
                        </div>
                        {newProductHasZone && (
                          <div className="pt-2 border-t border-slate-800">
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Field Label / ឈ្មោះ Label</label>
                            <input
                              type="text"
                              value={newProductZoneLabel}
                              onChange={e => setNewProductZoneLabel(e.target.value)}
                              placeholder="e.g. Zone ID, Server ID, Server"
                              className={inputCls}
                            />
                          </div>
                        )}
                      </div>

                      {/* Drag & Drop Artwork */}
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Game Artwork / Icon</label>
                        <div
                          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={e => {
                            e.preventDefault();
                            setIsDragging(false);
                            const f = e.dataTransfer.files[0];
                            if (f) handleImageFileDrop(f);
                          }}
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer rounded-xl flex flex-col items-center justify-center p-5 text-center transition-all"
                          style={{
                            border: `2px dashed ${isDragging ? '#06b6d4' : '#334155'}`,
                            background: isDragging ? 'rgba(6,182,212,.06)' : 'rgba(15,23,42,.4)',
                          }}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleImageFileDrop(f);
                            }}
                          />
                          {productImagePreview ? (
                            <div className="relative">
                              <img src={productImagePreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover mx-auto mb-2 shadow-lg border border-slate-700" />
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setProductImageFile(null);
                                  setProductImagePreview('');
                                }}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <p className="text-slate-400 text-[10px] mt-1">{productImageFile?.name}</p>
                            </div>
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-2">
                                <ImageIcon className="h-5 w-5 text-slate-500" />
                              </div>
                              <p className="text-slate-400 font-semibold text-[11px]">Drag & drop or click to upload cover</p>
                              <p className="text-slate-600 text-[10px] mt-0.5">PNG, JPG, WebP, SVG · Max 10MB</p>
                            </>
                          )}
                        </div>
                        {!productImagePreview && (
                          <input
                            type="text"
                            placeholder="Or paste image URL (e.g. /images/games/pubg.png)..."
                            value={newProductImage}
                            onChange={e => setNewProductImage(e.target.value)}
                            className={`${inputCls} mt-2`}
                          />
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading || uploadingImage}
                        className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-white font-bold text-xs disabled:opacity-50 transition-all cursor-pointer shadow-lg hover:brightness-110 active:scale-[0.99]"
                        style={btnGrad}
                      >
                        {uploadingImage ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Uploading image...</span>
                          </>
                        ) : actionLoading ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Creating Game...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create Game & Launch</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Add Package */}
                  <div className={`${panelCls} p-5`} style={panelBg}>
                    <h3 className="text-white font-extrabold text-sm mb-5 flex items-center space-x-2"><Gem className="h-4 w-4 text-cyan-400"/><span>Add Diamond Package</span></h3>
                    <form onSubmit={handleCreatePackage} className="space-y-4">
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Game Product</label>
                        <select value={selectedProductId} onChange={e=>setSelectedProductId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500 text-xs">
                          {allProducts.map((p, pIdx)=><option key={`prod-sel-${p.id || pIdx}`} value={p.id}>{p.name} ({p.category})</option>)}
                        </select></div>
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Package Name</label>
                        <input type="text" required placeholder="e.g. 50 Diamonds, 100+10 Diamonds" value={newPackageName} onChange={e=>setNewPackageName(e.target.value)} className={inputCls}/></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Amount</label>
                          <input type="number" required placeholder="50" value={newPackageAmount} onChange={e=>setNewPackageAmount(e.target.value)} className={inputCls}/></div>
                        <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Price (USD)</label>
                          <input type="number" step="0.01" required placeholder="0.99" value={newPackagePrice} onChange={e=>setNewPackagePrice(e.target.value)} className={inputCls}/></div>
                      </div>
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Category</label>
                        <select value={newPackageCategory} onChange={e=>setNewPackageCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500 text-xs">
                          <option value="NORMAL">Normal</option><option value="BEST_SELLER">Best Seller</option>
                        </select></div>
                      <div><label className="block text-slate-400 font-semibold mb-1.5 text-xs">Badge (optional)</label>
                        <input type="text" placeholder="e.g. 🔥 Best Value" value={newPackageBadge} onChange={e=>setNewPackageBadge(e.target.value)} className={inputCls}/></div>

                      {/* Package Artwork / Custom Icon Upload */}
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Package Icon / Artwork (optional)</label>
                        <div
                          onClick={() => newPackageFileInputRef.current?.click()}
                          className="cursor-pointer rounded-xl flex items-center justify-between p-2.5 border border-dashed border-slate-700 bg-slate-950/60 hover:border-cyan-500 transition-all mb-2"
                        >
                          <input
                            ref={newPackageFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setNewPackageFile(f);
                                setNewPackagePreview(URL.createObjectURL(f));
                              }
                            }}
                          />
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={newPackagePreview || getPkgImgSrc(newPackageImage)}
                              alt="Pkg Icon"
                              className="h-8 w-8 rounded-lg object-contain p-0.5 bg-slate-900 border border-slate-800"
                            />
                            <div>
                              <p className="text-xs font-bold text-white">
                                {newPackageFile ? newPackageFile.name : 'Upload custom diamond / item icon'}
                              </p>
                              <p className="text-[10px] text-slate-500">PNG, JPG, WebP supported</p>
                            </div>
                          </div>
                          <Upload className="h-4 w-4 text-cyan-400 mr-1" />
                        </div>
                        {!newPackagePreview && (
                          <input
                            type="text"
                            placeholder="Or icon path (e.g. /images/diamond-art.png)"
                            value={newPackageImage}
                            onChange={e => setNewPackageImage(e.target.value)}
                            className={inputCls}
                          />
                        )}
                      </div>

                      <button type="submit" disabled={actionLoading} className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-white font-bold text-xs disabled:opacity-50 transition-all" style={btnGrad}>
                        <Plus className="h-3.5 w-3.5"/><span>Create Package</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Catalog Header with Search & Filter */}
                <div className={`${panelCls} p-5`} style={panelBg}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-white font-extrabold text-sm flex items-center space-x-2">
                        <Database className="h-4 w-4 text-cyan-400" />
                        <span>Product Catalog Editor ({allProducts.length} Games)</span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Edit titles, packages, prices, cover artworks, or toggle availability.
                      </p>
                    </div>

                    {/* Search and Category Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search game..."
                          value={productSearchQuery}
                          onChange={e => setProductSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs w-44"
                        />
                      </div>
                      <select
                        value={productCategoryFilter}
                        onChange={e => setProductCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="MOBILE_GAME">Mobile Games</option>
                        <option value="PC_GAME">PC Games</option>
                        <option value="VOUCHER">Vouchers</option>
                      </select>
                    </div>
                  </div>

                  {/* Catalog List */}
                  {(() => {
                    const filteredCatalog = allProducts.filter(p => {
                      const matchesSearch = !productSearchQuery || p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || p.slug.toLowerCase().includes(productSearchQuery.toLowerCase());
                      const matchesCat = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
                      return matchesSearch && matchesCat;
                    });

                    return (
                      <div className="space-y-4">
                        {filteredCatalog.map((prod, prodIdx) => (
                          <div key={`cat-prod-${prod.id || prodIdx}`} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                            {/* Product Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-800/80 bg-slate-950/40">
                              <div className="flex items-center space-x-3 min-w-0">
                                <img
                                  src={getProductImgSrc(prod.image)}
                                  alt={prod.name}
                                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/1e293b/94a3b8?text=IMG'; }}
                                  className="w-12 h-12 rounded-xl object-cover border border-slate-800 shadow-sm shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2 flex-wrap">
                                    <h4 className="text-white font-black text-sm truncate">{prod.name}</h4>
                                    <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                      {prod.category}
                                    </span>
                                    {prod.isActive === false ? (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                                        Disabled
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">/{prod.slug}</p>
                                </div>
                              </div>

                              {/* Action Buttons for Game */}
                              <div className="flex items-center space-x-2 shrink-0">
                                <button
                                  onClick={() => handleToggleProductStatus(prod)}
                                  disabled={actionLoading}
                                  className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    prod.isActive === false
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                                  }`}
                                  title={prod.isActive === false ? 'Enable Product' : 'Disable Product'}
                                >
                                  {prod.isActive === false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                  <span>{prod.isActive === false ? 'Enable' : 'Disable'}</span>
                                </button>

                                <button
                                  onClick={() => openEditProductModal(prod)}
                                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all"
                                >
                                  <Pencil className="h-3 w-3" />
                                  <span>Edit Game</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                  disabled={actionLoading || deletingId === prod.id}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all disabled:opacity-50"
                                  title="Delete Product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Packages Section */}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                                  <Gem className="h-3 w-3 text-cyan-400" />
                                  <span>Recharge Packages ({prod.packages?.length || 0})</span>
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => openAddPackageModalForGame(prod)}
                                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold transition-all shadow-xs"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add Package</span>
                                </button>
                              </div>

                              {(!prod.packages || prod.packages.length === 0) ? (
                                <p className="text-slate-600 text-xs italic">No packages assigned to this game yet.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                  {(prod.packages || []).map((pkg, pkgIdx) => (
                                    <div
                                      key={`pkg-item-${pkg.id || pkgIdx}`}
                                      className="group relative border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all bg-slate-950/60 flex flex-col justify-between"
                                    >
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <img
                                              src={getPkgImgSrc(pkg.image)}
                                              alt={pkg.name}
                                              className="h-6 w-6 object-contain rounded shrink-0 bg-slate-900 border border-slate-800 p-0.5"
                                            />
                                            <span className="text-white font-bold text-xs truncate">{pkg.name}</span>
                                          </div>
                                        </div>
                                        <div className="text-cyan-400 font-black text-sm">${pkg.price.toFixed(2)}</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">Amount: {pkg.amount}</div>
                                        {pkg.badge && (
                                          <div className="mt-1 text-[9px] text-amber-400 font-bold truncate">🏷️ {pkg.badge}</div>
                                        )}
                                        {pkg.category === 'BEST_SELLER' && (
                                          <div className="text-[9px] text-violet-400 font-bold">★ Best Seller</div>
                                        )}
                                      </div>

                                      {/* Package Actions Bar */}
                                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-end space-x-1.5">
                                        <button
                                          onClick={() => openEditPackageModal(pkg, prod)}
                                          className="p-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-all"
                                          title="Edit Package"
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeletePackage(pkg.id)}
                                          disabled={actionLoading}
                                          className="p-1 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                                          title="Delete Package"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {filteredCatalog.length === 0 && (
                          <div className="text-center py-12 text-slate-500 text-xs">
                            No games match your search &quot;{productSearchQuery}&quot;.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ══ TAB 4B: DIAMONDS & PACKAGES EDITOR ════════════════════════ */}
            {activeTab === 'diamonds' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Header & Quick Summary */}
                <div className={`${panelCls} p-5 sm:p-6`} style={panelBg}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
                        <Gem className="h-3.5 w-3.5" />
                        <span>Diamond Packages Management System</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white">Diamonds & Packages Editor</h2>
                      <p className="text-slate-400 text-xs mt-1">
                        Configure diamond tiers, adjust prices, edit badge highlights, custom icons, and manage availability across all games.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (allProducts.length > 0) {
                            openAddPackageModalForGame(allProducts[0]);
                          } else {
                            setError('Please create a game first before adding packages');
                          }
                        }}
                        className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-white font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        style={btnGrad}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Diamond Package</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Packages</span>
                      <span className="text-lg font-black text-cyan-400 mt-0.5 block">{totalPackagesCount}</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Connected Games</span>
                      <span className="text-lg font-black text-white mt-0.5 block">{allProducts.length}</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Best Sellers</span>
                      <span className="text-lg font-black text-violet-400 mt-0.5 block">
                        {allProducts.reduce((acc, p) => acc + (p.packages?.filter((k: any) => k.category === 'BEST_SELLER')?.length || 0), 0)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Tiers</span>
                      <span className="text-lg font-black text-emerald-400 mt-0.5 block">
                        {allProducts.reduce((acc, p) => acc + (p.packages?.filter((k: any) => k.isActive !== false)?.length || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className={`${panelCls} p-4 sm:p-5`} style={panelBg}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Game Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                      <button
                        type="button"
                        onClick={() => setDiamondGameFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          diamondGameFilter === 'ALL'
                            ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        All Games ({totalPackagesCount})
                      </button>
                      {allProducts.map(prod => {
                        const pkgCount = prod.packages?.length || 0;
                        return (
                          <button
                            key={`filter-prod-${prod.id}`}
                            type="button"
                            onClick={() => setDiamondGameFilter(prod.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                              diamondGameFilter === prod.id
                                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            <span>{prod.name}</span>
                            <span className="text-[10px] opacity-80">({pkgCount})</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Search & Category Filter */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search diamonds, name, price..."
                          value={diamondSearchQuery}
                          onChange={e => setDiamondSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs w-full sm:w-56"
                        />
                      </div>
                      <select
                        value={diamondCategoryFilter}
                        onChange={e => setDiamondCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 text-xs shrink-0"
                      >
                        <option value="ALL">All Tiers</option>
                        <option value="NORMAL">Normal</option>
                        <option value="BEST_SELLER">Best Seller</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="DISABLED">Disabled Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Packages Editor Catalog List */}
                {(() => {
                  const targetProducts = diamondGameFilter === 'ALL'
                    ? allProducts
                    : allProducts.filter(p => p.id === diamondGameFilter);

                  let totalShown = 0;

                  return (
                    <div className="space-y-6">
                      {targetProducts.map(prod => {
                        const filteredPkgs = (prod.packages || []).filter((pkg: any) => {
                          const q = diamondSearchQuery.toLowerCase();
                          const matchesQuery = !q 
                            || pkg.name.toLowerCase().includes(q) 
                            || String(pkg.amount).includes(q) 
                            || String(pkg.price).includes(q)
                            || (pkg.badge && pkg.badge.toLowerCase().includes(q));

                          let matchesCat = true;
                          if (diamondCategoryFilter === 'NORMAL') matchesCat = pkg.category !== 'BEST_SELLER';
                          else if (diamondCategoryFilter === 'BEST_SELLER') matchesCat = pkg.category === 'BEST_SELLER';
                          else if (diamondCategoryFilter === 'ACTIVE') matchesCat = pkg.isActive !== false;
                          else if (diamondCategoryFilter === 'DISABLED') matchesCat = pkg.isActive === false;

                          return matchesQuery && matchesCat;
                        });

                        totalShown += filteredPkgs.length;

                        if (diamondSearchQuery && filteredPkgs.length === 0) return null;

                        return (
                          <div key={`diamond-group-${prod.id}`} className={`${panelCls} overflow-hidden`} style={panelBg}>
                            {/* Product Header Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-950/60 border-b border-slate-800">
                              <div className="flex items-center space-x-3 min-w-0">
                                <img
                                  src={getProductImgSrc(prod.image)}
                                  alt={prod.name}
                                  className="h-10 w-10 rounded-xl object-cover border border-slate-800 shadow-sm shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-white font-extrabold text-sm truncate">{prod.name}</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                      {prod.packages?.length || 0} Tiers
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-mono">/{prod.slug}</p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => openAddPackageModalForGame(prod)}
                                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all shrink-0 self-start sm:self-auto"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Diamond Tier</span>
                              </button>
                            </div>

                            {/* Packages Grid */}
                            <div className="p-4 sm:p-5">
                              {filteredPkgs.length === 0 ? (
                                <div className="text-center py-6 text-slate-600 text-xs italic">
                                  No packages match the current filter for {prod.name}.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                                  {filteredPkgs.map((pkg: any) => {
                                    const isQuickEditing = quickEditingPkgId === pkg.id;

                                    return (
                                      <div
                                        key={`editor-pkg-${pkg.id}`}
                                        className={`group rounded-2xl border p-3.5 transition-all flex flex-col justify-between bg-slate-900/90 shadow-md ${
                                          pkg.isActive === false
                                            ? 'border-red-900/50 opacity-60 bg-red-950/10'
                                            : 'border-slate-800 hover:border-cyan-500/40 hover:shadow-cyan-500/5'
                                        }`}
                                      >
                                        <div>
                                          {/* Top Tag & Status */}
                                          <div className="flex items-center justify-between gap-1.5 mb-2.5">
                                            <div className="flex items-center space-x-1.5 min-w-0">
                                              <img
                                                src={getPkgImgSrc(pkg.image)}
                                                alt={pkg.name}
                                                className="h-7 w-7 object-contain rounded-lg p-0.5 bg-slate-950 border border-slate-800 shrink-0"
                                              />
                                              <span className="text-white font-extrabold text-xs truncate max-w-[110px]" title={pkg.name}>
                                                {pkg.name}
                                              </span>
                                            </div>

                                            {pkg.isActive === false ? (
                                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 shrink-0">
                                                Disabled
                                              </span>
                                            ) : pkg.category === 'BEST_SELLER' ? (
                                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-violet-500/20 border border-violet-500/30 text-violet-300 shrink-0">
                                                ★ Best Seller
                                              </span>
                                            ) : (
                                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                                                Active
                                              </span>
                                            )}
                                          </div>

                                          {/* Amount & Price Display / Quick Edit Mode */}
                                          {isQuickEditing ? (
                                            <div className="space-y-2 my-2 p-2 rounded-xl bg-slate-950 border border-cyan-500/40">
                                              <div>
                                                <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Price ($ USD)</label>
                                                <input
                                                  type="number"
                                                  step="0.01"
                                                  value={quickEditPrice}
                                                  onChange={e => setQuickEditPrice(e.target.value)}
                                                  className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-black text-xs focus:outline-none"
                                                  autoFocus
                                                />
                                              </div>
                                              <div>
                                                <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Diamonds Amount</label>
                                                <input
                                                  type="number"
                                                  value={quickEditAmount}
                                                  onChange={e => setQuickEditAmount(e.target.value)}
                                                  className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:outline-none"
                                                />
                                              </div>
                                              <div className="flex gap-1.5 pt-1">
                                                <button
                                                  type="button"
                                                  onClick={() => handleSaveQuickEdit(pkg, prod)}
                                                  disabled={actionLoading}
                                                  className="flex-1 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[10px] transition-all"
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setQuickEditingPkgId(null)}
                                                  className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-[10px]"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="my-2 space-y-1">
                                              <div className="flex items-baseline justify-between">
                                                <span className="text-xs text-slate-400 font-semibold">Price:</span>
                                                <span className="text-cyan-400 font-black text-base">
                                                  ${pkg.price.toFixed(2)}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 font-semibold">Diamonds:</span>
                                                <span className="text-slate-200 font-black font-mono">
                                                  💎 {pkg.amount.toLocaleString()}
                                                </span>
                                              </div>
                                              {pkg.badge && (
                                                <div className="text-[10px] text-amber-400 font-bold truncate pt-0.5">
                                                  🏷️ {pkg.badge}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Bottom Control Actions */}
                                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleTogglePackageStatus(pkg, prod)}
                                            disabled={actionLoading}
                                            className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                              pkg.isActive === false
                                                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                                : 'bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                                            }`}
                                            title={pkg.isActive === false ? 'Enable Package' : 'Disable Package'}
                                          >
                                            {pkg.isActive === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                          </button>

                                          <div className="flex items-center space-x-1">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (isQuickEditing) {
                                                  setQuickEditingPkgId(null);
                                                } else {
                                                  setQuickEditingPkgId(pkg.id);
                                                  setQuickEditPrice(String(pkg.price));
                                                  setQuickEditAmount(String(pkg.amount));
                                                }
                                              }}
                                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                                isQuickEditing
                                                  ? 'bg-cyan-500 text-slate-950 font-black'
                                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-cyan-400'
                                              }`}
                                              title="Quick Price & Amount Edit"
                                            >
                                              Quick
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => openEditPackageModal(pkg, prod)}
                                              className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all border border-cyan-500/30"
                                              title="Full Package Editor"
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleDeletePackage(pkg.id)}
                                              disabled={actionLoading}
                                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/30"
                                              title="Delete Package"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {totalShown === 0 && (
                        <div className={`${panelCls} p-12 text-center text-slate-500 text-xs`} style={panelBg}>
                          No diamond packages match your filter &quot;{diamondSearchQuery}&quot;.
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            )}

            {/* ══ MODAL 1: PRODUCT EDITOR ════════════════════════════════ */}
            {editingProductModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl relative p-6 text-slate-200 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Pencil className="h-4 w-4 text-cyan-400" />
                      <span>Edit Product: {editingProductModal.name}</span>
                    </h3>
                    <button
                      onClick={() => setEditingProductModal(null)}
                      className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProductModal} className="space-y-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Product Name</label>
                      <input
                        type="text"
                        required
                        value={editProdName}
                        onChange={e => setEditProdName(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Category</label>
                        <select
                          value={editProdCategory}
                          onChange={e => setEditProdCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500 text-xs"
                        >
                          <option value="MOBILE_GAME">Mobile Game</option>
                          <option value="PC_GAME">PC Game</option>
                          <option value="VOUCHER">Voucher</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">URL Slug</label>
                        <input
                          type="text"
                          required
                          value={editProdSlug}
                          onChange={e => setEditProdSlug(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Image Edit & Drag Drop */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Cover Image</label>
                      <div
                        onClick={() => editProdModalFileInputRef.current?.click()}
                        className="cursor-pointer rounded-xl flex items-center justify-between p-3 border border-dashed border-slate-700 bg-slate-950/60 hover:border-cyan-500 transition-all mb-2"
                      >
                        <input
                          ref={editProdModalFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setEditProdModalFile(f);
                              setEditProdModalPreview(URL.createObjectURL(f));
                            }
                          }}
                        />
                        <div className="flex items-center space-x-3">
                          <img
                            src={editProdModalPreview || getProductImgSrc(editProdImage)}
                            alt="Preview"
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">
                              {editProdModalFile ? editProdModalFile.name : 'Click to choose new image file'}
                            </p>
                            <p className="text-[10px] text-slate-500">PNG, JPG, WebP supported</p>
                          </div>
                        </div>
                        <Upload className="h-4 w-4 text-cyan-400 mr-2" />
                      </div>
                      <input
                        type="text"
                        placeholder="Or image path (e.g. /images/games/mygame.png)"
                        value={editProdImage}
                        onChange={e => setEditProdImage(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    {/* Active Status Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div>
                        <p className="text-xs font-bold text-white">Product Active Status</p>
                        <p className="text-[10px] text-slate-400">Controls visibility in customer catalog</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditProdIsActive(!editProdIsActive)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          editProdIsActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {editProdIsActive ? 'Active (Visible)' : 'Disabled (Hidden)'}
                      </button>
                    </div>

                    {/* Zone ID / Server ID Toggle */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">Requires Zone ID / Server ID</p>
                          <p className="text-[10px] text-slate-400">Customer must enter Zone/Server ID</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditProdHasZone(!editProdHasZone)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            editProdHasZone ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {editProdHasZone ? 'Required (Yes)' : 'Not Required (No)'}
                        </button>
                      </div>
                      {editProdHasZone && (
                        <div className="pt-2 border-t border-slate-800">
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">Field Label / ឈ្មោះ Label (e.g. Zone ID, Server ID)</label>
                          <input
                            type="text"
                            value={editProdZoneLabel}
                            onChange={e => setEditProdZoneLabel(e.target.value)}
                            placeholder="e.g. Zone ID, Server ID, Server"
                            className={inputCls}
                          />
                        </div>
                      )}
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingProductModal(null)}
                        className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-1/2 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg"
                        style={btnGrad}
                      >
                        {actionLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ══ MODAL 2: PACKAGE EDITOR ════════════════════════════════ */}
            {editingPackageModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl relative p-6 text-slate-200 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Gem className="h-4 w-4 text-cyan-400" />
                      <span>Edit Package ({editingPackageModal.product.name})</span>
                    </h3>
                    <button
                      onClick={() => setEditingPackageModal(null)}
                      className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSavePackageModal} className="space-y-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Package Name</label>
                      <input
                        type="text"
                        required
                        value={editPkgName}
                        onChange={e => setEditPkgName(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Amount (Units)</label>
                        <input
                          type="number"
                          required
                          value={editPkgAmount}
                          onChange={e => setEditPkgAmount(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Price (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editPkgPrice}
                          onChange={e => setEditPkgPrice(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Tier Category</label>
                        <select
                          value={editPkgCategory}
                          onChange={e => setEditPkgCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500 text-xs"
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="BEST_SELLER">Best Seller</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Badge Label</label>
                        <input
                          type="text"
                          placeholder="e.g. HOT, VIP"
                          value={editPkgBadge}
                          onChange={e => setEditPkgBadge(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Package Artwork / Icon Edit */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Package Icon / Artwork (optional)</label>
                      <div
                        onClick={() => editPkgFileInputRef.current?.click()}
                        className="cursor-pointer rounded-xl flex items-center justify-between p-2.5 border border-dashed border-slate-700 bg-slate-950/60 hover:border-cyan-500 transition-all mb-2"
                      >
                        <input
                          ref={editPkgFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setEditPkgFile(f);
                              setEditPkgPreview(URL.createObjectURL(f));
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={editPkgPreview || getPkgImgSrc(editPkgImage)}
                            alt="Pkg Icon"
                            className="h-8 w-8 rounded-lg object-contain p-0.5 bg-slate-900 border border-slate-800"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">
                              {editPkgFile ? editPkgFile.name : 'Choose diamond / artwork file'}
                            </p>
                            <p className="text-[10px] text-slate-500">PNG, JPG, WebP supported</p>
                          </div>
                        </div>
                        <Upload className="h-4 w-4 text-cyan-400 mr-1" />
                      </div>
                      <input
                        type="text"
                        placeholder="Or icon path (e.g. /images/diamond-art.png)"
                        value={editPkgImage}
                        onChange={e => setEditPkgImage(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    {/* Active Status Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div>
                        <p className="text-xs font-bold text-white">Package Status</p>
                        <p className="text-[10px] text-slate-400">Enable or disable this specific package</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditPkgIsActive(!editPkgIsActive)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          editPkgIsActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {editPkgIsActive ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingPackageModal(null)}
                        className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-1/2 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg"
                        style={btnGrad}
                      >
                        {actionLoading ? 'Saving...' : 'Save Package'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ══ MODAL 3: QUICK ADD PACKAGE TO GAME ══════════════════════ */}
            {addPackageModalProd && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl relative p-6 text-slate-200 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Plus className="h-4 w-4 text-cyan-400" />
                      <span>Add Package to {addPackageModalProd.name}</span>
                    </h3>
                    <button
                      onClick={() => setAddPackageModalProd(null)}
                      className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveDirectPackageModal} className="space-y-4">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Package Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 50 Diamonds, Weekly Pass"
                        value={directPkgName}
                        onChange={e => setDirectPkgName(e.target.value)}
                        className={inputCls}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Amount (Units)</label>
                        <input
                          type="number"
                          required
                          placeholder="50"
                          value={directPkgAmount}
                          onChange={e => setDirectPkgAmount(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Price (USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.99"
                          value={directPkgPrice}
                          onChange={e => setDirectPkgPrice(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Tier Category</label>
                        <select
                          value={directPkgCategory}
                          onChange={e => setDirectPkgCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500 text-xs"
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="BEST_SELLER">Best Seller</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Badge (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 🔥 Popular, VIP"
                          value={directPkgBadge}
                          onChange={e => setDirectPkgBadge(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Custom Package Artwork Upload */}
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5 text-xs">Package Icon / Artwork (optional)</label>
                      <div
                        onClick={() => directPkgFileInputRef.current?.click()}
                        className="cursor-pointer rounded-xl flex items-center justify-between p-2.5 border border-dashed border-slate-700 bg-slate-950/60 hover:border-cyan-500 transition-all mb-2"
                      >
                        <input
                          ref={directPkgFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setDirectPkgFile(f);
                              setDirectPkgPreview(URL.createObjectURL(f));
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={directPkgPreview || getPkgImgSrc(directPkgImage)}
                            alt="Pkg Icon"
                            className="h-8 w-8 rounded-lg object-contain p-0.5 bg-slate-900 border border-slate-800"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">
                              {directPkgFile ? directPkgFile.name : 'Upload diamond / item icon'}
                            </p>
                            <p className="text-[10px] text-slate-500">PNG, JPG, WebP supported</p>
                          </div>
                        </div>
                        <Upload className="h-4 w-4 text-cyan-400 mr-1" />
                      </div>
                      {!directPkgPreview && (
                        <input
                          type="text"
                          placeholder="Or icon path (e.g. /images/diamond-art.png)"
                          value={directPkgImage}
                          onChange={e => setDirectPkgImage(e.target.value)}
                          className={inputCls}
                        />
                      )}
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setAddPackageModalProd(null)}
                        className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-1/2 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg"
                        style={btnGrad}
                      >
                        {actionLoading ? 'Adding...' : 'Create Package'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ══ TAB 5: BACKUP & RESTORE ════════════════════════════════ */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <HardDrive className="h-6 w-6 text-cyan-400" />
                      <span>Database Backup & Restore System</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      Export full system snapshots, download offline data dumps, and safely restore game catalogs and orders.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadBackup}
                      disabled={backupLoading}
                      className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={btnGrad}
                    >
                      <Download className="h-4 w-4" />
                      <span>{backupLoading ? 'Exporting...' : 'Export Backup (.json)'}</span>
                    </button>
                    <button
                      onClick={handleCreateSnapshot}
                      disabled={backupLoading}
                      className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4 text-cyan-400" />
                      <span>Create Server Snapshot</span>
                    </button>
                  </div>
                </div>

                {/* System Health / Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className={`${panelCls} p-4`} style={panelBg}>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Games</div>
                    <div className="text-xl font-black text-white mt-1">{allProducts.length}</div>
                    <div className="text-[10px] text-cyan-400 mt-0.5">Active in catalog</div>
                  </div>
                  <div className={`${panelCls} p-4`} style={panelBg}>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Packages</div>
                    <div className="text-xl font-black text-white mt-1">
                      {allProducts.reduce((acc, p) => acc + (p.packages?.length || 0), 0)}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Top-up bundles</div>
                  </div>
                  <div className={`${panelCls} p-4`} style={panelBg}>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Orders Logged</div>
                    <div className="text-xl font-black text-white mt-1">{orders.length}</div>
                    <div className="text-[10px] text-amber-400 mt-0.5">Transactions</div>
                  </div>
                  <div className={`${panelCls} p-4`} style={panelBg}>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Server Snapshots</div>
                    <div className="text-xl font-black text-white mt-1">{snapshots.length}</div>
                    <div className="text-[10px] text-violet-400 mt-0.5">Restore points ready</div>
                  </div>
                </div>

                {/* Restore From Local File Card */}
                <div className={`${panelCls} p-6`} style={panelBg}>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4 text-cyan-400" />
                    <span>Upload & Restore Backup File</span>
                  </h3>
                  <p className="text-slate-400 text-xs mb-4">
                    Restore games, package configurations, and orders from a previously downloaded <code className="text-cyan-400 font-mono">.json</code> backup file.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleUploadBackupFile}
                      className="hidden"
                    />
                    <button
                      onClick={() => backupFileInputRef.current?.click()}
                      disabled={backupLoading}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl border border-dashed border-cyan-500/50 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      <span>{backupLoading ? 'Restoring...' : 'Select Backup JSON File to Restore'}</span>
                    </button>
                    <span className="text-[11px] text-slate-500">
                      * Automatic transactional upsert prevents duplicate entries and keeps system stable.
                    </span>
                  </div>
                </div>

                {/* Saved Server Snapshots Table */}
                <div className={`${panelCls} overflow-hidden`} style={panelBg}>
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <History className="h-4 w-4 text-cyan-400" />
                      <span>Available Server Snapshots ({snapshots.length})</span>
                    </h3>
                    <button
                      onClick={loadSnapshots}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Refresh Snapshots"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {snapshots.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      <HardDrive className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      <p>No snapshots found on the server yet.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Click &quot;Create Server Snapshot&quot; above to create one.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/60">
                      {snapshots.map((snap: any, snIdx: number) => (
                        <div key={`snap-${snap.filename || snIdx}-${snIdx}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors">
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs font-bold text-white truncate">{snap.filename}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                                {(snap.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                              <span>📅 {new Date(snap.createdAt).toLocaleString()}</span>
                              {snap.counts && (
                                <>
                                  <span className="text-cyan-400 font-semibold">• {snap.counts.products || 0} Games</span>
                                  <span className="text-emerald-400 font-semibold">• {snap.counts.packages || 0} Packages</span>
                                  <span className="text-amber-400 font-semibold">• {snap.counts.orders || 0} Orders</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => handleRestoreSnapshot(snap.filename)}
                              disabled={restoringSnapshot === snap.filename || backupLoading}
                              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all disabled:opacity-50"
                            >
                              {restoringSnapshot === snap.filename ? (
                                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <RotateCcw className="h-3 w-3" />
                              )}
                              <span>{restoringSnapshot === snap.filename ? 'Restoring...' : 'Restore'}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSnapshot(snap.filename)}
                              disabled={backupLoading}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
                              title="Delete snapshot"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB: CUSTOMER CONTACT & SUPPORT INQUIRIES ────────── */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className={`${panelCls} p-4`} style={panelBg}>
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Inquiries</div>
                    <div className="text-2xl font-black text-white mt-1">{contactMessages.length}</div>
                  </div>
                  <div className={`${panelCls} p-4 border-amber-500/30`} style={panelBg}>
                    <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Pending Review</span>
                    </div>
                    <div className="text-2xl font-black text-amber-300 mt-1">{contactPendingCount}</div>
                  </div>
                  <div className={`${panelCls} p-4 border-blue-500/30`} style={panelBg}>
                    <div className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">In Progress</div>
                    <div className="text-2xl font-black text-blue-300 mt-1">
                      {contactMessages.filter(m => m.status === 'IN_PROGRESS').length}
                    </div>
                  </div>
                  <div className={`${panelCls} p-4 border-emerald-500/30`} style={panelBg}>
                    <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Resolved</div>
                    <div className="text-2xl font-black text-emerald-300 mt-1">
                      {contactMessages.filter(m => m.status === 'RESOLVED').length}
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className={`${panelCls} p-4 flex flex-col sm:flex-row items-center justify-between gap-3`} style={panelBg}>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={contactSearchQuery}
                        onChange={(e) => setContactSearchQuery(e.target.value)}
                        placeholder="Search by name, email, Telegram, Txn ID..."
                        className={inputCls + ' pl-9'}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <select
                      value={contactStatusFilter}
                      onChange={(e) => setContactStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending Only</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>

                    <button
                      onClick={loadContactMessages}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                      title="Refresh Inquiries"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Messages List Table */}
                <div className={`${panelCls} overflow-hidden`} style={panelBg}>
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-pink-400" />
                      <span>Customer Inquiries & Support Tickets</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Live sync with Supabase PostgreSQL
                    </span>
                  </div>

                  {contactMessages.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-xs">
                      <MessageSquare className="h-8 w-8 text-slate-600 mx-auto mb-2 opacity-50" />
                      <p>No contact messages found.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/60 overflow-x-auto">
                      {contactMessages
                        .filter(msg => {
                          if (contactStatusFilter !== 'ALL' && msg.status !== contactStatusFilter) return false;
                          if (!contactSearchQuery) return true;
                          const q = contactSearchQuery.toLowerCase();
                          return (
                            msg.name.toLowerCase().includes(q) ||
                            msg.email.toLowerCase().includes(q) ||
                            msg.subject.toLowerCase().includes(q) ||
                            msg.message.toLowerCase().includes(q) ||
                            (msg.telegram && msg.telegram.toLowerCase().includes(q)) ||
                            (msg.txnId && msg.txnId.toLowerCase().includes(q))
                          );
                        })
                        .map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-4 transition-colors hover:bg-slate-900/50 ${
                              selectedContact?.id === msg.id ? 'bg-slate-900/80 border-l-2 border-pink-500' : ''
                            }`}
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                                  <span className="font-bold text-sm text-white">{msg.name}</span>
                                  <span className="text-xs text-slate-400">({msg.email})</span>
                                  {msg.telegram && (
                                    <span className="px-2 py-0.5 rounded-md bg-sky-950 text-sky-400 border border-sky-800/60 text-[10px] font-mono">
                                      Telegram: {msg.telegram}
                                    </span>
                                  )}
                                  {msg.phone && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono">
                                      Tel: {msg.phone}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    msg.status === 'RESOLVED'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : msg.status === 'IN_PROGRESS'
                                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                                  }`}>
                                    {msg.status}
                                  </span>
                                </div>

                                <div className="text-xs text-pink-300 font-semibold mt-1">
                                  Subject: {msg.subject}
                                  {msg.txnId && (
                                    <span className="ml-2 font-mono text-[11px] text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                      Txn: {msg.txnId}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-slate-300 mt-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                                  {msg.message}
                                </p>

                                {msg.reply && (
                                  <div className="mt-2 text-xs bg-purple-950/30 p-2.5 rounded-xl border border-purple-900/40 text-purple-200">
                                    <strong className="text-purple-400 block text-[10px] uppercase">Your Reply:</strong>
                                    {msg.reply}
                                  </div>
                                )}

                                <div className="text-[10px] text-slate-500 mt-2">
                                  Received: {new Date(msg.createdAt).toLocaleString()} • Ticket ID: <span className="font-mono text-slate-400">{msg.id}</span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0 md:self-start">
                                <button
                                  onClick={() => {
                                    setSelectedContact(msg);
                                    setContactReplyText(msg.reply || '');
                                    setContactReplyStatus(msg.status || 'RESOLVED');
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-bold transition-all"
                                >
                                  Reply / Status
                                </button>
                                <button
                                  onClick={() => handleDeleteContact(msg.id)}
                                  disabled={contactActionLoading}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
                                  title="Delete Message"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Reply / Update Modal */}
                {selectedContact && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-200 z-10 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-5 w-5 text-pink-400" />
                          <h3 className="font-black text-base text-white">Reply & Update Support Ticket</h3>
                        </div>
                        <button
                          onClick={() => setSelectedContact(null)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-xs space-y-2 mb-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                        <div><strong>Customer:</strong> {selectedContact.name} ({selectedContact.email})</div>
                        {selectedContact.telegram && <div><strong>Telegram:</strong> {selectedContact.telegram}</div>}
                        <div><strong>Subject:</strong> {selectedContact.subject}</div>
                        <div className="text-slate-400"><strong>Message:</strong> &quot;{selectedContact.message}&quot;</div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Update Status</label>
                          <select
                            value={contactReplyStatus}
                            onChange={(e) => setContactReplyStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">Admin Response Note / Reply</label>
                          <textarea
                            rows={4}
                            value={contactReplyText}
                            onChange={(e) => setContactReplyText(e.target.value)}
                            placeholder="Type reply or resolution notes for customer..."
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-pink-500"
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedContact(null)}
                            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={contactActionLoading}
                            onClick={() => handleReplyContact(selectedContact.id)}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-black flex items-center space-x-1.5 shadow-md disabled:opacity-50"
                          >
                            {contactActionLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            <span>Save & Update Ticket</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 6: SECURITY & ANTI-DDOS PROTECTION ────────────── */}
            {activeTab === 'security' && (
              <SecurityDashboard />
            )}
          </>)}
        </main>
      </div>
    </div>
  );
}


