import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import { Plus, Filter } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import { STATUS_COLORS, OrderStatus } from '../utils/constants';
import { formatDate } from '../utils/formatters';

const GET_ORDERS_QUERY = gql`
  query GetOrders($filter: OrderFilterInput) {
    orders(filter: $filter) {
      orders {
        id
        order_number
        customer_id
        status
        total_usd
        total_lbp
      }
      error {
        field
        message
      }
      length
      page
      limit
    }
  }
`;

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const { data, loading } = useQuery(GET_ORDERS_QUERY, {
    variables: { filter: statusFilter ? { status: statusFilter } : undefined },
  });

  const { formatDual } = useCurrency();
  const orders = data?.orders?.orders || [];

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
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select
              value={statusFilter || ''}
              onValueChange={(value) => setStatusFilter((value as OrderStatus) || null)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value={OrderStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={OrderStatus.CONFIRMED}>Confirmed</SelectItem>
                <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                <SelectItem value={OrderStatus.INVOICED}>Invoiced</SelectItem>
                <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
