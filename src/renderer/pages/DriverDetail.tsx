import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Edit, Trash2, Loader2, AlertCircle, Truck } from 'lucide-react';
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
import { useGetDriverQuery, useDeleteDriverMutation, DriverStatus } from '../types/generated';

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data, loading } = useGetDriverQuery({
    variables: { id: id! },
    skip: !id,
  });

  const driver = data?.driver?.driver;

  const [deleteDriver, { loading: deleting }] = useDeleteDriverMutation();

  const handleDelete = async () => {
    if (!id) return;

    try {
      const { data } = await deleteDriver({ variables: { id } });

      if (data?.deleteDriver?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.deleteDriver.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Driver deleted successfully',
        });
        navigate('/drivers');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete driver',
      });
    }
    setShowDeleteDialog(false);
  };

  const getStatusColor = (status: DriverStatus) => {
    switch (status) {
      case DriverStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case DriverStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      case DriverStatus.ON_LEAVE:
        return 'bg-blue-100 text-blue-800';
      case DriverStatus.SUSPENDED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: DriverStatus) => {
    switch (status) {
      case DriverStatus.ACTIVE:
        return 'Active';
      case DriverStatus.INACTIVE:
        return 'Inactive';
      case DriverStatus.ON_LEAVE:
        return 'On Leave';
      case DriverStatus.SUSPENDED:
        return 'Suspended';
      default:
        return status;
    }
  };

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = parseISO(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isLicenseExpired = (expiryDate: string) => {
    return parseISO(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/drivers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Driver Not Found</h1>
            <p className="text-muted-foreground mt-1">The requested driver could not be found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/drivers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {driver.first_name} {driver.last_name}
            </h1>
            <p className="text-muted-foreground mt-1">{driver.driver_code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/drivers/${id}/edit`)}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Driver Code</p>
                <p className="font-medium">{driver.driver_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(driver.status)}>{getStatusLabel(driver.status)}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">First Name</p>
                <p className="font-medium">{driver.first_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Name</p>
                <p className="font-medium">{driver.last_name}</p>
              </div>
            </div>

            {driver.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{driver.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{format(parseISO(driver.createdAt), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{format(parseISO(driver.updatedAt), 'PPP')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            {driver.assigned_vehicle_id ? (
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Vehicle ID</p>
                  <p className="text-sm text-muted-foreground">{driver.assigned_vehicle_id}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No vehicle assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* License Information */}
        <Card>
          <CardHeader>
            <CardTitle>License Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">License Number</p>
              <p className="font-medium">{driver.license.license_number}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">License Class</p>
              <p className="font-medium">{driver.license.license_class}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="font-medium">{format(parseISO(driver.license.issue_date), 'PP')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiry Date</p>
                <div className="flex items-center gap-2">
                  {isLicenseExpired(driver.license.expiry_date) ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="font-medium text-red-500">
                        {format(parseISO(driver.license.expiry_date), 'PP')}
                      </p>
                    </>
                  ) : isLicenseExpiringSoon(driver.license.expiry_date) ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <p className="font-medium text-yellow-600">
                        {format(parseISO(driver.license.expiry_date), 'PP')}
                      </p>
                    </>
                  ) : (
                    <p className="font-medium">{format(parseISO(driver.license.expiry_date), 'PP')}</p>
                  )}
                </div>
              </div>
            </div>

            {isLicenseExpired(driver.license.expiry_date) && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">License Expired</p>
                  <p className="text-sm text-red-700">This driver's license has expired and needs renewal.</p>
                </div>
              </div>
            )}

            {!isLicenseExpired(driver.license.expiry_date) &&
              isLicenseExpiringSoon(driver.license.expiry_date) && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">License Expiring Soon</p>
                    <p className="text-sm text-yellow-700">This driver's license will expire within 30 days.</p>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-medium">{driver.contact.phone}</p>
              </div>
              {driver.contact.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{driver.contact.email}</p>
                </div>
              )}
            </div>

            {(driver.contact.emergency_contact_name || driver.contact.emergency_contact_phone) && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Emergency Contact</p>
                <div className="grid grid-cols-2 gap-4">
                  {driver.contact.emergency_contact_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{driver.contact.emergency_contact_name}</p>
                    </div>
                  )}
                  {driver.contact.emergency_contact_phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{driver.contact.emergency_contact_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the driver "{driver.first_name}{' '}
              {driver.last_name}" from the system.
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
