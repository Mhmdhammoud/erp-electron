import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { useGetProductQuery, useUpdateProductMutation, ProductStatus } from '../types/generated';
import { Skeleton } from '../components/ui/skeleton';

interface ProductFormData {
  sku: string;
  name: string;
  category: string;
  price_usd: number;
  quantity_in_stock: number;
  reorder_level: number;
  status: ProductStatus;
  barcode?: string;
  description?: string;
}

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data, loading } = useGetProductQuery({
    variables: { id: id! },
    skip: !id,
  });

  const product = data?.product?.product;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    values: product
      ? {
          sku: product.sku || '',
          name: product.name || '',
          category: product.category || '',
          price_usd: product.price_usd || 0,
          quantity_in_stock: product.quantity_in_stock || 0,
          reorder_level: product.reorder_level || 0,
          status: product.status || ProductStatus.Active,
          barcode: product.barcode || '',
          description: product.description || '',
        }
      : undefined,
  });

  const [updateProduct, { loading: updating }] = useUpdateProductMutation();

  const onSubmit = async (formData: ProductFormData) => {
    try {
      const { data } = await updateProduct({
        variables: {
          id: id!,
          input: {
            sku: formData.sku,
            name: formData.name,
            category: formData.category,
            price_usd: Number(formData.price_usd),
            quantity_in_stock: Number(formData.quantity_in_stock),
            reorder_level: Number(formData.reorder_level),
            status: formData.status,
            barcode: formData.barcode || undefined,
            description: formData.description || undefined,
          },
        },
      });

      if (data?.updateProduct?.error) {
        toast({
          title: 'Error',
          description: data.updateProduct.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
        navigate(`/products/${id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/products')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Product not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/products/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Update the product details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" {...register('sku', { required: 'SKU is required' })} />
                {errors.sku && <p className="text-sm text-red-500">{errors.sku.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input id="barcode" {...register('barcode')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input id="category" {...register('category', { required: 'Category is required' })} />
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_usd">Price (USD) *</Label>
                <Input
                  id="price_usd"
                  type="number"
                  step="0.01"
                  {...register('price_usd', { required: 'Price is required', min: 0 })}
                />
                {errors.price_usd && <p className="text-sm text-red-500">{errors.price_usd.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as ProductStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity_in_stock">Quantity in Stock *</Label>
                <Input
                  id="quantity_in_stock"
                  type="number"
                  {...register('quantity_in_stock', { required: 'Quantity is required', min: 0 })}
                />
                {errors.quantity_in_stock && (
                  <p className="text-sm text-red-500">{errors.quantity_in_stock.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level *</Label>
                <Input
                  id="reorder_level"
                  type="number"
                  {...register('reorder_level', { required: 'Reorder level is required', min: 0 })}
                />
                {errors.reorder_level && (
                  <p className="text-sm text-red-500">{errors.reorder_level.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(`/products/${id}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
