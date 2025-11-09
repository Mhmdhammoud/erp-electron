import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Calendar, DollarSign } from 'lucide-react';
import { useGetOrderQuery, useGetCustomersQuery } from '../types/generated';
import { useCurrency } from '../hooks/useCurrency';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { formatDual } = useCurrency();

  const { data, loading } = useGetOrderQuery({
    variables: { id: id! },
    skip: !id,
  });

  const { data: customersData } = useGetCustomersQuery();

  const order = data?.order?.order;
  const customers = customersData?.customers?.customers || [];
  const customer = customers.find((c) => c._id === order?.customer_id);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Order Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">The order you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/orders')} className="mt-4">
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { usd: totalUsd, lbp: totalLbp } = formatDual(order.total_usd || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order #{order._id.slice(0, 8)}</h1>
            <p className="text-muted-foreground mt-2">Order Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/orders/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>Basic details about this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Customer</div>
              <div className="text-lg font-semibold">{customer?.name || 'Unknown'}</div>
              {customer?.email && <div className="text-sm text-muted-foreground">{customer.email}</div>}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Order Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <Badge variant="outline" className="capitalize">
                  {order.status}
                </Badge>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Currency</div>
              <div>{order.currency_used}</div>
            </div>

            {order.notes && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Total</CardTitle>
            <CardDescription>Pricing information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-muted-foreground" />
              <div>
                <div className="text-3xl font-bold">{totalUsd}</div>
                <div className="text-sm text-muted-foreground">{totalLbp}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Products included in this order</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item, index) => {
                const { usd: itemUsd, lbp: itemLbp } = formatDual(item.subtotal_usd || 0);
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="font-mono text-sm">{item.product_sku}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.unit_price_usd?.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">{itemUsd}</div>
                      <div className="text-xs text-muted-foreground">{itemLbp}</div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <div className="flex justify-end">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">{totalUsd}</div>
              <div className="text-sm text-muted-foreground">{totalLbp}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
