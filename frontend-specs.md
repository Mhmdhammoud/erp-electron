# Frontend Specification - Multi-Tenant Retail ERP

**Version**: 1.0.0
**Last Updated**: November 2025
**Backend API**: GraphQL (NestJS)
**Target Platforms**: Electron (Business Users) + Next.js (Super Admin Dashboard)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [GraphQL API Reference](#graphql-api-reference)
5. [Entity Schemas](#entity-schemas)
6. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
7. [Currency & Internationalization](#currency--internationalization)
8. [UI Requirements](#ui-requirements)
9. [Electron App Structure](#electron-app-structure)
10. [Next.js Admin Structure](#nextjs-admin-structure)
11. [State Management](#state-management)
12. [Development Guidelines](#development-guidelines)

---

## Overview

### Purpose

This document defines the frontend specifications for the multi-tenant ERP system. It provides all necessary information for building the Electron desktop application (for business users) and the Next.js admin dashboard (for super admins).

### Backend Status

**Current Implementation: ~85% Complete**

✅ **Fully Implemented:**
- Tenant Module (CRUD, exchange rates, branding)
- Product Module (inventory, categories, search)
- Customer Module (CRUD, search, addresses)
- Order Module (status management, inventory integration)
- Invoice Module (payment tracking, status calculation)
- Dashboard Module (metrics, analytics, KPIs)
- Health Module (system monitoring)
- Authentication Guards & Decorators
- Multi-Tenancy Isolation
- Currency Conversion Service

⚠️ **Partially Implemented:**
- Invoice-Order coupling (needs status update when invoice created)

❌ **Not Yet Implemented:**
- Webhooks Module (Clerk user.created events)
- Auth Module (login/me GraphQL queries)
- Pagination for large datasets

### Frontend Goals

1. **Electron App**: Desktop-first experience for daily business operations
2. **Admin Dashboard**: Web-based super admin portal for multi-tenant management
3. **Offline-First**: Electron app works with local caching
4. **Multi-Currency**: USD/LBP dual display throughout
5. **Multi-Language**: English → Arabic → French (MVP: English only)
6. **Real-Time Updates**: GraphQL subscriptions (future enhancement)

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  CLERK (Authentication)                     │
│  - Issues JWT with metadata (tenant_id, role)              │
│  - Manages user sessions                                    │
└──────────┬────────────────────────────┬─────────────────────┘
           │                            │
       ┌───▼─────────────┐    ┌────────▼──────────────┐
       │   Electron      │    │   Next.js Admin      │
       │   App (React)   │    │   Dashboard (React)  │
       │                 │    │                      │
       │  - Business UI  │    │  - Super Admin Only  │
       │  - Port: 3001   │    │  - Port: 3002        │
       │  - Offline Mode │    │  - Tenant Management │
       └───┬─────────────┘    └────────┬──────────────┘
           │                           │
           │ GraphQL + JWT             │ GraphQL + JWT
           │                           │
           └────────────────┬──────────┘
                            │
               ┌────────────▼────────────┐
               │    NestJS Backend       │
               │   (Port 3000)           │
               │                         │
               ├─ GraphQL API            │
               ├─ JWT Validation         │
               ├─ Tenant Isolation       │
               ├─ Business Logic         │
               └────────────┬────────────┘
                            │
               ┌────────────▼────────────┐
               │   MongoDB Atlas         │
               │  (Multi-Tenant Data)    │
               └─────────────────────────┘
```

### Technology Stack

#### Electron App

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Electron 27+ | Desktop app wrapper |
| **UI Library** | React 18.x | Component-based UI |
| **Language** | TypeScript 5.x | Type safety |
| **GraphQL Client** | Apollo Client 3.8+ | API communication |
| **State Management** | Zustand | Lightweight state |
| **Styling** | TailwindCSS 3.x | Utility-first CSS |
| **i18n** | i18next 23.x | Multi-language |
| **Auth** | @clerk/clerk-react | Clerk integration |
| **Code Generation** | graphql-codegen | Type-safe queries |
| **Build Tool** | Vite 5.x | Fast bundler |
| **Forms** | React Hook Form | Form validation |
| **Tables** | TanStack Table | Advanced tables |
| **Charts** | Recharts | Data visualization |

#### Next.js Admin Dashboard

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | Next.js 14.x | React SSR framework |
| **UI Library** | React 18.x | Component-based UI |
| **Language** | TypeScript 5.x | Type safety |
| **GraphQL Client** | Apollo Client 3.8+ | API communication |
| **Styling** | TailwindCSS 3.x | Utility-first CSS |
| **Auth** | @clerk/nextjs | Clerk SSR integration |
| **Code Generation** | graphql-codegen | Type-safe queries |
| **Forms** | React Hook Form | Form validation |
| **Validation** | Zod | Runtime validation |

---

## Authentication Flow

### Clerk Integration

#### User Registration & Login

```
1. User visits Electron App / Admin Dashboard
2. Redirected to Clerk login page
3. User signs up or logs in
4. Clerk creates user account
5. Clerk webhook (user.created) triggers backend
6. Backend creates tenant automatically
7. Backend updates Clerk user metadata:
   {
     tenant_id: "650f7c2a1b2d3e4f5a6b7c8d",
     role: "admin"
   }
8. User redirected back to app
9. Frontend receives JWT with metadata
10. Frontend stores JWT securely
11. All GraphQL requests include JWT header
```

#### JWT Structure

```json
{
  "sub": "user_2abc123xyz",
  "email": "owner@business.com",
  "email_verified": true,
  "name": "Business Owner",
  "picture": "https://img.clerk.com/...",
  "public_metadata": {
    "tenant_id": "650f7c2a1b2d3e4f5a6b7c8d",
    "role": "admin"
  },
  "iat": 1700000000,
  "exp": 1700003600
}
```

#### Frontend Auth Implementation

**Electron App:**
```typescript
// src/auth/ClerkProvider.tsx
import { ClerkProvider } from '@clerk/clerk-react';
import { useAuth } from '@clerk/clerk-react';

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <AuthenticatedApp />
    </ClerkProvider>
  );
}

function AuthenticatedApp() {
  const { isSignedIn, isLoaded, getToken } = useAuth();

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <SignIn />;

  return <MainApp />;
}

// Apollo Client with JWT
const createApolloClient = () => {
  const { getToken } = useAuth();

  const authLink = setContext(async (_, { headers }) => {
    const token = await getToken();
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      }
    };
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
};
```

**Next.js Admin:**
```typescript
// src/middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/"],
  afterAuth(auth, req) {
    // Verify super admin role
    const role = auth.sessionClaims?.public_metadata?.role;
    if (role !== 'super_admin') {
      return redirectToUnauthorized();
    }
  }
});
```

#### Role-Based Access Control

**Roles:**
- `admin`: Full access to their tenant's data
- `user`: Read-only access to tenant's data (future)
- `super_admin`: Access to all tenants (admin dashboard only)

**Frontend Implementation:**
```typescript
// useAuth hook
export function useAuth() {
  const { user, getToken } = useAuth();

  return {
    userId: user?.id,
    email: user?.primaryEmailAddress?.emailAddress,
    tenantId: user?.publicMetadata?.tenant_id as string,
    role: user?.publicMetadata?.role as 'admin' | 'user' | 'super_admin',
    isSuperAdmin: user?.publicMetadata?.role === 'super_admin',
    getToken,
  };
}

// Protected route component
function ProtectedRoute({ children, requiredRole }) {
  const { role } = useAuth();

  if (!requiredRole.includes(role)) {
    return <Unauthorized />;
  }

  return children;
}
```

---

## GraphQL API Reference

### Complete Query & Mutation List

#### **Tenant Operations**

```graphql
# Get current user's tenant
query MyTenant {
  myTenant {
    data {
      id
      name
      email
      phone
      website
      branding {
        logoUrl
        primaryColor
        invoiceFooter
        companyAddress
      }
      currencyConfig {
        baseCurrency
        secondaryCurrency
        exchangeRate
        updatedAt
      }
      language
      status
      createdAt
      updatedAt
    }
    error {
      field
      message
    }
  }
}

# Get tenant by ID (super admin only)
query GetTenant($id: ObjectID!) {
  tenant(id: $id) {
    data {
      # Same fields as above
    }
    error {
      field
      message
    }
  }
}

# Get all tenants (super admin only)
query GetAllTenants {
  tenants {
    data {
      # Array of tenant objects
    }
    error {
      field
      message
    }
  }
}

# Create tenant
mutation CreateTenant($input: CreateTenantInput!) {
  createTenant(input: $input) {
    data {
      id
      name
    }
    error {
      field
      message
    }
  }
}

# Update tenant
mutation UpdateTenant($id: ObjectID!, $input: UpdateTenantInput!) {
  updateTenant(id: $id, input: $input) {
    data {
      id
      name
    }
    error {
      field
      message
    }
  }
}

# Update exchange rate
mutation UpdateExchangeRate($rate: Float!) {
  updateExchangeRate(rate: $rate) {
    data {
      baseCurrency
      secondaryCurrency
      exchangeRate
      updatedAt
    }
    error {
      field
      message
    }
  }
}

# Delete tenant (soft delete)
mutation DeleteTenant($id: ObjectID!) {
  deleteTenant(id: $id) {
    data {
      success
    }
    error {
      field
      message
    }
  }
}
```

#### **Product Operations**

```graphql
# Get all products
query GetProducts($filter: ProductFilterInput) {
  products(filter: $filter) {
    data {
      id
      sku
      name
      description
      barcode
      category
      subcategory
      price_usd
      cost_usd
      quantity_in_stock
      reorder_level
      status
      created_by
      updated_by
      createdAt
      updatedAt
    }
    error {
      field
      message
    }
  }
}

# Get product by ID
query GetProduct($id: ObjectID!) {
  product(id: $id) {
    data {
      # Same fields as above
    }
    error {
      field
      message
    }
  }
}

# Get product by SKU
query GetProductBySku($sku: String!) {
  productBySku(sku: $sku) {
    data {
      # Same fields
    }
    error {
      field
      message
    }
  }
}

# Get product by barcode
query GetProductByBarcode($barcode: String!) {
  productByBarcode(barcode: $barcode) {
    data {
      # Same fields
    }
    error {
      field
      message
    }
  }
}

# Get low inventory products
query GetLowInventoryProducts {
  lowInventoryProducts {
    data {
      # Array of products
    }
    error {
      field
      message
    }
  }
}

# Get product categories
query GetProductCategories {
  productCategories {
    data {
      category
      count
    }
    error {
      field
      message
    }
  }
}

# Create product
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    data {
      id
      sku
      name
    }
    error {
      field
      message
    }
  }
}

# Update product
mutation UpdateProduct($id: ObjectID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    data {
      id
      sku
      name
    }
    error {
      field
      message
    }
  }
}

# Delete product
mutation DeleteProduct($id: ObjectID!) {
  deleteProduct(id: $id) {
    data {
      success
    }
    error {
      field
      message
    }
  }
}

# Update product inventory
mutation UpdateProductInventory($id: ObjectID!, $quantity: Float!) {
  updateProductInventory(id: $id, quantity: $quantity) {
    data {
      id
      quantity_in_stock
    }
    error {
      field
      message
    }
  }
}
```

#### **Customer Operations**

```graphql
# Get all customers
query GetCustomers {
  customers {
    data {
      id
      name
      email
      phone
      company_name
      tax_id
      credit_limit
      current_credit_used
      addresses {
        type
        street
        city
        state
        postal_code
        country
      }
      status
      created_by
      updated_by
      createdAt
      updatedAt
    }
    error {
      field
      message
    }
  }
}

# Get customer by ID
query GetCustomer($id: ObjectID!) {
  customer(id: $id) {
    data {
      # Same fields as above
    }
    error {
      field
      message
    }
  }
}

# Search customers
query SearchCustomers($searchTerm: String!) {
  searchCustomers(searchTerm: $searchTerm) {
    data {
      # Array of customers
    }
    error {
      field
      message
    }
  }
}

# Create customer
mutation CreateCustomer($input: CreateCustomerInput!) {
  createCustomer(input: $input) {
    data {
      id
      name
    }
    error {
      field
      message
    }
  }
}

# Update customer
mutation UpdateCustomer($id: ObjectID!, $input: UpdateCustomerInput!) {
  updateCustomer(id: $id, input: $input) {
    data {
      id
      name
    }
    error {
      field
      message
    }
  }
}

# Delete customer
mutation DeleteCustomer($id: ObjectID!) {
  deleteCustomer(id: $id) {
    data {
      success
    }
    error {
      field
      message
    }
  }
}
```

#### **Order Operations**

```graphql
# Get all orders
query GetOrders($status: OrderStatus) {
  orders(status: $status) {
    data {
      id
      order_number
      customer_id
      status
      items {
        product_id
        product_sku
        product_name
        quantity
        unit_price_usd
        subtotal_usd
      }
      subtotal_usd
      tax_amount_usd
      total_usd
      currency_used
      exchange_rate_used
      total_lbp
      notes
      internal_notes
      invoice_id
      invoiced_at
      created_by
      updated_by
      createdAt
      updatedAt
    }
    error {
      field
      message
    }
  }
}

# Get order by ID
query GetOrder($id: ObjectID!) {
  order(id: $id) {
    data {
      # Same fields as above
    }
    error {
      field
      message
    }
  }
}

# Get orders by customer
query GetOrdersByCustomer($customerId: ObjectID!) {
  ordersByCustomer(customerId: $customerId) {
    data {
      # Array of orders
    }
    error {
      field
      message
    }
  }
}

# Create order
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    data {
      id
      order_number
      total_usd
    }
    error {
      field
      message
    }
  }
}

