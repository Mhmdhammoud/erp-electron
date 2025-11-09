import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, Trash, Package2, DollarSign, AlertCircle, Warehouse } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import {
  useGetProductQuery,
  useDeleteProductMutation,
  useGetProductInventoryDistributionQuery,
} from '../types/generated';
import { useToast } from '../hooks/use-toast';
import { useCurrency } from '../hooks/useCurrency';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatDual } = useCurrency();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, loading } = useGetProductQuery({
    variables: { id: id! },
    skip: !id,
  });

  const {
    data: inventoryData,
    loading: inventoryLoading,
  } = useGetProductInventoryDistributionQuery({
    variables: { productId: id! },
    skip: !id,
  });

  const [deleteProduct, { loading: deleting }] = useDeleteProductMutation();

  const product = data?.product?.product;
  const inventoryDistribution = inventoryData?.productInventoryDistribution?.inventories || [];

  const handleDelete = async () => {
    if (!product) return;

    try {
      const result = await deleteProduct({
        variables: { id: product.id },
      });

      if (result.data?.deleteProduct?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.deleteProduct.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Product deleted successfully',
        });
        navigate('/products');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Product Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Package2 className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/products')} className="mt-4">
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLowStock = product.quantity_in_stock <= (product.reorder_level || 0);
  const { usd, lbp } = formatDual(product.price_usd);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground mt-2">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/products/${id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Product details and identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Product Name</div>
              <div className="text-lg font-semibold">{product.name}</div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">SKU</div>
                <div className="font-mono">{product.sku}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Barcode</div>
                <div className="font-mono">{product.barcode || '-'}</div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Category</div>
              {product.category ? (
                <Badge variant="outline">{product.category}</Badge>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
              <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                {product.status}
              </Badge>
            </div>

            {product.description && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                  <p className="text-sm">{product.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
            <CardDescription>Stock levels and pricing information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Price</div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{usd}</div>
                  <div className="text-sm text-muted-foreground">{lbp}</div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Quantity in Stock</div>
              <div className="flex items-center gap-2">
                <Package2 className="w-5 h-5 text-muted-foreground" />
                <span className={`text-2xl font-bold ${isLowStock ? 'text-destructive' : ''}`}>
                  {product.quantity_in_stock}
                </span>
                {isLowStock && <AlertCircle className="w-5 h-5 text-destructive" />}
              </div>
              {isLowStock && (
                <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Low stock warning - Below reorder level
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Reorder Level</div>
                <div className="text-lg font-semibold">{product.reorder_level}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Stock Status</div>
                {isLowStock ? (
                  <Badge variant="destructive">Low Stock</Badge>
                ) : (
                  <Badge variant="default">In Stock</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouse Inventory Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Warehouse Inventory Distribution
          </CardTitle>
          <CardDescription>
            Product availability across all warehouse locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : inventoryDistribution.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Total Quantity</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryDistribution.map((inventory) => (
                  <TableRow
                    key={inventory._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/warehouses/${inventory.warehouse_id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{inventory.warehouse?.name || 'Unknown Warehouse'}</span>
                        <span className="text-xs text-muted-foreground">
                          {inventory.warehouse?.address?.city}, {inventory.warehouse?.address?.country}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {inventory.warehouse?.code || 'N/A'}
                    </TableCell>
                    <TableCell>{inventory.location || 'N/A'}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {inventory.quantity}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {inventory.reserved_quantity || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={inventory.available_quantity > 0 ? 'default' : 'secondary'}>
                        {inventory.available_quantity || inventory.quantity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Warehouse className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">
                No warehouse inventory data available for this product
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This product may not be stored in any warehouses yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{product.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
