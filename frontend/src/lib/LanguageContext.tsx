'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'EN' | 'KH';

interface Translations {
  // Header
  browseGames: string;
  myOrders: string;
  adminDashboard: string;
  login: string;
  logout: string;
  loggedInAs: string;
  
  // Home Page
  instantAutoVerification: string;
  topUpYourGame: string;
  instantlyAndSafely: string;
  heroDescription: string;
  searchPlaceholder: string;
  allProducts: string;
  mobileGames: string;
  pcGames: string;
  vouchers: string;
  packagesAvailable: string;
  topUpBtn: string;
  serverIssueTitle: string;
  noProductsFound: string;
  trySearchingElse: string;
  
  // Game Details Page
  backToHome: string;
  category: string;
  instantDelivery: string;
  enterAccountDetails: string;
  playerId: string;
  zoneId: string;
  verifyPlayerNickname: string;
  verifying: string;
  validated: string;
  nicknameRequired: string;
  zoneIdRequired: string;
  selectRechargePackage: string;
  selectedBadge: string;
  choosePaymentGateway: string;
  bakongDesc: string;
  abaDesc: string;
  canadiaTitle: string;
  canadiaDesc: string;
  orderSummary: string;
  selectedProduct: string;
  packageItem: string;
  gameAccountNick: string;
  notValidated: string;
  playerIdDetails: string;
  paymentGateway: string;
  totalPriceUsd: string;
  purchaseTopUp: string;
  generatingInvoice: string;
  purchaseDisclaimer: string;
  
  // Invoice Page
  invoiceNotFound: string;
  scanKhqr: string;
  scanToPay: string;
  scanAppInstructions: string;
  paymentSuccessful: string;
  directTopupSuccessDesc: string;
  recipientNickname: string;
  recipientPlayerId: string;
  deliveryStatus: string;
  autoDelivered: string;
  buyMoreRecharge: string;
  viewPurchaseHistory: string;
  orderInvoice: string;
  invoiceReference: string;
  totalPrice: string;
  statusLabel: string;
  paymentStatusLabel: string;
  invoiceNotice: string;
  paymentUnsuccessful: string;
  expiredNotice: string;
  digitalVoucherCode: string;
  voucherNotice: string;
}

