import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User,
  Package,
  FileText,
  ChevronRight,
  ChevronLeft,
  Search,
  Trash,
  Plus,
  Minus,
} from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import {
  useCreateOrderMutation,
  useGetCustomersQuery,
  useGetProductsQuery,
  type OrderItemInput,
} from '../types/generated';
import { useToast } from '../hooks/use-toast';
import { Currency as CurrencyEnum } from '../types/generated';

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

export default function OrderCreate() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyEnum>(CurrencyEnum.Usd);
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const { toast } = useToast();
  const { formatDual } = useCurrency();

  const { data: customersData } = useGetCustomersQuery();
  const { data: productsData } = useGetProductsQuery({
    variables: { filter: { search: productSearch } },
  });

  const [createOrder, { loading: creating }] = useCreateOrderMutation();

  const customers = customersData?.customers?.customers || [];
  const products = productsData?.products?.products || [];

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
            notes: notes || undefined,
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
        navigate('/orders');
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Order</h1>
          <p className="text-muted-foreground mt-2">Create a new sales order</p>
        </div>
      </div>

      {/* Wizard Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {ORDER_WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                        isActive || isCompleted
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30 bg-background text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`font-medium ${
                        isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < ORDER_WIZARD_STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-4 bg-muted-foreground/30" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Customer */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Customer</CardTitle>
            <CardDescription>Choose the customer for this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">
                Customer <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name} {customer.email && `(${customer.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={selectedCurrency} onValueChange={(value) => setSelectedCurrency(value as CurrencyEnum)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CurrencyEnum.Usd}>USD</SelectItem>
                  <SelectItem value={CurrencyEnum.Lbp}>LBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add Products */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Products</CardTitle>
            <CardDescription>Add products to the order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-search">Search Products</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="product-search"
                  placeholder="Search by name or SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {productSearch && products.length > 0 && (
                <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                  {products.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => handleAddProduct(product)}
                    >
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                      </div>
                      <div className="text-sm font-medium">${product.price_usd.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No products added yet. Search and click to add products.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-32">Unit Price</TableHead>
                    <TableHead className="w-40">Quantity</TableHead>
                    <TableHead className="w-32 text-right">Subtotal</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => {
                    const { usd, lbp } = formatDual(item.subtotal_usd);
                    return (
                      <TableRow key={item.product_id}>
                        <TableCell>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-muted-foreground">SKU: {item.product_sku}</div>
                        </TableCell>
                        <TableCell>${item.unit_price_usd.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{usd}</div>
                          <div className="text-xs text-muted-foreground">{lbp}</div>
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
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Submit */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Order</CardTitle>
            <CardDescription>Review and confirm the order details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Customer Information</h4>
              <div className="text-sm">
                <div className="font-medium">{selectedCustomer?.name}</div>
                {selectedCustomer?.email && (
                  <div className="text-muted-foreground">{selectedCustomer.email}</div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-2">Order Items</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-24 text-center">Quantity</TableHead>
                    <TableHead className="w-32 text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item) => {
                    const { usd, lbp } = formatDual(item.subtotal_usd);
                    return (
                      <TableRow key={item.product_id}>
                        <TableCell>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-muted-foreground">
                            ${item.unit_price_usd.toFixed(2)} each
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{usd}</div>
                          <div className="text-xs text-muted-foreground">{lbp}</div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-4 flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold">
                    {formatDual(calculateTotal()).usd}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDual(calculateTotal()).lbp}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any additional notes..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
          )}
          {currentStep < ORDER_WIZARD_STEPS.length ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleCreateOrder} disabled={creating}>
              {creating ? 'Creating...' : 'Create Order'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
