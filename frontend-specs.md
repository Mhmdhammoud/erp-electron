# Frontend Implementation Guide - New Features PRD

## Document Purpose

This Product Requirements Document (PRD) provides detailed frontend implementation guidance for the 4 new backend features. Use this as your development roadmap.

---

## Table of Contents

1. [Feature 1: Invoice-Order Coupling](#feature-1-invoice-order-coupling)
2. [Feature 2: Order-Warehouse Integration](#feature-2-order-warehouse-integration)
3. [Feature 3: Auto-Tenant Creation (Webhooks)](#feature-3-auto-tenant-creation-webhooks)
4. [Feature 4: Me Query (User Context)](#feature-4-me-query-user-context)
5. [Implementation Priority](#implementation-priority)
6. [GraphQL Code Generation](#graphql-code-generation)
7. [Testing Checklist](#testing-checklist)

---

## Feature 1: Invoice-Order Coupling

### Overview

When creating an invoice for an order, the order status automatically updates to `INVOICED`. No frontend code changes required, but UI should reflect this behavior.

### User Stories

**As a user**, when I create an invoice from an order, I want the order status to automatically update to "Invoiced" so I know it has been billed.

**As a user**, I want to see which orders have been invoiced and which haven't, so I can track billing status.

### UI Changes

#### 1. Order Status Badge

**Component**: `OrderStatusBadge.tsx`

**Requirements**:

- Display "Invoiced" status with distinct color (e.g., purple/blue)
- Show icon indicating billing complete
- Differentiate from "Shipped" status

**Example Implementation**:

```tsx
type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'SHIPPED' | 'INVOICED' | 'CANCELLED';

interface StatusConfig {
  color: string;
  bg: string;
  icon: React.ReactNode;
  label: string;
}

const statusConfig: Record<OrderStatus, StatusConfig> = {
  DRAFT: {
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    icon: <FileIcon />,
    label: 'Draft',
  },
  CONFIRMED: {
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    icon: <CheckCircleIcon />,
    label: 'Confirmed',
  },
  SHIPPED: {
    color: 'text-green-700',
    bg: 'bg-green-100',
    icon: <TruckIcon />,
    label: 'Shipped',
  },
  INVOICED: {
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    icon: <ReceiptIcon />,
    label: 'Invoiced',
  },
  CANCELLED: {
    color: 'text-red-700',
    bg: 'bg-red-100',
    icon: <XCircleIcon />,
    label: 'Cancelled',
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${config.bg}`}>
      <span className={config.color}>{config.icon}</span>
      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}
```

#### 2. Order List Page

**Location**: `app/orders/page.tsx`

**Requirements**:

- Add "Invoiced" filter option
- Show invoiced orders with purple/blue badge
- Display invoice link/button for invoiced orders

**Filter UI**:

```tsx
<Tabs defaultValue="all">
  <TabsList>
    <TabsTrigger value="all">All Orders</TabsTrigger>
    <TabsTrigger value="draft">Draft</TabsTrigger>
    <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
    <TabsTrigger value="shipped">Shipped</TabsTrigger>
    <TabsTrigger value="invoiced">Invoiced</TabsTrigger>
    <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
  </TabsList>
</Tabs>
```

**GraphQL Query**:

```graphql
query GetOrders($filter: OrderFilterInput) {
  orders(filter: $filter) {
    data {
      id
      order_number
      status
      total_usd
      customer_id
      invoice_id
      createdAt
    }
    page
    limit
    totalCount
    error {
      field
      message
    }
  }
}
```

#### 3. Order Details Page

**Location**: `app/orders/[id]/page.tsx`

**Requirements**:

- Show "Invoice Created" alert/banner for invoiced orders
- Display link to invoice
- Show timestamp when invoice was created
- Disable "Create Invoice" button if already invoiced

**Example UI**:

```tsx
function OrderDetails({ order }: { order: Order }) {
  const isInvoiced = order.status === 'INVOICED';

  return (
    <div>
      {isInvoiced && (
        <Alert className="mb-4 bg-purple-50 border-purple-200">
          <ReceiptIcon className="h-4 w-4" />
          <AlertTitle>Invoice Created</AlertTitle>
          <AlertDescription>
            This order has been invoiced.{' '}
            <Link href={`/invoices/${order.invoice_id}`} className="underline">
              View Invoice
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h1>Order {order.order_number}</h1>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="flex gap-2">
          {!isInvoiced && order.status !== 'DRAFT' && (
            <Button onClick={handleCreateInvoice}>Create Invoice</Button>
          )}

          {isInvoiced && (
            <Button variant="outline" asChild>
              <Link href={`/invoices/${order.invoice_id}`}>View Invoice</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Order details */}
    </div>
  );
}
```

#### 4. Create Invoice Flow

**Location**: `app/invoices/create/page.tsx`

**Requirements**:

- After successful invoice creation, show success message
- Automatically redirect to order page showing "Invoiced" status
- Handle error if order cannot be invoiced (draft/cancelled)

**Example Implementation**:

```tsx
function CreateInvoiceForm({ orderId }: { orderId: string }) {
  const [createInvoice, { loading }] = useCreateInvoiceMutation();
  const router = useRouter();

  const handleSubmit = async (values: CreateInvoiceInput) => {
    const { data } = await createInvoice({
      variables: { input: values },
    });

    if (data?.createInvoice?.error) {
      toast.error(data.createInvoice.error.message);
      return;
    }

    toast.success('Invoice created successfully. Order status updated to Invoiced.');
    router.push(`/orders/${orderId}`);
  };

  return <Form onSubmit={handleSubmit}>{/* Form fields */}</Form>;
}
```

### Error Handling

**Possible Errors**:

1. `CANNOT_INVOICE_DRAFT_ORDER` - Order must be confirmed first
2. `CANNOT_INVOICE_CANCELLED_ORDER` - Cannot invoice cancelled orders
3. `INVOICE_ALREADY_EXISTS` - Invoice already created for this order

**Display Strategy**:

```tsx
const errorMessages = {
  CANNOT_INVOICE_DRAFT_ORDER: 'Please confirm the order before creating an invoice.',
  CANNOT_INVOICE_CANCELLED_ORDER: 'Cannot create invoice for cancelled orders.',
  INVOICE_ALREADY_EXISTS: 'An invoice already exists for this order.',
};

// Show as toast notification
if (error) {
  toast.error(errorMessages[error.field] || error.message);
}
```

### Business Rules (Display to User)

- ✅ Only confirmed or shipped orders can be invoiced
- ✅ Draft orders must be confirmed first
- ✅ Cancelled orders cannot be invoiced
- ✅ Once invoiced, order status cannot be changed
- ✅ Order automatically updates to "Invoiced" when invoice is created

---

## Feature 2: Order-Warehouse Integration

### Overview

Orders now support warehouse assignment for fulfillment. Inventory is reserved (not deducted) when order is confirmed, ensuring accurate stock availability.

### User Stories

**As a warehouse manager**, I want to assign orders to specific warehouses so I know where to fulfill them from.

**As a user**, I want to see which warehouse will fulfill my order so I can track inventory and shipment location.

**As a system**, I want to reserve inventory when orders are confirmed so other orders can't oversell the same stock.

### UI Changes

#### 1. Order Creation Form - Warehouse Selection

**Location**: `app/orders/create/page.tsx`

**Requirements**:

- Add warehouse dropdown (optional field)
- Show "Primary Warehouse" as default
- Display available inventory per warehouse
- Validate sufficient inventory before submission

**Form Component**:

```tsx
function CreateOrderForm() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const { data: warehouses } = useGetWarehousesQuery({
    variables: { filter: { status: 'active' } },
  });

  return (
    <Form>
      <FormField name="customer_id">
        <Label>Customer</Label>
        <CustomerSelect />
      </FormField>

      {/* 🆕 NEW: Warehouse Selection */}
      <FormField name="warehouse_id">
        <Label>Fulfillment Warehouse (Optional)</Label>
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger>
            <SelectValue placeholder="Primary Warehouse (default)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Primary Warehouse (default)</SelectItem>
            {warehouses?.warehouses?.data?.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                <div className="flex items-center gap-2">
                  <span>{wh.name}</span>
                  {wh.is_primary && (
                    <Badge variant="secondary" size="sm">
                      Primary
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormDescription>
          Leave blank to use the primary warehouse. Inventory will be reserved from the selected
          warehouse.
        </FormDescription>
      </FormField>

      <OrderItemsTable
        warehouseId={selectedWarehouse}
        onInventoryCheck={handleInventoryValidation}
      />

      <FormActions>
        <Button type="submit">Create Order</Button>
      </FormActions>
    </Form>
  );
}
```

#### 2. Order Items Table with Inventory Check

**Requirements**:

- Show available inventory per warehouse per product
- Validate quantity doesn't exceed available inventory
- Display warning if low stock
- Update availability as items are added

**Component**:

```tsx
function OrderItemRow({ productId, warehouseId, quantity, onQuantityChange }: OrderItemRowProps) {
  const { data: inventory } = useGetWarehouseInventoryQuery({
    variables: { warehouseId, productId },
    skip: !warehouseId || !productId,
  });

  const availableQty = inventory?.inventory?.available_quantity ?? 0;
  const hasError = quantity > availableQty;

  return (
    <TableRow className={hasError ? 'bg-red-50' : ''}>
      <TableCell>{/* Product Name */}</TableCell>
      <TableCell>
        <Input
          type="number"
          min="1"
          max={availableQty}
          value={quantity}
          onChange={(e) => onQuantityChange(Number(e.target.value))}
          className={hasError ? 'border-red-500' : ''}
        />
        {hasError && (
          <p className="text-sm text-red-600 mt-1">Only {availableQty} available in warehouse</p>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={availableQty < 10 ? 'destructive' : 'secondary'}>
          {availableQty} available
        </Badge>
      </TableCell>
    </TableRow>
  );
}
```

#### 3. Order Details Page - Warehouse Information

**Location**: `app/orders/[id]/page.tsx`

**Requirements**:

- Display assigned warehouse name and location
- Link to warehouse details page
- Show reservation status (reserved/released)
- Display inventory distribution

**Example UI**:

```tsx
function OrderWarehouseInfo({ order }: { order: Order }) {
  const { data: warehouse } = useGetWarehouseQuery({
    variables: { id: order.warehouse_id },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fulfillment Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-muted-foreground">Warehouse</Label>
          <div className="flex items-center gap-2 mt-1">
            <WarehouseIcon className="h-4 w-4" />
            <Link
              href={`/warehouses/${warehouse?.warehouse?.id}`}
              className="font-medium hover:underline"
            >
              {warehouse?.warehouse?.name || 'Primary Warehouse'}
            </Link>
            {warehouse?.warehouse?.is_primary && <Badge variant="secondary">Primary</Badge>}
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground">Location</Label>
          <p className="mt-1">
            {warehouse?.warehouse?.address?.city}, {warehouse?.warehouse?.address?.country}
          </p>
        </div>

        <div>
          <Label className="text-muted-foreground">Inventory Status</Label>
          <div className="mt-1">
            {order.status === 'CONFIRMED' || order.status === 'SHIPPED' ? (
              <Badge variant="outline" className="bg-yellow-50">
                <LockIcon className="h-3 w-3 mr-1" />
                Reserved
              </Badge>
            ) : (
              <Badge variant="outline">Not Reserved</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 4. Product Details - Inventory Distribution

**Location**: `app/products/[id]/page.tsx`

**Requirements**:

- Show inventory across all warehouses
- Display reserved vs available quantities
- Show which warehouses have stock
- Allow stock transfers between warehouses

**Component**:

```tsx
function ProductInventoryDistribution({ productId }: { productId: string }) {
  const { data } = useGetInventoryByProductQuery({
    variables: { productId },
  });

  const inventories = data?.inventoryByProduct?.inventories || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead>Total Stock</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventories.map((inv) => (
              <TableRow key={inv.warehouse_id}>
                <TableCell>
                  <Link href={`/warehouses/${inv.warehouse_id}`} className="hover:underline">
                    {inv.warehouse_name}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{inv.quantity}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-yellow-50">
                    {inv.reserved_quantity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={inv.available_quantity > 0 ? 'success' : 'destructive'}>
                    {inv.available_quantity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    Transfer Stock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span>Total across all warehouses:</span>
            <span className="font-medium">
              {inventories.reduce((sum, inv) => sum + inv.quantity, 0)} units
            </span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Total available:</span>
            <span>{inventories.reduce((sum, inv) => sum + inv.available_quantity, 0)} units</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### GraphQL Queries & Mutations

#### Get Warehouses for Dropdown

```graphql
query GetWarehouses($filter: WarehouseFilterInput) {
  warehouses(filter: $filter) {
    data {
      id
      name
      code
      status
      is_primary
      address {
        city
        country
      }
    }
    totalCount
  }
}
```

#### Create Order with Warehouse

```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    data {
      id
      order_number
      warehouse_id
      status
      items {
        product_id
        product_name
        quantity
      }
    }
    error {
      field
      message
    }
  }
}
```

#### Get Warehouse Inventory

```graphql
query GetWarehouseInventory($warehouseId: ID!, $productId: ID!) {
  getInventoryByWarehouseAndProduct(warehouseId: $warehouseId, productId: $productId) {
    data {
      warehouse_id
      product_id
      quantity
      reserved_quantity
      available_quantity
      location
    }
    error {
      field
      message
    }
  }
}
```

#### Get Inventory by Product (All Warehouses)

```graphql
query GetInventoryByProduct($productId: ID!) {
  inventoryByProduct(productId: $productId) {
    inventories {
      warehouse_id
      warehouse_name
      quantity
      reserved_quantity
      available_quantity
    }
    totalCount
  }
}
```

### Error Handling

**Possible Errors**:

1. `WAREHOUSE_NOT_FOUND` - Selected warehouse doesn't exist
2. `PRIMARY_WAREHOUSE_NOT_FOUND` - No primary warehouse configured
3. `INSUFFICIENT_INVENTORY` - Not enough stock in warehouse
4. `INVENTORY_NOT_FOUND` - Product not stocked in warehouse

**User-Friendly Messages**:

```tsx
const errorMessages = {
  WAREHOUSE_NOT_FOUND: 'The selected warehouse could not be found.',
  PRIMARY_WAREHOUSE_NOT_FOUND: 'No primary warehouse is configured. Please contact support.',
  INSUFFICIENT_INVENTORY: 'Not enough stock available in this warehouse.',
  INVENTORY_NOT_FOUND: 'This product is not available in the selected warehouse.',
};
```

### Business Rules (Display to User)

- ✅ If no warehouse selected, primary warehouse is used automatically
- ✅ Order validates inventory availability before creation
- ✅ Confirming order reserves inventory (makes it unavailable for other orders)
- ✅ Cancelling order releases reserved inventory
- ✅ Inventory shows: Total Stock = Reserved + Available
- ⚠️ Reserved inventory is not physically moved until shipment

---

## Feature 3: Auto-Tenant Creation (Webhooks)

### Overview

When users sign up via Clerk, a tenant is automatically created for them. This happens server-to-server, but frontend should handle the user experience.

### User Stories

**As a new user**, when I sign up, I want a company workspace created automatically so I can start using the app immediately.

**As a user**, I want to see my company name and branding after signup so I know I'm in the right workspace.

### Frontend Changes

#### 1. Post-Signup Flow

**Location**: After Clerk signup redirect

**Requirements**:

- Show loading state while tenant is being created
- Fetch user + tenant info with `me` query
- Display welcome message with tenant name
- Redirect to onboarding wizard

**Component**:

```tsx
function PostSignupRedirect() {
  const { data, loading, error } = useMeQuery({
    // Poll until tenant is available (webhook may take 1-2 seconds)
    pollInterval: 1000,
    skip: false,
  });

  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (data?.me?.tenant) {
      // Tenant found! Stop polling
      router.push('/onboarding');
    } else if (attempts > 10) {
      // After 10 seconds, show error
      toast.error('Unable to create workspace. Please contact support.');
    } else {
      setAttempts((prev) => prev + 1);
    }
  }, [data, attempts]);

  if (loading || !data?.me?.tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <h2 className="mt-4 text-xl font-semibold">Setting up your workspace...</h2>
        <p className="mt-2 text-muted-foreground">This will only take a moment</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <CheckCircleIcon className="h-16 w-16 text-green-500" />
      <h2 className="mt-4 text-2xl font-bold">Welcome to {data.me.tenant.name}!</h2>
      <p className="mt-2 text-muted-foreground">Your workspace is ready. Let's get started.</p>
    </div>
  );
}
```

#### 2. Onboarding Wizard

**Location**: `app/onboarding/page.tsx`

**Requirements**:

- Company information setup (name, logo, address)
- Currency configuration (exchange rate)
- Primary warehouse creation
- First product creation (optional)

**Wizard Steps**:

```tsx
function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const { data: me } = useMeQuery();

  const steps = [
    {
      title: 'Company Details',
      description: 'Set up your company profile',
      component: <CompanyDetailsStep />,
    },
    {
      title: 'Currency Settings',
      description: 'Configure your pricing currency',
      component: <CurrencySettingsStep />,
    },
    {
      title: 'Primary Warehouse',
      description: 'Create your main warehouse',
      component: <WarehouseSetupStep />,
    },
    {
      title: 'Your First Product',
      description: 'Add a product to get started',
      component: <FirstProductStep optional />,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-12">
      <StepIndicator currentStep={step} totalSteps={steps.length} />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{steps[step - 1].title}</CardTitle>
          <CardDescription>{steps[step - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>{steps[step - 1].component}</CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
            Back
          </Button>
          <Button
            onClick={() =>
              step < steps.length ? setStep((s) => s + 1) : router.push('/dashboard')
            }
          >
            {step < steps.length ? 'Next' : 'Finish'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

#### 3. Company Details Step

**Requirements**:

- Pre-filled with tenant name from signup
- Upload logo (optional)
- Company address
- Contact information

**Component**:

```tsx
function CompanyDetailsStep() {
  const { data: me } = useMeQuery();
  const [updateTenant] = useUpdateTenantMutation();

  const initialValues = {
    name: me?.me?.tenant?.name || '',
    email: me?.me?.user?.email || '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      country: '',
    },
  };

  return (
    <Form initialValues={initialValues} onSubmit={handleSubmit}>
      <FormField name="name">
        <Label>Company Name</Label>
        <Input placeholder="Acme Corp" />
      </FormField>

      <FormField name="logo">
        <Label>Company Logo (Optional)</Label>
        <FileUpload accept="image/*" />
      </FormField>

      <FormField name="email">
        <Label>Email</Label>
        <Input type="email" />
      </FormField>

      {/* More fields */}
    </Form>
  );
}
```

### Error Handling

**Scenario**: Webhook fails or is delayed

**Detection**: `me` query returns `error: "Tenant not found"` after signup

**Recovery**:

```tsx
function SignupErrorHandler() {
  const [createTenant] = useCreateTenantMutation();
  const { user } = useUser(); // From Clerk

  const handleManualCreate = async () => {
    const { data } = await createTenant({
      variables: {
        input: {
          owner_clerk_id: user.id,
          name: user.fullName || user.emailAddresses[0].emailAddress.split('@')[0],
          email: user.emailAddresses[0].emailAddress,
        },
      },
    });

    if (data?.createTenant?.data) {
      toast.success('Workspace created successfully!');
      router.push('/dashboard');
    }
  };

  return (
    <Alert variant="destructive">
      <AlertCircleIcon className="h-4 w-4" />
      <AlertTitle>Setup Incomplete</AlertTitle>
      <AlertDescription>
        We couldn't automatically create your workspace.
        <Button variant="link" onClick={handleManualCreate} className="ml-1">
          Click here to try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

### No Backend Setup Required

This is purely backend functionality. Frontend only needs to:

1. Handle post-signup loading state
2. Guide user through onboarding
3. Handle rare error case (webhook failure)

---

## Feature 4: Me Query (User Context)

### Overview

Single GraphQL query that returns current user info + tenant details. Use this to bootstrap app state on load.

### User Stories

**As a user**, I want to see my profile information and company details when I log in.

**As a developer**, I want a single query to load all user context instead of multiple API calls.

### Implementation

#### 1. App Layout - Context Provider

**Location**: `app/layout.tsx`

**Requirements**:

- Fetch `me` query on app load
- Provide user + tenant context to all components
- Handle loading and error states
- Refresh on user/tenant updates

**Implementation**:

```tsx
// contexts/AppContext.tsx
interface AppContextType {
  user: UserInfo | null;
  tenant: Tenant | null;
  loading: boolean;
  refetch: () => void;
}

const AppContext = createContext<AppContextType>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, refetch } = useMeQuery({
    fetchPolicy: 'cache-and-network', // Always fetch fresh, but use cache while loading
  });

  const value = {
    user: data?.me?.user || null,
    tenant: data?.me?.tenant || null,
    loading,
    refetch,
  };

  if (loading && !data) {
    return <AppLoadingSkeleton />;
  }

  if (data?.me?.error) {
    return <ErrorPage error={data.me.error} />;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
```

**Usage in Layout**:

```tsx
// app/layout.tsx
import { AppProvider } from '@/contexts/AppContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClerkProvider>
          <ApolloProvider client={apolloClient}>
            <AppProvider>{children}</AppProvider>
          </ApolloProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
```

#### 2. User Menu Component

**Location**: `components/UserMenu.tsx`

**Requirements**:

- Display user profile image
- Show user name and email
- Show current role (admin/user)
- Link to account settings
- Sign out button

**Component**:

```tsx
function UserMenu() {
  const { user, tenant } = useApp();
  const { signOut } = useClerk();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={user?.imageUrl} alt={user?.firstName} />
            <AvatarFallback>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="w-fit mt-1">
              {user?.role}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account">
              <UserIcon className="mr-2 h-4 w-4" />
              Account Settings
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/settings/company">
              <BuildingIcon className="mr-2 h-4 w-4" />
              Company Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => signOut()}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 3. Tenant Branding Application

**Location**: `app/layout.tsx` or theme provider

**Requirements**:

- Apply tenant primary color to UI
- Show tenant logo in header
- Use tenant name in page titles
- Apply branding to invoices/documents

**Implementation**:

```tsx
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useApp();

  useEffect(() => {
    if (tenant?.branding?.primary_color) {
      // Apply CSS variable for primary color
      document.documentElement.style.setProperty('--primary', tenant.branding.primary_color);
    }
  }, [tenant?.branding?.primary_color]);

  return children;
}
```

**Header with Logo**:

```tsx
function AppHeader() {
  const { tenant } = useApp();

  return (
    <header className="border-b">
      <div className="flex items-center gap-4 px-4 py-3">
        {tenant?.branding?.logo_url ? (
          <img src={tenant.branding.logo_url} alt={tenant.name} className="h-8" />
        ) : (
          <div className="font-bold text-lg">{tenant?.name}</div>
        )}

        {/* Navigation */}
      </div>
    </header>
  );
}
```

#### 4. Role-Based Access Control

**Location**: Permission helper/component

**Requirements**:

- Check user role from `me` query
- Hide/show features based on permissions
- Redirect if insufficient permissions

**Implementation**:

```tsx
// hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useApp();

  const can = (permission: string) => {
    if (user?.role === 'admin') return true;

    const permissions = {
      'view:products': true,
      'create:products': user?.role === 'admin',
      'delete:orders': user?.role === 'admin',
      // ... more permissions
    };

    return permissions[permission] || false;
  };

  return { can };
}

// Component
function DeleteOrderButton({ orderId }: { orderId: string }) {
  const { can } = usePermissions();

  if (!can('delete:orders')) {
    return null; // Hide button
  }

  return (
    <Button variant="destructive" onClick={handleDelete}>
      Delete Order
    </Button>
  );
}
```

### GraphQL Query

```graphql
query Me {
  me {
    user {
      id
      email
      firstName
      lastName
      imageUrl
      tenantId
      role
    }
    tenant {
      id
      name
      description
      email
      phone
      website
      language
      status
      branding {
        logo_url
        primary_color
        invoice_footer
        company_address
      }
      currency_config {
        base_currency
        secondary_currency
        exchange_rate
      }
    }
    error
  }
}
```

### Caching Strategy

**Apollo Cache Configuration**:

```tsx
const apolloClient = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          me: {
            merge: true, // Always replace with latest data
          },
        },
      },
    },
  }),
});
```

**When to Refetch**:

```tsx
// After updating company settings
await updateTenant({ variables: { input } });
await refetch(); // Refetch me query

// After updating user profile
await updateUser();
await refetch();
```

### Error Handling

**Possible Errors**:

1. User not authenticated (401)
2. Tenant not found
3. Network error

**Error Display**:

```tsx
function ErrorBoundary({ error }: { error: string }) {
  const { signOut } = useClerk();

  if (error.includes('Tenant not found')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircleIcon className="h-16 w-16 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">Workspace Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          Your workspace could not be found. Please contact support.
        </p>
        <Button onClick={signOut} className="mt-4">
          Sign Out
        </Button>
      </div>
    );
  }

  return <GenericErrorPage error={error} />;
}
```

---

## Implementation Priority

### Phase 1: Essential (Week 1-2)

1. ✅ **Me Query Integration** - Bootstrap user context
2. ✅ **User Menu** - Profile display
3. ✅ **Tenant Branding** - Apply logo/colors
4. ✅ **Post-Signup Flow** - Onboarding wizard

### Phase 2: Core Features (Week 3-4)

1. ✅ **Order-Warehouse Selection** - Warehouse dropdown in order creation
2. ✅ **Inventory Validation** - Check availability before order
3. ✅ **Order Status Updates** - Show "Invoiced" badge
4. ✅ **Warehouse Info Display** - Show on order details

### Phase 3: Enhanced UX (Week 5-6)

1. ✅ **Inventory Distribution View** - Product page showing all warehouses
2. ✅ **Role-Based Access Control** - Hide/show features by role
3. ✅ **Error Recovery** - Handle webhook failures
4. ✅ **Loading States** - Skeleton loaders

---

## GraphQL Code Generation

### Setup

```bash
npm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo
```

### Configuration

**codegen.yml**:

```yaml
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

### Usage

Create query files:

```graphql
# queries/me.graphql
query Me {
  me {
    user {
      id
      email
      firstName
      lastName
      imageUrl
      tenantId
      role
    }
    tenant {
      id
      name
      branding {
        logo_url
        primary_color
      }
    }
  }
}
```

Generate types:

```bash
npm run codegen
```

Use in components:

```tsx
import { useMeQuery } from '@/types/generated';

function Component() {
  const { data, loading } = useMeQuery();
  // Types are automatically inferred!
}
```

---

## Testing Checklist

### Feature 1: Invoice-Order Coupling

- [ ] Create invoice from confirmed order
- [ ] Verify order status updates to "Invoiced"
- [ ] Verify "Invoiced" badge appears on order list
- [ ] Verify invoice link appears on order details
- [ ] Try to create duplicate invoice (should fail)
- [ ] Try to invoice draft order (should fail)

### Feature 2: Order-Warehouse Integration

- [ ] Create order without selecting warehouse (should use primary)
- [ ] Create order with specific warehouse selected
- [ ] Verify inventory validation (reject if insufficient stock)
- [ ] Confirm order and verify inventory is reserved
- [ ] Cancel order and verify inventory is released
- [ ] View product inventory distribution across warehouses

### Feature 3: Auto-Tenant Creation

- [ ] Sign up new user in Clerk
- [ ] Verify tenant is created automatically
- [ ] Verify user lands on onboarding page
- [ ] Complete onboarding wizard
- [ ] Verify company details are saved

### Feature 4: Me Query

- [ ] Login and verify user info loads
- [ ] Verify tenant branding is applied
- [ ] Verify user menu shows correct role
- [ ] Update company settings and verify refetch
- [ ] Sign out and sign back in

---

## Summary

**Total Development Effort**: 4-6 weeks

**Components to Build**: ~15
**GraphQL Queries**: ~8
**GraphQL Mutations**: ~5

**Key Technologies**:

- Next.js 14
- Apollo Client
- GraphQL Code Generator
- Clerk Auth
- shadcn/ui

All backend APIs are ready and documented. Frontend can start implementation immediately.

---

# PHASE 2: FLEET MANAGEMENT

## Document Update - Phase 2 Features

This section covers the newly implemented **Phase 2: Fleet Management** features, including Driver Management and Vehicle Management modules.

---

## Table of Contents - Phase 2

1. [Feature 5: Driver Management](#feature-5-driver-management)
2. [Feature 6: Vehicle Management](#feature-6-vehicle-management)
3. [Phase 2 Implementation Priority](#phase-2-implementation-priority)
4. [Phase 2 GraphQL Schema](#phase-2-graphql-schema)
5. [Phase 2 Testing Checklist](#phase-2-testing-checklist)

---

## Feature 5: Driver Management

### Overview

Complete driver management system for tracking delivery drivers, their licenses, contact information, and vehicle assignments.

### User Stories

**As a fleet manager**, I want to manage driver information so I can assign them to vehicles and track their license status.

**As a dispatcher**, I want to see which drivers are available and which vehicles they're assigned to.

**As an admin**, I want to receive alerts when driver licenses are expiring so we can renew them on time.

### UI Requirements

#### 1. Drivers List Page

**Location**: `app/drivers/page.tsx`

**Requirements**:

- Table view with driver code, name, status, vehicle assignment, license expiry
- Filter by status (Active, On Leave, Inactive)
- Search by driver code or name
- Pagination (10/25/50/100 per page)
- Quick actions: View, Edit, Delete
- Visual indicators for expiring licenses (30 days)

**Component Example**:

```tsx
import { DriversTable } from '@/components/drivers/DriversTable';
import { DriverFilters } from '@/components/drivers/DriverFilters';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

export default function DriversPage() {
  const [filters, setFilters] = useState<DriverFilterInput>({
    status: null,
    search: '',
    page: 1,
    limit: 25,
  });

  const { data, loading } = useDriversQuery({
    variables: { filter: filters },
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Drivers</h1>
          <p className="text-muted-foreground">
            Manage your delivery drivers and their assignments
          </p>
        </div>
        <Button asChild>
          <Link href="/drivers/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Driver
          </Link>
        </Button>
      </div>

      <DriverFilters filters={filters} onChange={setFilters} />

      <DriversTable
        drivers={data?.drivers?.drivers || []}
        loading={loading}
        pagination={{
          page: data?.drivers?.page || 1,
          limit: data?.drivers?.limit || 25,
          totalCount: data?.drivers?.totalCount || 0,
        }}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
}
```

**DriversTable Component**:

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, AlertTriangle } from 'lucide-react';
import { formatDate, isLicenseExpiringSoon } from '@/lib/utils';

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  ON_LEAVE: { label: 'On Leave', color: 'bg-yellow-100 text-yellow-700' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-700' },
};

export function DriversTable({ drivers, loading, pagination, onPageChange }) {
  if (loading) return <TableSkeleton />;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>License</TableHead>
            <TableHead>License Expiry</TableHead>
            <TableHead>Assigned Vehicle</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => {
            const licenseExpiring = isLicenseExpiringSoon(driver.license.expiry_date);

            return (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.driver_code}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {driver.first_name} {driver.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">{driver.contact.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusConfig[driver.status].color}>
                    {statusConfig[driver.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{driver.license.license_class.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {licenseExpiring && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    <span className={licenseExpiring ? 'text-amber-600 font-medium' : ''}>
                      {formatDate(driver.license.expiry_date)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {driver.assigned_vehicle_id ? (
                    <Link
                      href={`/vehicles/${driver.assigned_vehicle_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View Vehicle
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Not assigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{driver.contact.phone}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/drivers/${driver.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/drivers/${driver.id}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(driver.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Pagination
        page={pagination.page}
        limit={pagination.limit}
        totalCount={pagination.totalCount}
        onPageChange={onPageChange}
      />
    </div>
  );
}
```

#### 2. Create/Edit Driver Form

**Location**: `app/drivers/new/page.tsx`, `app/drivers/[id]/edit/page.tsx`

**Requirements**:

- Personal information (first name, last name, driver code)
- License information (class, number, issue/expiry dates)
- Contact information (phone, email, emergency contact)
- Vehicle assignment (optional)
- Notes field
- Form validation with inline errors

**Form Component**:

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const driverSchema = z.object({
  driver_code: z.string().min(1, 'Driver code is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  license: z.object({
    license_number: z.string().min(1, 'License number is required'),
    license_class: z.enum(['CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4']),
    issue_date: z.string(),
    expiry_date: z.string(),
  }),
  contact: z.object({
    phone: z.string().min(1, 'Phone is required'),
    email: z.string().email('Invalid email'),
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
  }),
  assigned_vehicle_id: z.string().optional(),
  notes: z.string().optional(),
});

type DriverFormData = z.infer<typeof driverSchema>;

export function DriverForm({ driver, onSubmit }: DriverFormProps) {
  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: driver || {
      driver_code: '',
      first_name: '',
      last_name: '',
      license: {
        license_class: 'CLASS_3',
        issue_date: '',
        expiry_date: '',
      },
      contact: {
        phone: '',
        email: '',
      },
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="driver_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="DRV001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* License Information */}
        <Card>
          <CardHeader>
            <CardTitle>License Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="license.license_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="license.license_class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Class *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CLASS_1">Class 1 (Motorcycle)</SelectItem>
                      <SelectItem value="CLASS_2">Class 2 (Car)</SelectItem>
                      <SelectItem value="CLASS_3">Class 3 (Truck)</SelectItem>
                      <SelectItem value="CLASS_4">Class 4 (Special)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="license.issue_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="license.expiry_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>You'll receive alerts 30 days before expiry</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="contact.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact.emergency_contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact.emergency_contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/drivers">Cancel</Link>
          </Button>
          <Button type="submit">{driver ? 'Update Driver' : 'Create Driver'}</Button>
        </div>
      </form>
    </Form>
  );
}
```

#### 3. Driver Details Page

**Location**: `app/drivers/[id]/page.tsx`

**Requirements**:

- Full driver information display
- License status with expiry countdown
- Assigned vehicle details
- Action buttons (Edit, Assign Vehicle, Deactivate)
- Activity history (assignments, status changes)

**Component**:

```tsx
export default function DriverDetailsPage({ params }: { params: { id: string } }) {
  const { data, loading } = useDriverQuery({
    variables: { id: params.id },
  });

  const driver = data?.driver?.driver;

  if (loading) return <DetailsSkeleton />;
  if (!driver) return <NotFound />;

  const licenseExpiringSoon = isLicenseExpiringSoon(driver.license.expiry_date);
  const daysUntilExpiry = getDaysUntil(driver.license.expiry_date);

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            {driver.first_name} {driver.last_name}
          </h1>
          <p className="text-muted-foreground">{driver.driver_code}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/drivers/${driver.id}/edit`}>Edit Driver</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                More Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleAssignVehicle}>Assign Vehicle</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeactivate}>Mark as On Leave</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                Delete Driver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge className={statusConfig[driver.status].color}>
                  {statusConfig[driver.status].label}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Driver Code</Label>
              <p className="mt-1 font-medium">{driver.driver_code}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Full Name</Label>
              <p className="mt-1">
                {driver.first_name} {driver.last_name}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* License Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              License Information
              {licenseExpiringSoon && (
                <Badge variant="destructive" className="ml-auto">
                  Expiring Soon
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {licenseExpiringSoon && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>License Expiring</AlertTitle>
                <AlertDescription>
                  This driver's license expires in {daysUntilExpiry} days. Please arrange renewal.
                </AlertDescription>
              </Alert>
            )}
            <div>
              <Label className="text-muted-foreground">License Number</Label>
              <p className="mt-1 font-mono">{driver.license.license_number}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">License Class</Label>
              <p className="mt-1">
                <Badge variant="outline">{driver.license.license_class.replace('_', ' ')}</Badge>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Issue Date</Label>
                <p className="mt-1">{formatDate(driver.license.issue_date)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Expiry Date</Label>
                <p className={cn('mt-1', licenseExpiringSoon && 'text-red-600 font-medium')}>
                  {formatDate(driver.license.expiry_date)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="mt-1">{driver.contact.phone}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="mt-1">{driver.contact.email}</p>
            </div>
            {driver.contact.emergency_contact_name && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Emergency Contact</Label>
                  <p className="mt-1">{driver.contact.emergency_contact_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {driver.contact.emergency_contact_phone}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Assigned Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            {driver.assigned_vehicle_id ? (
              <VehicleAssignmentCard vehicleId={driver.assigned_vehicle_id} />
            ) : (
              <div className="text-center py-6">
                <TruckIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No vehicle assigned</p>
                <Button variant="outline" className="mt-4" onClick={handleAssignVehicle}>
                  Assign Vehicle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {driver.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{driver.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

#### 4. Expiring Licenses Dashboard Widget

**Location**: `app/dashboard/page.tsx`

**Requirements**:

- Show drivers with licenses expiring within 30 days
- Sort by expiry date (soonest first)
- Quick action to view driver details
- Badge showing days remaining

**Component**:

```tsx
function ExpiringLicensesWidget() {
  const { data } = useDriversWithExpiringLicensesQuery();

  const drivers = data?.driversWithExpiringLicenses?.drivers || [];

  if (drivers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Driver Licenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
            <p className="mt-2 text-sm text-muted-foreground">All driver licenses are valid</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Expiring Licenses
        </CardTitle>
        <CardDescription>
          {drivers.length} driver license{drivers.length > 1 ? 's' : ''} expiring soon
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {drivers.map((driver) => {
            const daysRemaining = getDaysUntil(driver.license.expiry_date);

            return (
              <div
                key={driver.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {driver.first_name[0]}
                      {driver.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {driver.first_name} {driver.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{driver.driver_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={daysRemaining <= 7 ? 'destructive' : 'secondary'}>
                    {daysRemaining} days
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/drivers/${driver.id}`}>View</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <Button variant="outline" className="w-full mt-4" asChild>
          <Link href="/drivers?filter=expiring">View All Expiring Licenses</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

### GraphQL Queries & Mutations - Drivers

#### Get All Drivers

```graphql
query GetDrivers($filter: DriverFilterInput) {
  drivers(filter: $filter) {
    drivers {
      id
      driver_code
      first_name
      last_name
      status
      license {
        license_number
        license_class
        issue_date
        expiry_date
      }
      contact {
        phone
        email
        emergency_contact_name
        emergency_contact_phone
      }
      assigned_vehicle_id
      notes
      createdAt
      updatedAt
    }
    length
    page
    limit
    totalCount
    error {
      field
      message
    }
  }
}
```

#### Get Single Driver

```graphql
query GetDriver($id: ID!) {
  driver(id: $id) {
    driver {
      id
      driver_code
      first_name
      last_name
      status
      license {
        license_number
        license_class
        issue_date
        expiry_date
      }
      contact {
        phone
        email
        emergency_contact_name
        emergency_contact_phone
      }
      assigned_vehicle_id
      notes
      createdAt
      updatedAt
      created_by
      updated_by
    }
    error {
      field
      message
    }
  }
}
```

#### Create Driver

```graphql
mutation CreateDriver($input: CreateDriverInput!) {
  createDriver(input: $input) {
    driver {
      id
      driver_code
      first_name
      last_name
      status
    }
    error {
      field
      message
    }
  }
}
```

#### Update Driver

```graphql
mutation UpdateDriver($id: ID!, $input: UpdateDriverInput!) {
  updateDriver(id: $id, input: $input) {
    driver {
      id
      driver_code
      first_name
      last_name
      status
      license {
        expiry_date
      }
    }
    error {
      field
      message
    }
  }
}
```

#### Delete Driver

```graphql
mutation DeleteDriver($id: ID!) {
  deleteDriver(id: $id) {
    driver {
      id
      driver_code
    }
    error {
      field
      message
    }
  }
}
```

#### Assign Vehicle to Driver

```graphql
mutation AssignVehicleToDriver($id: ID!, $input: AssignVehicleInput!) {
  assignVehicleToDriver(id: $id, input: $input) {
    driver {
      id
      assigned_vehicle_id
    }
    error {
      field
      message
    }
  }
}
```

#### Get Drivers with Expiring Licenses

```graphql
query GetDriversWithExpiringLicenses {
  driversWithExpiringLicenses {
    drivers {
      id
      driver_code
      first_name
      last_name
      license {
        license_number
        expiry_date
      }
      contact {
        phone
        email
      }
    }
    length
    totalCount
    error {
      field
      message
    }
  }
}
```

### Error Handling - Drivers

**Possible Errors**:

1. `DRIVER_NOT_FOUND` - Driver doesn't exist
2. `DRIVER_ALREADY_EXISTS` - Driver code already in use
3. `INVALID_OBJECT_ID` - Malformed driver ID
4. `INTERNAL_SERVER_ERROR` - Server error

**User-Friendly Messages**:

```tsx
const driverErrorMessages = {
  DRIVER_NOT_FOUND: 'Driver not found. They may have been deleted.',
  DRIVER_ALREADY_EXISTS: 'A driver with this code already exists. Please use a unique code.',
  INVALID_OBJECT_ID: 'Invalid driver ID provided.',
  INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again.',
};

// Display in toast
if (error) {
  toast.error(driverErrorMessages[error.field] || error.message);
}
```

---

## Feature 6: Vehicle Management

### Overview

Complete vehicle fleet management system for tracking vehicles, maintenance schedules, insurance policies, and driver assignments.

### User Stories

**As a fleet manager**, I want to track all vehicles, their maintenance schedules, and insurance status.

**As a dispatcher**, I want to see which vehicles are available and who they're assigned to.

**As an admin**, I want to receive alerts for expiring insurance and upcoming maintenance.

### UI Requirements

#### 1. Vehicles List Page

**Location**: `app/vehicles/page.tsx`

**Requirements**:

- Card/table view toggle
- Filter by status (Active, In Maintenance, Out of Service, Retired)
- Filter by vehicle type
- Search by vehicle code, license plate, make, or model
- Visual indicators for insurance expiry and maintenance due
- Quick actions: View, Edit, Assign Driver, Delete

**Component** (Card View):

```tsx
export default function VehiclesPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<VehicleFilterInput>({
    status: null,
    vehicle_type: null,
    search: '',
    page: 1,
    limit: 12,
  });

  const { data, loading } = useVehiclesQuery({
    variables: { filter: filters },
  });

  const vehicles = data?.vehicles?.vehicles || [];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Fleet Vehicles</h1>
          <p className="text-muted-foreground">
            Manage your delivery fleet and maintenance schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'grid' | 'list')}>
            <TabsList>
              <TabsTrigger value="grid">
                <Grid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button asChild>
            <Link href="/vehicles/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </div>
      </div>

      <VehicleFilters filters={filters} onChange={setFilters} />

      {view === 'grid' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <VehiclesTable vehicles={vehicles} />
      )}

      <Pagination
        page={data?.vehicles?.page || 1}
        limit={data?.vehicles?.limit || 12}
        totalCount={data?.vehicles?.totalCount || 0}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
}
```

**VehicleCard Component**:

```tsx
const vehicleTypeIcons = {
  MOTORCYCLE: Bike,
  CAR: Car,
  VAN: Van,
  SMALL_TRUCK: Truck,
  MEDIUM_TRUCK: Truck,
  LARGE_TRUCK: Truck,
  REFRIGERATED_TRUCK: Refrigerator,
};

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  IN_MAINTENANCE: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-700' },
  OUT_OF_SERVICE: { label: 'Out of Service', color: 'bg-red-100 text-red-700' },
  RETIRED: { label: 'Retired', color: 'bg-gray-100 text-gray-700' },
};

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const Icon = vehicleTypeIcons[vehicle.vehicle_type];
  const insuranceExpiring =
    vehicle.insurance && isInsuranceExpiringSoon(vehicle.insurance.expiry_date);
  const maintenanceDue =
    vehicle.maintenance && isMaintenanceDue(vehicle.maintenance.next_maintenance_date);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {vehicle.make} {vehicle.vehicle_model}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{vehicle.vehicle_code}</p>
            </div>
          </div>
          <Badge className={statusConfig[vehicle.status].color}>
            {statusConfig[vehicle.status].label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alerts */}
        {(insuranceExpiring || maintenanceDue) && (
          <div className="space-y-2">
            {insuranceExpiring && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Insurance expiring {formatRelative(vehicle.insurance.expiry_date)}
                </AlertDescription>
              </Alert>
            )}
            {maintenanceDue && (
              <Alert className="py-2 bg-amber-50 border-amber-200">
                <Wrench className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  Maintenance due {formatRelative(vehicle.maintenance.next_maintenance_date)}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Vehicle Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground">License Plate</Label>
            <p className="font-mono font-medium mt-1">{vehicle.license_plate}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Year</Label>
            <p className="mt-1">{vehicle.year}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Type</Label>
            <p className="mt-1 text-xs">
              <Badge variant="outline">{vehicle.vehicle_type.replace(/_/g, ' ')}</Badge>
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Fuel</Label>
            <p className="mt-1 text-xs">
              <Badge variant="outline">{vehicle.fuel_type}</Badge>
            </p>
          </div>
        </div>

        {/* Driver Assignment */}
        <div>
          <Label className="text-muted-foreground text-xs">Assigned Driver</Label>
          {vehicle.assigned_driver_id ? (
            <Link
              href={`/drivers/${vehicle.assigned_driver_id}`}
              className="flex items-center gap-2 mt-1 text-sm text-blue-600 hover:underline"
            >
              <User className="h-4 w-4" />
              View Driver
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">Not assigned</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/vehicles/${vehicle.id}`}>View Details</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/vehicles/${vehicle.id}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAssignDriver(vehicle.id)}>
              Assign Driver
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(vehicle.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
```

#### 2. Create/Edit Vehicle Form

**Location**: `app/vehicles/new/page.tsx`, `app/vehicles/[id]/edit/page.tsx`

**Requirements**:

- Basic information (vehicle code, license plate, make, model, year)
- Type and fuel selection
- Maintenance information (last/next dates, mileage)
- Insurance information (policy, provider, expiry, coverage)
- Home warehouse assignment
- Capacity fields (fuel, cargo)
- Notes field

**Form Schema**:

```tsx
const vehicleSchema = z.object({
  vehicle_code: z.string().min(1, 'Vehicle code is required'),
  license_plate: z.string().min(1, 'License plate is required'),
  vehicle_type: z.enum([
    'MOTORCYCLE',
    'CAR',
    'VAN',
    'SMALL_TRUCK',
    'MEDIUM_TRUCK',
    'LARGE_TRUCK',
    'REFRIGERATED_TRUCK',
  ]),
  make: z.string().min(1, 'Make is required'),
  vehicle_model: z.string().min(1, 'Model is required'),
  year: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  fuel_type: z.enum(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG']),
  fuel_capacity: z.number().optional(),
  cargo_capacity: z.number().optional(),
  maintenance: z
    .object({
      last_maintenance_date: z.string(),
      next_maintenance_date: z.string().optional(),
      maintenance_interval_km: z.number().optional(),
      current_mileage: z.number().optional(),
    })
    .optional(),
  insurance: z
    .object({
      policy_number: z.string().min(1),
      provider: z.string().min(1),
      expiry_date: z.string(),
      coverage_amount: z.number().optional(),
    })
    .optional(),
  home_warehouse_id: z.string().optional(),
  notes: z.string().optional(),
});
```

**Form Component Structure**:

```tsx
export function VehicleForm({ vehicle, onSubmit }: VehicleFormProps) {
  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle || defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {/* Vehicle code, license plate, make, model, year */}
          </CardContent>
        </Card>

        {/* Vehicle Specifications Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Vehicle Specifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {/* Vehicle type, fuel type, capacities */}
          </CardContent>
        </Card>

        {/* Maintenance Information Card (Optional) */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Maintenance Information</CardTitle>
              <Badge variant="secondary">Optional</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {/* Maintenance dates, intervals, mileage */}
          </CardContent>
        </Card>

        {/* Insurance Information Card (Optional) */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Insurance Information</CardTitle>
              <Badge variant="secondary">Optional</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {/* Policy number, provider, expiry, coverage */}
          </CardContent>
        </Card>

        {/* Assignment Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent>{/* Home warehouse selection */}</CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/vehicles">Cancel</Link>
          </Button>
          <Button type="submit">{vehicle ? 'Update Vehicle' : 'Create Vehicle'}</Button>
        </div>
      </form>
    </Form>
  );
}
```

#### 3. Vehicle Details Page

**Location**: `app/vehicles/[id]/page.tsx`

**Requirements**:

- Complete vehicle information display
- Maintenance schedule and history
- Insurance details with expiry countdown
- Assigned driver information
- Home warehouse link
- Action buttons (Edit, Assign Driver, Maintenance, Retire)

```tsx
export default function VehicleDetailsPage({ params }: { params: { id: string } }) {
  const { data, loading } = useVehicleQuery({
    variables: { id: params.id },
  });

  const vehicle = data?.vehicle?.vehicle;

  if (loading) return <DetailsSkeleton />;
  if (!vehicle) return <NotFound />;

  const Icon = vehicleTypeIcons[vehicle.vehicle_type];
  const insuranceExpiring =
    vehicle.insurance && isInsuranceExpiringSoon(vehicle.insurance.expiry_date);
  const maintenanceDue =
    vehicle.maintenance && isMaintenanceDue(vehicle.maintenance.next_maintenance_date);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {vehicle.make} {vehicle.vehicle_model}
            </h1>
            <p className="text-muted-foreground">
              {vehicle.vehicle_code} • {vehicle.license_plate}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/vehicles/${vehicle.id}/edit`}>Edit Vehicle</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                More Actions
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleAssignDriver}>Assign Driver</DropdownMenuItem>
              <DropdownMenuItem onClick={handleScheduleMaintenance}>
                Schedule Maintenance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRetire}>Mark as Retired</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                Delete Vehicle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Alert Banners */}
      {(insuranceExpiring || maintenanceDue) && (
        <div className="grid gap-4 mb-6 md:grid-cols-2">
          {insuranceExpiring && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Insurance Expiring Soon</AlertTitle>
              <AlertDescription>
                Insurance policy expires on {formatDate(vehicle.insurance.expiry_date)}. Please
                arrange renewal.
              </AlertDescription>
            </Alert>
          )}
          {maintenanceDue && (
            <Alert className="bg-amber-50 border-amber-200">
              <Wrench className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Maintenance Due</AlertTitle>
              <AlertDescription className="text-amber-800">
                Next maintenance scheduled for{' '}
                {formatDate(vehicle.maintenance.next_maintenance_date)}.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge className={statusConfig[vehicle.status].color}>
                  {statusConfig[vehicle.status].label}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Vehicle Code</Label>
                <p className="mt-1 font-medium">{vehicle.vehicle_code}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">License Plate</Label>
                <p className="mt-1 font-mono font-medium">{vehicle.license_plate}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Make</Label>
                <p className="mt-1">{vehicle.make}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Model</Label>
                <p className="mt-1">{vehicle.vehicle_model}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Year</Label>
                <p className="mt-1">{vehicle.year}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="mt-1">
                  <Badge variant="outline">{vehicle.vehicle_type.replace(/_/g, ' ')}</Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Fuel Type</Label>
                <p className="mt-1">
                  <Badge variant="outline">{vehicle.fuel_type}</Badge>
                </p>
              </div>
              {vehicle.fuel_capacity && (
                <div>
                  <Label className="text-muted-foreground">Fuel Capacity</Label>
                  <p className="mt-1">{vehicle.fuel_capacity}L</p>
                </div>
              )}
              {vehicle.cargo_capacity && (
                <div>
                  <Label className="text-muted-foreground">Cargo Capacity</Label>
                  <p className="mt-1">{vehicle.cargo_capacity} kg</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Information */}
        {vehicle.maintenance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Last Maintenance</Label>
                  <p className="mt-1">{formatDate(vehicle.maintenance.last_maintenance_date)}</p>
                </div>
                {vehicle.maintenance.next_maintenance_date && (
                  <div>
                    <Label className="text-muted-foreground">Next Maintenance</Label>
                    <p className={cn('mt-1', maintenanceDue && 'text-amber-600 font-medium')}>
                      {formatDate(vehicle.maintenance.next_maintenance_date)}
                    </p>
                  </div>
                )}
                {vehicle.maintenance.current_mileage && (
                  <div>
                    <Label className="text-muted-foreground">Current Mileage</Label>
                    <p className="mt-1">
                      {vehicle.maintenance.current_mileage.toLocaleString()} km
                    </p>
                  </div>
                )}
                {vehicle.maintenance.maintenance_interval_km && (
                  <div>
                    <Label className="text-muted-foreground">Interval</Label>
                    <p className="mt-1">
                      Every {vehicle.maintenance.maintenance_interval_km.toLocaleString()} km
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insurance Information */}
        {vehicle.insurance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Insurance Information
                {insuranceExpiring && (
                  <Badge variant="destructive" className="ml-auto">
                    Expiring Soon
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Policy Number</Label>
                  <p className="mt-1 font-mono">{vehicle.insurance.policy_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Provider</Label>
                  <p className="mt-1">{vehicle.insurance.provider}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p className={cn('mt-1', insuranceExpiring && 'text-red-600 font-medium')}>
                    {formatDate(vehicle.insurance.expiry_date)}
                  </p>
                </div>
                {vehicle.insurance.coverage_amount && (
                  <div>
                    <Label className="text-muted-foreground">Coverage</Label>
                    <p className="mt-1">${vehicle.insurance.coverage_amount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assigned Driver */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Driver</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle.assigned_driver_id ? (
              <DriverAssignmentCard driverId={vehicle.assigned_driver_id} />
            ) : (
              <div className="text-center py-6">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No driver assigned</p>
                <Button variant="outline" className="mt-4" onClick={handleAssignDriver}>
                  Assign Driver
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Home Warehouse */}
        {vehicle.home_warehouse_id && (
          <Card>
            <CardHeader>
              <CardTitle>Home Warehouse</CardTitle>
            </CardHeader>
            <CardContent>
              <WarehouseLink warehouseId={vehicle.home_warehouse_id} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      {vehicle.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

#### 4. Fleet Dashboard Widgets

**Maintenance & Insurance Alerts**:

```tsx
function FleetAlertsWidget() {
  const { data: insurance } = useVehiclesWithExpiringInsuranceQuery();
  const { data: maintenance } = useVehiclesMaintenanceDueQuery();

  const insuranceVehicles = insurance?.vehiclesWithExpiringInsurance?.vehicles || [];
  const maintenanceVehicles = maintenance?.vehiclesMaintenanceDue?.vehicles || [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Insurance Expiring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Insurance Expiring
          </CardTitle>
          <CardDescription>
            {insuranceVehicles.length} vehicle{insuranceVehicles.length !== 1 ? 's' : ''} with
            expiring insurance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {insuranceVehicles.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm text-muted-foreground">
                All vehicle insurance policies are valid
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insuranceVehicles.map((vehicle) => (
                <VehicleAlertItem
                  key={vehicle.id}
                  vehicle={vehicle}
                  date={vehicle.insurance.expiry_date}
                  type="insurance"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Due */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Due
          </CardTitle>
          <CardDescription>
            {maintenanceVehicles.length} vehicle{maintenanceVehicles.length !== 1 ? 's' : ''} due
            for maintenance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {maintenanceVehicles.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
              <p className="mt-2 text-sm text-muted-foreground">All vehicles are up to date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {maintenanceVehicles.map((vehicle) => (
                <VehicleAlertItem
                  key={vehicle.id}
                  vehicle={vehicle}
                  date={vehicle.maintenance.next_maintenance_date}
                  type="maintenance"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### GraphQL Queries & Mutations - Vehicles

#### Get All Vehicles

```graphql
query GetVehicles($filter: VehicleFilterInput) {
  vehicles(filter: $filter) {
    vehicles {
      id
      vehicle_code
      license_plate
      vehicle_type
      status
      make
      vehicle_model
      year
      fuel_type
      fuel_capacity
      cargo_capacity
      maintenance {
        last_maintenance_date
        next_maintenance_date
        maintenance_interval_km
        current_mileage
      }
      insurance {
        policy_number
        provider
        expiry_date
        coverage_amount
      }
      assigned_driver_id
      home_warehouse_id
      notes
      createdAt
      updatedAt
    }
    length
    page
    limit
    totalCount
    error {
      field
      message
    }
  }
}
```

#### Get Single Vehicle

```graphql
query GetVehicle($id: ID!) {
  vehicle(id: $id) {
    vehicle {
      id
      vehicle_code
      license_plate
      vehicle_type
      status
      make
      vehicle_model
      year
      fuel_type
      fuel_capacity
      cargo_capacity
      maintenance {
        last_maintenance_date
        next_maintenance_date
        maintenance_interval_km
        current_mileage
      }
      insurance {
        policy_number
        provider
        expiry_date
        coverage_amount
      }
      assigned_driver_id
      home_warehouse_id
      notes
      createdAt
      updatedAt
      created_by
      updated_by
    }
    error {
      field
      message
    }
  }
}
```

#### Create Vehicle

```graphql
mutation CreateVehicle($input: CreateVehicleInput!) {
  createVehicle(input: $input) {
    vehicle {
      id
      vehicle_code
      license_plate
      make
      vehicle_model
    }
    error {
      field
      message
    }
  }
}
```

#### Update Vehicle

```graphql
mutation UpdateVehicle($id: ID!, $input: UpdateVehicleInput!) {
  updateVehicle(id: $id, input: $input) {
    vehicle {
      id
      vehicle_code
      status
      maintenance {
        next_maintenance_date
      }
    }
    error {
      field
      message
    }
  }
}
```

#### Delete Vehicle

```graphql
mutation DeleteVehicle($id: ID!) {
  deleteVehicle(id: $id) {
    vehicle {
      id
      vehicle_code
    }
    error {
      field
      message
    }
  }
}
```

#### Assign Driver to Vehicle

```graphql
mutation AssignDriverToVehicle($vehicleId: ID!, $driverId: ID!) {
  assignDriverToVehicle(vehicleId: $vehicleId, driverId: $driverId) {
    vehicle {
      id
      assigned_driver_id
    }
    error {
      field
      message
    }
  }
}
```

#### Get Vehicles with Expiring Insurance

```graphql
query GetVehiclesWithExpiringInsurance {
  vehiclesWithExpiringInsurance {
    vehicles {
      id
      vehicle_code
      license_plate
      make
      vehicle_model
      insurance {
        policy_number
        provider
        expiry_date
      }
    }
    length
    totalCount
    error {
      field
      message
    }
  }
}
```

#### Get Vehicles Due for Maintenance

```graphql
query GetVehiclesMaintenanceDue {
  vehiclesMaintenanceDue {
    vehicles {
      id
      vehicle_code
      license_plate
      make
      vehicle_model
      maintenance {
        last_maintenance_date
        next_maintenance_date
        current_mileage
      }
    }
    length
    totalCount
    error {
      field
      message
    }
  }
}
```

### Error Handling - Vehicles

**Possible Errors**:

1. `VEHICLE_NOT_FOUND` - Vehicle doesn't exist
2. `VEHICLE_ALREADY_EXISTS` - Vehicle code or license plate already in use
3. `INVALID_OBJECT_ID` - Malformed vehicle ID
4. `INTERNAL_SERVER_ERROR` - Server error

**User-Friendly Messages**:

```tsx
const vehicleErrorMessages = {
  VEHICLE_NOT_FOUND: 'Vehicle not found. It may have been deleted.',
  VEHICLE_ALREADY_EXISTS: 'A vehicle with this code or license plate already exists.',
  INVALID_OBJECT_ID: 'Invalid vehicle ID provided.',
  INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again.',
};
```

---

## Phase 2 Implementation Priority

### Week 1-2: Core Infrastructure

1. ✅ Set up Driver and Vehicle pages (list, detail, form)
2. ✅ Implement basic CRUD operations
3. ✅ Create reusable components (status badges, filters, tables)
4. ✅ Integrate GraphQL queries and mutations

### Week 3-4: Enhanced Features

1. ✅ Build dashboard widgets (expiring licenses, maintenance alerts)
2. ✅ Implement driver-vehicle assignment flows
3. ✅ Add search and filtering
4. ✅ Create detail pages with full information display

### Week 5-6: Polish & Integration

1. ✅ Add form validation and error handling
2. ✅ Implement loading states and skeletons
3. ✅ Build alert systems (notifications for expiring items)
4. ✅ Add responsive design improvements
5. ✅ Integration testing

---

## Phase 2 GraphQL Schema

### Type Definitions

```graphql
# Driver Types
enum DriverStatus {
  ACTIVE
  ON_LEAVE
  INACTIVE
}

enum LicenseClass {
  CLASS_1 # Motorcycle
  CLASS_2 # Car
  CLASS_3 # Truck
  CLASS_4 # Special vehicles
}

type DriverLicense {
  license_number: String!
  license_class: LicenseClass!
  issue_date: String!
  expiry_date: String!
}

type DriverContact {
  phone: String!
  email: String!
  emergency_contact_name: String
  emergency_contact_phone: String
}

type Driver {
  id: ID!
  tenant_id: ID!
  driver_code: String!
  first_name: String!
  last_name: String!
  status: DriverStatus!
  license: DriverLicense!
  contact: DriverContact!
  assigned_vehicle_id: ID
  notes: String
  createdAt: String!
  updatedAt: String!
  created_by: String!
  updated_by: String
}

# Vehicle Types
enum VehicleType {
  MOTORCYCLE
  CAR
  VAN
  SMALL_TRUCK
  MEDIUM_TRUCK
  LARGE_TRUCK
  REFRIGERATED_TRUCK
}

enum VehicleStatus {
  ACTIVE
  IN_MAINTENANCE
  OUT_OF_SERVICE
  RETIRED
}

enum FuelType {
  GASOLINE
  DIESEL
  ELECTRIC
  HYBRID
  CNG
}

type VehicleMaintenance {
  last_maintenance_date: String!
  next_maintenance_date: String
  maintenance_interval_km: Int
  current_mileage: Int
}

type VehicleInsurance {
  policy_number: String!
  provider: String!
  expiry_date: String!
  coverage_amount: Float
}

type Vehicle {
  id: ID!
  tenant_id: ID!
  vehicle_code: String!
  license_plate: String!
  vehicle_type: VehicleType!
  status: VehicleStatus!
  make: String!
  vehicle_model: String!
  year: Int!
  fuel_type: FuelType!
  fuel_capacity: Float
  cargo_capacity: Float
  maintenance: VehicleMaintenance
  insurance: VehicleInsurance
  assigned_driver_id: ID
  home_warehouse_id: ID
  notes: String
  createdAt: String!
  updatedAt: String!
  created_by: String!
  updated_by: String
}
```

---

## Phase 2 Testing Checklist

### Driver Management

- [ ] Create driver with all required fields
- [ ] Create driver with optional emergency contact
- [ ] Update driver information
- [ ] Update driver license information
- [ ] Delete driver (should be soft delete)
- [ ] Assign vehicle to driver
- [ ] Unassign vehicle from driver
- [ ] Filter drivers by status
- [ ] Search drivers by code or name
- [ ] View drivers with expiring licenses (30 days)
- [ ] Verify license expiry alerts appear
- [ ] Try to create driver with duplicate code (should fail)
- [ ] Test pagination

### Vehicle Management

- [ ] Create vehicle with all required fields
- [ ] Create vehicle with optional maintenance info
- [ ] Create vehicle with optional insurance info
- [ ] Update vehicle information
- [ ] Update vehicle status
- [ ] Delete vehicle
- [ ] Assign driver to vehicle
- [ ] Unassign driver from vehicle
- [ ] Filter vehicles by status
- [ ] Filter vehicles by type
- [ ] Search vehicles by code, plate, make, or model
- [ ] View vehicles with expiring insurance (30 days)
- [ ] View vehicles due for maintenance
- [ ] Verify insurance expiry alerts appear
- [ ] Verify maintenance due alerts appear
- [ ] Try to create vehicle with duplicate code (should fail)
- [ ] Try to create vehicle with duplicate license plate (should fail)
- [ ] Test pagination
- [ ] Toggle between grid and list views

### Integration

- [ ] Assign driver to vehicle from driver page
- [ ] Assign driver to vehicle from vehicle page
- [ ] Verify driver shows assigned vehicle
- [ ] Verify vehicle shows assigned driver
- [ ] Unassign and verify both records update
- [ ] Dashboard widgets show correct counts
- [ ] Dashboard widgets link to detail pages

---

## Phase 2 Summary

**Total Development Effort**: 5-6 weeks

**Components to Build**: ~20

- DriversTable
- DriverForm
- DriverCard
- DriverFilters
- VehiclesTable (with grid/list toggle)
- VehicleCard
- VehicleForm
- VehicleFilters
- ExpiringLicensesWidget
- FleetAlertsWidget
- AssignmentDialogs
- StatusBadges
- And more...

**GraphQL Queries**: ~10
**GraphQL Mutations**: ~8

**Key Technologies**:

- Next.js 14
- Apollo Client
- GraphQL Code Generator
- shadcn/ui
- React Hook Form
- Zod validation
- Lucide icons

**Key Features Delivered**:

- Complete driver management with license tracking
- Complete vehicle management with maintenance/insurance tracking
- Driver-vehicle assignment system
- Alert system for expiring licenses and insurance
- Maintenance scheduling
- Search and filtering
- Responsive design with grid/list views
- Dashboard widgets for fleet monitoring

All Phase 2 backend APIs are ready and fully tested. Frontend can start implementation immediately.

---

**End of Phase 2 Documentation**
