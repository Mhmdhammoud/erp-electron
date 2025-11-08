import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import { Plus, Filter } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import { STATUS_COLORS, OrderStatus } from '../utils/constants';
import { formatDate } from '../utils/formatters';

const GET_ORDERS_QUERY = gql`
  query GetOrders($status: OrderStatus) {
    orders(status: $status) {
      data {
        id
        order_number
        customer_id
        status
        total_usd
        total_lbp
        createdAt
      }
      error {
        field
        message
      }
    }
  }
`;

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const { data, loading } = useQuery(GET_ORDERS_QUERY, {
    variables: { status: statusFilter },
  });

  const { formatDual } = useCurrency();
  const orders = data?.orders?.data || [];

  const columns = [
    { key: 'order_number', header: 'Order #' },
    {
      key: 'createdAt',
      header: 'Date',
      render: (val: string) => formatDate(val, 'PP'),
    },
    {
      key: 'total_usd',
      header: 'Total',
      render: (val: number) => {
        const { usd, lbp } = formatDual(val);
        return (
          <div>
            <div className="font-medium">{usd}</div>
            <div className="text-xs text-gray-500">{lbp}</div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (val: string) => <Badge variant={STATUS_COLORS[val] as any}>{val}</Badge>,
    },
    {
      key: 'id',
      header: 'Actions',
      render: () => (
        <Button variant="ghost" size="sm">
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">Manage your sales orders</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="input w-48"
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter((e.target.value as OrderStatus) || null)}
            >
              <option value="">All Statuses</option>
              <option value={OrderStatus.DRAFT}>Draft</option>
              <option value={OrderStatus.CONFIRMED}>Confirmed</option>
              <option value={OrderStatus.SHIPPED}>Shipped</option>
              <option value={OrderStatus.INVOICED}>Invoiced</option>
              <option value={OrderStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Button>
        </div>

        <Table
          data={orders}
          columns={columns}
          isLoading={loading}
          emptyMessage="No orders found. Create your first order to get started."
        />
      </Card>
    </div>
  );
}
