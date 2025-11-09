import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Trash, Mail, Phone, MapPin, User } from 'lucide-react';
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
import { useGetCustomerQuery, useDeleteCustomerMutation } from '../types/generated';
import { useToast } from '../hooks/use-toast';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, loading } = useGetCustomerQuery({
    variables: { id: id! },
    skip: !id,
  });

  const [deleteCustomer, { loading: deleting }] = useDeleteCustomerMutation();

  const customer = data?.customer?.customer;

  const handleDelete = async () => {
    if (!customer) return;

    try {
      const result = await deleteCustomer({
        variables: { id: customer._id },
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
        navigate('/customers');
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Customer Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">The customer you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/customers')} className="mt-4">
              Back to Customers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultAddress = customer.addresses?.find((addr) => addr.is_default) || customer.addresses?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
            <p className="text-muted-foreground mt-2">Customer Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/customers/${id}/edit`)}>
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
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How to reach this customer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
              <div className="text-lg font-semibold">{customer.name}</div>
            </div>

            {customer.email && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                      {customer.email}
                    </a>
                  </div>
                </div>
              </>
            )}

            {customer.phone && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Phone</div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                </div>
              </>
            )}

            {customer.notes && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
                  <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Addresses</CardTitle>
            <CardDescription>Customer delivery and billing addresses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.addresses && customer.addresses.length > 0 ? (
              customer.addresses.map((address, index) => (
                <div key={index}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <Badge variant={address.is_default ? 'default' : 'outline'} className="capitalize">
                          {address.type}
                          {address.is_default && ' (Default)'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm pl-6">
                      <div>{address.street}</div>
                      <div>
                        {address.city}
                        {address.state && `, ${address.state}`} {address.postal_code}
                      </div>
                      <div>{address.country}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No addresses on file</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer "{customer.name}". This action cannot be undone.
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