# Update order status
mutation UpdateOrderStatus($id: ObjectID!, $input: UpdateOrderStatusInput!) {
  updateOrderStatus(id: $id, input: $input) {
    data {
      id
      status
    }
    error {
      field
      message
    }
  }
}

# Cancel order
mutation CancelOrder($id: ObjectID!) {
  cancelOrder(id: $id) {
    data {
      success
    }
    error {
      field
      message
    }
  }
}
```

#### **Invoice Operations**

```graphql
# Get all invoices
query GetInvoices($status: PaymentStatus) {
  invoices(status: $status) {
    data {
      id
      invoice_number
      order_id
      customer_id
      issued_date
      due_date
      subtotal_usd
      tax_amount_usd
      total_usd
      currency_used
      exchange_rate_used
      total_lbp
      payment_status
      paid_amount_usd
      remaining_amount_usd
      payments {
        date
        amount_usd
        amount_lbp
        payment_method
        notes
      }
      invoice_notes
      payment_terms
      created_by
      updated_by
      createdAt
      updatedAt
    }
    error {
      field
      message
    }
  }
}

# Get invoice by ID
query GetInvoice($id: ObjectID!) {
  invoice(id: $id) {
    data {
      # Same fields as above
    }
    error {
      field
      message
    }
  }
}

