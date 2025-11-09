import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Building, MapPin, Phone, Clock, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../hooks/use-toast';
import { useCreateWarehouseMutation } from '../types/generated';

interface WarehouseFormData {
  name: string;
  code: string;
  is_primary: boolean;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  total_sqft?: number;
  storage_units?: number;
  max_pallets?: number;
  monday_open?: string;
  monday_close?: string;
  tuesday_open?: string;
  tuesday_close?: string;
  wednesday_open?: string;
  wednesday_close?: string;
  thursday_open?: string;
  thursday_close?: string;
  friday_open?: string;
  friday_close?: string;
  saturday_open?: string;
  saturday_close?: string;
  sunday_open?: string;
  sunday_close?: string;
}

export default function WarehouseCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<WarehouseFormData>({
    defaultValues: {
      is_primary: false,
      country: 'Lebanon',
    },
  });

  const [createWarehouse, { loading: creating }] = useCreateWarehouseMutation();

  const onSubmit = async (formData: WarehouseFormData) => {
    try {
      const input = {
        name: formData.name,
        code: formData.code,
        is_primary: formData.is_primary,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state || undefined,
          postal_code: formData.postal_code || undefined,
          country: formData.country,
          coordinates:
            formData.latitude && formData.longitude
              ? {
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                }
              : undefined,
        },
        contact:
          formData.contact_name || formData.contact_phone || formData.contact_email
            ? {
                name: formData.contact_name || undefined,
                phone: formData.contact_phone || undefined,
                email: formData.contact_email || undefined,
              }
            : undefined,
        capacity:
          formData.total_sqft || formData.storage_units || formData.max_pallets
            ? {
                total_sqft: formData.total_sqft || undefined,
                storage_units: formData.storage_units || undefined,
                max_pallets: formData.max_pallets || undefined,
              }
            : undefined,
        operating_hours: {
          monday:
            formData.monday_open && formData.monday_close
              ? { open: formData.monday_open, close: formData.monday_close }
              : undefined,
          tuesday:
            formData.tuesday_open && formData.tuesday_close
              ? { open: formData.tuesday_open, close: formData.tuesday_close }
              : undefined,
          wednesday:
            formData.wednesday_open && formData.wednesday_close
              ? { open: formData.wednesday_open, close: formData.wednesday_close }
              : undefined,
          thursday:
            formData.thursday_open && formData.thursday_close
              ? { open: formData.thursday_open, close: formData.thursday_close }
              : undefined,
          friday:
            formData.friday_open && formData.friday_close
              ? { open: formData.friday_open, close: formData.friday_close }
              : undefined,
          saturday:
            formData.saturday_open && formData.saturday_close
              ? { open: formData.saturday_open, close: formData.saturday_close }
              : undefined,
          sunday:
            formData.sunday_open && formData.sunday_close
              ? { open: formData.sunday_open, close: formData.sunday_close }
              : undefined,
        },
      };

      const { data } = await createWarehouse({ variables: { input } });

      if (data?.createWarehouse?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.createWarehouse.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Warehouse created successfully',
        });
        navigate('/warehouses');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create warehouse',
      });
    }
  };

  const generateCode = () => {
    const code = `WH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setValue('code', code);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/warehouses')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Warehouse</h1>
          <p className="text-muted-foreground mt-1">Add a new warehouse location</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">
              <Building className="mr-2 h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="address">
              <MapPin className="mr-2 h-4 w-4" />
              Address
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="mr-2 h-4 w-4" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="details">
              <Clock className="mr-2 h-4 w-4" />
              Details
            </TabsTrigger>
          </TabsList>

          {/* Basic Information */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the warehouse name and unique code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Warehouse Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Warehouse name is required' })}
                    placeholder="e.g., Main Warehouse"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Warehouse Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      {...register('code', { required: 'Warehouse code is required' })}
                      placeholder="e.g., WH-001"
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Generate
                    </Button>
                  </div>
                  {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_primary"
                    checked={watch('is_primary')}
                    onCheckedChange={(checked) => setValue('is_primary', checked as boolean)}
                  />
                  <Label htmlFor="is_primary" className="cursor-pointer">
                    Set as primary warehouse
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address */}
          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
                <CardDescription>Enter the warehouse physical address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    {...register('street', { required: 'Street address is required' })}
                    placeholder="123 Main Street"
                  />
                  {errors.street && <p className="text-sm text-red-500">{errors.street.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      {...register('city', { required: 'City is required' })}
                      placeholder="Beirut"
                    />
                    {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" {...register('state')} placeholder="Optional" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input id="postal_code" {...register('postal_code')} placeholder="12345" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      {...register('country', { required: 'Country is required' })}
                      placeholder="Lebanon"
                    />
                    {errors.country && (
                      <p className="text-sm text-red-500">{errors.country.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude (Optional)</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      {...register('latitude', { valueAsNumber: true })}
                      placeholder="33.8547"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude (Optional)</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      {...register('longitude', { valueAsNumber: true })}
                      placeholder="35.8623"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Enter contact details for this warehouse (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Person Name</Label>
                  <Input
                    id="contact_name"
                    {...register('contact_name')}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone Number</Label>
                  <Input
                    id="contact_phone"
                    {...register('contact_phone')}
                    placeholder="+961 1 234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email Address</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    {...register('contact_email')}
                    placeholder="warehouse@example.com"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details */}
          <TabsContent value="details">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Capacity</CardTitle>
                  <CardDescription>Enter warehouse capacity details (optional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total_sqft">Total Square Feet</Label>
                      <Input
                        id="total_sqft"
                        type="number"
                        {...register('total_sqft', { valueAsNumber: true })}
                        placeholder="10000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storage_units">Storage Units</Label>
                      <Input
                        id="storage_units"
                        type="number"
                        {...register('storage_units', { valueAsNumber: true })}
                        placeholder="500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_pallets">Max Pallets</Label>
                      <Input
                        id="max_pallets"
                        type="number"
                        {...register('max_pallets', { valueAsNumber: true })}
                        placeholder="200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operating Hours</CardTitle>
                  <CardDescription>Set weekly operating hours (optional)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
                    (day) => (
                      <div key={day} className="grid grid-cols-3 gap-4 items-center">
                        <Label className="capitalize">{day}</Label>
                        <div className="space-y-2">
                          <Input
                            type="time"
                            {...register(`${day}_open` as any)}
                            placeholder="09:00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Input
                            type="time"
                            {...register(`${day}_close` as any)}
                            placeholder="18:00"
                          />
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/warehouses')}>
            Cancel
          </Button>
          <Button type="submit" disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Warehouse
          </Button>
        </div>
      </form>
    </div>
  );
}
