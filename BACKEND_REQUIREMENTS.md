# Backend Requirements - Search and Advanced Filters

**Date**: November 9, 2025
**For**: Backend Team
**Purpose**: Implement missing search and filter capabilities for frontend

---

## Overview

The frontend needs additional search and filter capabilities to complete the ERP system. This document specifies the required GraphQL queries, mutations, and filter input types.

---

## 1. Order Search and Filters

### Required Query: `searchOrders`

```graphql
type Query {
  searchOrders(
    searchTerm: String!
    filter: OrderFilterInput
    page: Int
    limit: Int
  ): OrdersResponse!
}
```

**Search Behavior:**
- Search should match against:
  - `order_number` (exact and partial match)
  - `customer.name` (partial match, case-insensitive)
  - `customer.email` (partial match, case-insensitive)
  - `notes` (partial match, case-insensitive)

**Example Usage:**
```graphql
query {
  searchOrders(
    searchTerm: "John"
    filter: { status: "confirmed" }
    page: 1
    limit: 20
  ) {
    orders { ... }
    length
    page
    limit
  }
}
```

### Enhanced OrderFilterInput

```graphql
input OrderFilterInput {
  # Existing
  status: OrderStatus

  # NEW: Date range filters
  order_date_from: DateTime
  order_date_to: DateTime

  # NEW: Amount range filters
  total_amount_min: Float
  total_amount_max: Float

  # NEW: Currency filter
  currency: Currency

  # NEW: Customer filter
  customer_id: ID
}
```

**Use Cases:**
- Filter orders by date range (e.g., "show me orders from last month")
- Filter orders by amount range (e.g., "orders over $1000")
- Filter by currency (USD vs LBP)
- Filter by specific customer

---

## 2. Invoice Search and Filters

### Required Query: `searchInvoices`

```graphql
type Query {
  searchInvoices(
    searchTerm: String!
    filter: InvoiceFilterInput
    page: Int
    limit: Int
  ): InvoicesResponse!
}
```

**Search Behavior:**
- Search should match against:
  - `invoice_number` (exact and partial match)
  - `customer.name` (partial match, case-insensitive)
  - `customer.email` (partial match, case-insensitive)
  - `notes` (partial match, case-insensitive)

**Example Usage:**
```graphql
query {
  searchInvoices(
    searchTerm: "INV-2024"
    filter: { payment_status: "unpaid" }
    page: 1
    limit: 20
  ) {
    invoices { ... }
    length
    page
    limit
  }
}
```

### Enhanced InvoiceFilterInput

```graphql
input InvoiceFilterInput {
  # Existing
  payment_status: PaymentStatus

  # NEW: Date range filters
  invoice_date_from: DateTime
  invoice_date_to: DateTime
  due_date_from: DateTime
  due_date_to: DateTime

  # NEW: Amount range filters
  total_amount_min: Float
  total_amount_max: Float
  paid_amount_min: Float
  paid_amount_max: Float

  # NEW: Currency filter
  currency: Currency

  # NEW: Customer filter
  customer_id: ID

  # NEW: Overdue filter
  is_overdue: Boolean
}
```

**Use Cases:**
- Filter invoices by invoice date or due date
- Find invoices in a specific amount range
- Filter overdue invoices (due_date < now AND payment_status != 'paid')
- Filter by customer or currency

---

## 3. Product Advanced Filters

### Enhanced ProductFilterInput

```graphql
input ProductFilterInput {
  # Existing
  status: ProductStatus
  search: String # Already searches name, SKU, barcode

  # NEW: Category filter
  category: String

  # NEW: Price range filters
  price_usd_min: Float
  price_usd_max: Float

  # NEW: Stock level filters
  quantity_in_stock_min: Int
  quantity_in_stock_max: Int
  is_low_stock: Boolean # quantity_in_stock <= reorder_level

  # NEW: Sort options
  sort_by: ProductSortField
  sort_order: SortOrder
}

enum ProductSortField {
  NAME
  SKU
  PRICE
  QUANTITY
  CREATED_AT
  UPDATED_AT
}

enum SortOrder {
  ASC
  DESC
}
```

**Use Cases:**
- Filter products by category
- Find products in a price range
- Find products with low stock (below reorder level)
- Find products with quantity between X and Y
- Sort products by name, price, stock level, etc.

---

## 4. Customer Advanced Filters

### Enhanced CustomerFilterInput

```graphql
input CustomerFilterInput {
  # Existing (if any)

  # NEW: Location filter
  city: String
  state: String
  country: String

  # NEW: Date filter
  created_at_from: DateTime
  created_at_to: DateTime

  # NEW: Has orders filter
  has_orders: Boolean # True = customers with at least one order

  # NEW: Sort options
  sort_by: CustomerSortField
  sort_order: SortOrder
}

enum CustomerSortField {
  NAME
  EMAIL
  CREATED_AT
  UPDATED_AT
}
```

