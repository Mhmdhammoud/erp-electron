import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '../hooks/use-toast';
import {
  useGetVehicleQuery,
  useUpdateVehicleMutation,
  VehicleType,
  VehicleStatus,
  FuelType,
} from '../types/generated';

interface VehicleFormData {
  vehicle_code: string;
  license_plate: string;
  type: VehicleType;
  status: VehicleStatus;
  make: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  fuel_type: FuelType;
  fuel_capacity_liters: number;
  insurance_policy_number: string;
  insurance_provider: string;
  insurance_start_date: string;
  insurance_expiry_date: string;
  insurance_premium_amount: number;
  last_maintenance_date: string;
  last_maintenance_type: string;
  last_maintenance_cost: number;
  next_maintenance_date: string;
  notes: string;
}

export default function VehicleEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');

  const { data, loading: fetching } = useGetVehicleQuery({
    variables: { id: id! },
    skip: !id,
  });

  const vehicle = data?.vehicle?.vehicle;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<VehicleFormData>();

  const selectedType = watch('type');
  const selectedStatus = watch('status');
  const selectedFuelType = watch('fuel_type');

  useEffect(() => {
    if (vehicle) {
      reset({
        vehicle_code: vehicle.vehicle_code,
        license_plate: vehicle.license_plate,
        type: vehicle.type,
        status: vehicle.status,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        vin: vehicle.vin || '',
        color: vehicle.color || '',
        fuel_type: vehicle.fuel_type || undefined,
        fuel_capacity_liters: vehicle.fuel_capacity_liters || undefined,
        insurance_policy_number: vehicle.insurance?.policy_number || '',
        insurance_provider: vehicle.insurance?.provider || '',
        insurance_start_date: vehicle.insurance?.start_date || '',
        insurance_expiry_date: vehicle.insurance?.expiry_date || '',
        insurance_premium_amount: vehicle.insurance?.premium_amount || undefined,
        last_maintenance_date: vehicle.maintenance?.last_maintenance_date || '',
        last_maintenance_type: vehicle.maintenance?.last_maintenance_type || '',
        last_maintenance_cost: vehicle.maintenance?.last_maintenance_cost || undefined,
        next_maintenance_date: vehicle.maintenance?.next_maintenance_date || '',
        notes: vehicle.notes || '',
      });
    }
  }, [vehicle, reset]);

  const [updateVehicle, { loading: updating }] = useUpdateVehicleMutation();

  const onSubmit = async (formData: VehicleFormData) => {
    if (!id) return;

    try {
      const input = {
        vehicle_code: formData.vehicle_code,
        license_plate: formData.license_plate,
        type: formData.type,
        status: formData.status,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        vin: formData.vin || undefined,
        color: formData.color || undefined,
        fuel_type: formData.fuel_type || undefined,
        fuel_capacity_liters: formData.fuel_capacity_liters || undefined,
        insurance: formData.insurance_policy_number
          ? {
              policy_number: formData.insurance_policy_number,
              provider: formData.insurance_provider,
              start_date: formData.insurance_start_date,
              expiry_date: formData.insurance_expiry_date,
              premium_amount: formData.insurance_premium_amount || undefined,
            }
          : undefined,
        maintenance: formData.last_maintenance_date
          ? {
              last_maintenance_date: formData.last_maintenance_date,
              last_maintenance_type: formData.last_maintenance_type || undefined,
              last_maintenance_cost: formData.last_maintenance_cost || undefined,
              next_maintenance_date: formData.next_maintenance_date || undefined,
            }
          : undefined,
        notes: formData.notes || undefined,
      };

      const { data } = await updateVehicle({ variables: { id, input } });

      if (data?.updateVehicle?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.updateVehicle.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Vehicle updated successfully',
        });
        navigate('/vehicles');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update vehicle',
      });
    }
  };

  if (fetching) {
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
      <div className="mb-6 flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/vehicles')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Vehicle</h1>
          <p className="text-muted-foreground mt-1">
            Update vehicle: {vehicle.make} {vehicle.model} ({vehicle.license_plate})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="technical">Technical Details</TabsTrigger>
            <TabsTrigger value="insurance">Insurance & Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Vehicle identification and basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_code">Vehicle Code *</Label>
                    <Input
                      id="vehicle_code"
                      {...register('vehicle_code', { required: 'Vehicle code is required' })}
                      placeholder="VEH-001"
                    />
                    {errors.vehicle_code && <p className="text-sm text-red-500">{errors.vehicle_code.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license_plate">License Plate *</Label>
                    <Input
                      id="license_plate"
                      {...register('license_plate', { required: 'License plate is required' })}
                      placeholder="ABC-1234"
                    />
                    {errors.license_plate && <p className="text-sm text-red-500">{errors.license_plate.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Vehicle Type *</Label>
                    <Select value={selectedType} onValueChange={(value) => setValue('type', value as VehicleType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={VehicleType.TRUCK}>Truck</SelectItem>
                        <SelectItem value={VehicleType.VAN}>Van</SelectItem>
                        <SelectItem value={VehicleType.CAR}>Car</SelectItem>
                        <SelectItem value={VehicleType.MOTORCYCLE}>Motorcycle</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) => setValue('status', value as VehicleStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={VehicleStatus.ACTIVE}>Active</SelectItem>
                        <SelectItem value={VehicleStatus.IN_MAINTENANCE}>In Maintenance</SelectItem>
                        <SelectItem value={VehicleStatus.OUT_OF_SERVICE}>Out of Service</SelectItem>
                        <SelectItem value={VehicleStatus.RETIRED}>Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make *</Label>
                    <Input
                      id="make"
                      {...register('make', { required: 'Make is required' })}
                      placeholder="Toyota"
                    />
                    {errors.make && <p className="text-sm text-red-500">{errors.make.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      {...register('model', { required: 'Model is required' })}
                      placeholder="Hilux"
                    />
                    {errors.model && <p className="text-sm text-red-500">{errors.model.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Year *</Label>
                    <Input
                      id="year"
                      type="number"
                      {...register('year', {
                        required: 'Year is required',
                        valueAsNumber: true,
                        min: { value: 1900, message: 'Year must be after 1900' },
                        max: { value: new Date().getFullYear() + 1, message: 'Invalid year' },
                      })}
                      placeholder="2024"
                    />
                    {errors.year && <p className="text-sm text-red-500">{errors.year.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" {...register('notes')} placeholder="Additional notes about the vehicle..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical">
            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
                <CardDescription>Vehicle specifications and technical information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
                  <Input id="vin" {...register('vin')} placeholder="1HGBH41JXMN109186" maxLength={17} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" {...register('color')} placeholder="White" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuel_type">Fuel Type</Label>
                    <Select
                      value={selectedFuelType}
                      onValueChange={(value) => setValue('fuel_type', value as FuelType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FuelType.GASOLINE}>Gasoline</SelectItem>
                        <SelectItem value={FuelType.DIESEL}>Diesel</SelectItem>
                        <SelectItem value={FuelType.ELECTRIC}>Electric</SelectItem>
                        <SelectItem value={FuelType.HYBRID}>Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuel_capacity_liters">Fuel Capacity (Liters)</Label>
                  <Input
                    id="fuel_capacity_liters"
                    type="number"
                    {...register('fuel_capacity_liters', { valueAsNumber: true })}
                    placeholder="60"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insurance">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Information</CardTitle>
                  <CardDescription>Vehicle insurance details and coverage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insurance_policy_number">Policy Number</Label>
                      <Input
                        id="insurance_policy_number"
                        {...register('insurance_policy_number')}
                        placeholder="POL-123456"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="insurance_provider">Provider</Label>
                      <Input
                        id="insurance_provider"
                        {...register('insurance_provider')}
                        placeholder="Insurance Company Name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="insurance_start_date">Start Date</Label>
                      <Input id="insurance_start_date" type="date" {...register('insurance_start_date')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="insurance_expiry_date">Expiry Date</Label>
                      <Input id="insurance_expiry_date" type="date" {...register('insurance_expiry_date')} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_premium_amount">Premium Amount (USD)</Label>
                    <Input
                      id="insurance_premium_amount"
                      type="number"
                      step="0.01"
                      {...register('insurance_premium_amount', { valueAsNumber: true })}
                      placeholder="1500.00"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Tracking</CardTitle>
                  <CardDescription>Track maintenance schedule and history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="last_maintenance_date">Last Maintenance Date</Label>
                      <Input id="last_maintenance_date" type="date" {...register('last_maintenance_date')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="next_maintenance_date">Next Maintenance Date</Label>
                      <Input id="next_maintenance_date" type="date" {...register('next_maintenance_date')} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_maintenance_type">Last Maintenance Type</Label>
                    <Input
                      id="last_maintenance_type"
                      {...register('last_maintenance_type')}
                      placeholder="Oil change, tire rotation, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_maintenance_cost">Last Maintenance Cost (USD)</Label>
                    <Input
                      id="last_maintenance_cost"
                      type="number"
                      step="0.01"
                      {...register('last_maintenance_cost', { valueAsNumber: true })}
                      placeholder="250.00"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/vehicles')}>
            Cancel
          </Button>
          <Button type="submit" disabled={updating}>
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Vehicle
          </Button>
        </div>
      </form>
    </div>
  );
}
