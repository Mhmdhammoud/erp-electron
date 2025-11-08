import { Loader2, DollarSign, ShoppingCart, FileText, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '../hooks/useCurrency';
import { useGetDashboardStatsQuery } from '../types/generated';

export default function Dashboard() {
  const { data, loading } = useGetDashboardStatsQuery();
  const { formatUSD } = useCurrency();

  const metrics = data?.dashboardMetrics;

  const stats = [
    {
      name: 'Total Revenue (Month)',
      value: formatUSD(metrics?.revenue?.this_month || 0),
      icon: DollarSign,
      change: '+12.5%',
      changeType: 'increase',
    },
    {
      name: 'Orders',
      value:
        metrics?.order_status_counts?.reduce((sum: number, item: any) => sum + item.count, 0) || 0,
      icon: ShoppingCart,
      change: '+4.75%',
      changeType: 'increase',
    },
    {
      name: 'Invoices',
      value:
        metrics?.invoice_status_counts?.reduce((sum: number, item: any) => sum + item.count, 0) ||
        0,
      icon: FileText,
      change: '-1.39%',
      changeType: 'decrease',
    },
    {
      name: 'Low Inventory',
      value: metrics?.low_inventory_products?.length || 0,
      icon: Package,
      change: metrics?.low_inventory_products?.length > 0 ? 'Attention needed' : 'All good',
      changeType: metrics?.low_inventory_products?.length > 0 ? 'decrease' : 'increase',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  <p
                    className={`text-sm mt-2 ${
                      stat.changeType === 'increase' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                    }`}
                  >
                    {stat.change}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.top_products?.slice(0, 5).map((product: any) => (
                <div key={product.product_id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.product_name}</p>
                    <p className="text-sm text-muted-foreground">{product.total_quantity_sold} sold</p>
                  </div>
                  <p className="font-semibold">
                    {formatUSD(product.total_revenue_usd)}
                  </p>
                </div>
              )) || <p className="text-muted-foreground text-center py-4">No data available</p>}
            </div>
          </CardContent>
        </Card>

        {/* Low Inventory Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Low Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.low_inventory_products?.slice(0, 5).map((product: any) => (
                <div key={product.product_id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{product.product_name}</p>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">{product.quantity_in_stock}</p>
                    <p className="text-xs text-muted-foreground">Min: {product.reorder_level}</p>
                  </div>
                </div>
              )) || <p className="text-muted-foreground text-center py-4">All inventory levels are good</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
