import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Filter,
  Trash,
  Search,
  ShoppingCart,
  User,
  Package,
  FileText,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useGetCustomersQuery,
  useGetProductsQuery,
  type OrderItemInput,
} from '../types/generated';
import { useToast } from '../hooks/use-toast';
import { OrderStatus, Currency } from '../utils/constants';

interface OrderItemForm {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price_usd: number;
  subtotal_usd: number;
}

const ORDER_WIZARD_STEPS = [
  { id: 1, title: 'Customer', icon: User },
  { id: 2, title: 'Products', icon: Package },
  { id: 3, title: 'Review', icon: FileText },
];

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(Currency.USD);
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const { toast } = useToast();
  const { formatDual } = useCurrency();

  const { data: ordersData, loading, refetch } = useGetOrdersQuery({
    variables: { filter: statusFilter && statusFilter !== 'all' ? { status: statusFilter } : undefined },
  });

  const { data: customersData } = useGetCustomersQuery();
  const { data: productsData } = useGetProductsQuery({
    variables: { filter: { search: productSearch } },
  });

  const [createOrder, { loading: creating }] = useCreateOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const orders = ordersData?.orders?.orders || [];
  const customers = customersData?.customers?.customers || [];
  const products = productsData?.products?.products || [];

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
    setCurrentStep(1);
    setSelectedCustomerId('');
    setSelectedCurrency(Currency.USD);
    setOrderItems([]);
    setNotes('');
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setCurrentStep(1);
    setSelectedCustomerId('');
    setOrderItems([]);
    setNotes('');
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedCustomerId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a customer',
      });
      return;
    }
    if (currentStep === 2 && orderItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one product',
      });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, ORDER_WIZARD_STEPS.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleAddProduct = (product: any) => {
    const existingItem = orderItems.find((item) => item.product_id === product.id);
    if (existingItem) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Product already added to order',
      });
      return;
    }

    const newItem: OrderItemForm = {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_price_usd: product.price_usd,
      subtotal_usd: product.price_usd,
    };

    setOrderItems([...orderItems, newItem]);
    setProductSearch('');
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setOrderItems((items) =>
      items.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
              subtotal_usd: item.unit_price_usd * quantity,
            }
          : item
      )
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setOrderItems((items) => items.filter((item) => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.subtotal_usd, 0);
  };

  const handleCreateOrder = async () => {
    const items: OrderItemInput[] = orderItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price_usd: item.unit_price_usd,
    }));

    try {
      const result = await createOrder({
        variables: {
          input: {
            customer_id: selectedCustomerId,
            items,
            currency_used: selectedCurrency,
            notes: notes || null,
          },
        },
      });

      if (result.data?.createOrder?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.createOrder.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Order created successfully',
        });
        handleCloseCreateDialog();
        refetch();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred',
      });
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const result = await updateOrderStatus({
        variables: {
          id: orderId,
          input: { status: newStatus },
        },
      });

      if (result.data?.updateOrderStatus?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.updateOrderStatus.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Order status updated successfully',
        });
        refetch();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred',
      });
    }
  };

  const selectedCustomer = customers.find((c: any) => c._id === selectedCustomerId);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground mt-1">Manage your sales orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value={OrderStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={OrderStatus.CONFIRMED}>Confirmed</SelectItem>
                  <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                  <SelectItem value={OrderStatus.INVOICED}>Invoiced</SelectItem>
                  <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No orders found. Create your first order to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => {
                  const { usd } = formatDual(order.total_usd);
                  const customer = customers.find((c: any) => c._id === order.customer_id);

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">
                        {customer?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{order.items?.length || 0} items</TableCell>
                      <TableCell className="font-medium">{usd}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.currency_used}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={OrderStatus.DRAFT}>Draft</SelectItem>
                            <SelectItem value={OrderStatus.CONFIRMED}>Confirmed</SelectItem>
                            <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                            <SelectItem value={OrderStatus.INVOICED}>Invoiced</SelectItem>
                            <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Order Wizard Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Follow the steps to create a new sales order
            </DialogDescription>
          </DialogHeader>

          {/* Wizard Steps */}
          <div className="flex items-center justify-center gap-2 py-4">
            {ORDER_WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.id
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
                {index < ORDER_WIZARD_STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {/* Step 1: Select Customer */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">
                    Select Customer <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Choose a customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.name}
                          {customer.email && ` (${customer.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomer && (
                  <Card>
                    <CardHeader>
                      <h4 className="text-sm font-semibold">Customer Details</h4>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{' '}
                        <span className="font-medium">{selectedCustomer.name}</span>
                      </div>
                      {selectedCustomer.email && (
                        <div>
                          <span className="text-muted-foreground">Email:</span>{' '}
                          {selectedCustomer.email}
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div>
                          <span className="text-muted-foreground">Phone:</span>{' '}
                          {selectedCustomer.phone}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 2: Add Products */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productSearch">Add Products</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="productSearch"
                      placeholder="Search products by name or SKU..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {productSearch && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {products.map((product: any) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer"
                          onClick={() => handleAddProduct(product)}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              SKU: {product.sku} • ${product.price_usd}
                            </div>
                          </div>
                          <Plus className="w-4 h-4" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {orderItems.length > 0 && (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.product_id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.product_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.product_sku}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>${item.unit_price_usd.toFixed(2)}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateQuantity(
                                    item.product_id,
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              ${item.subtotal_usd.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveProduct(item.product_id)}
                              >
                                <Trash className="w-4 h-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {orderItems.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-md">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">
                      No products added yet. Search and add products above.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <h4 className="text-sm font-semibold">Order Summary</h4>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Customer</div>
                      <div className="font-medium">{selectedCustomer?.name}</div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Products</div>
                      <div className="space-y-2">
                        {orderItems.map((item) => (
                          <div
                            key={item.product_id}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.product_name} x {item.quantity}
                            </span>
                            <span className="font-medium">
                              ${item.subtotal_usd.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={(value) => setSelectedCurrency(value as Currency)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Currency.USD}>USD</SelectItem>
                      <SelectItem value={Currency.LBP}>LBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any additional notes for this order..."
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleCloseCreateDialog}>
              Cancel
            </Button>
            {currentStep < ORDER_WIZARD_STEPS.length ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleCreateOrder} disabled={creating}>
                {creating ? 'Creating...' : 'Create Order'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
