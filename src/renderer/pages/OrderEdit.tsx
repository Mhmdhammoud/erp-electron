import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { useGetOrderQuery, useUpdateOrderStatusMutation } from '../types/generated';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { useCurrency } from '../hooks/useCurrency';

interface OrderStatusFormData {
  status: string;
}

export default function OrderEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatDual } = useCurrency();

  const { data, loading } = useGetOrderQuery({
    variables: { id: id! },
    skip: !id,
  });

  const order = data?.order?.order;

  const { handleSubmit, setValue, watch } = useForm<OrderStatusFormData>({
    values: order
      ? {
          status: order.status || 'pending',
        }
      : undefined,
  });

  const [updateOrderStatus, { loading: updating }] = useUpdateOrderStatusMutation();

  const onSubmit = async (formData: OrderStatusFormData) => {
    try {
      const { data } = await updateOrderStatus({
        variables: {
          id: id!,
          input: {
            status: formData.status,
          },
        },
      });

      if (data?.updateOrderStatus?.error) {
        toast({
          title: 'Error',
          description: data.updateOrderStatus.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Order status updated successfully',
        });
        navigate(`/orders/${id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Order not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/orders/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Update Order Status</h1>
      </div>

      <div className="space-y-6">
        {/* Order Information (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>Current order details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Order ID</Label>
                <p className="font-mono text-sm">{order._id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Customer ID</Label>
                <p className="font-mono text-sm">{order.customer_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Order Date</Label>
                <p>{new Date(order.order_date).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Currency Used</Label>
                <p className="uppercase">{order.currency_used}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Total Amount</Label>
                <p className="font-semibold">
                  {formatDual(order.total_usd || 0, order.total_lbp || 0)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Current Status</Label>
                <div className="mt-1">
                  <Badge className={getStatusColor(order.status || 'pending')}>
                    {order.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div>
                <Label className="text-muted-foreground mb-2 block">Order Items</Label>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="p-2 text-left text-sm font-medium">Product</th>
                        <th className="p-2 text-right text-sm font-medium">Quantity</th>
                        <th className="p-2 text-right text-sm font-medium">Unit Price</th>
                        <th className="p-2 text-right text-sm font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground">{item.product_sku}</p>
                            </div>
                          </td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">${item.unit_price_usd?.toFixed(2)}</td>
                          <td className="p-2 text-right font-medium">
                            ${item.subtotal_usd?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Update Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
              <CardDescription>Change the order status below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">New Status *</Label>
                <Select value={watch('status')} onValueChange={(value) => setValue('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="processing">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        Processing
                      </div>
                    </SelectItem>
                    <SelectItem value="shipped">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        Shipped
                      </div>
                    </SelectItem>
                    <SelectItem value="delivered">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Delivered
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(`/orders/${id}`)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Package className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
