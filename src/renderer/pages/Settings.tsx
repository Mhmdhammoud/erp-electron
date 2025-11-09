import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTenant } from '../hooks/useTenant';
import { useUpdateTenantSettingsMutation } from '../types/generated';
import { useToast } from '../hooks/use-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Building2, Palette, DollarSign, Loader2 } from 'lucide-react';

interface BusinessFormData {
  name: string;
  email: string;
  phone: string;
  website: string;
}

interface BrandingFormData {
  logoUrl: string;
  primaryColor: string;
  invoiceFooter: string;
  companyAddress: string;
}

interface CurrencyFormData {
  exchangeRate: number;
}

export default function Settings() {
  const { tenant, loading, refetch } = useTenant();
  const [activeTab, setActiveTab] = useState('business');
  const { toast } = useToast();

  const [updateTenantSettings, { loading: updating }] = useUpdateTenantSettingsMutation();

  const businessForm = useForm<BusinessFormData>({
    values: {
      name: tenant?.name || '',
      email: tenant?.email || '',
      phone: tenant?.phone || '',
      website: tenant?.website || '',
    },
  });

  const brandingForm = useForm<BrandingFormData>({
    values: {
      logoUrl: tenant?.branding?.logoUrl || '',
      primaryColor: tenant?.branding?.primaryColor || '#3b82f6',
      invoiceFooter: tenant?.branding?.invoiceFooter || '',
      companyAddress: tenant?.branding?.companyAddress || '',
    },
  });

  const currencyForm = useForm<CurrencyFormData>({
    values: {
      exchangeRate: tenant?.currencyConfig?.exchangeRate || 88000,
    },
  });

  const tabs = [
    { id: 'business', name: 'Business Information', icon: Building2 },
    { id: 'branding', name: 'Branding', icon: Palette },
    { id: 'currency', name: 'Currency', icon: DollarSign },
  ];

  const handleBusinessSubmit = async (data: BusinessFormData) => {
    try {
      const result = await updateTenantSettings({
        variables: {
          id: tenant?._id || '',
          input: {
            name: data.name,
          },
        },
      });

      if (result.data?.updateTenant?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.updateTenant.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Business information updated successfully',
        });
        refetch();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update settings',
      });
    }
  };

  const handleBrandingSubmit = async (data: BrandingFormData) => {
    try {
      const result = await updateTenantSettings({
        variables: {
          id: tenant?._id || '',
          input: {
            branding: {
              logo_url: data.logoUrl,
              primary_color: data.primaryColor,
              invoice_footer: data.invoiceFooter,
              company_address: data.companyAddress,
            },
          },
        },
      });

      if (result.data?.updateTenant?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.updateTenant.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Branding settings updated successfully',
        });
        refetch();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update branding',
      });
    }
  };

  const handleCurrencySubmit = async (data: CurrencyFormData) => {
    try {
      const result = await updateTenantSettings({
        variables: {
          id: tenant?._id || '',
          input: {
            currency_config: {
              exchange_rate: Number(data.exchangeRate),
            },
          },
        },
      });

      if (result.data?.updateTenant?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.data.updateTenant.error.message,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Exchange rate updated successfully',
        });
        refetch();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update exchange rate',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your business settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Business Information */}
      {activeTab === 'business' && (
        <Card title="Business Information">
          <form onSubmit={businessForm.handleSubmit(handleBusinessSubmit)} className="space-y-4">
            <Input
              label="Business Name"
              {...businessForm.register('name', { required: 'Business name is required' })}
              placeholder="Enter business name"
            />
            {businessForm.formState.errors.name && (
              <p className="text-sm text-red-500">{businessForm.formState.errors.name.message}</p>
            )}
            <Input
              label="Email"
              type="email"
              {...businessForm.register('email')}
              placeholder="business@example.com"
            />
            <Input
              label="Phone"
              type="tel"
              {...businessForm.register('phone')}
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="Website"
              type="url"
              {...businessForm.register('website')}
              placeholder="https://example.com"
            />
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Branding */}
      {activeTab === 'branding' && (
        <Card title="Branding & Customization">
          <form onSubmit={brandingForm.handleSubmit(handleBrandingSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
              <Input
                {...brandingForm.register('logoUrl')}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  {...brandingForm.register('primaryColor')}
                  className="h-10 w-20 rounded border border-gray-300"
                />
                <Input
                  {...brandingForm.register('primaryColor')}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Footer
              </label>
              <textarea
                className="input min-h-[100px]"
                {...brandingForm.register('invoiceFooter')}
                placeholder="Thank you for your business!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address
              </label>
              <textarea
                className="input min-h-[100px]"
                {...brandingForm.register('companyAddress')}
                placeholder="123 Main St, City, Country"
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Currency */}
      {activeTab === 'currency' && (
        <Card title="Currency Settings">
          <form onSubmit={currencyForm.handleSubmit(handleCurrencySubmit)} className="space-y-4">
            <Input
              label="Base Currency"
              defaultValue="USD"
              disabled
              helperText="Base currency is always USD"
            />
            <Input
              label="Secondary Currency"
              defaultValue="LBP"
              disabled
              helperText="Secondary currency is always LBP"
            />
            <Input
              label="Exchange Rate (USD to LBP)"
              type="number"
              {...currencyForm.register('exchangeRate', {
                required: 'Exchange rate is required',
                min: { value: 1, message: 'Exchange rate must be greater than 0' },
              })}
              placeholder="88000"
              helperText="Current exchange rate for converting USD to LBP"
            />
            {currencyForm.formState.errors.exchangeRate && (
              <p className="text-sm text-red-500">
                {currencyForm.formState.errors.exchangeRate.message}
              </p>
            )}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Exchange Rate
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