# Get invoices by customer
query GetInvoicesByCustomer($customerId: ObjectID!) {
  invoicesByCustomer(customerId: $customerId) {
    data {
      # Array of invoices
    }
    error {
      field
      message
    }
  }
}

# Get invoices by order
query GetInvoicesByOrder($orderId: ObjectID!) {
  invoicesByOrder(orderId: $orderId) {
    data {
      # Array of invoices
    }
    error {
      field
      message
    }
  }
}

# Create invoice from order
mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    data {
      id
      invoice_number
      total_usd
    }
    error {
      field
      message
    }
  }
}

# Record payment
mutation RecordPayment($id: ObjectID!, $input: RecordPaymentInput!) {
  recordPayment(id: $id, input: $input) {
    data {
      id
      payment_status
      paid_amount_usd
      remaining_amount_usd
    }
    error {
      field
      message
    }
  }
}

# Cancel invoice
mutation CancelInvoice($id: ObjectID!) {
  cancelInvoice(id: $id) {
    data {
      success
    }
    error {
      field
      message
    }
  }
}
```

#### **Dashboard Operations**

```graphql
# Get dashboard metrics
query GetDashboardMetrics {
  dashboardMetrics {
    data {
      revenue {
        today
        thisWeek
        thisMonth
        lastMonth
      }
      topProducts {
        product_id
        product_name
        total_quantity_sold
        total_revenue_usd
      }
      lowInventory {
        product_id
        product_name
        sku
        quantity_in_stock
        reorder_level
      }
      ordersByStatus {
        status
        count
      }
      invoicesByStatus {
        status
        count
      }
      overdueInvoices {
        count
        total_amount_usd
      }
    }
    error {
      field
      message
    }
  }
}
```

#### **Health Check**

```graphql
# Health check
query HealthCheck {
  healthCheck {
    status
    database
    uptime
    timestamp
    version
  }
}
```

---

## Entity Schemas

### Input Types

#### CreateTenantInput
```typescript
interface CreateTenantInput {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  language?: Language; // Default: EN
}
```

#### UpdateTenantInput
```typescript
interface UpdateTenantInput {
  name?: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  language?: Language;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    invoiceFooter?: string;
    companyAddress?: string;
  };
  currencyConfig?: {
    exchangeRate: number;
  };
}
```

#### CreateProductInput
```typescript
interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  barcode?: string;
  category?: string;
  subcategory?: string;
  price_usd: number;
  cost_usd?: number;
  quantity_in_stock: number;
  reorder_level?: number;
}
```

#### UpdateProductInput
```typescript
interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string;
  barcode?: string;
  category?: string;
  subcategory?: string;
  price_usd?: number;
  cost_usd?: number;
  quantity_in_stock?: number;
  reorder_level?: number;
  status?: ProductStatus;
}
```

#### ProductFilterInput
```typescript
interface ProductFilterInput {
  category?: string;
  status?: ProductStatus;
  search?: string; // Searches name, SKU, barcode
}
```

#### CreateCustomerInput
```typescript
interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  tax_id?: string;
  credit_limit?: number;
  addresses?: AddressInput[];
}

