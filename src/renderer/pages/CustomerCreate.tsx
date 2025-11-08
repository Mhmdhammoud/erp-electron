import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { useCreateCustomerMutation, type AddressInput } from '../types/generated';
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

export default function CustomerCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const { toast } = useToast();

  const [createCustomer, { loading: creating }] = useCreateCustomerMutation();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Customer</h1>
          <p className="text-muted-foreground mt-2">Add a new customer to your system</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
          <CardDescription>Enter the details for the new customer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter customer name"
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
                  placeholder="customer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-4">Address Information</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    placeholder="123 Main Street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      placeholder="State"
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
                      placeholder="12345"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="Country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

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

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/customers')}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