const translations: Record<Language, Translations> = {
  EN: {
    browseGames: 'Browse Games',
    myOrders: 'My Orders',
    adminDashboard: 'Admin Dashboard',
    login: 'Login',
    logout: 'Logout',
    loggedInAs: 'Logged in as',
    instantAutoVerification: 'Instant Auto Payment Verification',
    topUpYourGame: 'Top Up Your Game',
    instantlyAndSafely: 'Instantly & Safely',
    heroDescription: 'Fastest game diamond top-ups and gift vouchers in Cambodia. Supports auto-verification via ABA PayWay and Bakong KHQR.',
    searchPlaceholder: 'Search your game...',
    allProducts: 'All Products',
    mobileGames: 'Mobile Games',
    pcGames: 'PC Games',
    vouchers: 'Vouchers',
    packagesAvailable: 'Packages available',
    topUpBtn: 'Top Up',
    serverIssueTitle: 'Server Connection Issue',
    noProductsFound: 'No products found',
    trySearchingElse: 'Try searching for something else or check other categories.',
    backToHome: 'Back to Home',
    category: 'Category',
    instantDelivery: 'Instant Delivery via Automated Gateway',
    enterAccountDetails: 'Enter Account Details',
    playerId: 'Player ID',
    zoneId: 'Zone ID',
    verifyPlayerNickname: 'Verify Player Nickname',
    verifying: 'Verifying...',
    validated: 'Validated',
    nicknameRequired: 'Player ID is required',
    zoneIdRequired: 'Zone ID is required for MLBB',
    selectRechargePackage: 'Select Recharge Package',
    selectedBadge: 'SELECTED',
    choosePaymentGateway: 'Choose Payment Gateway',
    bakongDesc: 'Verify auto-scans in riels/dollars',
    abaDesc: 'Checkout with cards or banking app',
    canadiaTitle: 'Canadia KHQR',
    canadiaDesc: 'Pay instantly via Canadia Bank KHQR',
    orderSummary: 'Order Summary',
    selectedProduct: 'Selected Product',
    packageItem: 'Package item',
    gameAccountNick: 'Game Account Nick',
    notValidated: 'Not validated',
    playerIdDetails: 'Player ID Details',
    paymentGateway: 'Payment Gateway',
    totalPriceUsd: 'Total Price (USD)',
    purchaseTopUp: 'Purchase Top Up',
    generatingInvoice: 'Generating Invoice...',
    purchaseDisclaimer: 'By purchasing, you agree that your top-up details are accurate. Digital transactions cannot be cancelled.',
    invoiceNotFound: 'Invoice Not Found',
    scanKhqr: 'Scan Bakong/KHQR code',
    scanToPay: 'Scan to Pay',
    scanAppInstructions: 'Open any Cambodian banking app (Bakong, ABA Mobile, Canadia, Acleda) and scan this QR code to pay.',
    paymentSuccessful: 'Payment Successful!',
    directTopupSuccessDesc: 'Your recharge order has been fully processed and digital items delivered.',
    recipientNickname: 'Recipient Nickname',
    recipientPlayerId: 'Recipient Player ID',
    deliveryStatus: 'Delivery Status',
    autoDelivered: 'Auto Delivered',
    buyMoreRecharge: 'Buy More Recharge',
    viewPurchaseHistory: 'View Purchase History',
    orderInvoice: 'Order Invoice',
    invoiceReference: 'Invoice reference',
    totalPrice: 'Total Price',
    statusLabel: 'Status',
    paymentStatusLabel: 'Payment Status',
    invoiceNotice: 'This invoice polls updates automatically. Once your banking app scan goes through, this screen will load and deliver your top-up instantly.',
    paymentUnsuccessful: 'Payment Unsuccessful',
    expiredNotice: 'This order transaction has expired, was cancelled, or failed validation scans.',
    digitalVoucherCode: 'Your Digital Voucher Code',
    voucherNotice: 'Use this code inside the respective game store (Steam, Roblox, etc.) to redeem your wallet balance.',
  },
  KH: {
    browseGames: 'ស្វែងរកហ្គេម',
    myOrders: 'ការបញ្ជាទិញរបស់ខ្ញុំ',
    adminDashboard: 'ផ្ទាំងគ្រប់គ្រង',
    login: 'ចូលគណនី',
    logout: 'ចាកចេញ',
    loggedInAs: 'បានចូលជា',
    instantAutoVerification: 'ការផ្ទៀងផ្ទាត់ការបង់ប្រាក់ដោយស្វ័យប្រវត្តិភ្លាមៗ',
    topUpYourGame: 'បញ្ចូលលុយហ្គេមរបស់អ្នក',
    instantlyAndSafely: 'ភ្លាមៗ និងមានសុវត្ថិភាព',
    heroDescription: 'សេវាកម្មបញ្ចូលលុយហ្គេមលឿនបំផុត និងទិញកាតកាដូនៅក្នុងប្រទេសកម្ពុជា។ គាំទ្រការផ្ទៀងផ្ទាត់ដោយស្វ័យប្រវត្តិងាយស្រួលតាមរយៈ ABA PayWay និង បាគង KHQR។',
    searchPlaceholder: 'ស្វែងរកហ្គេមរបស់អ្នក...',
    allProducts: 'ផលិតផលទាំងអស់',
    mobileGames: 'ហ្គេមទូរស័ព្ទ',
    pcGames: 'ហ្គេមកុំព្យូទ័រ',
    vouchers: 'កាតវ៉ៅឆឺរ',
    packagesAvailable: 'កញ្ចប់អាចរកបាន',
    topUpBtn: 'បញ្ចូលលុយ',
    serverIssueTitle: 'បញ្ហាភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ',
    noProductsFound: 'រកមិនឃើញផលិតផលទេ',
    trySearchingElse: 'សូមព្យាយាមស្វែងរកអ្វីផ្សេងទៀត ឬពិនិត្យមើលប្រភេទផ្សេងទៀត។',
    backToHome: 'ត្រឡប់ទៅទំព័រដើម',
    category: 'ប្រភេទ',
    instantDelivery: 'ការដឹកជញ្ជូនភ្លាមៗតាមរយៈច្រកទ្វារស្វ័យប្រវត្តិ',
    enterAccountDetails: 'បញ្ចូលព័ត៌មានគណនី',
    playerId: 'លេខសម្គាល់អ្នកលេង (Player ID)',
    zoneId: 'លេខសម្គាល់តំបន់ (Zone ID)',
    verifyPlayerNickname: 'ផ្ទៀងផ្ទាត់ឈ្មោះអ្នកលេង',
    verifying: 'កំពុងផ្ទៀងផ្ទាត់...',
    validated: 'បានបញ្ជាក់',
    nicknameRequired: 'សូមបញ្ចូលលេខសម្គាល់អ្នកលេង',
    zoneIdRequired: 'សូមបញ្ចូលលេខសម្គាល់តំបន់សម្រាប់ MLBB',
    selectRechargePackage: 'ជ្រើសរើសកញ្ចប់បញ្ចូលលុយ',
    selectedBadge: 'បានជ្រើសរើស',
    choosePaymentGateway: 'ជ្រើសរើសច្រកបង់ប្រាក់',
    bakongDesc: 'ផ្ទៀងផ្ទាត់ការស្កែនដោយស្វ័យប្រវត្តជាលុយរៀល/ដុល្លារ',
    abaDesc: 'បង់ប្រាក់ជាមួយកាត ឬកម្មវិធីធនាគារ',
    canadiaTitle: 'ធនាគារ កាណាឌីយ៉ា KHQR',
    canadiaDesc: 'ទូទាត់ប្រាក់ភ្លាមៗតាមរយៈ Canadia KHQR',
    orderSummary: 'សេចក្តីសង្ខេបនៃការបញ្ជាទិញ',
    selectedProduct: 'ផលិតផលដែលបានជ្រើសរើស',
    packageItem: 'កញ្ចប់ផលិតផល',
    gameAccountNick: 'ឈ្មោះគណនីហ្គេម',
    notValidated: 'មិនទាន់ផ្ទៀងផ្ទាត់',
    playerIdDetails: 'ព័ត៌មានលម្អិត Player ID',
    paymentGateway: 'ច្រកបង់ប្រាក់',
    totalPriceUsd: 'តម្លៃសរុប (USD)',
    purchaseTopUp: 'ទិញការបញ្ចូលលុយឥឡូវនេះ',
    generatingInvoice: 'កំពុងបង្កើតវិក្កយបត្រ...',
    purchaseDisclaimer: 'តាមរយៈការទិញនេះ អ្នកយល់ព្រមថាព័ត៌មានបញ្ចូលលុយរបស់អ្នកគឺត្រឹមត្រូវ។ រាល់ប្រតិបត្តិការឌីជីថលមិនអាចបោះបង់បានឡើយ។',
    invoiceNotFound: 'រកមិនឃើញវិក្កយបត្រទេ',
    scanKhqr: 'ស្កែនកូដ បាគង/KHQR',
    scanToPay: 'ស្កែនដើម្បីទូទាត់ប្រាក់',
    scanAppInstructions: 'សូមបើកកម្មវិធីធនាគារណាមួយនៅក្នុងប្រទេសកម្ពុជា (បាគង, ABA Mobile, កាណាឌីយ៉ា, អេស៊ីលីដា) រួចស្កែន QR កូដនេះដើម្បីទូទាត់ប្រាក់។',
    paymentSuccessful: 'ការទូទាត់បានជោគជ័យ!',
    directTopupSuccessDesc: 'ការបញ្ជាទិញបញ្ចូលលុយរបស់អ្នកត្រូវបានដំណើរការពេញលេញ និងបញ្ជូនទិន្នន័យរួចរាល់។',
    recipientNickname: 'ឈ្មោះអ្នកទទួល',
    recipientPlayerId: 'លេខសម្គាល់អ្នកទទួល',
    deliveryStatus: 'ស្ថានភាពចែកចាយ',
    autoDelivered: 'បញ្ជូនដោយស្វ័យប្រវត្តិ',
    buyMoreRecharge: 'បញ្ចូលលុយបន្ថែមទៀត',
    viewPurchaseHistory: 'មើលប្រវត្តិនៃការទិញ',
    orderInvoice: 'វិក្កយបត្របញ្ជាទិញ',
    invoiceReference: 'លេខយោងវិក្កយបត្រ',
    totalPrice: 'តម្លៃសរុប',
    statusLabel: 'ស្ថានភាព',
    paymentStatusLabel: 'ស្ថានភាពទូទាត់',
    invoiceNotice: 'វិក្កយបត្រនេះធ្វើការអាប់ដេតដោយស្វ័យប្រវត្តិ។ នៅពេលការស្កែនទូទាត់របស់អ្នកជោគជ័យ ប្រព័ន្ធនឹងបញ្ចូលលុយជូនអ្នកភ្លាមៗ។',
    paymentUnsuccessful: 'ការទូទាត់មិនជោគជ័យ',
    expiredNotice: 'ប្រតិបត្តិការនេះបានហួសពេល កំណត់ ឬបរាជ័យក្នុងការផ្ទៀងផ្ទាត់ការទូទាត់។',
    digitalVoucherCode: 'កូដកាតវ៉ៅឆឺររបស់អ្នក',
    voucherNotice: 'សូមប្រើប្រាស់កូដនេះនៅក្នុងហាងហ្គេម (Steam, Roblox ជាដើម) ដើម្បីបញ្ចូលទឹកប្រាក់ក្នុងគណនីរបស់អ្នក។',
  },
};

interface LanguageContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('KH');

  useEffect(() => {
    setLanguageState('KH');
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState('KH');
    localStorage.setItem('language', 'KH');
  };

  return (
    <LanguageContext.Provider value={{ language, t: translations[language], setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
