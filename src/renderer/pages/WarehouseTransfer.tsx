import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import {
  useGetWarehouseQuery,
  useGetWarehousesQuery,
  useGetWarehouseInventoryQuery,
  useTransferStockMutation,
} from '../types/generated';

interface TransferFormData {
  product_id: string;
  to_warehouse_id: string;
  quantity: number;
  notes: string;
}

export default function WarehouseTransfer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [availableQuantity, setAvailableQuantity] = useState<number>(0);

  const { data: warehouseData, loading: warehouseLoading } = useGetWarehouseQuery({
    variables: { id: id || '' },
    skip: !id,
  });

  const { data: warehousesData, loading: warehousesLoading } = useGetWarehousesQuery();

  const { data: inventoryData, loading: inventoryLoading } = useGetWarehouseInventoryQuery({
    variables: { warehouseId: id || '', page: 1, limit: 100 },
    skip: !id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TransferFormData>();

  const [transferStock, { loading: transferring }] = useTransferStockMutation();

  const warehouse = warehouseData?.warehouse?.warehouse;
  const warehouses = warehousesData?.warehouses?.warehouses || [];
  const inventories = inventoryData?.warehouseInventory?.inventories || [];

  // Filter out current warehouse from destination list
  const availableWarehouses = warehouses.filter((w) => w._id !== id);

  // Update available quantity when product is selected
  useEffect(() => {
    if (selectedProduct) {
      const inventory = inventories.find((inv) => inv.product_id === selectedProduct);
      setAvailableQuantity(inventory?.available_quantity || inventory?.quantity || 0);
    } else {
      setAvailableQuantity(0);
    }
  }, [selectedProduct, inventories]);

  const onSubmit = async (formData: TransferFormData) => {
    if (!id) return;

    if (formData.quantity > availableQuantity) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Cannot transfer more than ${availableQuantity} units`,
      });
      return;
    }

    try {
      const input = {
        product_id: formData.product_id,
        from_warehouse_id: id,
        to_warehouse_id: formData.to_warehouse_id,
        quantity: Number(formData.quantity),
        notes: formData.notes || undefined,
      };

      const { data } = await transferStock({ variables: { input } });

      if (data?.transferStock?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.transferStock.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Stock transferred successfully',
        });
        navigate(`/warehouses/${id}`);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to transfer stock',
      });
    }
  };

  if (warehouseLoading || warehousesLoading || inventoryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Warehouse not found</h2>
          <Button className="mt-4" onClick={() => navigate('/warehouses')}>
            Back to Warehouses
          </Button>
        </div>
      </div>
    );
  }

  if (inventories.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(`/warehouses/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Transfer Stock</h1>
            <p className="text-muted-foreground mt-1">From: {warehouse.name}</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Inventory Available</h3>
              <p className="text-muted-foreground mb-4">
                This warehouse has no products to transfer.
              </p>
              <Button onClick={() => navigate(`/warehouses/${id}`)}>Back to Warehouse</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/warehouses/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Transfer Stock</h1>
          <p className="text-muted-foreground mt-1">
            From: {warehouse.name} ({warehouse.code})
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Stock Transfer
          </CardTitle>
          <CardDescription>
            Transfer inventory from {warehouse.name} to another warehouse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product_id">Product *</Label>
              <Select
                value={selectedProduct}
                onValueChange={(value) => {
                  setSelectedProduct(value);
                  setValue('product_id', value);
                }}
              >
                <SelectTrigger id="product_id">
                  <SelectValue placeholder="Select a product to transfer" />
                </SelectTrigger>
                <SelectContent>
                  {inventories.map((inventory) => (
                    <SelectItem key={inventory._id} value={inventory.product_id}>
                      Product ID: {inventory.product_id} (Available:{' '}
                      {inventory.available_quantity || inventory.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register('product_id', { required: 'Product is required' })}
              />
              {errors.product_id && (
                <p className="text-sm text-red-500">{errors.product_id.message}</p>
              )}
            </div>

            {/* Available Quantity Display */}
            {selectedProduct && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-900">
                  Available Quantity: {availableQuantity} units
                </p>
              </div>
            )}

            {/* Destination Warehouse */}
            <div className="space-y-2">
              <Label htmlFor="to_warehouse_id">Destination Warehouse *</Label>
              <Select
                onValueChange={(value) => setValue('to_warehouse_id', value)}
                disabled={!selectedProduct}
              >
                <SelectTrigger id="to_warehouse_id">
                  <SelectValue placeholder="Select destination warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {availableWarehouses.map((wh) => (
                    <SelectItem key={wh._id} value={wh._id}>
                      {wh.name} ({wh.code}) - {wh.address.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register('to_warehouse_id', { required: 'Destination warehouse is required' })}
              />
              {errors.to_warehouse_id && (
                <p className="text-sm text-red-500">{errors.to_warehouse_id.message}</p>
              )}
              {availableWarehouses.length === 0 && (
                <p className="text-sm text-amber-600">
                  No other warehouses available. Please create another warehouse first.
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Transfer *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={availableQuantity}
                {...register('quantity', {
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Quantity must be at least 1' },
                  max: {
                    value: availableQuantity,
                    message: `Quantity cannot exceed ${availableQuantity}`,
                  },
                  valueAsNumber: true,
                })}
                placeholder="Enter quantity"
                disabled={!selectedProduct}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                {...register('notes')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Add any notes about this transfer..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(`/warehouses/${id}`)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={transferring || !selectedProduct || availableWarehouses.length === 0}
              >
                {transferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Transfer Stock
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