interface AddressInput {
  type: string; // 'billing', 'shipping', 'other'
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}
```

#### UpdateCustomerInput
```typescript
interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  tax_id?: string;
  credit_limit?: number;
  addresses?: AddressInput[];
  status?: CustomerStatus;
}
```

#### CreateOrderInput
```typescript
interface CreateOrderInput {
  customer_id: string; // ObjectID
  items: OrderItemInput[];
  currency_used?: Currency; // Default: USD
  exchange_rate_used?: number; // Required if currency_used is LBP
  notes?: string;
  internal_notes?: string;
}

interface OrderItemInput {
  product_id: string; // ObjectID
  quantity: number;
  unit_price_usd: number; // Must match product price
}
```

#### UpdateOrderStatusInput
```typescript
interface UpdateOrderStatusInput {
  status: OrderStatus;
}
```

#### CreateInvoiceInput
```typescript
interface CreateInvoiceInput {
  order_id: string; // ObjectID
  issued_date?: Date; // Default: now
  due_date?: Date; // Default: now + 30 days
  invoice_notes?: string;
  payment_terms?: string; // e.g., "Net 30"
}
```

#### RecordPaymentInput
```typescript
interface RecordPaymentInput {
  amount_usd: number;
  amount_lbp?: number; // Optional LBP payment
  payment_method: PaymentMethod;
  date?: Date; // Default: now
  notes?: string;
}
```

### Enums

```typescript
enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
}

enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  INVOICED = 'invoiced',
  CANCELLED = 'cancelled',
}

enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CHECK = 'check',
}

enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  AED = 'AED',
  SAR = 'SAR',
  QAR = 'QAR',
  KWD = 'KWD',
  LBP = 'LBP',
}

enum Language {
  EN = 'en',
  AR = 'ar',
  FR = 'fr',
}

enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}
```

---

## Multi-Tenancy Implementation

### Frontend Considerations

#### 1. Automatic Tenant Scoping

**All GraphQL queries are automatically scoped to the user's tenant** via JWT metadata. The frontend does NOT need to pass `tenant_id` in queries.

```typescript
// ❌ WRONG - Don't pass tenant_id
const { data } = useQuery(GET_PRODUCTS, {
  variables: { tenantId: user.tenantId }
});

// ✅ CORRECT - Backend extracts tenant from JWT
const { data } = useQuery(GET_PRODUCTS);
```

#### 2. Tenant Context Hook

```typescript
// hooks/useTenant.ts
export function useTenant() {
  const { data, loading } = useQuery(MY_TENANT_QUERY);

  return {
    tenant: data?.myTenant?.data,
    loading,
    exchangeRate: data?.myTenant?.data?.currencyConfig?.exchangeRate,
    branding: data?.myTenant?.data?.branding,
    language: data?.myTenant?.data?.language,
  };
}

// Usage
function Header() {
  const { tenant, branding } = useTenant();

  return (
    <header style={{ backgroundColor: branding?.primaryColor }}>
      <img src={branding?.logoUrl} alt={tenant?.name} />
    </header>
  );
}
```

#### 3. Super Admin Multi-Tenant View

Only the Next.js admin dashboard needs tenant selection:

```typescript
// For super admins only
function TenantSelector() {
  const { data } = useQuery(GET_ALL_TENANTS);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  return (
    <select onChange={(e) => setSelectedTenant(e.target.value)}>
      {data?.tenants?.data?.map(tenant => (
        <option key={tenant.id} value={tenant.id}>
          {tenant.name}
        </option>
      ))}
    </select>
  );
}
```

---

## Currency & Internationalization

### Dual Currency Display

**All prices are stored in USD**, but displayed in both USD and LBP:

```typescript
// hooks/useCurrency.ts
export function useCurrency() {
  const { exchangeRate } = useTenant();

  const convertToLBP = (usd: number) => {
    return usd * (exchangeRate || 88000);
  };

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatLBP = (amount: number) => {
    return new Intl.NumberFormat('en-LB', {
      style: 'currency',
      currency: 'LBP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return {
    convertToLBP,
    formatUSD,
    formatLBP,
    exchangeRate,
  };
}

// Usage
function PriceDisplay({ usd }: { usd: number }) {
  const { convertToLBP, formatUSD, formatLBP } = useCurrency();

  return (
    <div>
      <span className="text-lg font-bold">{formatUSD(usd)}</span>
      <span className="text-sm text-gray-500 ml-2">
        ({formatLBP(convertToLBP(usd))})
      </span>
    </div>
  );
}
```

### Multi-Language Support

```typescript
// i18n configuration
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          'products.title': 'Products',
          'products.add': 'Add Product',
          'products.sku': 'SKU',
          'products.name': 'Product Name',
          // ... more translations
        }
      },
      ar: {
        translation: {
          'products.title': 'المنتجات',
          'products.add': 'إضافة منتج',
          'products.sku': 'رمز المنتج',
          'products.name': 'اسم المنتج',
          // ... more translations
        }
      },
      fr: {
        translation: {
          'products.title': 'Produits',
          'products.add': 'Ajouter un produit',
          'products.sku': 'SKU',
          'products.name': 'Nom du produit',
          // ... more translations
        }
      }
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// Usage
import { useTranslation } from 'react-i18next';

function ProductsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('products.title')}</h1>
      <button>{t('products.add')}</button>
    </div>
  );
}
```

---

## UI Requirements

### Electron App (Business Users)

#### 1. Dashboard Page

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Header: Logo | Business Name | User Menu | Settings    │
├─────────────────────────────────────────────────────────┤
│ Sidebar Navigation                      Main Content    │
│ - Dashboard                                             │
│ - Products                    ┌──────────────────────┐  │
│ - Customers                   │  Revenue Metrics     │  │
│ - Orders                      │  Today: $1,234       │  │
│ - Invoices                    │  This Week: $5,678   │  │
│                               │  This Month: $12,345 │  │
│                               └──────────────────────┘  │
│                                                         │
│                               ┌──────────────────────┐  │
│                               │  Quick Stats         │  │
│                               │  - Orders: 45        │  │
│                               │  - Customers: 120    │  │
│                               │  - Low Stock: 5      │  │
│                               └──────────────────────┘  │
│                                                         │
│                               ┌──────────────────────┐  │
│                               │  Recent Orders       │  │
│                               │  [Table]             │  │
│                               └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Data to Display:**
- Revenue metrics (today, week, month)
- Order counts by status (draft, confirmed, shipped, invoiced)
- Invoice counts by status (unpaid, partial, paid, overdue)
- Low inventory alerts
- Top selling products
- Recent orders table

**GraphQL Query:**
```graphql
query DashboardData {
  dashboardMetrics {
    data {
      revenue {
        today
        thisWeek
        thisMonth
        lastMonth
      }
      topProducts {
        product_name
        total_revenue_usd
      }
      lowInventory {
        product_name
        sku
        quantity_in_stock
      }
      ordersByStatus {
        status
        count
      }
      invoicesByStatus {
        status
        count
      }
      overdueInvoices {
        count
        total_amount_usd
      }
    }
  }
}
```

#### 2. Products Page

**Features:**
- Product list table with search/filter
- Add/Edit product modal
- Delete product confirmation
- Low inventory badge
- Category grouping
- Barcode scanner support (Electron only)

**Table Columns:**
- SKU
- Name
- Category
- Price (USD/LBP)
- Stock Quantity
- Status
- Actions (Edit, Delete)

**Filters:**
- Category dropdown
- Status dropdown (Active, Inactive, Discontinued)
- Search (name, SKU, barcode)

**GraphQL Queries:**
```graphql
query Products($filter: ProductFilterInput) {
  products(filter: $filter) {
    data {
      id
      sku
      name
      category
      price_usd
      quantity_in_stock
      reorder_level
      status
    }
  }

  productCategories {
    data {
      category
      count
    }
  }
}
```

#### 3. Customers Page

**Features:**
- Customer list with search
- Add/Edit customer modal
- View customer details (orders, invoices)
- Credit limit tracking

**Table Columns:**
- Name
- Email
- Phone
- Company Name
- Credit Used / Limit
- Status
- Actions

**GraphQL Queries:**
```graphql
query Customers {
  customers {
    data {
      id
      name
      email
      phone
      company_name
      credit_limit
      current_credit_used
      status
    }
  }
}

query CustomerDetails($id: ObjectID!) {
  customer(id: $id) {
    data {
      # Full customer details
    }
  }

  ordersByCustomer(customerId: $id) {
    data {
      # Customer's orders
    }
  }

  invoicesByCustomer(customerId: $id) {
    data {
      # Customer's invoices
    }
  }
}
```

#### 4. Orders Page

**Features:**
- Order list with status filters
- Create order wizard (multi-step)
- Order details view
- Status transition buttons (Confirm, Ship, Invoice)
- Print order confirmation
- Cancel order

**Create Order Wizard Steps:**
1. Select Customer
2. Add Products (search, select, quantity)
3. Review & Calculate Total
4. Select Currency (USD/LBP)
5. Add Notes
6. Submit

**Status Workflow:**
```
Draft → Confirmed → Shipped → Invoiced
         ↓
      Cancelled
```

**Table Columns:**
- Order Number
- Customer Name
- Total (USD/LBP)
- Status
- Created Date
- Actions

**GraphQL Queries:**
```graphql
query Orders($status: OrderStatus) {
  orders(status: $status) {
    data {
      id
      order_number
      customer_id
      status
      total_usd
      total_lbp
      createdAt
    }
  }
}

mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    data {
      id
      order_number
    }
  }
}

