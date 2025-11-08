import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Trash, MapPin, Mail, Phone } from 'lucide-react';
import {
  useGetCustomersQuery,
  useSearchCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  type AddressInput,
} from '../types/generated';
import { useToast } from '../hooks/use-toast';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  // Address fields
  addressType: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const initialFormData: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  notes: '',
  addressType: 'billing',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
};

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);

  const { toast } = useToast();

  // Use searchCustomers when there's a search term, otherwise use customers
  const hasSearchTerm = searchTerm.trim().length > 0;

  const {
    data: customersData,
    loading: customersLoading,
    refetch: refetchCustomers,
  } = useGetCustomersQuery({
    variables: { filter: {} },
    skip: hasSearchTerm,
  });

  const {
    data: searchData,
    loading: searchLoading,
    refetch: refetchSearch,
  } = useSearchCustomersQuery({
    variables: {
      searchTerm: searchTerm.trim(),
      filter: {},
    },
    skip: !hasSearchTerm,
  });

  const loading = customersLoading || searchLoading;
  const refetch = hasSearchTerm ? refetchSearch : refetchCustomers;

  const [createCustomer, { loading: creating }] = useCreateCustomerMutation();
  const [updateCustomer, { loading: updating }] = useUpdateCustomerMutation();
  const [deleteCustomer, { loading: deleting }] = useDeleteCustomerMutation();

  const customers =
    (hasSearchTerm
      ? searchData?.searchCustomers?.customers
      : customersData?.customers?.customers) || [];

  const handleOpenDialog = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
      const defaultAddress =
        customer.addresses?.find((a: any) => a.is_default) || customer.addresses?.[0];
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        notes: customer.notes || '',
        addressType: defaultAddress?.type || 'billing',
        street: defaultAddress?.street || '',
        city: defaultAddress?.city || '',
        state: defaultAddress?.state || '',
        postalCode: defaultAddress?.postal_code || '',
        country: defaultAddress?.country || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const addresses: AddressInput[] = [];
    if (formData.street && formData.city && formData.postalCode && formData.country) {
      addresses.push({
        type: formData.addressType,
        street: formData.street,
        city: formData.city,
        state: formData.state || null,
        postal_code: formData.postalCode,
        country: formData.country,
        is_default: true,
      });
    }

    const input = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      notes: formData.notes || null,
      addresses: addresses.length > 0 ? addresses : null,
    };

    try {
      if (editingCustomer) {
        const result = await updateCustomer({
          variables: { id: editingCustomer._id, input },
        });

        if (result.data?.updateCustomer?.error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.data.updateCustomer.error.message,
          });
        } else {
          toast({
            title: 'Success',
            description: 'Customer updated successfully',
          });
          handleCloseDialog();
          refetch();
        }
      } else {
        const result = await createCustomer({
          variables: { input },
        });

        if (result.data?.createCustomer?.error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: result.data.createCustomer.error.message,
          });
        } else {
          toast({
            title: 'Success',
            description: 'Customer created successfully',
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
    if (!deletingCustomer) return;

    try {
      const result = await deleteCustomer({
        variables: { id: deletingCustomer._id },
      });

      if (result.data?.deleteCustomer?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.deleteCustomer.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Customer deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setDeletingCustomer(null);
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

  const openDeleteDialog = (customer: any) => {
    setDeletingCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-muted-foreground mt-1">Manage your customer relationships</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
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
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No customers found. Add your first customer to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: any) => {
                  const defaultAddress =
                    customer.addresses?.find((a: any) => a.is_default) || customer.addresses?.[0];

                  return (
                    <TableRow key={customer._id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{customer.phone}</span>
                            </div>
                          )}
                          {!customer.email && !customer.phone && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {defaultAddress ? (
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground">
                              {defaultAddress.city}, {defaultAddress.country}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {customer.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(customer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(customer)}
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
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Create New Customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Update the customer information below.'
                : 'Fill in the details to create a new customer.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3">Address Information</h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about this customer..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || updating}>
                {creating || updating
                  ? 'Saving...'
                  : editingCustomer
                    ? 'Update Customer'
                    : 'Create Customer'}
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
              This will permanently delete the customer "{deletingCustomer?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingCustomer(null)}>Cancel</AlertDialogCancel>
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
