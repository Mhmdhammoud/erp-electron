import { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import { Plus, Search, Edit, Trash } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import { STATUS_COLORS } from '../utils/constants';
import { useGetProductsQuery } from '../types/generated';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading } = useGetProductsQuery({
    variables: { filter: { search: searchTerm } },
  });

  const { formatDual } = useCurrency();
  const products = data?.products?.products || [];

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
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="w-5 h-5 text-default-400" />}
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
