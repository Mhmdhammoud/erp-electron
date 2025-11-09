# ERP System - Feature Tracking

This document tracks the implementation status of all features in the ERP system.

## ✅ Completed Features

### Core Functionality
- [x] **Authentication** - Clerk integration with JWT and tenant metadata
- [x] **Dark/Light Mode** - Theme toggle with localStorage persistence
- [x] **Dashboard** - Basic metrics (revenue, orders, invoices, low inventory alerts)
- [x] **Multi-tenancy** - Automatic tenant isolation via JWT

### Products
- [x] **List Products** - Table view with search
- [x] **Create Product** - Dedicated create page at `/products/new`
- [x] **Update Product** - Via dialog (edit button in table)
- [x] **Delete Product** - Confirmation dialog
- [x] **Search Products** - Basic filter by name, SKU, or barcode
- [x] **Pagination** - Page controls with configurable items per page
- [x] **Low Stock Alerts** - Visual indicators when stock below reorder level

### Customers
- [x] **List Customers** - Table view with search
- [x] **Create Customer** - Dedicated create page at `/customers/new`
- [x] **Update Customer** - Via dialog with address management
- [x] **Delete Customer** - Confirmation dialog
- [x] **Search Customers** - Dedicated search query
- [x] **Pagination** - Page controls (hidden during search)
- [x] **Address Management** - Support for multiple addresses

### Orders
- [x] **List Orders** - Table view with status badges
- [x] **Create Order** - Dedicated 3-step wizard at `/orders/new`
  - Step 1: Select Customer
  - Step 2: Add Products (with search and quantity controls)
  - Step 3: Review & Submit
- [x] **Update Order Status** - Dropdown in table for status changes
- [x] **Status Filter** - Filter by Draft, Confirmed, Shipped, Invoiced, Cancelled
- [x] **Pagination** - Page controls with status filter support
- [x] **Currency Support** - USD and LBP selection

### Invoices
- [x] **List Invoices** - Table view with payment tracking
- [x] **Create Invoice** - Dedicated create page at `/invoices/new`
  - From existing order
  - Standalone with customer selection
- [x] **Record Payment** - Dialog for partial/full payments
- [x] **Payment Status Filter** - Filter by Unpaid, Partial, Paid, Overdue
- [x] **Pagination** - Page controls with payment status filter
- [x] **Payment History** - Track multiple payments per invoice
- [x] **Overdue Indicators** - Visual alerts for overdue invoices

### UI Components
- [x] **Collapsible Sidebar** - Expandable navigation groups
- [x] **Toast Notifications** - Success/error messages
- [x] **Loading States** - Skeleton loaders for all list pages
- [x] **Empty States** - Helpful messages when no data
- [x] **Responsive Design** - TailwindCSS utility classes
- [x] **Pagination Component** - Reusable with page controls and items-per-page selector

---

## ⚠️ Partially Implemented

### Products
- [⚠️] **Search** - Basic filter only (no advanced search options)
- [⚠️] **Edit** - Only via dialog (no dedicated edit page route)

### Customers
- [⚠️] **Edit** - Only via dialog (no dedicated edit page route)

### Orders
- [⚠️] **Update** - Status only (no full edit capability)
- [⚠️] **Edit** - No edit functionality (only status updates)

### Settings
- [⚠️] **Settings Page** - UI exists but save functionality not connected
  - Business info form displays tenant data
  - Branding tab exists
  - Currency settings tab exists
  - Save buttons don't trigger `updateTenantSettings` mutation

---

## ❌ Missing Critical Features

### Products
- [ ] **Detail Page** - View full product details at `/products/:id`
- [ ] **Edit Page** - Dedicated edit route at `/products/:id/edit`
- [ ] **Advanced Filters** - Filter by category, price range, stock level
- [ ] **Bulk Operations** - Select multiple, bulk delete, bulk update

### Customers
- [ ] **Detail Page** - View full customer details at `/customers/:id`
- [ ] **Edit Page** - Dedicated edit route at `/customers/:id/edit`
- [ ] **Advanced Filters** - Filter by location, date added, has orders
- [ ] **Bulk Operations** - Select multiple, bulk delete, bulk update

### Orders
- [ ] **Detail Page** - View full order details at `/orders/:id` (button exists but no handler)
- [ ] **Edit Page** - Full order editing at `/orders/:id/edit`
- [ ] **Delete Operation** - Delete orders with confirmation
- [ ] **Search** - Search orders by customer, date, order number
- [ ] **Advanced Filters** - Date range, amount range, currency filter
- [ ] **Bulk Operations** - Select multiple, bulk status update, bulk delete

