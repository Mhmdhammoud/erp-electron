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
export const STATUS_COLORS = {
  // Product
  [ProductStatus.ACTIVE]: 'badge-success',
  [ProductStatus.INACTIVE]: 'badge-gray',
  [ProductStatus.DISCONTINUED]: 'badge-danger',

  // Customer
  [CustomerStatus.ACTIVE]: 'badge-success',
  [CustomerStatus.INACTIVE]: 'badge-gray',
  [CustomerStatus.BLOCKED]: 'badge-danger',

  // Order
  [OrderStatus.DRAFT]: 'badge-gray',
  [OrderStatus.CONFIRMED]: 'badge-info',
  [OrderStatus.SHIPPED]: 'badge-warning',
  [OrderStatus.INVOICED]: 'badge-success',
  [OrderStatus.CANCELLED]: 'badge-danger',

  // Payment
  [PaymentStatus.UNPAID]: 'badge-danger',
  [PaymentStatus.PARTIAL]: 'badge-warning',
  [PaymentStatus.PAID]: 'badge-success',
  [PaymentStatus.OVERDUE]: 'badge-danger',
  [PaymentStatus.CANCELLED]: 'badge-gray',
};

// Default Exchange Rate (USD to LBP)
export const DEFAULT_EXCHANGE_RATE = 88000;
