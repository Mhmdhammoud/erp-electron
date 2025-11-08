import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import { Plus, Search, Edit, Trash } from 'lucide-react';
import { STATUS_COLORS } from '../utils/constants';

const GET_CUSTOMERS_QUERY = gql`
  query GetCustomers($filter: CustomerFilterInput) {
    customers(filter: $filter) {
      customers {
        _id
        name
        email
        phone
        addresses {
          type
          street
          city
          state
          postal_code
          country
          is_default
        }
        notes
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

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading } = useQuery(GET_CUSTOMERS_QUERY);

  const customers = data?.customers?.customers || [];
  const filteredCustomers = customers.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email', render: (val: string) => val || '-' },
    { key: 'phone', header: 'Phone', render: (val: string) => val || '-' },
    { key: 'company_name', header: 'Company', render: (val: string) => val || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (val: string) => <Badge variant={STATUS_COLORS[val] as any}>{val}</Badge>,
    },
    {
      key: 'id',
      header: 'Actions',
      render: () => (
        <div className="flex items-center space-x-2">
          <button className="text-primary-600 hover:text-primary-800">
            <Edit className="w-4 h-4" />
          </button>
          <button className="text-red-600 hover:text-red-800">
            <Trash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-1">Manage your customer relationships</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="w-5 h-5 text-default-400" />}
            />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        <Table
          data={filteredCustomers}
          columns={columns}
          isLoading={loading}
          emptyMessage="No customers found. Add your first customer to get started."
        />
      </Card>
    </div>
  );
}
