import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Plus, Search, Download, Trash2, Eye, Edit, AlertCircle, Grid3x3, List as ListIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { useToast } from '../hooks/use-toast';
import { useGetVehiclesQuery, useDeleteVehicleMutation, VehicleStatus, VehicleType } from '../types/generated';

type ViewMode = 'grid' | 'table';

export default function Vehicles() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page] = useState(1);
  const [limit] = useState(20);

  const { data, loading, refetch } = useGetVehiclesQuery({
    variables: {
      filter: {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        type: typeFilter !== 'all' ? (typeFilter as any) : undefined,
        page,
        limit,
      },
    },
  });

  const vehicles = data?.vehicles?.vehicles || [];

  const [deleteVehicle, { loading: deleting }] = useDeleteVehicleMutation();

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { data } = await deleteVehicle({ variables: { id: deleteId } });

      if (data?.deleteVehicle?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.deleteVehicle.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Vehicle deleted successfully',
        });
        refetch();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete vehicle',
      });
    }
    setDeleteId(null);
  };

  const exportToCSV = () => {
    const headers = ['Vehicle Code', 'License Plate', 'Type', 'Status', 'Make', 'Model', 'Year'];
    const rows = vehicles.map((vehicle) => [
      vehicle.vehicle_code,
      vehicle.license_plate,
      vehicle.type,
      vehicle.status,
      vehicle.make,
      vehicle.model,
      vehicle.year,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicles-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case VehicleStatus.IN_MAINTENANCE:
        return 'bg-yellow-100 text-yellow-800';
      case VehicleStatus.OUT_OF_SERVICE:
        return 'bg-red-100 text-red-800';
      case VehicleStatus.RETIRED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: VehicleStatus) => {
    switch (status) {
      case VehicleStatus.ACTIVE:
        return 'Active';
      case VehicleStatus.IN_MAINTENANCE:
        return 'In Maintenance';
      case VehicleStatus.OUT_OF_SERVICE:
        return 'Out of Service';
      case VehicleStatus.RETIRED:
        return 'Retired';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: VehicleType) => {
    switch (type) {
      case VehicleType.TRUCK:
        return 'Truck';
      case VehicleType.VAN:
        return 'Van';
      case VehicleType.CAR:
        return 'Car';
      case VehicleType.MOTORCYCLE:
        return 'Motorcycle';
      default:
        return type;
    }
  };

  const isInsuranceExpiringSoon = (expiryDate: string) => {
    const expiry = parseISO(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isInsuranceExpired = (expiryDate: string) => {
    return parseISO(expiryDate) < new Date();
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground mt-1">Manage your fleet vehicles</p>
        </div>
        <Button onClick={() => navigate('/vehicles/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code, plate, or make..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={VehicleType.TRUCK}>Truck</SelectItem>
                  <SelectItem value={VehicleType.VAN}>Van</SelectItem>
                  <SelectItem value={VehicleType.CAR}>Car</SelectItem>
                  <SelectItem value={VehicleType.MOTORCYCLE}>Motorcycle</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={VehicleStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={VehicleStatus.IN_MAINTENANCE}>In Maintenance</SelectItem>
                  <SelectItem value={VehicleStatus.OUT_OF_SERVICE}>Out of Service</SelectItem>
                  <SelectItem value={VehicleStatus.RETIRED}>Retired</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1 border rounded-md">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('table')}
                  className="h-9 w-9"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-9 w-9"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading vehicles...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No vehicles found</p>
            </div>
          ) : viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Code</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Make & Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Insurance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle._id}>
                    <TableCell className="font-medium">{vehicle.vehicle_code}</TableCell>
                    <TableCell>{vehicle.license_plate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(vehicle.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(vehicle.status)}>{getStatusLabel(vehicle.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {vehicle.insurance ? (
                        <div className="flex items-center gap-2">
                          {isInsuranceExpired(vehicle.insurance.expiry_date) ? (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-500">Expired</span>
                            </>
                          ) : isInsuranceExpiringSoon(vehicle.insurance.expiry_date) ? (
                            <>
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-yellow-600">Expiring Soon</span>
                            </>
                          ) : (
                            <span className="text-sm text-green-600">Valid</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/vehicles/${vehicle._id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/vehicles/${vehicle._id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(vehicle._id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <Card
                  key={vehicle._id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/vehicles/${vehicle._id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{vehicle.vehicle_code}</CardTitle>
                        <CardDescription>{vehicle.license_plate}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(vehicle.status)}>{getStatusLabel(vehicle.status)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Type</span>
                        <Badge variant="outline">{getTypeLabel(vehicle.type)}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">Year: {vehicle.year}</p>
                      </div>
                      {vehicle.insurance && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Insurance</span>
                          {isInsuranceExpired(vehicle.insurance.expiry_date) ? (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-500">Expired</span>
                            </div>
                          ) : isInsuranceExpiringSoon(vehicle.insurance.expiry_date) ? (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-yellow-600">Expiring Soon</span>
                            </div>
                          ) : (
                            <span className="text-sm text-green-600">Valid</span>
                          )}
                        </div>
                      )}
                      {vehicle.assigned_driver_id && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Driver Assigned</span>
                          <span className="text-sm font-medium">Yes</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/vehicles/${vehicle._id}/edit`);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(vehicle._id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
