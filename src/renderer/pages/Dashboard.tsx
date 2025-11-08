import { useQuery, gql } from '@apollo/client';
import Card from '../components/common/Card';
import { useCurrency } from '../hooks/useCurrency';
import { DollarSign, ShoppingCart, Users, FileText, TrendingUp, Package } from 'lucide-react';

const DASHBOARD_METRICS_QUERY = gql`
  query GetDashboardMetrics {
    dashboardMetrics {
      data {
        revenue {
          today
          thisWeek
          thisMonth
          lastMonth
        }
        topProducts {
          product_id
          product_name
          total_quantity_sold
          total_revenue_usd
        }
        lowInventory {
          product_id
          product_name
          sku
          quantity_in_stock
          reorder_level
        }
        ordersByStatus {
          status
          count
        }
        invoicesByStatus {
          status
          count
        }
        overdueInvoices {
          count
          total_amount_usd
        }
      }
      error {
        field
        message
      }
    }
  }
`;

export default function Dashboard() {
  const { data, loading } = useQuery(DASHBOARD_METRICS_QUERY);
  const { formatUSD } = useCurrency();

  const metrics = data?.dashboardMetrics?.data;

  const stats = [
    {
      name: 'Total Revenue (Month)',
      value: formatUSD(metrics?.revenue?.thisMonth || 0),
      icon: DollarSign,
      change: '+12.5%',
      changeType: 'increase',
    },
    {
      name: 'Orders',
      value: metrics?.ordersByStatus?.reduce((sum: number, item: any) => sum + item.count, 0) || 0,
      icon: ShoppingCart,
      change: '+4.75%',
      changeType: 'increase',
    },
    {
      name: 'Invoices',
      value: metrics?.invoicesByStatus?.reduce((sum: number, item: any) => sum + item.count, 0) || 0,
      icon: FileText,
      change: '-1.39%',
      changeType: 'decrease',
    },
    {
      name: 'Low Inventory',
      value: metrics?.lowInventory?.length || 0,
      icon: Package,
      change: metrics?.lowInventory?.length > 0 ? 'Attention needed' : 'All good',
      changeType: metrics?.lowInventory?.length > 0 ? 'decrease' : 'increase',
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
                <p className={`text-sm mt-2 ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics?.topProducts?.slice(0, 5).map((product: any) => (
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics?.lowInventory?.slice(0, 5).map((product: any) => (
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
