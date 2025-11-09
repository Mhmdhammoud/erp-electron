// Product Status
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

// Customer Status
export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

// Order Status
export enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  INVOICED = 'invoiced',
  CANCELLED = 'cancelled',
}

// Payment Status
export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

// Payment Method
export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
}

// Currency
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  AED = 'AED',
  SAR = 'SAR',
  QAR = 'QAR',
  KWD = 'KWD',
  LBP = 'LBP',
}

// Language
export enum Language {
  EN = 'en',
  AR = 'ar',
  FR = 'fr',
}

// Tenant Status
export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// Status Badge Colors
export const STATUS_COLORS: Record<string, string> = {
  // Product
  'active': 'badge-success',
  'inactive': 'badge-gray',
  'discontinued': 'badge-danger',

  // Customer
  'customer-active': 'badge-success',
  'customer-inactive': 'badge-gray',
  'blocked': 'badge-danger',

  // Order
  'draft': 'badge-gray',
  'confirmed': 'badge-info',
  'shipped': 'badge-warning',
  'invoiced': 'badge-success',
  'order-cancelled': 'badge-danger',

  // Payment
  'unpaid': 'badge-danger',
  'partial': 'badge-warning',
  'paid': 'badge-success',
  'overdue': 'badge-danger',
  'payment-cancelled': 'badge-gray',
};

// Default Exchange Rate (USD to LBP)
export const DEFAULT_EXCHANGE_RATE = 88000;