mutation UpdateOrderStatus($id: ObjectID!, $input: UpdateOrderStatusInput!) {
  updateOrderStatus(id: $id, input: $input) {
    data {
      id
      status
    }
  }
}
```

#### 5. Invoices Page

**Features:**
- Invoice list with status filters
- Create invoice from order
- Record payment (supports partial payments)
- Print/Export invoice (PDF)
- Send invoice (future: email integration)
- Overdue invoice alerts

**Table Columns:**
- Invoice Number
- Customer Name
- Total Amount
- Paid Amount
- Remaining Amount
- Status
- Due Date
- Actions

**Payment Recording:**
- Modal with payment amount input
- Payment method selection
- Date picker
- Notes field
- Shows remaining amount after payment

**GraphQL Queries:**
```graphql
query Invoices($status: PaymentStatus) {
  invoices(status: $status) {
    data {
      id
      invoice_number
      customer_id
      total_usd
      paid_amount_usd
      remaining_amount_usd
      payment_status
      due_date
      createdAt
    }
  }
}

mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    data {
      id
      invoice_number
    }
  }
}

mutation RecordPayment($id: ObjectID!, $input: RecordPaymentInput!) {
  recordPayment(id: $id, input: $input) {
    data {
      id
      payment_status
      paid_amount_usd
      remaining_amount_usd
    }
  }
}
```

#### 6. Settings Page

**Tabs:**
- **Business Information**: Edit tenant details
- **Branding**: Logo, colors, invoice footer
- **Currency**: Update exchange rate
- **Users**: Manage team members (future)
- **Preferences**: Language, timezone

**GraphQL Queries:**
```graphql
query Settings {
  myTenant {
    data {
      name
      email
      phone
      website
      branding {
        logoUrl
        primaryColor
        invoiceFooter
        companyAddress
      }
      currencyConfig {
        exchangeRate
      }
      language
    }
  }
}

mutation UpdateSettings($id: ObjectID!, $input: UpdateTenantInput!) {
  updateTenant(id: $id, input: $input) {
    data {
      id
      name
    }
  }
}

mutation UpdateExchangeRate($rate: Float!) {
  updateExchangeRate(rate: $rate) {
    data {
      exchangeRate
      updatedAt
    }
  }
}
```

---

### Next.js Admin Dashboard (Super Admin)

#### 1. Tenants Overview

**Features:**
- List all tenants
- View tenant details
- Create new tenant
- Suspend/Activate tenant
- View tenant metrics

**Table Columns:**
- Name
- Owner Email
- Created Date
- Status
- # Users
- # Orders
- Revenue
- Actions

#### 2. Tenant Details

**Tabs:**
- Overview (metrics)
- Users
- Products
- Orders
- Invoices
- Settings

---

## Electron App Structure

```
electron-app/
├── src/
│   ├── main/                      # Electron main process
│   │   ├── main.ts                # Entry point
│   │   ├── ipc/                   # IPC handlers
│   │   └── menu.ts                # Application menu
│   │
│   ├── renderer/                  # React app (renderer process)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   └── FormInput.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── products/
│   │   │   │   ├── ProductList.tsx
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   └── ProductDetails.tsx
│   │   │   ├── customers/
│   │   │   ├── orders/
│   │   │   ├── invoices/
│   │   │   └── dashboard/
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Invoices.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── graphql/
│   │   │   ├── queries/
│   │   │   │   ├── products.ts
│   │   │   │   ├── customers.ts
│   │   │   │   ├── orders.ts
│   │   │   │   ├── invoices.ts
│   │   │   │   └── dashboard.ts
│   │   │   ├── mutations/
│   │   │   │   ├── products.ts
│   │   │   │   ├── customers.ts
│   │   │   │   ├── orders.ts
│   │   │   │   └── invoices.ts
│   │   │   └── client.ts          # Apollo Client setup
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useTenant.ts
│   │   │   ├── useCurrency.ts
│   │   │   └── useProducts.ts
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.ts       # Zustand store
│   │   │   ├── cartStore.ts       # Order creation state
│   │   │   └── settingsStore.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── types/
│   │   │   └── generated.ts       # graphql-codegen output
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── preload/
│   │   └── preload.ts             # Preload script
│   │
│   └── assets/
│       ├── icons/
│       └── images/
│
├── codegen.yml                    # GraphQL code generation
├── electron-builder.yml           # Electron packaging
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Next.js Admin Structure

```
admin-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing/Login
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx          # Tenants overview
│   │   │   ├── tenants/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Tenant details
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   └── api/
│   │       └── graphql/
│   │           └── route.ts      # GraphQL proxy (optional)
│   │
│   ├── components/
│   │   ├── tenants/
│   │   │   ├── TenantList.tsx
│   │   │   └── TenantDetails.tsx
│   │   └── common/
│   │
│   ├── graphql/
│   │   ├── queries/
│   │   └── mutations/
│   │
│   ├── lib/
│   │   ├── apollo-client.ts
│   │   └── clerk.ts
│   │
│   └── middleware.ts             # Clerk auth middleware
│
├── codegen.yml
├── next.config.js
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

## State Management

### Zustand Stores

#### Auth Store
```typescript
// store/authStore.ts
import create from 'zustand';

