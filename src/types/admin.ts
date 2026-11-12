import { Product, SpecificationGroup } from "@/data/products";

export type AdminTabId =
  | "overview"
  | "orders"
  | "payments"
  | "invoices"
  | "courier"
  | "tracking"
  | "products"
  | "add-product"
  | "categories"
  | "brands"
  | "reviews"
  | "qna"
  | "inv-overview"
  | "inv-adjust"
  | "inv-history"
  | "inv-alerts"
  | "coupons"
  | "offers"
  | "banners"
  | "popups"
  | "meta-pixel"
  | "gtm"
  | "customers"
  | "inquiries"
  | "chatbot"
  | "faqs"
  | "acc-overview"
  | "acc-income"
  | "acc-expenses"
  | "acc-debit-credit"
  | "acc-ledger"
  | "acc-transfers"
  | "acc-reports"
  | "cms"
  | "homepage"
  | "landing-pages"
  | "emi"
  | "delivery"
  | "pay-settings"
  | "settings"
  | "users"
  | "roles"
  | "logs"
  | "db-sync";

export type AdminRoleName =
  | "Super Admin"
  | "Order Manager"
  | "Product Editor"
  | "Accounts Manager"
  | "Marketing Manager"
  | "Customer Support"
  | (string & {});

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Ready to Ship"
  | "Shipped"
  | "Dispatched"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

export type PaymentStatusType =
  | "Paid"
  | "Unpaid"
  | "Partial Payment"
  | "Pending Verification"
  | "Failed"
  | "Refunded";

export interface RoleDefinition {
  id: string;
  name: AdminRoleName;
  description: string;
  permissions: string[]; // module group keys or '*'
}

export interface AdminUserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRoleName;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  startDate: string;
  expiryDate: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  usageCount: number;
  usageByCustomer?: Record<string, number>;
  applicableCategories: string[];
  applicableProducts: string[];
  description: string;
  active: boolean;
}

export interface AdminBannerItem {
  id: string;
  placement: "hero" | "side" | "promo_full" | "mid";
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  active: boolean;
  order: number;
}

export interface AdminPopupItem {
  id: string;
  title: string;
  description: string;
  desktopImage: string;
  mobileImage?: string;
  buttonText: string;
  buttonLink: string;
  startDate: string;
  endDate: string;
  displayPosition: "center" | "bottom-right" | "top-bar";
  targetPages: "homepage" | "all" | "selected";
  selectedPaths: string[];
  visitorRule: "first_visit" | "repeat_visit" | "all";
  frequency: "once_per_session" | "once_per_day" | "always";
  delaySeconds: number;
  active: boolean;
}

export interface AdminTrackingSettings {
  metaPixelId: string;
  metaPixelEnabled: boolean;
  metaCapiEnabled: boolean;
  metaTestEventCode: string;
  metaEvents: string[];
  gtmContainerId: string;
  gtmEnabled: boolean;
  ga4MeasurementId: string;
  consentRequired: boolean;
}

export interface AdminPaymentChannel {
  id: "cod" | "bkash" | "nagad" | "sslcommerz" | "card" | "emi";
  name: string;
  enabled: boolean;
  accountNumber?: string;
  instructions?: string;
}

