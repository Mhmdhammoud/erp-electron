import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { useToast } from '../hooks/use-toast';
import { useGetCustomerQuery, useUpdateCustomerMutation } from '../types/generated';
import { Skeleton } from '../components/ui/skeleton';

interface AddressInput {
  type: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  addresses: AddressInput[];
  notes?: string;
}

export default function CustomerEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data, loading } = useGetCustomerQuery({
    variables: { id: id! },
    skip: !id,
  });

  const customer = data?.customer?.customer;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<CustomerFormData>({
    values: customer
      ? {
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          addresses: customer.addresses?.length
            ? customer.addresses.map((addr) => ({
                type: addr.type || 'billing',
                street: addr.street || '',
                city: addr.city || '',
                state: addr.state || '',
                postal_code: addr.postal_code || '',
                country: addr.country || '',
                is_default: addr.is_default || false,
              }))
            : [
                {
                  type: 'billing',
                  street: '',
                  city: '',
                  state: '',
                  postal_code: '',
                  country: '',
                  is_default: true,
                },
              ],
          notes: customer.notes || '',
        }
      : undefined,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'addresses',
  });

  const [updateCustomer, { loading: updating }] = useUpdateCustomerMutation();

  const onSubmit = async (formData: CustomerFormData) => {
    try {
      const { data } = await updateCustomer({
        variables: {
          id: id!,
          input: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            addresses: formData.addresses.map((addr) => ({
              type: addr.type,
              street: addr.street,
              city: addr.city,
              state: addr.state,
              postal_code: addr.postal_code,
              country: addr.country,
              is_default: addr.is_default,
            })),
            notes: formData.notes || undefined,
          },
        },
      });

      if (data?.updateCustomer?.error) {
        toast({
          title: 'Error',
          description: data.updateCustomer.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Customer updated successfully',
        });
        navigate(`/customers/${id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Customer not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/customers/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Customer</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Update the customer details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" {...register('phone', { required: 'Phone is required' })} />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register('notes')} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Addresses</CardTitle>
                <CardDescription>Manage customer addresses</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    type: 'billing',
                    street: '',
                    city: '',
                    state: '',
                    postal_code: '',
                    country: '',
                    is_default: false,
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-2">
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Select
                        value={watch(`addresses.${index}.type`)}
                        onValueChange={(value) =>
                          register(`addresses.${index}.type`).onChange({
                            target: { value, name: `addresses.${index}.type` },
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="shipping">Shipping</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`default-${index}`}
                          checked={watch(`addresses.${index}.is_default`)}
                          onCheckedChange={(checked) =>
                            register(`addresses.${index}.is_default`).onChange({
                              target: { value: checked, name: `addresses.${index}.is_default` },
                            })
                          }
                        />
                        <Label htmlFor={`default-${index}`}>Default</Label>
                      </div>
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Street Address *</Label>
                      <Input
                        {...register(`addresses.${index}.street`, {
                          required: 'Street is required',
                        })}
                      />
                      {errors.addresses?.[index]?.street && (
                        <p className="text-sm text-red-500">
                          {errors.addresses[index]?.street?.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City *</Label>
                        <Input
                          {...register(`addresses.${index}.city`, { required: 'City is required' })}
                        />
                        {errors.addresses?.[index]?.city && (
                          <p className="text-sm text-red-500">
                            {errors.addresses[index]?.city?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>State *</Label>
                        <Input
                          {...register(`addresses.${index}.state`, {
                            required: 'State is required',
                          })}
                        />
                        {errors.addresses?.[index]?.state && (
                          <p className="text-sm text-red-500">
                            {errors.addresses[index]?.state?.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Postal Code *</Label>
                        <Input
                          {...register(`addresses.${index}.postal_code`, {
                            required: 'Postal code is required',
                          })}
                        />
                        {errors.addresses?.[index]?.postal_code && (
                          <p className="text-sm text-red-500">
                            {errors.addresses[index]?.postal_code?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Country *</Label>
                        <Input
                          {...register(`addresses.${index}.country`, {
                            required: 'Country is required',
                          })}
                        />
                        {errors.addresses?.[index]?.country && (
                          <p className="text-sm text-red-500">
                            {errors.addresses[index]?.country?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(`/customers/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={updating}>
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
