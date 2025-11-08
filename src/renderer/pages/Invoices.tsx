import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import { Plus, Filter, DollarSign } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import { STATUS_COLORS, PaymentStatus } from '../utils/constants';
import { formatDate } from '../utils/formatters';

const GET_INVOICES_QUERY = gql`
  query GetInvoices($filter: InvoiceFilterInput) {
    invoices(filter: $filter) {
      invoices {
        id
        invoice_number
        customer_id
        total_usd
        paid_amount_usd
        payment_status
        due_date
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

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | null>(null);
  const { data, loading } = useQuery(GET_INVOICES_QUERY, {
    variables: { filter: statusFilter ? { status: statusFilter } : undefined },
  });

  const { formatUSD } = useCurrency();
  const invoices = data?.invoices?.invoices || [];

  const columns = [
    { key: 'invoice_number', header: 'Invoice #' },
    {
      key: 'createdAt',
      header: 'Date',
      render: (val: string) => formatDate(val, 'PP'),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (val: string) => formatDate(val, 'PP'),
    },
    {
      key: 'total_usd',
      header: 'Total',
      render: (val: number) => <span className="font-medium">{formatUSD(val)}</span>,
    },
    {
      key: 'paid_amount_usd',
      header: 'Paid',
      render: (val: number) => <span className="text-green-600">{formatUSD(val)}</span>,
    },
    {
      key: 'remaining_amount_usd',
      header: 'Remaining',
      render: (val: number) => <span className="text-red-600">{formatUSD(val)}</span>,
    },
    {
      key: 'payment_status',
      header: 'Status',
      render: (val: string) => <Badge variant={STATUS_COLORS[val] as any}>{val}</Badge>,
    },
    {
      key: 'id',
      header: 'Actions',
      render: () => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            View
          </Button>
          <Button variant="ghost" size="sm">
            <DollarSign className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <p className="text-gray-600 mt-1">Manage invoices and payments</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              className="input w-48"
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter((e.target.value as PaymentStatus) || null)}
            >
              <option value="">All Statuses</option>
              <option value={PaymentStatus.UNPAID}>Unpaid</option>
              <option value={PaymentStatus.PARTIAL}>Partial</option>
              <option value={PaymentStatus.PAID}>Paid</option>
              <option value={PaymentStatus.OVERDUE}>Overdue</option>
            </select>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        <Table
          data={invoices}
          columns={columns}
          isLoading={loading}
          emptyMessage="No invoices found. Create your first invoice to get started."
        />
      </Card>
    </div>
  );
}