**Use Cases:**
- Filter customers by location (city, state, country)
- Find customers created in a date range
- Filter customers who have placed orders vs haven't
- Sort customers alphabetically or by date added

---

## 5. Bulk Operations (Future Enhancement)

### Bulk Delete

```graphql
type Mutation {
  # Products
  bulkDeleteProducts(ids: [ID!]!): BulkOperationResponse!

  # Customers
  bulkDeleteCustomers(ids: [ID!]!): BulkOperationResponse!

  # Orders
  bulkDeleteOrders(ids: [ID!]!): BulkOperationResponse!

  # Invoices
  bulkDeleteInvoices(ids: [ID!]!): BulkOperationResponse!
}

type BulkOperationResponse {
  success_count: Int!
  failure_count: Int!
  errors: [FieldError!]
}
```

### Bulk Status Update (Orders)

```graphql
type Mutation {
  bulkUpdateOrderStatus(
    ids: [ID!]!
    status: OrderStatus!
  ): BulkOperationResponse!
}
```

---

## 6. Export Features (Future Enhancement)

### CSV Export

```graphql
type Query {
  exportProducts(filter: ProductFilterInput): String! # Returns CSV data as string
  exportCustomers(filter: CustomerFilterInput): String!
  exportOrders(filter: OrderFilterInput): String!
  exportInvoices(filter: InvoiceFilterInput): String!
}
```

**Returns:**
- CSV formatted string with headers
- Filtered by the provided filter input
- Frontend will trigger download in browser

---

## 7. Invoice PDF Generation (High Priority)

### Generate Invoice PDF

```graphql
type Mutation {
  generateInvoicePDF(id: ID!): InvoicePDFResponse!
}

type InvoicePDFResponse {
  pdf_url: String # URL to download PDF (S3/Cloudinary)
  error: FieldError
}
```

**Requirements:**
- Generate PDF using invoice template
- Include company branding (logo, colors from tenant.branding)
- Include all invoice details (items, amounts, payment history)
- Store PDF in cloud storage (S3/Cloudinary)
- Return URL for frontend to download/display

---

## 8. Email Invoice (Future Enhancement)

### Send Invoice Email

```graphql
type Mutation {
  emailInvoice(
    id: ID!
    recipient_email: String
    cc_emails: [String!]
    subject: String
    message: String
  ): EmailResponse!
}

type EmailResponse {
  success: Boolean!
  message: String
  error: FieldError
}
```

**Requirements:**
- Send invoice PDF as attachment
- Use customer email if recipient_email not provided
- Include custom message if provided
- Use tenant branding for email template
- Track email sent status in invoice

---

## Priority Implementation Order

### Phase 1: Critical (Implement First)
1. ✅ `searchOrders` query
2. ✅ `searchInvoices` query
3. ✅ Enhanced `OrderFilterInput` (date range, amount range)
4. ✅ Enhanced `InvoiceFilterInput` (date range, amount range, overdue)

### Phase 2: High Priority
5. ✅ Enhanced `ProductFilterInput` (category, price range, stock level, sorting)
6. ✅ Enhanced `CustomerFilterInput` (location, date range, has_orders)
7. ✅ `generateInvoicePDF` mutation

### Phase 3: Medium Priority
8. ⏳ Bulk delete mutations for all entities
9. ⏳ Bulk update status for orders
10. ⏳ `emailInvoice` mutation

### Phase 4: Nice to Have
11. ⏳ CSV export queries
12. ⏳ Advanced sorting for all entities

---

## Testing Requirements

For each implemented feature:

1. **Unit Tests**
   - Test search with various terms
   - Test each filter individually
   - Test combined filters
   - Test pagination with filters/search

2. **Integration Tests**
   - Test tenant isolation (search/filter only returns data for current tenant)
   - Test performance with large datasets (1000+ records)
   - Test edge cases (empty results, invalid inputs)

3. **Examples to Provide**
   - Sample GraphQL queries for each new feature
   - Expected response formats
   - Error handling examples

---

## Notes for Backend Team

- All search queries should be case-insensitive
- All search queries must respect tenant isolation
- Date filters should accept ISO 8601 format
- Amount filters should work with USD values (LBP conversion handled by frontend)
- Consider adding indexes on frequently searched fields (order_number, invoice_number, etc.)
- Pagination should maintain consistency with existing pattern (page/limit with length)

---

## Questions or Clarifications

If you need clarification on any requirement, please reach out to the frontend team.

**Contact:** Frontend Development Team
**Last Updated:** November 9, 2025
