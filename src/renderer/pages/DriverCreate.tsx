import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { useCreateDriverMutation } from '../types/generated';

interface DriverFormData {
  driver_code: string;
  first_name: string;
  last_name: string;
  license_number: string;
  license_class: string;
  issue_date: string;
  expiry_date: string;
  phone: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
}

export default function DriverCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverFormData>();

  const [createDriver, { loading: creating }] = useCreateDriverMutation();

  const onSubmit = async (formData: DriverFormData) => {
    try {
      const input = {
        driver_code: formData.driver_code,
        first_name: formData.first_name,
        last_name: formData.last_name,
        license: {
          license_number: formData.license_number,
          license_class: formData.license_class,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date,
        },
        contact: {
          phone: formData.phone,
          email: formData.email || undefined,
          emergency_contact_name: formData.emergency_contact_name || undefined,
          emergency_contact_phone: formData.emergency_contact_phone || undefined,
        },
        notes: formData.notes || undefined,
      };

      const { data } = await createDriver({ variables: { input } });

      if (data?.createDriver?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.createDriver.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Driver created successfully',
        });
        navigate('/drivers');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create driver',
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/drivers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Driver</h1>
          <p className="text-muted-foreground mt-1">Create a new driver profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="license">License</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Driver identification and personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="driver_code">Driver Code *</Label>
                  <Input
                    id="driver_code"
                    {...register('driver_code', { required: 'Driver code is required' })}
                    placeholder="DRV-001"
                  />
                  {errors.driver_code && <p className="text-sm text-red-500">{errors.driver_code.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      {...register('first_name', { required: 'First name is required' })}
                      placeholder="John"
                    />
                    {errors.first_name && <p className="text-sm text-red-500">{errors.first_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      {...register('last_name', { required: 'Last name is required' })}
                      placeholder="Doe"
                    />
                    {errors.last_name && <p className="text-sm text-red-500">{errors.last_name.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Additional notes about the driver..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="license">
            <Card>
              <CardHeader>
                <CardTitle>License Information</CardTitle>
                <CardDescription>Driver's license details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_number">License Number *</Label>
                    <Input
                      id="license_number"
                      {...register('license_number', { required: 'License number is required' })}
                      placeholder="ABC123456"
                    />
                    {errors.license_number && <p className="text-sm text-red-500">{errors.license_number.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license_class">License Class *</Label>
                    <Input
                      id="license_class"
                      {...register('license_class', { required: 'License class is required' })}
                      placeholder="C"
                    />
                    {errors.license_class && <p className="text-sm text-red-500">{errors.license_class.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue_date">Issue Date *</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      {...register('issue_date', { required: 'Issue date is required' })}
                    />
                    {errors.issue_date && <p className="text-sm text-red-500">{errors.issue_date.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">Expiry Date *</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      {...register('expiry_date', { required: 'Expiry date is required' })}
                    />
                    {errors.expiry_date && <p className="text-sm text-red-500">{errors.expiry_date.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Phone, email, and emergency contacts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      {...register('phone', { required: 'Phone number is required' })}
                      placeholder="+961 1 234567"
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="driver@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      {...register('emergency_contact_name')}
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      {...register('emergency_contact_phone')}
                      placeholder="+961 1 234567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/drivers')}>
            Cancel
          </Button>
          <Button type="submit" disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Driver
          </Button>
        </div>
      </form>
    </div>
  );
}
