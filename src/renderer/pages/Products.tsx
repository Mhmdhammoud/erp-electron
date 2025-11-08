import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Trash, AlertCircle } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from '../types/generated';
import { useToast } from '../hooks/use-toast';

interface ProductFormData {
  sku: string;
  name: string;
  category: string;
  price_usd: string;
  quantity_in_stock: string;
  reorder_level: string;
  status: string;
  barcode: string;
  description: string;
}

const initialFormData: ProductFormData = {
  sku: '',
  name: '',
  category: '',
  price_usd: '',
  quantity_in_stock: '',
  reorder_level: '',
  status: 'active',
  barcode: '',
  description: '',
};

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  const { toast } = useToast();
  const { formatDual } = useCurrency();

  const { data, loading, refetch } = useGetProductsQuery({
    variables: { filter: { search: searchTerm } },
  });

  const [createProduct, { loading: creating }] = useCreateProductMutation();
  const [updateProduct, { loading: updating }] = useUpdateProductMutation();
  const [deleteProduct, { loading: deleting }] = useDeleteProductMutation();

  const products = data?.products?.products || [];

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        category: product.category || '',
        price_usd: product.price_usd?.toString() || '',
        quantity_in_stock: product.quantity_in_stock?.toString() || '',
        reorder_level: product.reorder_level?.toString() || '',
        status: product.status || 'active',
        barcode: product.barcode || '',
        description: product.description || '',
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = {
      sku: formData.sku,
      name: formData.name,
      category: formData.category || null,
      price_usd: parseFloat(formData.price_usd),
      quantity_in_stock: parseInt(formData.quantity_in_stock),
      reorder_level: parseInt(formData.reorder_level),
      status: formData.status,
      barcode: formData.barcode || null,
      description: formData.description || null,
    };

    try {
      if (editingProduct) {
        const result = await updateProduct({
          variables: { id: editingProduct.id, input },
        });

        if (result.data?.updateProduct?.error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.data.updateProduct.error.message,
          });
        } else {
          toast({
            title: 'Success',
            description: 'Product updated successfully',
          });
          handleCloseDialog();
          refetch();
        }
      } else {
        const result = await createProduct({
          variables: { input },
        });

        if (result.data?.createProduct?.error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.data.createProduct.error.message,
          });
        } else {
          toast({
            title: 'Success',
            description: 'Product created successfully',
          });
          handleCloseDialog();
          refetch();
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      const result = await deleteProduct({
        variables: { id: deletingProduct.id },
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
        setIsDeleteDialogOpen(false);
        setDeletingProduct(null);
        refetch();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred',
      });
    }
  };

  const openDeleteDialog = (product: any) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted-foreground mt-1">Manage your product inventory</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No products found. Create your first product to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: any) => {
                  const isLowStock =
                    product.quantity_in_stock <= (product.reorder_level || 0);
                  const { usd, lbp } = formatDual(product.price_usd);

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.category || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{usd}</div>
                          <div className="text-xs text-muted-foreground">{lbp}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              isLowStock ? 'text-destructive font-semibold' : ''
                            }
                          >
                            {product.quantity_in_stock}
                          </span>
                          {isLowStock && (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.status === 'active' ? 'default' : 'secondary'}
                        >
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(product)}
                          >
                            <Trash className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Create New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update the product information below.'
                : 'Fill in the details to create a new product.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_usd">
                  Price (USD) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price_usd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_usd}
                  onChange={(e) =>
                    setFormData({ ...formData, price_usd: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_in_stock">
                  Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity_in_stock"
                  type="number"
                  min="0"
                  value={formData.quantity_in_stock}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity_in_stock: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder_level">
                  Reorder Level <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="reorder_level"
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) =>
                    setFormData({ ...formData, reorder_level: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || updating}>
                {creating || updating
                  ? 'Saving...'
                  : editingProduct
                  ? 'Update Product'
                  : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product "{deletingProduct?.name}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingProduct(null)}>
              Cancel
            </AlertDialogCancel>
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
