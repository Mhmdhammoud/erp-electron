import {
  DollarSign,
  ShoppingCart,
  FileText,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
      description: 'vs last month',
    },
    {
      name: 'Orders',
      value:
        metrics?.order_status_counts?.reduce((sum: number, item: any) => sum + item.count, 0) || 0,
      icon: ShoppingCart,
      change: '+4.75%',
      changeType: 'increase',
      description: 'total orders',
    },
    {
      name: 'Invoices',
      value:
        metrics?.invoice_status_counts?.reduce((sum: number, item: any) => sum + item.count, 0) ||
        0,
      icon: FileText,
      change: '-1.39%',
      changeType: 'decrease',
      description: 'total invoices',
    },
    {
      name: 'Low Inventory',
      value: metrics?.low_inventory_products?.length || 0,
      icon: Package,
      change: (metrics?.low_inventory_products?.length || 0) > 0 ? 'Attention needed' : 'All good',
      changeType: (metrics?.low_inventory_products?.length || 0) > 0 ? 'decrease' : 'increase',
      description: 'products need restocking',
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
          {new Array(4).fill(null).map((_, i) => (
            <Card key={`dashboard-skeleton-${i}`}>
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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-2 text-xs">
                  {stat.changeType === 'increase' ? (
                    <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-500" />
                  )}
                  <span
                    className={
                      stat.changeType === 'increase'
                        ? 'text-green-600 dark:text-green-500 font-medium'
                        : 'text-red-600 dark:text-red-500 font-medium'
                    }
                  >
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">{stat.description}</span>
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
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.top_products?.slice(0, 5).map((product: any, index: number) => {
                const maxRevenue = metrics?.top_products?.[0]?.total_revenue_usd || 1;
                const percentage = (product.total_revenue_usd / maxRevenue) * 100;

                return (
                  <div key={product.product_id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{product.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.total_quantity_sold} sold
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-lg">
                        {formatUSD(product.total_revenue_usd)}
                      </p>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    {index < (metrics?.top_products?.length || 0) - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                );
              }) || <p className="text-muted-foreground text-center py-8">No data available</p>}
            </div>
          </CardContent>
        </Card>

        {/* Low Inventory Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Low Inventory Alerts
            </CardTitle>
            <CardDescription>Products that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.low_inventory_products?.slice(0, 5).map((product: any) => {
                const stockPercentage = (product.quantity_in_stock / product.reorder_level) * 100;

                return (
                  <div key={product.product_id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        Low Stock
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current Stock</span>
                        <span className="font-semibold text-destructive">
                          {product.quantity_in_stock}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Reorder Level</span>
                        <span className="font-medium">{product.reorder_level}</span>
                      </div>
                      <Progress value={Math.min(stockPercentage, 100)} className="h-2" />
                    </div>
                    {metrics?.low_inventory_products?.indexOf(product) <
                      Math.min(metrics?.low_inventory_products?.length || 0, 5) - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                );
              }) || (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground font-medium">All inventory levels are good</p>
                  <p className="text-sm text-muted-foreground mt-1">No products need restocking</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