### Invoices
- [ ] **Detail Page** - View full invoice details at `/invoices/:id`
- [ ] **Edit Page** - Edit invoice at `/invoices/:id/edit`
- [ ] **Delete Operation** - Delete invoices with confirmation
- [ ] **Search** - Search invoices by customer, invoice number
- [ ] **Advanced Filters** - Date range, amount range, due date filter
- [ ] **Bulk Operations** - Select multiple, bulk delete
- [ ] **PDF Generation** - Export invoice as PDF
- [ ] **Email Invoice** - Send invoice to customer

### Settings
- [ ] **Save Functionality** - Connect to `updateTenantSettings` mutation
- [ ] **Currency Exchange Rates** - Manage USD/LBP exchange rate
- [ ] **Business Logo Upload** - Upload and display company logo
- [ ] **Invoice Templates** - Customize invoice appearance

---

## 📋 Missing Nice-to-Have Features

### Export/Import
- [ ] **CSV Export** - Export data from all list pages
- [ ] **Excel Export** - Export with formatting
- [ ] **PDF Reports** - Generate printable reports
- [ ] **Import from CSV** - Bulk import products, customers

### Analytics & Reporting
- [ ] **Advanced Dashboard** - More detailed metrics
- [ ] **Date Range Filters** - Filter dashboard by date
- [ ] **Sales Reports** - Revenue by product, customer, period
- [ ] **Inventory Reports** - Stock movement, valuation
- [ ] **Customer Reports** - Top customers, purchase history
- [ ] **Custom Reports** - Build custom reports

### User Management
- [ ] **User List Page** - View all users in tenant
- [ ] **User Roles** - Admin, Manager, Employee roles
- [ ] **Permissions** - Role-based access control
- [ ] **User CRUD** - Create, update, delete users
- [ ] **Activity Log** - Track user actions

### Product Features
- [ ] **Product Categories** - Hierarchical category management
- [ ] **Product Images** - Upload and display product photos
- [ ] **Variants** - Size, color, other variations
- [ ] **Barcode Scanning** - Scan barcode to find products
- [ ] **Stock Adjustments** - Manual stock adjustments with reason

### Order Features
- [ ] **Order Notes** - Internal notes on orders
- [ ] **Shipping Integration** - Track shipments
- [ ] **Email Notifications** - Order confirmation, shipping updates
- [ ] **Order History** - View all changes to an order

### Invoice Features
- [ ] **Recurring Invoices** - Auto-generate monthly invoices
- [ ] **Payment Reminders** - Auto-send reminders for overdue invoices
- [ ] **Credit Notes** - Issue refunds/credits
- [ ] **Multiple Currencies** - Invoice in different currencies

### System Features
- [ ] **Audit Log** - Track all system changes
- [ ] **Backup/Restore** - Database backup functionality
- [ ] **API Documentation** - GraphQL schema documentation
- [ ] **Keyboard Shortcuts** - Power user shortcuts
- [ ] **Offline Mode** - Work offline and sync when online

---

## 🐛 Known Issues

### Code Quality
- [ ] `delete-product.graphql` in wrong location (`/components/` instead of `/graphql/mutations/`)
- [ ] "View Details" button in Orders page has no click handler
- [ ] Missing GraphQL mutations:
  - `delete-order`
  - `delete-invoice`
  - `update-order` (full update, not just status)
  - `update-invoice`
  - `search-products`
  - `search-orders`
  - `search-invoices`

### Type Safety
- [ ] Some components use `any` type instead of proper TypeScript interfaces
- [ ] GraphQL generated types manually created (codegen not run)

---

## 🎯 Recommended Priority Order

### Phase 1: Critical Fixes (Immediate)
1. ✅ Fix Invoices functionality (COMPLETED)
2. ✅ Implement pagination (COMPLETED)
3. Fix Settings save functionality
4. Add delete operations for Orders and Invoices

### Phase 2: Core Features (High Priority)
5. Create detail pages for all resources
6. Create edit pages for all resources
7. Add search for Orders and Invoices
8. Add advanced filters for all resources

### Phase 3: UX Improvements (Medium Priority)
9. Bulk operations for all resources
10. Export to CSV/Excel
11. PDF generation for invoices
12. Email functionality

### Phase 4: Analytics & Reporting (Medium Priority)
13. Enhanced dashboard with date filters
14. Sales and inventory reports
15. Customer analytics

### Phase 5: Advanced Features (Low Priority)
16. User management and permissions
17. Product categories and images
18. Recurring invoices
19. Audit logging

---

## 📝 Notes

- **Backend**: Deployed at https://erp-api.meritt-dev.co.uk/
- **Tech Stack**: Electron 27+, React 18, TypeScript 5, Vite 5, shadcn/ui, Apollo Client 3.8+, Clerk Auth
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS 3.x with CSS variables for theming
- **State Management**: React hooks + Apollo Client cache

Last Updated: 2025-11-09