export interface AdminPaymentRecord {
  id: string;
  orderId: string;
  customerName: string;
  phone: string;
  method: string;
  amount: number;
  status: PaymentStatusType;
  transactionId?: string;
  senderNumber?: string;
  gatewayReference?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface AdminInvoiceRecord {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  invoiceType: "auto" | "manual";
  sourceChannel: "Website" | "Walk-in" | "Phone" | "Facebook" | "WhatsApp" | "Custom";
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  items: {
    productId?: string;
    title: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  vatPercent: number;
  vatAmount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatusType;
  createdAt: string;
}

export interface AdminCourierProvider {
  id: "pathao" | "steadfast" | "redx" | "paperfly" | "rango_express" | "custom";
  name: string;
  enabled: boolean;
  sandboxMode: boolean;
  baseUrl?: string;
  storeId?: string;
  trackingUrlPattern?: string;
  hasCredentials?: boolean;
  maskedSummary?: Record<string, string>;
  lastTestedAt?: string;
  lastTestStatus?: "ok" | "error";
  lastTestMessage?: string;
  defaultCharge: number;
}

export interface AdminCourierBooking {
  id: string;
  orderId: string;
  courierId: string;
  courierName: string;
  consignmentId: string;
  trackingId: string;
  trackingUrl?: string;
  deliveryStatus: "Booked" | "Picked Up" | "In Transit" | "Delivered" | "Returned" | "Cancelled";
  deliveryCharge: number;
  returnStatus?: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  mode: "auto" | "manual";
  rawResponse?: Record<string, unknown>;
  apiResponseSummary?: string;
  lastError?: string;
  lastApiError?: string;
  lastSyncedAt?: string;
  bookedAt: string;
}

export interface StockMovementRecord {
  id: string;
  productId: string;
  productTitle: string;
  sku: string;
  type: "stock_in" | "stock_out" | "adjustment" | "order_deduction" | "order_restore";
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  reason: string;
  actor: string;
  createdAt: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  accountType: "Cash" | "Bank" | "bKash" | "Nagad" | "Other";
  accountNumber?: string;
  openingBalance: number;
  currentBalance: number;
  active: boolean;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: "debit" | "credit";
  entryKind: "income" | "expense" | "transfer" | "adjustment" | "refund";
  accountId: string;
  category: string;
  amount: number;
  referenceNo?: string;
  orderId?: string;
  counterparty?: string;
  description: string;
  attachmentUrl?: string;
  pairTxId?: string;
  actor: string;
  createdAt: string;
}

export interface AdminEmiBankConfig {
  id: string;
  name: string;
  shortName: string;
  tenures: number[];
  processingFeePercent: number;
  interestRate: number;
  zeroEmiEligible: boolean;
  minOrderAmount: number;
  applicableCategories: string[];
  enabled: boolean;
}

export interface AdminEmiRate {
  months: number;
  scbRate: number;
  generalRate: number;
}

export interface AdminStoreSettings {
  storeName: string;
  logoUrl: string;
  faviconUrl: string;
  hotlinePrimary: string;
  hotlineSecondary: string;
  whatsappNumber: string;
  supportEmail: string;
  officeAddress: string;
  currencySymbol: string;
  insideDhakaShipping: number;
  outsideDhakaShipping: number;
  freeDeliveryThreshold: number;
  emiMinAmount: number;
  lowStockThreshold: number;
  stockDeductOnStatus: OrderStatus;
  defaultVatPercent: number;
  invoicePrefix: string;
  invoiceFooterNote: string;
  autoInvoiceOnOrder: boolean;
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    youtube: string;
  };
  homepageSections: {
    id: string;
    label: string;
    enabled: boolean;
    order: number;
  }[];
  chatbotGreeting: string;
  emailAlertsEnabled: boolean;
  googleSiteVerification?: string;
  smtpSettings?: {
    provider: "smtp" | "resend";
    host: string;
    port: number;
    username: string;
    senderName: string;
    senderEmail: string;
    adminNotificationEmail: string;
    hasPassword?: boolean;
  };
}

export interface AdminPolicyPage {
  slug: string;
  title: string;
  lastUpdated: string;
  content: string;
  seoTitle?: string;
  metaDescription?: string;
  published: boolean;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole?: string;
  section: string;
  action: string;
  details?: string;
}

export interface ProductModerationOverride {
  productId: string;
  hiddenReviewIds: string[];
  approvedReviewIds: string[];
  reviewReplies: Record<string, string>;
  qnaAnswers: Record<string, { answer: string; answeredAt: string }>;
  hiddenQnaIds: string[];
}

export interface AdminSubcategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  displayOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  active?: boolean;
}

export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  banner?: string;
  parentId?: string;
  displayOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  active?: boolean;
  subcategories: AdminSubcategoryItem[];
}

export interface AdminBrandItem {
  id: string;
  name: string;
  slug: string;
  country: string;
  logo?: string;
  description?: string;
  authorized: boolean;
  seoTitle?: string;
  seoDescription?: string;
  active?: boolean;
}