interface AuthState {
  userId: string | null;
  tenantId: string | null;
  role: string | null;
  setUser: (user: { userId: string; tenantId: string; role: string }) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  tenantId: null,
  role: null,
  setUser: (user) => set(user),
  clearUser: () => set({ userId: null, tenantId: null, role: null }),
}));
```

#### Cart Store (for Order Creation)
```typescript
// store/cartStore.ts
import create from 'zustand';

interface CartItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price_usd: number;
}

interface CartState {
  customer_id: string | null;
  items: CartItem[];
  currency: 'USD' | 'LBP';
  notes: string;
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  setCustomer: (customer_id: string) => void;
  setCurrency: (currency: 'USD' | 'LBP') => void;
  clear: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  customer_id: null,
  items: [],
  currency: 'USD',
  notes: '',

  addItem: (item) => set((state) => ({
    items: [...state.items, item]
  })),

  removeItem: (product_id) => set((state) => ({
    items: state.items.filter(i => i.product_id !== product_id)
  })),

  updateQuantity: (product_id, quantity) => set((state) => ({
    items: state.items.map(i =>
      i.product_id === product_id ? { ...i, quantity } : i
    )
  })),

  setCustomer: (customer_id) => set({ customer_id }),

  setCurrency: (currency) => set({ currency }),

  clear: () => set({
    customer_id: null,
    items: [],
    currency: 'USD',
    notes: '',
  }),

  getTotal: () => {
    return get().items.reduce((sum, item) =>
      sum + (item.quantity * item.unit_price_usd), 0
    );
  },
}));
```

---

## Development Guidelines

### GraphQL Code Generation

```yaml
# codegen.yml
schema: http://localhost:3000/graphql
documents: 'src/**/*.graphql'
generates:
  src/types/generated.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
    config:
      withHooks: true
      withComponent: false
      withHOC: false
```

**Usage:**
```bash
npm run codegen
```

### Type-Safe Queries

```typescript
// src/graphql/queries/products.ts
import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilterInput) {
    products(filter: $filter) {
      data {
        id
        sku
        name
        price_usd
        quantity_in_stock
      }
      error {
        field
        message
      }
    }
  }
`;

// Usage with generated hooks
import { useGetProductsQuery } from '../types/generated';

function ProductList() {
  const { data, loading, error } = useGetProductsQuery({
    variables: { filter: { status: 'active' } }
  });

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  const products = data?.products?.data || [];

  return (
    <Table data={products} />
  );
}
```

### Error Handling Pattern

```typescript
// All GraphQL responses follow this pattern
interface Response<T> {
  data?: T;
  error?: {
    field?: string;
    message: string;
  };
}

// Usage
function ProductForm() {
  const [createProduct, { loading }] = useCreateProductMutation();

  const handleSubmit = async (input: CreateProductInput) => {
    const { data } = await createProduct({ variables: { input } });

    if (data?.createProduct?.error) {
      toast.error(data.createProduct.error.message);
      return;
    }

    toast.success('Product created successfully!');
    navigate('/products');
  };
}
```

### Offline Support (Electron)

```typescript
// Apollo Client with offline support
import { InMemoryCache, ApolloClient } from '@apollo/client';
import { CachePersistor } from 'apollo3-cache-persist';

const cache = new InMemoryCache();

const persistor = new CachePersistor({
  cache,
  storage: window.localStorage,
});

await persistor.restore();

const client = new ApolloClient({
  uri: 'http://localhost:3000/graphql',
  cache,
});
```

---

## Summary

### What Frontend Needs to Know

1. **Authentication**: Use Clerk for auth, JWT contains tenant_id automatically
2. **Multi-Tenancy**: Backend handles tenant isolation, frontend doesn't pass tenant_id
3. **Currency**: All prices stored in USD, display both USD/LBP using tenant's exchange rate
4. **GraphQL**: Use provided queries/mutations, all return `{ data, error }` pattern
5. **Enums**: Use centralized enums for status fields
6. **Validation**: Backend validates all inputs, frontend shows errors
7. **Business Logic**: Order status workflow, inventory deduction, payment tracking all handled by backend

### Missing Backend Features (To Implement Later)

1. Webhooks Module (Clerk user.created)
2. Auth Module (login/me queries)
3. Pagination support
4. Order-Invoice status coupling

### Ready to Build

The backend is production-ready for MVP development. Frontend can start building all CRUD interfaces, order creation wizards, invoice management, and dashboard visualizations using the documented GraphQL API.

---

**End of Frontend Specification Document**
