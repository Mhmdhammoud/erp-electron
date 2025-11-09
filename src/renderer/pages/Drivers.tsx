import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Trash, Filter, Download, AlertCircle, User } from 'lucide-react';
import {
  useGetDriversQuery,
  useDeleteDriverMutation,
  DriverStatus,
} from '../types/generated';
import { useToast } from '../hooks/use-toast';
import { format, parseISO } from 'date-fns';

export default function Drivers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDriver, setDeletingDriver] = useState<any>(null);

  const { toast } = useToast();

  const { data, loading, refetch } = useGetDriversQuery({
    variables: {
      filter: {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        page,
        limit,
      },
    },
  });

  const [deleteDriver, { loading: deleting }] = useDeleteDriverMutation();

  const drivers = data?.drivers?.drivers || [];
  const totalItems = data?.drivers?.length || 0;

  const handleDelete = async () => {
    if (!deletingDriver) return;

    try {
      const result = await deleteDriver({
        variables: { id: deletingDriver._id },
      });

      if (result.data?.deleteDriver?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.deleteDriver.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Driver deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setDeletingDriver(null);
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

  const openDeleteDialog = (driver: any) => {
    setDeletingDriver(driver);
    setIsDeleteDialogOpen(true);
  };

  const handleExportCSV = () => {
    if (drivers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data',
        description: 'There are no drivers to export',
      });
      return;
    }

    const headers = ['Driver Code', 'Name', 'License Number', 'License Class', 'Status', 'Phone', 'Email', 'License Expiry'];

    const rows = drivers.map((driver: any) => [
      driver.driver_code || '',
      `${driver.first_name} ${driver.last_name}`,
      driver.license?.license_number || '',
      driver.license?.license_class || '',
      driver.status || '',
      driver.contact?.phone || '',
      driver.contact?.email || '',
      driver.license?.expiry_date || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `drivers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: `Exported ${drivers.length} drivers to CSV`,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case DriverStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case DriverStatus.INACTIVE:
        return 'bg-gray-100 text-gray-800';
      case DriverStatus.ON_LEAVE:
        return 'bg-yellow-100 text-yellow-800';
      case DriverStatus.SUSPENDED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
        <p className="text-muted-foreground mt-2">Manage your fleet drivers and licenses</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search drivers by name, code, or license number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={DriverStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={DriverStatus.INACTIVE}>Inactive</SelectItem>
                  <SelectItem value={DriverStatus.ON_LEAVE}>On Leave</SelectItem>
                  <SelectItem value={DriverStatus.SUSPENDED}>Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExportCSV} disabled={drivers.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => navigate('/drivers/new')} size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {new Array(5).fill(null).map((_, i) => (
                <Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-16">
              <User className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No drivers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Create your first driver to get started'}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate('/drivers/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Driver
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Driver Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>License Expiry</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver: any) => {
                      const licenseExpiringSoon = driver.license && isLicenseExpiringSoon(driver.license.expiry_date);
                      const licenseExpired = driver.license && isLicenseExpired(driver.license.expiry_date);

                      return (
                        <TableRow key={driver._id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-sm">{driver.driver_code}</TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {driver.first_name} {driver.last_name}
                            </div>
                            {driver.assigned_vehicle_id && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Vehicle assigned
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {driver.license ? (
                              <div>
                                <div className="font-mono text-sm">{driver.license.license_number}</div>
                                <div className="text-xs text-muted-foreground">
                                  Class: {driver.license.license_class}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {driver.license ? (
                              <div className="flex items-center gap-2">
                                <span className={licenseExpired ? 'text-red-600 font-semibold' : licenseExpiringSoon ? 'text-yellow-600 font-semibold' : ''}>
                                  {format(parseISO(driver.license.expiry_date), 'MMM dd, yyyy')}
                                </span>
                                {(licenseExpired || licenseExpiringSoon) && (
                                  <AlertCircle className={`w-4 h-4 ${licenseExpired ? 'text-red-600' : 'text-yellow-600'}`} />
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {driver.contact.phone}
                              {driver.contact.email && (
                                <div className="text-xs text-muted-foreground">{driver.contact.email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeVariant(driver.status)}>
                              {driver.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/drivers/${driver._id}`)}
                              >
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/drivers/${driver._id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(driver)}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete driver "{deletingDriver?.first_name} {deletingDriver?.last_name}"? This action cannot be undone.
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
