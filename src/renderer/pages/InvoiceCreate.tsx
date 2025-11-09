import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Receipt } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import {
  useCreateInvoiceMutation,
  useGetOrdersQuery,
  useGetCustomersQuery,
} from '../types/generated';
import { useToast } from '../hooks/use-toast';

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const [selectedOrderId, setSelectedOrderId] = useState('none');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  const { toast } = useToast();
  const { formatDual } = useCurrency();

  const { data: ordersData } = useGetOrdersQuery();
  const { data: customersData } = useGetCustomersQuery();

  const [createInvoice, { loading: creating }] = useCreateInvoiceMutation();

  const orders = ordersData?.orders?.orders || [];
  const customers = customersData?.customers?.customers || [];

  // Get the due date for default value (7 days from now)
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedOrderId === 'none' && !selectedCustomerId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an order or customer',
      });
      return;
    }

    if (!dueDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a due date',
      });
      return;
    }

    try {
      const result = await createInvoice({
        variables: {
          input: {
            order_id: selectedOrderId === 'none' ? '' : selectedOrderId,
            due_date: dueDate,
            issue_date: new Date().toISOString(),
            notes: invoiceNotes || undefined,
          },
        },
      });

      if (result.data?.createInvoice?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.createInvoice.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Invoice created successfully',
        });
        navigate('/invoices');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred',
      });
    }
  };

  const selectedOrder =
    selectedOrderId === 'none' ? null : orders.find((o: any) => o._id === selectedOrderId);

  // Update customer when order is selected
  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (orderId !== 'none') {
      const order = orders.find((o: any) => o._id === orderId);
      if (order) {
        setSelectedCustomerId(order.customer_id);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
          <p className="text-muted-foreground mt-2">
            Create an invoice from an order or standalone
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Invoice Information
          </CardTitle>
          <CardDescription>Select an existing order or create a standalone invoice</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateInvoice} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="order">Order (Optional)</Label>
              <Select value={selectedOrderId} onValueChange={handleOrderChange}>
                <SelectTrigger id="order">
                  <SelectValue placeholder="Select an order (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No order (standalone invoice)</SelectItem>
                  {orders
                    .filter((order: any) => order.status !== 'cancelled')
                    .map((order: any) => {
                      const customer = customers.find((c: any) => c._id === order.customer_id);
                      return (
                        <SelectItem key={order._id} value={order._id}>
                          {customer?.name || 'Unknown'} - ${order.total_usd?.toFixed(2)} (
                          {order.status})
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {selectedOrder && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Total:</span>
                      <span className="font-medium">
                        {formatDual(selectedOrder.total_usd || 0).usd}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="capitalize">
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items:</span>
                      <span>{selectedOrder.items?.length || 0} product(s)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="customer">
                Customer <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
                disabled={selectedOrderId !== 'none'}
              >
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
              {selectedOrderId !== 'none' && (
                <p className="text-xs text-muted-foreground">
                  Customer is automatically selected from the order
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due-date">
                Due Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              {!dueDate && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => setDueDate(getDefaultDueDate())}
                >
                  Set to 7 days from now
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                rows={4}
                placeholder="Add any additional notes or payment terms..."
              />
            </div>

            {selectedOrderId === 'none' && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> You are creating a standalone invoice. You'll need to add
                  line items and amounts manually after creation.
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle>Order Items Preview</CardTitle>
            <CardDescription>These items will be included in the invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedOrder.items?.map((item: any) => (
                <div
                  key={`${item.product_id}-${item.quantity}`}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-md"
                >
                  <div>
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-muted-foreground">
                      SKU: {item.product_sku} • Qty: {item.quantity} × $
                      {item.unit_price_usd?.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-medium">{formatDual(item.subtotal_usd || 0).usd}</div>
                </div>
              ))}
              <Separator className="my-4" />
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-md">
                <div className="font-semibold">Total</div>
                <div className="text-lg font-bold">
                  {formatDual(selectedOrder.total_usd || 0).usd}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
