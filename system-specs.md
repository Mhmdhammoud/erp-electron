# Multi-Tenant Retail ERP System - Complete Project Specification

**Status**: Pre-Development  
**Version**: 1.0.0  
**Last Updated**: November 2025  
**Backend**: NestJS + GraphQL + Mongoose  
**Frontend**: Electron (Business) + Next.js (Admin)  
**Auth**: Clerk with JWT & Metadata

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Domain Models](#domain-models)
5. [File Structure](#file-structure)
6. [Multi-Tenancy Strategy](#multi-tenancy-strategy)
7. [Authentication & Authorization](#authentication--authorization)
8. [GraphQL API Specification](#graphql-api-specification)
9. [Mongoose Schemas](#mongoose-schemas)
10. [Service Layer](#service-layer)
11. [Resolvers](#resolvers)
12. [Environment Variables](#environment-variables)
13. [Docker Setup](#docker-setup)
14. [Development Roadmap](#development-roadmap)

---

## Project Overview

### Vision
A customizable, multi-tenant retail ERP system designed for small-to-medium businesses in Lebanon and beyond.

**Key Characteristics**:
- **Frontend**: Electron (desktop-first) + Next.js (super admin)
- **Backend**: NestJS with GraphQL + Mongoose
- **Database**: MongoDB (single DB, tenant isolation via `tenant_id`)
- **Authentication**: Clerk (JWT with metadata)
- **Currencies**: USD base, LBP secondary with configurable exchange rate
- **Languages**: English → Arabic → French (MVP starts with English)
- **Customization**: Pre-built workflows, invoice/software branding (minimal scope)
- **Deployment**: Each business gets own instance (single backend, multi-tenant data isolation)

### MVP Scope (Phase 1)

**Core Entities**:
- Tenants (businesses)
- Products (inventory)
- Customers (buyers)
- Orders (sales orders)
- Invoices (billable documents)

**Features**:
- Master data CRUD (products, customers)
- Inventory tracking (stock levels, reorder points)
- Sales order creation and management
- Invoice generation from orders
- Payment tracking (paid/pending amounts)
- Multi-currency display (USD/LBP)
- Customizable branding (logo, colors, invoice footer)
- Basic dashboards (revenue, orders, customers KPIs)
- Role-based access (admin, user, super admin)

**Out of Scope (Phase 2+)**:
- Tax calculations
- Multi-warehouse management
- Purchase-to-pay workflows
- Double-entry bookkeeping GL
- Real-time analytics
- Plugins/extensions
- Supplier management

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  CLERK (Authentication)                    │
│  Manages users, issues JWT with metadata (tenant_id, role) │
└──────────┬────────────────────────────┬─────────────────────┘
           │                            │
       ┌───▼─────────────┐    ┌────────▼──────────────┐
       │   Electron      │    │   Next.js Admin      │
       │   App (React)   │    │   Dashboard (React)  │
       │  Business Users │    │   Super Admins Only  │
       │  Port: 3001     │    │   Port: 3002         │
       └───┬─────────────┘    └────────┬──────────────┘
           │                           │
           │ GraphQL + JWT             │ GraphQL + JWT
           │                           │
           └────────────────┬──────────┘
                            │
               ┌────────────▼────────────┐
               │    NestJS Backend       │
               │   (Port 3000)           │
               │                        │
               ├─ GraphQL Playground    │
               ├─ GqlAuthGuard          │
               ├─ TenantContext         │
               ├─ Services Layer        │
               ├─ Resolvers             │
               ├─ Webhook Handler       │
               └────────────┬───────────┘
                            │
               ┌────────────▼────────────┐
               │   MongoDB Atlas         │
               │  (Single Database)      │
               │                        │
               ├─ tenants               │
               ├─ products              │
               ├─ customers             │
               ├─ orders                │
               └─ invoices              │
               └────────────────────────┘
```

### Multi-Tenancy Data Flow

```
Step 1: User Login (Clerk)
  └─ JWT issued with metadata: { tenant_id, role, email }

Step 2: Electron/NextJS stores JWT

Step 3: GraphQL Query sent with Authorization header
  └─ Authorization: Bearer <JWT>

Step 4: NestJS GqlAuthGuard validates JWT signature

Step 5: Guard extracts tenant_id from JWT metadata

Step 6: GraphQL Context created
  └─ context = { userId, tenantId, role, isSuperAdmin }

Step 7: Resolver receives context

Step 8: Service layer enforces tenant_id filter
  └─ MongoDB: find({ tenant_id: ObjectId(tenantId), ... })

Step 9: Only tenant's data returned

Step 10: Client receives filtered results
```

---

## Tech Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 20 LTS | JavaScript runtime |
| **Framework** | NestJS | 10.x | Application framework |
| **GraphQL** | Apollo Server | 4.x | GraphQL API |
| **GraphQL Integration** | @nestjs/graphql | 12.x | NestJS GraphQL module |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Database** | MongoDB | 6.0+ | NoSQL document store |
| **ODM** | Mongoose | 8.x | MongoDB schema & validation |
| **Auth** | @clerk/backend | Latest | JWT validation, Clerk API |
| **Validation** | class-validator | 0.14.x | DTO validation |
| **Env Config** | @nestjs/config | 3.x | Environment management |
| **Logging** | Winston | 3.x | Structured logging |
| **Testing** | Jest | 29.x | Unit & integration tests |

### Frontend (Electron)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Electron | 27+ | Desktop application |
| **UI** | React | 18.x | Component library |
| **Language** | TypeScript | 5.x | Type safety |
| **GraphQL Client** | Apollo Client | 3.8+ | GraphQL queries/mutations |
| **Code Generation** | graphql-codegen | 4.x | Generate TS types from schema |
| **Styling** | TailwindCSS | 3.x | Utility CSS |
| **i18n** | i18next | 23.x | Multi-language support |
| **Build Tool** | Vite | 5.x | Fast bundler |
| **Auth** | @clerk/clerk-react | Latest | Clerk UI integration |

### Frontend (Admin Dashboard)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js | 14.x | React + SSR |
| **Language** | TypeScript | 5.x | Type safety |
| **Auth** | @clerk/nextjs | Latest | Clerk middleware & UI |
| **GraphQL Client** | Apollo Client | 3.8+ | GraphQL queries |
| **Styling** | TailwindCSS | 3.x | Utility CSS |
| **i18n** | next-i18next | Latest | Server-side translations |
| **Validation** | zod | Latest | Runtime schema validation |

### DevOps & Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containers** | Docker | Containerization |
| **Orchestration** | Docker Compose | Local development |
| **Database Hosting** | MongoDB Atlas | Managed MongoDB |
| **Backend Hosting** | AWS EC2 / DigitalOcean / Render | API server |
| **Admin Frontend** | Vercel | Next.js hosting |
| **Electron Releases** | GitHub Releases | App distribution |
| **CI/CD** | GitHub Actions | Automated testing & deployment |

---

## Domain Models

### 1. Tenant

Represents a business/organization using the ERP system.

```typescript
interface Tenant {
  _id: ObjectId;
  owner_clerk_id: string;           // Clerk user ID (unique)
  name: string;                     // Business name
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  
  branding: {
    logo_url?: string;
    primary_color?: string;         // Hex color
    invoice_footer?: string;        // Custom text
    company_address?: string;
  };
  
  currency_config: {
    base_currency: "USD";           // Always USD
    secondary_currency: "LBP";      // Always LBP
    exchange_rate: number;          // USD to LBP rate
    updated_at: Date;
  };
  
  language: "en" | "ar" | "fr";    // Default UI language
  timezone?: string;                // For reporting
  status: "active" | "inactive" | "suspended";
  
  created_at: Date;
  updated_at: Date;
  created_by: string;               // Clerk user ID
  updated_by?: string;
}
```

**MongoDB Collection**: `tenants`  
**Unique Index**: `{ owner_clerk_id: 1 }`

---

### 2. Product

Represents inventory items/SKUs.

```typescript
interface Product {
  _id: ObjectId;
  tenant_id: ObjectId;              // Multi-tenancy key
  
  sku: string;                      // Unique within tenant
  name: string;
  description?: string;
  barcode?: string;
  category?: string;
  subcategory?: string;
  
  price_usd: number;                // Selling price (always USD)
  cost_usd?: number;                // COGS
  
  quantity_in_stock: number;
  reorder_level?: number;           // Alert threshold
  
  status: "active" | "inactive" | "discontinued";
  
  created_at: Date;
  updated_at: Date;
  created_by: string;               // Clerk user ID
  updated_by?: string;
}
```

**MongoDB Collection**: `products`  
**Indexes**:
- `{ tenant_id: 1, sku: 1 }` (unique)
- `{ tenant_id: 1, name: 1 }`
- `{ tenant_id: 1, category: 1 }`

---

### 3. Customer

Represents buyers/clients.

```typescript
interface Customer {
  _id: ObjectId;
  tenant_id: ObjectId;
  
  name: string;
  email?: string;
  phone?: string;
  
  billing_address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  
  shipping_address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  
  company_name?: string;
  tax_id?: string;
  
  credit_limit?: number;            // In USD
  current_credit_used?: number;
  
  status: "active" | "inactive" | "blocked";
  
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}
```

**MongoDB Collection**: `customers`  
**Indexes**:
- `{ tenant_id: 1, email: 1 }`
- `{ tenant_id: 1, name: 1 }`

---

### 4. Order

Represents sales orders.

```typescript
interface OrderItem {
  product_id: ObjectId;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price_usd: number;           // Price at order time
  subtotal_usd: number;             // qty * unit_price
}

interface Order {
  _id: ObjectId;
  tenant_id: ObjectId;
  
  order_number: string;             // e.g., "ORD-2025-0001" (unique per tenant)
  customer_id: ObjectId;
  
  status: "draft" | "confirmed" | "shipped" | "invoiced" | "cancelled";
  
  items: OrderItem[];
  
  subtotal_usd: number;
  tax_amount_usd: number;           // Always 0 for MVP
  total_usd: number;                // subtotal + tax
  
  currency_used: "USD" | "LBP";
  exchange_rate_used?: number;      // If LBP selected
  total_lbp?: number;               // total_usd * exchange_rate
  
  notes?: string;
  internal_notes?: string;
  
  invoice_id?: ObjectId;            // Link to generated invoice
  invoiced_at?: Date;
  
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
}
```

**MongoDB Collection**: `orders`  
**Indexes**:
- `{ tenant_id: 1, order_number: 1 }` (unique)
- `{ tenant_id: 1, customer_id: 1 }`
- `{ tenant_id: 1, status: 1 }`

---

### 5. Invoice

Represents billable documents generated from orders.

```typescript
interface Invoice {
  _id: ObjectId;
  tenant_id: ObjectId;
  
  invoice_number: string;           // e.g., "INV-2025-0001" (unique per tenant)
  order_id: ObjectId;               // Source order
  customer_id: ObjectId;
  
  issued_date: Date;
  due_date: Date;
  
  items: OrderItem[];               // Copied from order
  
  subtotal_usd: number;
  tax_amount_usd: number;           // Always 0 for MVP
  total_usd: number;
  
  currency_used: "USD" | "LBP";
  exchange_rate_used?: number;
  total_lbp?: number;
  
  status: "draft" | "sent" | "viewed" | "partially_paid" | "paid" | "overdue" | "cancelled";
  
  paid_amount_usd: number;          // Default: 0
  payment_date?: Date;
  remaining_amount_usd: number;     // total_usd - paid_amount_usd
  
  invoice_notes?: string;
  payment_terms?: string;           // e.g., "Net 30"
  
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
  sent_at?: Date;
  viewed_at?: Date;
}
```

**MongoDB Collection**: `invoices`  
**Indexes**:
- `{ tenant_id: 1, invoice_number: 1 }` (unique)
- `{ tenant_id: 1, customer_id: 1 }`
- `{ tenant_id: 1, status: 1 }`

---

## File Structure (NestJS Backend)

```
backend/
├── src/
│   ├── main.ts                     # Entry point
│   ├── app.module.ts               # Root module
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── tenant.decorator.ts
│   │   │   ├── user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── is-super-admin.decorator.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── gql-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── super-admin.guard.ts
│   │   │
│   │   ├── filters/
│   │   │   └── gql-exception.filter.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── tenant-context.interceptor.ts
│   │   │
│   │   └── types/
│   │       └── graphql-context.ts
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── graphql.config.ts
│   │   ├── clerk.config.ts
│   │   └── validation.schema.ts
│   │
│   ├── core/
│   │   ├── services/
│   │   │   ├── clerk.service.ts
│   │   │   ├── currency.service.ts
│   │   │   └── logger.service.ts
│   │   │
│   │   ├── helpers/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   ├── constants.ts
│   │   │   └── errors.ts
│   │   │
│   │   └── scalars/
│   │       ├── date.scalar.ts
│   │       └── object-id.scalar.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.resolver.ts
│   │   │   └── dto/
│   │   │
│   │   ├── tenant/
│   │   │   ├── tenant.module.ts
│   │   │   ├── tenant.service.ts
│   │   │   ├── tenant.resolver.ts
│   │   │   ├── schemas/
│   │   │   │   └── tenant.schema.ts
│   │   │   └── dto/
│   │   │       ├── create-tenant.input.ts
│   │   │       ├── update-tenant.input.ts
│   │   │       └── tenant.type.ts
│   │   │
│   │   ├── product/
│   │   │   ├── product.module.ts
│   │   │   ├── product.service.ts
│   │   │   ├── product.resolver.ts
│   │   │   ├── schemas/
│   │   │   │   └── product.schema.ts
│   │   │   └── dto/
│   │   │       ├── create-product.input.ts
│   │   │       ├── update-product.input.ts
│   │   │       └── product.type.ts
│   │   │
│   │   ├── customer/
│   │   │   ├── customer.module.ts
│   │   │   ├── customer.service.ts
│   │   │   ├── customer.resolver.ts
│   │   │   ├── schemas/
│   │   │   │   └── customer.schema.ts
│   │   │   └── dto/
│   │   │
│   │   ├── order/
│   │   │   ├── order.module.ts
│   │   │   ├── order.service.ts
│   │   │   ├── order.resolver.ts
│   │   │   ├── schemas/
│   │   │   │   ├── order.schema.ts
│   │   │   │   └── order-item.schema.ts
│   │   │   └── dto/
│   │   │
│   │   ├── invoice/
│   │   │   ├── invoice.module.ts
│   │   │   ├── invoice.service.ts
│   │   │   ├── invoice.resolver.ts
│   │   │   ├── schemas/
│   │   │   │   └── invoice.schema.ts
│   │   │   └── dto/
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.module.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── dashboard.resolver.ts
│   │   │   └── dto/
│   │   │
│   │   ├── webhooks/
│   │   │   ├── webhooks.module.ts
│   │   │   ├── clerk.controller.ts
│   │   │   └── services/
│   │   │       └── webhook.service.ts
│   │   │
│   │   └── health/
│   │       ├── health.module.ts
│   │       └── health.controller.ts
│   │
│   ├── database/
│   │   ├── seeds/
│   │   │   ├── seed.module.ts
│   │   │   └── seed.service.ts
│   │   └── indexes.ts
│   │
│   ├── graphql/
│   │   └── schema.gql
│   │
│   └── types/
│       ├── environment.ts
│       └── index.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── fixtures/
│
├── .env.example
├── .env.development
├── .env.production
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── nest-cli.json
├── tsconfig.json
├── package.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
└── README.md
```

---

## Multi-Tenancy Strategy

### Isolation Levels

1. **Database Level**: Single MongoDB database for all tenants
2. **Document Level**: Every document includes `tenant_id` field
3. **Query Level**: All queries filtered by `tenant_id`
4. **API Level**: Tenant extracted from JWT metadata
5. **Application Level**: Guards enforce tenant context

### Tenant Identification Flow

```
User logs in via Clerk
  ↓
Clerk issues JWT with public_metadata: { tenant_id, role }
  ↓
Frontend stores JWT securely
  ↓
Frontend sends GraphQL query with JWT header
  ↓
GqlAuthGuard validates JWT signature
  ↓
Guard extracts tenant_id from JWT.public_metadata
  ↓
Tenant ID added to GraphQL context
  ↓
Service layer uses context.tenantId for all queries
  ↓
MongoDB returns only tenant-scoped data
```

### Implementation in Services

```typescript
// Every service method MUST enforce tenant isolation

async findAll(tenantId: string): Promise<Product[]> {
  // Tenant ID is ALWAYS included in query
  return this.productModel.find({
    tenant_id: new Types.ObjectId(tenantId),
  });
}

async create(input: CreateProductInput, tenantId: string): Promise<Product> {
  // Tenant ID is ALWAYS set on creation
  return this.productModel.create({
    ...input,
    tenant_id: new Types.ObjectId(tenantId),
  });
}

async update(id: string, input: any, tenantId: string): Promise<Product> {
  // Tenant ID is ALWAYS checked for ownership
  const product = await this.productModel.findOne({
    _id: new Types.ObjectId(id),
    tenant_id: new Types.ObjectId(tenantId),
  });
  
  if (!product) throw new NotFoundException();
  return product.save();
}
```

---

## Authentication & Authorization

### Clerk JWT Structure

```json
{
  "sub": "user_123",
  "email": "owner@business.com",
  "email_verified": true,
  "name": "Business Owner",
  "picture": "https://...",
  "public_metadata": {
    "tenant_id": "650f7c2a1b2d3e4f5a6b7c8d",
    "role": "admin"
  },
  "iat": 1700000000,
  "exp": 1700003600
}
```

### Role-Based Access Control

**Roles**:
- `admin`: Full access to their tenant's data
- `user`: Limited access to their tenant's data (view orders, products)
- `super_admin`: Access to all tenants (admin dashboard only)

### Guard Implementation

```typescript
// src/common/guards/gql-auth.guard.ts

@Injectable()
export class GqlAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      req.user = {
        userId: decoded.sub,
        email: decoded.email,
        metadata: decoded.public_metadata,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

---

## GraphQL API Specification

### Core Queries & Mutations

```graphql
# Tenant Queries
query GetTenant($id: ObjectID!) {
  tenant(id: $id) {
    id
    name
    branding { logoUrl primaryColor }
    currencyConfig { exchangeRate }
  }
}

# Product Queries
query GetProducts {
  products {
    id sku name priceUsd quantityInStock
  }
}

query GetProduct($id: ObjectID!) {
  product(id: $id) {
    id sku name priceUsd category status
  }
}

# Product Mutations
mutation CreateProduct($input: CreateProductInput!) {
  createProduct(input: $input) {
    id sku name priceUsd
  }
}

mutation UpdateProduct($id: ObjectID!, $input: UpdateProductInput!) {
  updateProduct(id: $id, input: $input) {
    id sku name priceUsd
  }
}

# Customer Queries
query GetCustomers {
  customers {
    id name email phone status
  }
}

# Order Queries
query GetOrders {
  orders {
    id orderNumber customer { name } total status
  }
}

# Invoice Queries
query GetInvoices {
  invoices {
    id invoiceNumber customer { name } totalUsd status paidAmountUsd
  }
}

# Dashboard
query GetDashboardStats {
  dashboardStats {
    totalRevenue totalOrders totalCustomers
    topProducts { productName salesCount revenue }
  }
}
```

---

## Environment Variables

```bash
# .env.example

# Application
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/erp_db

# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# GraphQL
GRAPHQL_DEBUG=true
GRAPHQL_INTROSPECTION=true

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Currency
DEFAULT_EXCHANGE_RATE=88000

# Frontend URLs
FRONTEND_URL=http://localhost:3001
ADMIN_DASHBOARD_URL=http://localhost:3002
```

---

## Docker Setup

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### docker-compose.dev.yml

```yaml
version: '3.9'

services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: erp_dev
    volumes:
      - mongo-data:/data/db

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://mongodb:27017/erp_dev
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
    depends_on:
      - mongodb
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  mongo-data:
```

---

## Development Roadmap

### Phase 1 (MVP) - Weeks 1-4
- ✅ NestJS backend setup
- ✅ GraphQL schema & resolvers
- ✅ MongoDB schemas
- ✅ Clerk integration
- ✅ Multi-tenancy layer
- ✅ Product CRUD
- ✅ Customer CRUD
- ✅ Order creation & management
- ✅ Invoice generation
- ✅ Payment tracking
- ✅ Basic dashboard

### Phase 2 (Polish) - Weeks 5-6
- Dashboard enhancements
- Batch operations
- Search & filtering
- Error handling improvements
- Integration tests
- Performance optimization

### Phase 3 (Deployment) - Week 7
- Docker containerization
- CI/CD pipeline (GitHub Actions)
- Production deployment
- Monitoring & logging
- Security audit

### Phase 4 (Frontend) - After Backend
- Electron app UI
- Next.js admin dashboard
- Multi-language implementation
- State management
- Testing

### Phase 2+ (Future Enhancements)
- Advanced reporting
- Supplier management
- Purchase orders
- Accounting GL
- Tax calculations
- Multi-warehouse support
- Mobile app
- Analytics & BI
