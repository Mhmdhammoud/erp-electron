import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, MapPin, Package, Plus, Search, Trash, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { useToast } from '../hooks/use-toast';
import { useGetWarehousesQuery, useDeleteWarehouseMutation } from '../types/generated';
import { Pagination } from '../components/ui/pagination';

export default function Warehouses() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warehouseToDelete, setWarehouseToDelete] = useState<string | null>(null);

  const { data, loading, refetch } = useGetWarehousesQuery({
    variables: {
      filter: {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      },
      page,
      limit,
    },
  });

  const [deleteWarehouse, { loading: deleting }] = useDeleteWarehouseMutation();

  const warehouses = data?.warehouses?.warehouses || [];
  const totalItems = data?.warehouses?.length || 0;

  const handleDeleteClick = (warehouseId: string) => {
    setWarehouseToDelete(warehouseId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!warehouseToDelete) return;

    try {
      const result = await deleteWarehouse({
        variables: { id: warehouseToDelete },
      });

      if (result.data?.deleteWarehouse?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.deleteWarehouse.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Warehouse deleted successfully',
        });
        refetch();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete warehouse',
      });
    } finally {
      setDeleteDialogOpen(false);
      setWarehouseToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Warehouses</h1>
          <p className="text-muted-foreground mt-1">Manage your warehouse locations and inventory</p>
        </div>
        <Button onClick={() => navigate('/warehouses/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search warehouses by name, code, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Warehouse Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No warehouses found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first warehouse'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => navigate('/warehouses/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Warehouse
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouses.map((warehouse) => (
              <Card
                key={warehouse._id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/warehouses/${warehouse._id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {warehouse.name}
                        {warehouse.is_primary && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Code: {warehouse.code}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(warehouse.status)}>
                      {warehouse.status?.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {warehouse.address.city}
                        {warehouse.address.state && `, ${warehouse.address.state}`}
                        {`, ${warehouse.address.country}`}
                      </span>
                    </div>

                    {warehouse.contact?.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{warehouse.contact.phone}</span>
                      </div>
                    )}

                    {warehouse.capacity && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {warehouse.capacity.total_sqft && (
                          <Badge variant="outline" className="text-xs">
                            {warehouse.capacity.total_sqft.toLocaleString()} sqft
                          </Badge>
                        )}
                        {warehouse.capacity.storage_units && (
                          <Badge variant="outline" className="text-xs">
                            {warehouse.capacity.storage_units} units
                          </Badge>
                        )}
                        {warehouse.capacity.max_pallets && (
                          <Badge variant="outline" className="text-xs">
                            {warehouse.capacity.max_pallets} pallets
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/warehouses/${warehouse._id}/edit`);
                        }}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(warehouse._id);
                        }}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalItems > limit && (
            <Pagination
              currentPage={page}
              totalItems={totalItems}
              itemsPerPage={limit}
              onPageChange={setPage}
              onItemsPerPageChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Warehouse</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this warehouse? This action cannot be undone and will
              affect inventory tracking.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
