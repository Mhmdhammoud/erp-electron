import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import { Plus, Search, Edit, Trash } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import { STATUS_COLORS } from '../utils/constants';

const GET_PRODUCTS_QUERY = gql`
  query GetProducts($filter: ProductFilterInput) {
    products(filter: $filter) {
      data {
        id
        sku
        name
        category
        price_usd
        quantity_in_stock
        reorder_level
        status
      }
      error {
        field
        message
      }
    }
  }
`;

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading } = useQuery(GET_PRODUCTS_QUERY, {
    variables: { filter: { search: searchTerm } },
  });

  const { formatUSD, formatDual } = useCurrency();
  const products = data?.products?.data || [];

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Product Name' },
    { key: 'category', header: 'Category', render: (val: string) => val || '-' },
    {
      key: 'price_usd',
      header: 'Price',
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
      key: 'quantity_in_stock',
      header: 'Stock',
      render: (val: number, row: any) => (
        <span className={val <= (row.reorder_level || 0) ? 'text-red-600 font-semibold' : ''}>
          {val}
        </span>
      ),
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
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600 mt-1">Manage your product inventory</p>
      </div>

      <Card>
        {/* Header with Search and Add Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Products Table */}
        <Table
          data={products}
          columns={columns}
          isLoading={loading}
          emptyMessage="No products found. Create your first product to get started."
        />
      </Card>
    </div>
  );
}
