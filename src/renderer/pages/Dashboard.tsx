import { Spinner } from '@heroui/react';
import Card from '../components/common/Card';
import { useCurrency } from '../hooks/useCurrency';
import { DollarSign, ShoppingCart, FileText, Package } from 'lucide-react';
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name} className="!p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p
                  className={`text-sm mt-2 ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </p>
              </div>
              <div className="p-3 bg-primary-50 rounded-full">
                <stat.icon className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card title="Top Products">
          {loading ? (
            <div className="text-center py-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {metrics?.top_products?.slice(0, 5).map((product: any) => (
                <div key={product.product_id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-600">{product.total_quantity_sold} sold</p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatUSD(product.total_revenue_usd)}
                  </p>
                </div>
              )) || <p className="text-gray-500 text-center py-4">No data available</p>}
            </div>
          )}
        </Card>

        {/* Low Inventory Alerts */}
        <Card title="Low Inventory Alerts">
          {loading ? (
            <div className="text-center py-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {metrics?.low_inventory_products?.slice(0, 5).map((product: any) => (
                <div key={product.product_id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-600">{product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">{product.quantity_in_stock}</p>
                    <p className="text-xs text-gray-500">Min: {product.reorder_level}</p>
                  </div>
                </div>
              )) || <p className="text-gray-500 text-center py-4">All inventory levels are good</p>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
