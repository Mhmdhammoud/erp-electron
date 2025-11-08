# NestJS Backend Specification - Multi-Tenant Retail ERP

**Status**: Pre-Development  
**Version**: 1.0.0  
**Framework**: NestJS 10.x with GraphQL & Mongoose  
**Last Updated**: November 2025

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [Architecture Overview](#architecture-overview)
3. [File Structure](#file-structure)
4. [Module Organization](#module-organization)
5. [GraphQL Schema](#graphql-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
8. [Mongoose Integration](#mongoose-integration)
9. [Service Layer](#service-layer)
10. [Resolvers](#resolvers)
11. [Guards & Decorators](#guards--decorators)
12. [Database Connection](#database-connection)
13. [Error Handling](#error-handling)
14. [Webhooks (Clerk)](#webhooks-clerk)
15. [Environment Variables](#environment-variables)
16. [Docker Setup](#docker-setup)
17. [Development Workflow](#development-workflow)

---

## Project Setup

### Installation

```bash
# Create new NestJS project
npm i -g @nestjs/cli
nest new backend --package-manager npm

# Navigate to project
cd backend

# Install required packages
npm install \
  @nestjs/graphql \
  @nestjs/mongoose \
  @apollo/server \
  graphql \
  mongoose \
  @clerk/backend \
  jsonwebtoken \
  class-validator \
  class-transformer \
  @nestjs/config \
  dotenv \
  winston \
  zod

# Install dev dependencies
npm install --save-dev \
  @types/node \
  @types/express \
  @types/jsonwebtoken \
  ts-loader \
  typescript \
  @nestjs/testing \
  jest \
  @types/jest \
  ts-jest \
  eslint \
  prettier
```

---

## Architecture Overview

### Multi-Tenancy Pattern

```
User (Clerk) → JWT Token (with tenant_id in metadata)
    ↓
GraphQL Query + JWT
    ↓
NestJS Guard (JWT validation, tenant extraction)
    ↓
GraphQL Context { userId, tenantId, role, isSuperAdmin }
    ↓
Resolver uses context to enforce data isolation
    ↓
Service layer adds tenant_id filter to all queries
    ↓
MongoDB returns only tenant-scoped data
```

### Core Principles

1. **Tenant Isolation**: Every query filters by `tenant_id` in context
2. **JWT-based Auth**: Clerk tokens contain tenant metadata
3. **Schema-driven**: Code generation from GraphQL schema
4. **Service Layer**: Business logic separate from resolvers
5. **Guards & Interceptors**: Cross-cutting concerns (logging, auth)
6. **Type Safety**: Full TypeScript with Mongoose schemas

---

## File Structure (NestJS)

```
backend/
├── src/
│   ├── main.ts                         # Application entry point
│   ├── app.module.ts                   # Root module
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── tenant.decorator.ts     # Extract tenant ID from context
│   │   │   ├── user.decorator.ts       # Extract user from context
│   │   │   ├── roles.decorator.ts      # Role-based access control
│   │   │   └── is-super-admin.decorator.ts
│   │   │
│   │   ├── guards/
│   │   │   ├── gql-auth.guard.ts       # GraphQL JWT authentication
│   │   │   ├── roles.guard.ts          # Role-based authorization
│   │   │   └── super-admin.guard.ts    # Super admin only
│   │   │
│   │   ├── filters/
│   │   │   └── gql-exception.filter.ts # GraphQL error handling
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts  # Request/response logging
│   │   │   └── tenant-context.interceptor.ts
│   │   │
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts      # DTO validation
│   │   │
│   │   └── types/
│   │       ├── graphql-context.ts      # GQL context interface
│   │       └── index.ts
│   │
│   ├── config/
│   │   ├── database.config.ts          # MongoDB connection setup
│   │   ├── graphql.config.ts           # Apollo Server config
│   │   ├── clerk.config.ts             # Clerk initialization
│   │   └── validation.schema.ts        # Environment validation (Zod)
│   │
│   ├── core/
│   │   ├── services/
│   │   │   ├── clerk.service.ts        # Clerk API client wrapper
│   │   │   ├── currency.service.ts     # USD/LBP conversion logic
│   │   │   └── logger.service.ts       # Winston logging
│   │   │
│   │   ├── helpers/
│   │   │   ├── formatters.ts           # Number, date, currency formatting
│   │   │   ├── validators.ts           # Validation helpers (Zod)
│   │   │   ├── constants.ts            # App constants (roles, statuses)
│   │   │   └── errors.ts               # Custom error classes
│   │   │
│   │   └── scalars/
│   │       ├── date.scalar.ts          # DateTime scalar
│   │       └── object-id.scalar.ts     # MongoDB ObjectID scalar
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts         # JWT validation, token parsing
│   │   │   ├── auth.resolver.ts        # Login/logout
│   │   │   ├── dto/
│   │   │   │   └── login.input.ts
│   │   │   └── types/
│   │   │       └── auth-payload.type.ts
│   │   │
│   │   ├── tenant/
│   │   │   ├── tenant.module.ts
│   │   │   ├── tenant.service.ts       # CRUD, setup, exchange rates
│   │   │   ├── tenant.resolver.ts      # GraphQL queries/mutations
│   │   │   ├── schemas/
│   │   │   │   └── tenant.schema.ts    # Mongoose schema + interface
│   │   │   ├── dto/
│   │   │   │   ├── create-tenant.input.ts
│   │   │   │   ├── update-tenant.input.ts
│   │   │   │   └── tenant.type.ts
│   │   │   └── tests/
│   │   │       ├── tenant.service.spec.ts
│   │   │       └── tenant.resolver.spec.ts
│   │   │
│   │   ├── product/
│   │   │   ├── product.module.ts
│   │   │   ├── product.service.ts      # CRUD, inventory tracking
│   │   │   ├── product.resolver.ts
│   │   │   ├── schemas/
│   │   │   │   └── product.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-product.input.ts
│   │   │   │   ├── update-product.input.ts
│   │   │   │   ├── product-filter.input.ts
│   │   │   │   └── product.type.ts
│   │   │   └── tests/
│   │   │       └── product.service.spec.ts
│   │   │
│   │   ├── customer/
│   │   │   ├── customer.module.ts
│   │   │   ├── customer.service.ts
│   │   │   ├── customer.resolver.ts
│   │   │   ├── schemas/
│   │   │   │   └── customer.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-customer.input.ts
│   │   │   │   ├── update-customer.input.ts
│   │   │   │   └── customer.type.ts
│   │   │   └── tests/
│   │   │       └── customer.service.spec.ts
│   │   │
│   │   ├── order/
│   │   │   ├── order.module.ts
│   │   │   ├── order.service.ts        # Order lifecycle, status transitions
│   │   │   ├── order.resolver.ts
│   │   │   ├── schemas/
│   │   │   │   ├── order.schema.ts
│   │   │   │   └── order-item.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-order.input.ts
│   │   │   │   ├── update-order-status.input.ts
│   │   │   │   ├── order-item.input.ts
│   │   │   │   └── order.type.ts
│   │   │   └── tests/
│   │   │       └── order.service.spec.ts
│   │   │
│   │   ├── invoice/
│   │   │   ├── invoice.module.ts
│   │   │   ├── invoice.service.ts      # Invoice generation, payment tracking
│   │   │   ├── invoice.resolver.ts
│   │   │   ├── schemas/
│   │   │   │   └── invoice.schema.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-invoice.input.ts
│   │   │   │   ├── record-payment.input.ts
│   │   │   │   ├── invoice-filter.input.ts
│   │   │   │   └── invoice.type.ts
│   │   │   └── tests/
│   │   │       └── invoice.service.spec.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.module.ts
│   │   │   ├── dashboard.service.ts    # Aggregations, KPIs
│   │   │   ├── dashboard.resolver.ts
│   │   │   ├── dto/
│   │   │   │   └── dashboard.type.ts
│   │   │   └── tests/
│   │   │       └── dashboard.service.spec.ts
│   │   │
│   │   ├── webhooks/
│   │   │   ├── webhooks.module.ts
│   │   │   ├── clerk.controller.ts     # Clerk user events webhook
│   │   │   └── services/
│   │   │       └── webhook.service.ts  # Webhook business logic
│   │   │
│   │   └── health/
│   │       ├── health.module.ts
│   │       └── health.controller.ts    # Health check, dependency status
│   │
│   ├── database/
│   │   ├── seeds/
│   │   │   ├── seed.module.ts
│   │   │   └── seed.service.ts         # Development seed data
│   │   └── indexes.ts                  # MongoDB indexes
│   │
│   ├── graphql/
│   │   └── schema.gql                  # Generated GraphQL schema
│   │
│   └── types/
│       ├── environment.ts              # Environment type definitions
│       └── index.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── fixtures/
│
├── dist/                               # Compiled output
├── node_modules/
│
├── .env.example
├── .env.development
├── .env.production
│
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
│
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
│
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
│
└── README.md
```

---

## Module Organization (NestJS)

### App Module (Root)

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { graphqlConfig } from './config/graphql.config';
import { mongooseConfig } from './config/database.config';
import { validationSchema } from './config/validation.schema';

// Modules
import { TenantModule } from './modules/tenant/tenant.module';
import { ProductModule } from './modules/product/product.module';
import { CustomerModule } from './modules/customer/customer.module';
import { OrderModule } from './modules/order/order.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { HealthModule } from './modules/health/health.module';

// Core
import { LoggerModule } from './core/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      ...graphqlConfig,
    }),
    MongooseModule.forRoot(mongooseConfig.uri, mongooseConfig.options),
    
    // Feature modules
    AuthModule,
    TenantModule,
    ProductModule,
    CustomerModule,
    OrderModule,
    InvoiceModule,
    DashboardModule,
    WebhooksModule,
    HealthModule,
    
    // Core modules
    LoggerModule,
  ],
})
export class AppModule {}
```

### Tenant Module Example

```typescript
// src/modules/tenant/tenant.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantService } from './tenant.service';
import { TenantResolver } from './tenant.resolver';
import { TenantSchema } from './schemas/tenant.schema';
import { ClerkService } from '../../core/services/clerk.service';
import { CurrencyService } from '../../core/services/currency.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Tenant', schema: TenantSchema },
    ]),
  ],
  providers: [
    TenantService,
    TenantResolver,
    ClerkService,
    CurrencyService,
  ],
  exports: [TenantService],
})
export class TenantModule {}
```

---

## GraphQL Schema

### Schema Structure

```graphql
# src/graphql/schema.gql

scalar DateTime
scalar ObjectID

# ============================================================================
# AUTH
# ============================================================================

type AuthPayload {
  id: ID!
  email: String!
  firstName: String
  lastName: String
  role: UserRole!
  tenantId: ObjectID
  token: String!
}

enum UserRole {
  ADMIN
  USER
  SUPER_ADMIN
}

type Query {
  me: AuthPayload
}

type Mutation {
  login(email: String!, password: String!): AuthPayload!
}

# ============================================================================
# TENANT
# ============================================================================

type Tenant {
  id: ObjectID!
  name: String!
  description: String
  email: String
  phone: String
  website: String
  branding: TenantBranding!
  currencyConfig: CurrencyConfig!
  language: Language!
  timezone: String
  status: TenantStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type TenantBranding {
  logoUrl: String
  primaryColor: String
  invoiceFooter: String
  companyAddress: String
}

type CurrencyConfig {
  baseCurrency: String!        # Always "USD"
  secondaryCurrency: String!   # Always "LBP"
  exchangeRate: Float!
  updatedAt: DateTime!
}

enum Language {
  EN
  AR
  FR
}

enum TenantStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

input CreateTenantInput {
  name: String!
  description: String
  email: String
  phone: String
  website: String
  language: Language = EN
}

input UpdateTenantInput {
  name: String
  description: String
  email: String
  phone: String
  website: String
  language: Language
  branding: TenantBrandingInput
  currencyConfig: CurrencyConfigInput
}

input TenantBrandingInput {
  logoUrl: String
  primaryColor: String
  invoiceFooter: String
  companyAddress: String
}

input CurrencyConfigInput {
  exchangeRate: Float!
}

type TenantQuery {
  tenant(id: ObjectID!): Tenant
  tenants: [Tenant!]!
}

type TenantMutation {
  createTenant(input: CreateTenantInput!): Tenant!
  updateTenant(id: ObjectID!, input: UpdateTenantInput!): Tenant!
  deleteTenant(id: ObjectID!): Boolean!
  updateExchangeRate(rate: Float!): CurrencyConfig!
}

extend type Query {
  tenant(id: ObjectID!): Tenant
  tenants: [Tenant!]!
}

extend type Mutation {
  createTenant(input: CreateTenantInput!): Tenant!
  updateTenant(id: ObjectID!, input: UpdateTenantInput!): Tenant!
  deleteTenant(id: ObjectID!): Boolean!
  updateExchangeRate(rate: Float!): CurrencyConfig!
}

# ============================================================================
# PRODUCT
# ============================================================================

type Product {
  id: ObjectID!
  sku: String!
  name: String!
  description: String
  barcode: String
  category: String
  subcategory: String
  priceUsd: Float!
  costUsd: Float
  quantityInStock: Int!
  reorderLevel: Int
  status: ProductStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum ProductStatus {
  ACTIVE
  INACTIVE
  DISCONTINUED
}

input CreateProductInput {
  sku: String!
  name: String!
  description: String
  barcode: String
  category: String
  subcategory: String
  priceUsd: Float!
  costUsd: Float
  quantityInStock: Int!
  reorderLevel: Int
}

input UpdateProductInput {
  sku: String
  name: String
  description: String
  barcode: String
  category: String
  subcategory: String
  priceUsd: Float
  costUsd: Float
  quantityInStock: Int
  reorderLevel: Int
  status: ProductStatus
}

input ProductFilterInput {
  category: String
  status: ProductStatus
  search: String
}

type ProductConnection {
  edges: [ProductEdge!]!
  pageInfo: PageInfo!
}

type ProductEdge {
  node: Product!
  cursor: String!
}

extend type Query {
  product(id: ObjectID!): Product
  products(
    filter: ProductFilterInput
    first: Int = 20
    after: String
  ): ProductConnection!
}

extend type Mutation {
  createProduct(input: CreateProductInput!): Product!
  updateProduct(id: ObjectID!, input: UpdateProductInput!): Product!
  deleteProduct(id: ObjectID!): Boolean!
}

# ============================================================================
# CUSTOMER
# ============================================================================

type Customer {
  id: ObjectID!
  name: String!
  email: String
  phone: String
  billingAddress: Address
  shippingAddress: Address
  companyName: String
  taxId: String
  creditLimit: Float
  currentCreditUsed: Float
  status: CustomerStatus!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Address {
  street: String
  city: String
  state: String
  postalCode: String
  country: String
}

enum CustomerStatus {
  ACTIVE
  INACTIVE
  BLOCKED
}

input CreateCustomerInput {
  name: String!
  email: String
  phone: String
  billingAddress: AddressInput
  shippingAddress: AddressInput
  companyName: String
  taxId: String
  creditLimit: Float
}

input UpdateCustomerInput {
  name: String
  email: String
  phone: String
  billingAddress: AddressInput
  shippingAddress: AddressInput
  companyName: String
  taxId: String
  creditLimit: Float
  status: CustomerStatus
}

input AddressInput {
  street: String
  city: String
  state: String
  postalCode: String
  country: String
}

extend type Query {
  customer(id: ObjectID!): Customer
  customers(first: Int = 20, after: String): [Customer!]!
}

extend type Mutation {
  createCustomer(input: CreateCustomerInput!): Customer!
  updateCustomer(id: ObjectID!, input: UpdateCustomerInput!): Customer!
  deleteCustomer(id: ObjectID!): Boolean!
}

# ============================================================================
# ORDER
# ============================================================================

type OrderItem {
  productId: ObjectID!
  productSku: String!
  productName: String!
  quantity: Int!
  unitPriceUsd: Float!
  subtotalUsd: Float!
}

type Order {
  id: ObjectID!
  orderNumber: String!
  customerId: ObjectID!
  customer: Customer
  status: OrderStatus!
  items: [OrderItem!]!
  subtotalUsd: Float!
  taxAmountUsd: Float!
  totalUsd: Float!
  currencyUsed: Currency!
  exchangeRateUsed: Float
  totalLbp: Float
  notes: String
  internalNotes: String
  invoiceId: ObjectID
  invoicedAt: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum OrderStatus {
  DRAFT
  CONFIRMED
  SHIPPED
  INVOICED
  CANCELLED
}

enum Currency {
  USD
  LBP
}

input OrderItemInput {
  productId: ObjectID!
  quantity: Int!
  unitPriceUsd: Float!
}

input CreateOrderInput {
  customerId: ObjectID!
  items: [OrderItemInput!]!
  currencyUsed: Currency! = USD
  exchangeRateUsed: Float
  notes: String
}

input UpdateOrderStatusInput {
  status: OrderStatus!
}

extend type Query {
  order(id: ObjectID!): Order
  orders(status: OrderStatus, first: Int = 20): [Order!]!
}

extend type Mutation {
  createOrder(input: CreateOrderInput!): Order!
  updateOrderStatus(id: ObjectID!, input: UpdateOrderStatusInput!): Order!
  cancelOrder(id: ObjectID!): Boolean!
}

# ============================================================================
# INVOICE
# ============================================================================

type Invoice {
  id: ObjectID!
  invoiceNumber: String!
  orderId: ObjectID!
  customerId: ObjectID!
  customer: Customer
  issuedDate: DateTime!
  dueDate: DateTime!
  items: [OrderItem!]!
  subtotalUsd: Float!
  taxAmountUsd: Float!
  totalUsd: Float!
  currencyUsed: Currency!
  exchangeRateUsed: Float
  totalLbp: Float
  status: InvoiceStatus!
  paidAmountUsd: Float!
  paymentDate: DateTime
  remainingAmountUsd: Float!
  invoiceNotes: String
  paymentTerms: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum InvoiceStatus {
  DRAFT
  SENT
  VIEWED
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
}

input CreateInvoiceInput {
  orderId: ObjectID!
  issuedDate: DateTime
  dueDate: DateTime
  invoiceNotes: String
  paymentTerms: String
}

input RecordPaymentInput {
  paidAmount: Float!
  paymentDate: DateTime
}

input InvoiceFilterInput {
  status: InvoiceStatus
  customerId: ObjectID
}

extend type Query {
  invoice(id: ObjectID!): Invoice
  invoices(filter: InvoiceFilterInput, first: Int = 20): [Invoice!]!
}

extend type Mutation {
  createInvoice(input: CreateInvoiceInput!): Invoice!
  recordPayment(id: ObjectID!, input: RecordPaymentInput!): Invoice!
  cancelInvoice(id: ObjectID!): Boolean!
}

# ============================================================================
# DASHBOARD
# ============================================================================

type DashboardStats {
  totalRevenue: Float!
  totalOrders: Int!
  totalCustomers: Int!
  totalProducts: Int!
  pendingInvoices: Int!
  outstandingAmount: Float!
  topProducts: [ProductStat!]!
  topCustomers: [CustomerStat!]!
}

type ProductStat {
  productId: ObjectID!
  productName: String!
  salesCount: Int!
  revenue: Float!
}

type CustomerStat {
  customerId: ObjectID!
  customerName: String!
  orderCount: Int!
  totalSpent: Float!
}

extend type Query {
  dashboardStats: DashboardStats!
}

# ============================================================================
# PAGINATION
# ============================================================================

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

---

## Authentication & Authorization

### JWT Guard with Clerk

```typescript
// src/common/guards/gql-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { verifyToken } from '@clerk/backend';

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

      // Attach to request
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

### Custom Tenant Decorator

```typescript
// src/common/decorators/tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(ctx);
    const { req } = gqlContext.getContext();
    return req.user?.metadata?.tenant_id;
  },
);
```

### Roles Guard

```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();
    const userRole = req.user?.metadata?.role;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `This action requires one of: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
```

---

## Multi-Tenancy Implementation

### Tenant Context Extraction

```typescript
// src/config/graphql.config.ts
import { ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLError } from 'graphql';

export const graphqlConfig: ApolloDriverConfig = {
  autoSchemaFile: 'src/graphql/schema.gql',
  context: ({ req }) => {
    const user = req.user;

    if (!user) {
      throw new GraphQLError('Unauthorized');
    }

    return {
      userId: user.userId,
      email: user.email,
      tenantId: user.metadata?.tenant_id,
      role: user.metadata?.role || 'user',
      isSuperAdmin: user.metadata?.role === 'super_admin',
    };
  },
  formatError: (error) => {
    return {
      message: error.message,
      code: error.extensions?.code,
      path: error.path,
    };
  },
};
```

### Tenant-Aware Service

```typescript
// src/modules/product/product.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductInput } from './dto/create-product.input';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel('Product') private productModel: Model<Product>,
  ) {}

  /**
   * Get all products for a tenant
   */
  async findAll(tenantId: string): Promise<Product[]> {
    return this.productModel.find({
      tenant_id: new Types.ObjectId(tenantId),
    });
  }

  /**
   * Get product by ID (must belong to tenant)
   */
  async findById(id: string, tenantId: string): Promise<Product> {
    const product = await this.productModel.findOne({
      _id: new Types.ObjectId(id),
      tenant_id: new Types.ObjectId(tenantId),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Create product for tenant
   */
  async create(
    input: CreateProductInput,
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    const newProduct = new this.productModel({
      ...input,
      tenant_id: new Types.ObjectId(tenantId),
      created_by: userId,
    });

    return newProduct.save();
  }

  /**
   * Update product (verify ownership)
   */
  async update(
    id: string,
    input: any,
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    const product = await this.findById(id, tenantId);

    Object.assign(product, input);
    product.updated_by = userId;
    product.updated_at = new Date();

    return product.save();
  }

  /**
   * Delete product (verify ownership)
   */
  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.productModel.deleteOne({
      _id: new Types.ObjectId(id),
      tenant_id: new Types.ObjectId(tenantId),
    });

    return result.deletedCount > 0;
  }
}
```

### GraphQL Resolver with Tenant Context

```typescript
// src/modules/product/product.resolver.ts
import { Resolver, Query, Mutation, Args, UseGuards } from '@nestjs/graphql';
import { ProductService } from './product.service';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { User } from '../../common/decorators/user.decorator';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { ProductType } from './dto/product.type';
import { CreateProductInput } from './dto/create-product.input';

@Resolver('Product')
export class ProductResolver {
  constructor(private productService: ProductService) {}

  @Query(() => [ProductType])
  @UseGuards(GqlAuthGuard)
  async products(@Tenant() tenantId: string) {
    return this.productService.findAll(tenantId);
  }

  @Query(() => ProductType)
  @UseGuards(GqlAuthGuard)
  async product(
    @Args('id') id: string,
    @Tenant() tenantId: string,
  ) {
    return this.productService.findById(id, tenantId);
  }

  @Mutation(() => ProductType)
  @UseGuards(GqlAuthGuard)
  async createProduct(
    @Args('input') input: CreateProductInput,
    @Tenant() tenantId: string,
    @User() userId: string,
  ) {
    return this.productService.create(input, tenantId, userId);
  }
}
```

---

## Mongoose Integration

### Product Schema Example

```typescript
// src/modules/product/schemas/product.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
@Schema({ collection: 'products', timestamps: true })
export class Product extends Document {
  @Field(() => String)
  _id: Types.ObjectId;

  @Prop({ required: true, index: true })
  @Field()
  tenant_id: Types.ObjectId;

  @Prop({ required: true, index: true })
  @Field()
  sku: string;

  @Prop({ required: true })
  @Field()
  name: string;

  @Prop()
  @Field({ nullable: true })
  description?: string;

  @Prop()
  @Field({ nullable: true })
  barcode?: string;

  @Prop()
  @Field({ nullable: true })
  category?: string;

  @Prop()
  @Field({ nullable: true })
  subcategory?: string;

  @Prop({ required: true })
  @Field()
  price_usd: number;

  @Prop()
  @Field({ nullable: true })
  cost_usd?: number;

  @Prop({ required: true, default: 0 })
  @Field()
  quantity_in_stock: number;

  @Prop()
  @Field({ nullable: true })
  reorder_level?: number;

  @Prop({ default: 'active' })
  @Field()
  status: 'active' | 'inactive' | 'discontinued';

  @Prop()
  @Field()
  created_by: string;

  @Prop()
  @Field({ nullable: true })
  updated_by?: string;

  @Prop()
  @Field()
  created_at: Date;

  @Prop()
  @Field()
  updated_at: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes for performance
ProductSchema.index({ tenant_id: 1, sku: 1 }, { unique: true });
ProductSchema.index({ tenant_id: 1, name: 1 });
ProductSchema.index({ tenant_id: 1, category: 1 });
ProductSchema.index({ tenant_id: 1, status: 1 });
```

### Tenant Schema

```typescript
// src/modules/tenant/schemas/tenant.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
@Schema({ collection: 'tenants', timestamps: true })
export class Tenant extends Document {
  @Field(() => String)
  _id: Types.ObjectId;

  @Prop({ required: true })
  @Field()
  owner_clerk_id: string;

  @Prop({ required: true })
  @Field()
  name: string;

  @Prop()
  @Field({ nullable: true })
  description?: string;

  @Prop()
  @Field({ nullable: true })
  email?: string;

  @Prop()
  @Field({ nullable: true })
  phone?: string;

  @Prop()
  @Field({ nullable: true })
  website?: string;

  @Prop({
    type: {
      logo_url: String,
      primary_color: String,
      invoice_footer: String,
      company_address: String,
    },
    default: {},
  })
  @Field(() => Object)
  branding: {
    logo_url?: string;
    primary_color?: string;
    invoice_footer?: string;
    company_address?: string;
  };

  @Prop({
    type: {
      base_currency: { type: String, default: 'USD' },
      secondary_currency: { type: String, default: 'LBP' },
      exchange_rate: { type: Number, required: true },
      updated_at: { type: Date, default: Date.now },
    },
    required: true,
  })
  @Field(() => Object)
  currency_config: {
    base_currency: string;
    secondary_currency: string;
    exchange_rate: number;
    updated_at: Date;
  };

  @Prop({ default: 'en' })
  @Field()
  language: 'en' | 'ar' | 'fr';

  @Prop()
  @Field({ nullable: true })
  timezone?: string;

  @Prop({ default: 'active' })
  @Field()
  status: 'active' | 'inactive' | 'suspended';

  @Prop()
  @Field()
  created_by: string;

  @Prop()
  @Field({ nullable: true })
  updated_by?: string;

  @Prop()
  @Field()
  created_at: Date;

  @Prop()
  @Field()
  updated_at: Date;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
TenantSchema.index({ owner_clerk_id: 1 }, { unique: true });
```

---

## Service Layer

### Product Service (Complete)

```typescript
// src/modules/product/product.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel('Product') private productModel: Model<Product>,
  ) {}

  async findAll(
    tenantId: string,
    filter?: { category?: string; status?: string; search?: string },
  ): Promise<Product[]> {
    const query: any = {
      tenant_id: new Types.ObjectId(tenantId),
    };

    if (filter?.category) {
      query.category = filter.category;
    }

    if (filter?.status) {
      query.status = filter.status;
    }

    if (filter?.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { sku: { $regex: filter.search, $options: 'i' } },
      ];
    }

    return this.productModel.find(query).sort({ created_at: -1 });
  }

  async findById(id: string, tenantId: string): Promise<Product> {
    this.validateObjectId(id);

    const product = await this.productModel.findOne({
      _id: new Types.ObjectId(id),
      tenant_id: new Types.ObjectId(tenantId),
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findBySku(sku: string, tenantId: string): Promise<Product> {
    const product = await this.productModel.findOne({
      sku,
      tenant_id: new Types.ObjectId(tenantId),
    });

    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }

    return product;
  }

  async create(
    input: CreateProductInput,
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    // Check if SKU already exists
    const existingProduct = await this.productModel.findOne({
      sku: input.sku,
      tenant_id: new Types.ObjectId(tenantId),
    });

    if (existingProduct) {
      throw new BadRequestException(
        `Product with SKU ${input.sku} already exists`,
      );
    }

    const product = new this.productModel({
      ...input,
      tenant_id: new Types.ObjectId(tenantId),
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return product.save();
  }

  async update(
    id: string,
    input: UpdateProductInput,
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    this.validateObjectId(id);

    // If SKU is being updated, check uniqueness
    if (input.sku) {
      const existingProduct = await this.productModel.findOne({
        sku: input.sku,
        _id: { $ne: new Types.ObjectId(id) },
        tenant_id: new Types.ObjectId(tenantId),
      });

      if (existingProduct) {
        throw new BadRequestException(
          `Product with SKU ${input.sku} already exists`,
        );
      }
    }

    const product = await this.findById(id, tenantId);

    Object.assign(product, input);
    product.updated_by = userId;
    product.updated_at = new Date();

    return product.save();
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    this.validateObjectId(id);

    const result = await this.productModel.deleteOne({
      _id: new Types.ObjectId(id),
      tenant_id: new Types.ObjectId(tenantId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return true;
  }

  async updateInventory(
    id: string,
    quantity: number,
    tenantId: string,
  ): Promise<Product> {
    const product = await this.findById(id, tenantId);

    if (product.quantity_in_stock + quantity < 0) {
      throw new BadRequestException('Insufficient inventory');
    }

    product.quantity_in_stock += quantity;
    product.updated_at = new Date();

    return product.save();
  }

  private validateObjectId(id: string): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
  }
}
```

---

## Resolvers

### Product Resolver (Complete)

```typescript
// src/modules/product/product.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  UseGuards,
  Context,
} from '@nestjs/graphql';
import { ProductService } from './product.service';
import { Tenant } from '../../common/decorators/tenant.decorator';
import { User } from '../../common/decorators/user.decorator';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { ProductType } from './dto/product.type';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductFilterInput } from './dto/product-filter.input';

@Resolver('Product')
export class ProductResolver {
  constructor(private productService: ProductService) {}

  @Query(() => [ProductType], {
    description: 'Get all products for a tenant',
  })
  @UseGuards(GqlAuthGuard)
  async products(
    @Args('filter', { nullable: true }) filter: ProductFilterInput,
    @Tenant() tenantId: string,
  ): Promise<ProductType[]> {
    return this.productService.findAll(tenantId, filter);
  }

  @Query(() => ProductType, {
    description: 'Get product by ID',
  })
  @UseGuards(GqlAuthGuard)
  async product(
    @Args('id') id: string,
    @Tenant() tenantId: string,
  ): Promise<ProductType> {
    return this.productService.findById(id, tenantId);
  }

  @Mutation(() => ProductType, {
    description: 'Create new product',
  })
  @UseGuards(GqlAuthGuard)
  async createProduct(
    @Args('input') input: CreateProductInput,
    @Tenant() tenantId: string,
    @User() userId: string,
  ): Promise<ProductType> {
    return this.productService.create(input, tenantId, userId);
  }

  @Mutation(() => ProductType, {
    description: 'Update existing product',
  })
  @UseGuards(GqlAuthGuard)
  async updateProduct(
    @Args('id') id: string,
    @Args('input') input: UpdateProductInput,
    @Tenant() tenantId: string,
    @User() userId: string,
  ): Promise<ProductType> {
    return this.productService.update(id, input, tenantId, userId);
  }

  @Mutation(() => Boolean, {
    description: 'Delete product',
  })
  @UseGuards(GqlAuthGuard)
  async deleteProduct(
    @Args('id') id: string,
    @Tenant() tenantId: string,
  ): Promise<boolean> {
    return this.productService.delete(id, tenantId);
  }
}
```

---

## Guards & Decorators

### User Decorator

```typescript
// src/common/decorators/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const gqlContext = GqlExecutionContext.create(ctx);
    const { req } = gqlContext.getContext();
    return req.user?.userId;
  },
);
```

### Roles Decorator

```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

### Super Admin Guard

```typescript
// src/common/guards/super-admin.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();
    
    const isSuperAdmin = req.user?.metadata?.role === 'super_admin';
    
    if (!isSuperAdmin) {
      throw new ForbiddenException('Only super admins can access this resource');
    }

    return true;
  }
}
```

---

## Database Connection

### MongoDB Configuration

```typescript
// src/config/database.config.ts
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const mongooseConfig: {
  uri: string;
  options: MongooseModuleOptions;
} = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_db',
  options: {
    retryWrites: true,
    w: 'majority',
    directConnection: false,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  },
};

// Indexes
export const createIndexes = async (connection: any) => {
  // Products
  await connection.collection('products').createIndex({ tenant_id: 1, sku: 1 }, { unique: true });
  await connection.collection('products').createIndex({ tenant_id: 1, name: 1 });

  // Customers
  await connection.collection('customers').createIndex({ tenant_id: 1, email: 1 });

  // Orders
  await connection.collection('orders').createIndex({ tenant_id: 1, order_number: 1 }, { unique: true });
  await connection.collection('orders').createIndex({ tenant_id: 1, customer_id: 1 });

  // Invoices
  await connection.collection('invoices').createIndex({ tenant_id: 1, invoice_number: 1 }, { unique: true });
};
```

---

## Error Handling

### GraphQL Exception Filter

```typescript
// src/common/filters/gql-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';

@Catch()
export class AllExceptionsFilter implements GqlExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const status =
      exception.getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception.message || 'Internal server error';

    return {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    };
  }
}
```

---

## Webhooks (Clerk)

### Clerk Webhook Controller

```typescript
// src/modules/webhooks/clerk.controller.ts
import { Controller, Post, Body, RawBody, Headers } from '@nestjs/common';
import { Webhook } from 'svix';
import { TenantService } from '../tenant/tenant.service';

@Controller('webhooks')
export class WebhooksController {
  private webhook: Webhook;

  constructor(private tenantService: TenantService) {
    this.webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
  }

  @Post('clerk')
  async handleClerkWebhook(
    @RawBody() body: Buffer,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    try {
      const evt = this.webhook.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });

      if (evt.type === 'user.created') {
        await this.tenantService.handleUserCreated(evt.data);
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }
}
```

### Tenant Service Webhook Handler

```typescript
// src/modules/tenant/tenant.service.ts (snippet)
async handleUserCreated(clerkUser: any) {
  const { id, email_addresses, first_name } = clerkUser;

  const tenant = await this.tenantModel.create({
    owner_clerk_id: id,
    name: first_name || email_addresses[0].email_address.split('@')[0],
    email: email_addresses[0].email_address,
    currency_config: {
      base_currency: 'USD',
      secondary_currency: 'LBP',
      exchange_rate: 88000, // Default rate
      updated_at: new Date(),
    },
    language: 'en',
    status: 'active',
    created_by: 'system',
    created_at: new Date(),
    updated_at: new Date(),
  });

  // Update Clerk user metadata with tenant_id
  await this.clerkService.updateUserMetadata(id, {
    tenant_id: tenant._id.toString(),
    role: 'admin',
  });

  return tenant;
}
```

---

## Environment Variables

```bash
# .env.example

# Node
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/erp_dev

# Clerk
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_WEBHOOK_SECRET=your_webhook_secret

# GraphQL
GRAPHQL_DEBUG=true
GRAPHQL_INTROSPECTION=true

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Currency
DEFAULT_EXCHANGE_RATE=88000

# Frontend URLs
ELECTRON_APP_URL=http://localhost:3001
ADMIN_DASHBOARD_URL=http://localhost:3002
```

---

## Docker Setup

### Dockerfile

```dockerfile
# Dockerfile
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
    networks:
      - erp-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://mongodb:27017/erp_dev
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
      CLERK_PUBLISHABLE_KEY: ${CLERK_PUBLISHABLE_KEY}
    depends_on:
      - mongodb
    networks:
      - erp-network
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  mongo-data:

networks:
  erp-network:
    driver: bridge
```

---

## Development Workflow

### Setup

```bash
# 1. Clone and install
git clone <repo>
cd backend
npm install

# 2. Create environment file
cp .env.example .env.development

# 3. Start MongoDB
docker-compose -f docker-compose.dev.yml up -d mongodb

# 4. Run migrations/seeds (if applicable)
npm run seed

# 5. Start dev server
npm run start:dev

# 6. GraphQL Playground
open http://localhost:3000/graphql
```

### Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Building

```bash
# Build for production
npm run build

# Start production build
npm start
```

---

## Next Steps

1. ✅ Set up NestJS project structure
2. ✅ Configure Mongoose + MongoDB
3. ✅ Implement Clerk authentication
4. ✅ Build GraphQL schema
5. ✅ Create services and resolvers
6. ⏳ Implement business logic (Orders, Invoices, etc.)
7. ⏳ Add comprehensive error handling
8. ⏳ Write unit and integration tests
9. ⏳ Set up CI/CD pipeline
10. ⏳ Deploy to production
