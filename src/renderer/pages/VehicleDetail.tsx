import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Edit, Trash2, Loader2, AlertCircle, User, Wrench, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useGetVehicleQuery, useDeleteVehicleMutation, VehicleStatus, VehicleType } from '../types/generated';

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, loading } = useGetVehicleQuery({
    variables: { id: id! },
    skip: !id,
  });

  const vehicle = data?.vehicle?.vehicle;

  const [deleteVehicle, { loading: deleting }] = useDeleteVehicleMutation();

  const handleDelete = async () => {
    if (!id) return;

    try {
      const { data } = await deleteVehicle({ variables: { id } });

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
        navigate('/vehicles');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete vehicle',
      });
    }
    setShowDeleteDialog(false);
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

  const isMaintenanceDue = (nextDate: string) => {
    const next = parseISO(nextDate);
    const now = new Date();
    return next <= now;
  };

  const isMaintenanceSoon = (nextDate: string) => {
    const next = parseISO(nextDate);
    const now = new Date();
    const daysUntilMaintenance = Math.floor((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/vehicles')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Vehicle Not Found</h1>
            <p className="text-muted-foreground mt-1">The requested vehicle could not be found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/vehicles')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </h1>
            <p className="text-muted-foreground mt-1">
              {vehicle.vehicle_code} • {vehicle.license_plate}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/vehicles/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle Code</p>
                <p className="font-medium">{vehicle.vehicle_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">License Plate</p>
                <p className="font-medium">{vehicle.license_plate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(vehicle.status)}>{getStatusLabel(vehicle.status)}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge variant="outline">{getTypeLabel(vehicle.type)}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Make</p>
                <p className="font-medium">{vehicle.make}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-medium">{vehicle.model}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium">{vehicle.year}</p>
              </div>
              {vehicle.color && (
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <p className="font-medium">{vehicle.color}</p>
                </div>
              )}
              {vehicle.vin && (
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-medium text-sm">{vehicle.vin}</p>
                </div>
              )}
            </div>

            {(vehicle.fuel_type || vehicle.fuel_capacity_liters) && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                {vehicle.fuel_type && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Type</p>
                    <p className="font-medium">{vehicle.fuel_type}</p>
                  </div>
                )}
                {vehicle.fuel_capacity_liters && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Capacity</p>
                    <p className="font-medium">{vehicle.fuel_capacity_liters} Liters</p>
                  </div>
                )}
              </div>
            )}

            {vehicle.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{vehicle.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{format(parseISO(vehicle.createdAt), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{format(parseISO(vehicle.updatedAt), 'PPP')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Driver */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Driver</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle.assigned_driver_id ? (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Driver ID</p>
                  <p className="text-sm text-muted-foreground">{vehicle.assigned_driver_id}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No driver assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insurance Information */}
        {vehicle.insurance && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Insurance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Policy Number</p>
                <p className="font-medium">{vehicle.insurance.policy_number}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-medium">{vehicle.insurance.provider}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{format(parseISO(vehicle.insurance.start_date), 'PP')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expiry Date</p>
                  <div className="flex items-center gap-2">
                    {isInsuranceExpired(vehicle.insurance.expiry_date) ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="font-medium text-red-500">
                          {format(parseISO(vehicle.insurance.expiry_date), 'PP')}
                        </p>
                      </>
                    ) : isInsuranceExpiringSoon(vehicle.insurance.expiry_date) ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <p className="font-medium text-yellow-600">
                          {format(parseISO(vehicle.insurance.expiry_date), 'PP')}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium">{format(parseISO(vehicle.insurance.expiry_date), 'PP')}</p>
                    )}
                  </div>
                </div>
              </div>

              {vehicle.insurance.premium_amount && (
                <div>
                  <p className="text-sm text-muted-foreground">Premium Amount</p>
                  <p className="font-medium">${vehicle.insurance.premium_amount.toFixed(2)}</p>
                </div>
              )}

              {isInsuranceExpired(vehicle.insurance.expiry_date) && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Insurance Expired</p>
                    <p className="text-sm text-red-700">This vehicle's insurance has expired and needs renewal.</p>
                  </div>
                </div>
              )}

              {!isInsuranceExpired(vehicle.insurance.expiry_date) &&
                isInsuranceExpiringSoon(vehicle.insurance.expiry_date) && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Insurance Expiring Soon</p>
                      <p className="text-sm text-yellow-700">This vehicle's insurance will expire within 30 days.</p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Maintenance Information */}
        {vehicle.maintenance && (
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                <CardTitle>Maintenance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {vehicle.maintenance.last_maintenance_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Last Maintenance Date</p>
                    <p className="font-medium">{format(parseISO(vehicle.maintenance.last_maintenance_date), 'PP')}</p>
                  </div>
                )}
                {vehicle.maintenance.next_maintenance_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Next Maintenance Date</p>
                    <div className="flex items-center gap-2">
                      {isMaintenanceDue(vehicle.maintenance.next_maintenance_date) ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="font-medium text-red-500">
                            {format(parseISO(vehicle.maintenance.next_maintenance_date), 'PP')}
                          </p>
                        </>
                      ) : isMaintenanceSoon(vehicle.maintenance.next_maintenance_date) ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <p className="font-medium text-yellow-600">
                            {format(parseISO(vehicle.maintenance.next_maintenance_date), 'PP')}
                          </p>
                        </>
                      ) : (
                        <p className="font-medium">{format(parseISO(vehicle.maintenance.next_maintenance_date), 'PP')}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {vehicle.maintenance.last_maintenance_type && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Maintenance Type</p>
                  <p className="font-medium">{vehicle.maintenance.last_maintenance_type}</p>
                </div>
              )}

              {vehicle.maintenance.last_maintenance_cost && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Maintenance Cost</p>
                  <p className="font-medium">${vehicle.maintenance.last_maintenance_cost.toFixed(2)}</p>
                </div>
              )}

              {vehicle.maintenance.next_maintenance_date && isMaintenanceDue(vehicle.maintenance.next_maintenance_date) && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Maintenance Overdue</p>
                    <p className="text-sm text-red-700">This vehicle's maintenance is overdue and should be scheduled immediately.</p>
                  </div>
                </div>
              )}

              {vehicle.maintenance.next_maintenance_date &&
                !isMaintenanceDue(vehicle.maintenance.next_maintenance_date) &&
                isMaintenanceSoon(vehicle.maintenance.next_maintenance_date) && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Maintenance Due Soon</p>
                      <p className="text-sm text-yellow-700">This vehicle's maintenance is due within 7 days.</p>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle "{vehicle.make} {vehicle.model} (
              {vehicle.license_plate})" from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