export interface ProductReviewRecord {
  id: string;
  productId: string;
  productSlug?: string;
  productTitle: string;
  customerName?: string;
  userName?: string;
  customerEmail?: string;
  userEmail?: string;
  customerLocation?: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  status: "Pending" | "Approved" | "Rejected";
  adminReply?: string;
  isTestData?: boolean;
  verifiedPurchase?: boolean;
  moderatedAt?: string;
  moderatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductQuestionRecord {
  id: string;
  productId: string;
  productSlug?: string;
  productTitle: string;
  customerName?: string;
  userName?: string;
  customerEmail?: string;
  userEmail?: string;
  question: string;
  answer?: string;
  answeredBy?: string;
  isTestData?: boolean;
  status: "Pending" | "Answered" | "Approved" | "Rejected" | "Hidden";
  createdAt: string;
  answeredAt?: string;
}

export interface CustomerUserRecord {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  passwordHash?: string;
  provider: "email" | "phone" | "google";
  emailVerified?: boolean;
  supabaseUserId?: string;
  avatar?: string;
  addresses: {
    id: string;
    title?: string;
    fullName: string;
    phone?: string;
    phoneNumber?: string;
    email?: string;
    city: string;
    area?: string;
    address?: string;
    addressLine?: string;
    isDefault: boolean;
  }[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface EmailDeliveryLog {
  id: string;
  eventKey: string;
  eventType: string;
  recipient: string;
  audience: "admin" | "customer";
  subject: string;
  status: "sent" | "failed" | "skipped";
  attempts: number;
  provider: string;
  error?: string;
  createdAt: string;
}

export interface ChatConversationRecord {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  question: string;
  status: "Open" | "Assigned" | "Resolved";
  assignedTo?: string;
  createdAt: string;
  messages: {
    id: string;
    sender: "customer" | "bot" | "agent";
    text: string;
    productLink?: string;
    time: string;
  }[];
}

export interface ChatbotFaqItem {
  id: string;
  keywords: string;
  question: string;
  answer: string;
  productLink?: string;
  active: boolean;
}

export interface ContactInquiryRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: "Pending" | "Replied" | "Resolved";
  assignedAgent?: string;
  adminNotes?: string;
  replies: { sender: string; text: string; sentAt: string }[];
  createdAt: string;
}

export interface CustomerProfileOverride {
  key: string;
  status: "active" | "vip" | "blocked";
  notes?: string;
}

export interface AdminOrderRecord {
  id: string;
  date: string;
  createdAtIso?: string;
  status: OrderStatus | string;
  paymentMethod: string;
  paymentStatus: PaymentStatusType;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  courier?: string;
  trackingNo?: string;
  adminNote?: string;
  sourceChannel?: string;
  bkashPhone?: string;
  bkashTrxId?: string;
  nagadPhone?: string;
  nagadTrxId?: string;
  timeline?: { title: string; time: string; completed: boolean; desc: string }[];
  shippingAddress: {
    fullName: string;
    phone?: string;
    phoneNumber?: string;
    email?: string;
    city: string;
    address: string;
  };
  items: {
    id?: string;
    title?: string;
    price?: number;
    quantity: number;
    thumbnail?: string;
    image?: string;
    product?: Partial<Product> & {
      title?: string;
      price?: number;
      image?: string;
      thumbnail?: string;
    };
  }[];
  source?: "local" | "supabase" | "sample" | "manual";
}

export interface ProductAdminExtended {
  purchasePrice?: number;
  status?: "published" | "draft" | "archived";
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  relatedProductIds?: string[];
  specifications?: SpecificationGroup[];
  offerTitle?: string;
  offerBadge?: string;
  offerEndsAt?: string;
}

export interface AdminOfferItem {
  id: string;
  productId: string;
  title: string;
  badge: string;
  offerPrice: number;
  originalPrice: number;
  discountPercent: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
}

export type LandingBlockType =
  | "hero"
  | "highlights"
  | "video"
  | "gallery"
  | "description"
  | "specs"
  | "testimonial"
  | "checkout";

export interface LandingPageBlock {
  id: string;
  type: LandingBlockType;
  label: string;
  heading: string;
  subheading?: string;
  body?: string;
  imageUrl?: string;
  videoUrl?: string;
  bulletPoints?: string[];
  ctaText?: string;
  visible: boolean;
}

export interface LandingPageRecord {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  badge?: string;
  productId: string;
  heroImage: string;
  galleryImages?: string[];
  videoUrl?: string;
  accentColor?: string;
  offerPrice?: number;
  originalPrice?: number;
  ctaText: string;
  warrantyNote?: string;
  deliveryNote?: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
  blocks: LandingPageBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminDatabase {
  adminUsers: AdminUserAccount[];
  roles: RoleDefinition[];
  customProducts: (Product & ProductAdminExtended)[];
  productOverrides: Record<string, Partial<Product> & ProductAdminExtended>;
  deletedProductIds: string[];
  categories: AdminCategoryItem[];
  brands: AdminBrandItem[];
  reviews: ProductReviewRecord[];
  productQuestions: ProductQuestionRecord[];
  customerUsers: CustomerUserRecord[];
  emailLogs: EmailDeliveryLog[];
  coupons: AdminCoupon[];
  offers?: AdminOfferItem[];
  landingPages?: LandingPageRecord[];
  banners: AdminBannerItem[];
  popups: AdminPopupItem[];
  trackingSettings: AdminTrackingSettings;
  paymentChannels: AdminPaymentChannel[];
  payments: AdminPaymentRecord[];
  recordedPaymentOrderIds: string[];
  invoices: AdminInvoiceRecord[];
  couriers: AdminCourierProvider[];
  courierBookings: AdminCourierBooking[];
  stockMovements: StockMovementRecord[];
  stockDeductedOrderIds: string[];
  accounts: FinancialAccount[];
  financialTransactions: FinancialTransaction[];
  customExpenseCategories: string[];
  accountsPayable: number;
  accountsReceivable: number;
  emiBanks: AdminEmiBankConfig[];
  emiRates: AdminEmiRate[];
  policies: Record<string, AdminPolicyPage>;
  productModeration: Record<string, ProductModerationOverride>;
  chatConversations: ChatConversationRecord[];
  chatbotFaqs: ChatbotFaqItem[];
  predefinedReplies: string[];
  contactInquiries: ContactInquiryRecord[];
  customerOverrides: Record<string, CustomerProfileOverride>;
  orderOverrides: Record<
    string,
    {
      status?: string;
      paymentStatus?: PaymentStatusType;
      courier?: string;
      trackingNo?: string;
      deliveryCharge?: number;
      adminNote?: string;
    }
  >;
  settings: AdminStoreSettings;
  auditLogs: AdminAuditLog[];
}
