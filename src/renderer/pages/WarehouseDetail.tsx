import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building,
  MapPin,
  Phone,
  Mail,
  Clock,
  Package,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { useToast } from '../hooks/use-toast';
import {
  useGetWarehouseQuery,
  useGetWarehouseInventoryQuery,
  useDeleteWarehouseMutation,
} from '../types/generated';

export default function WarehouseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [inventoryPage, setInventoryPage] = useState(1);
  const inventoryLimit = 10;

  const { data, loading, refetch } = useGetWarehouseQuery({
    variables: { id: id || '' },
    skip: !id,
  });

  const {
    data: inventoryData,
    loading: inventoryLoading,
    refetch: refetchInventory,
  } = useGetWarehouseInventoryQuery({
    variables: {
      warehouseId: id || '',
      page: inventoryPage,
      limit: inventoryLimit,
    },
    skip: !id,
  });

  const [deleteWarehouse, { loading: deleting }] = useDeleteWarehouseMutation();

  const warehouse = data?.warehouse?.warehouse;
  const inventories = inventoryData?.warehouseInventory?.inventories || [];
  const totalInventoryItems = inventoryData?.warehouseInventory?.length || 0;

  const handleDelete = async () => {
    if (!id) return;

    try {
      const { data } = await deleteWarehouse({ variables: { id } });

      if (data?.deleteWarehouse?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.deleteWarehouse.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Warehouse deleted successfully',
        });
        navigate('/warehouses');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete warehouse',
      });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
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

  const formatTime = (time?: string) => {
    if (!time) return 'Closed';
    return time;
  };

  if (loading) {
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

  const totalCapacityUsed =
    warehouse.capacity?.total_sqft && warehouse.capacity.storage_units
      ? Math.round(
          ((warehouse.capacity.storage_units || 0) / (warehouse.capacity.total_sqft || 1)) * 100
        )
      : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/warehouses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{warehouse.name}</h1>
              {warehouse.is_primary && (
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground">Code: {warehouse.code}</p>
              <Badge className={getStatusColor(warehouse.status)}>
                {warehouse.status?.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/warehouses/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Building className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>{warehouse.address.street}</p>
                <p>
                  {warehouse.address.city}
                  {warehouse.address.state && `, ${warehouse.address.state}`}
                </p>
                {warehouse.address.postal_code && <p>{warehouse.address.postal_code}</p>}
                <p className="font-semibold">{warehouse.address.country}</p>
                {warehouse.address.coordinates && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Coordinates: {warehouse.address.coordinates.latitude},{' '}
                    {warehouse.address.coordinates.longitude}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {warehouse.contact?.name ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{warehouse.contact.name}</span>
                    </div>
                    {warehouse.contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{warehouse.contact.phone}</span>
                      </div>
                    )}
                    {warehouse.contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{warehouse.contact.email}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No contact information available</p>
                )}
              </CardContent>
            </Card>

            {/* Capacity Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {warehouse.capacity ? (
                  <div className="space-y-3">
                    {warehouse.capacity.total_sqft && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Square Feet:</span>
                        <span className="font-semibold">
                          {warehouse.capacity.total_sqft.toLocaleString()} sqft
                        </span>
                      </div>
                    )}
                    {warehouse.capacity.storage_units && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Storage Units:</span>
                        <span className="font-semibold">
                          {warehouse.capacity.storage_units.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {warehouse.capacity.max_pallets && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Pallets:</span>
                        <span className="font-semibold">
                          {warehouse.capacity.max_pallets.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {totalCapacityUsed > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Capacity Used:</span>
                          <span className="font-semibold">{totalCapacityUsed}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${totalCapacityUsed}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No capacity information available</p>
                )}
              </CardContent>
            </Card>

            {/* Operating Hours Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Operating Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                {warehouse.operating_hours ? (
                  <div className="space-y-2">
                    {[
                      { day: 'Monday', hours: warehouse.operating_hours.monday },
                      { day: 'Tuesday', hours: warehouse.operating_hours.tuesday },
                      { day: 'Wednesday', hours: warehouse.operating_hours.wednesday },
                      { day: 'Thursday', hours: warehouse.operating_hours.thursday },
                      { day: 'Friday', hours: warehouse.operating_hours.friday },
                      { day: 'Saturday', hours: warehouse.operating_hours.saturday },
                      { day: 'Sunday', hours: warehouse.operating_hours.sunday },
                    ].map(({ day, hours }) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{day}:</span>
                        <span>
                          {hours
                            ? `${formatTime(hours.open)} - ${formatTime(hours.close)}`
                            : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No operating hours set</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Warehouse Inventory</CardTitle>
                  <CardDescription>
                    Products stored in this warehouse ({totalInventoryItems} items)
                  </CardDescription>
                </div>
                <Button onClick={() => navigate(`/warehouses/${id}/transfer`)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Transfer Stock
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : inventories.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product ID</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Total Quantity</TableHead>
                        <TableHead className="text-right">Reserved</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead>Last Restocked</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventories.map((inventory) => (
                        <TableRow key={inventory._id}>
                          <TableCell className="font-medium">{inventory.product_id}</TableCell>
                          <TableCell>{inventory.location || 'N/A'}</TableCell>
                          <TableCell className="text-right">{inventory.quantity}</TableCell>
                          <TableCell className="text-right">
                            {inventory.reserved_quantity || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {inventory.available_quantity || inventory.quantity}
                          </TableCell>
                          <TableCell>
                            {inventory.last_restocked_at
                              ? new Date(inventory.last_restocked_at).toLocaleDateString()
                              : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalInventoryItems > inventoryLimit && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing {(inventoryPage - 1) * inventoryLimit + 1} to{' '}
                        {Math.min(inventoryPage * inventoryLimit, totalInventoryItems)} of{' '}
                        {totalInventoryItems} items
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInventoryPage((p) => Math.max(1, p - 1))}
                          disabled={inventoryPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInventoryPage((p) => p + 1)}
                          disabled={inventoryPage * inventoryLimit >= totalInventoryItems}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No inventory in this warehouse</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{warehouse.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
