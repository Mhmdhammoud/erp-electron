import { useState } from 'react';
import { useTenant } from '../hooks/useTenant';
import { useUpload } from '../hooks/useUpload';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { FileUploader } from '../components/common/FileUploader';
import { Building2, Palette, DollarSign } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function Settings() {
  const { tenant, loading } = useTenant();
  const { handleUpload, uploadProgress, isUploading, error } = useUpload();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('business');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(tenant?.branding?.logoUrl);

  const tabs = [
    { id: 'business', name: 'Business Information', icon: Building2 },
    { id: 'branding', name: 'Branding', icon: Palette },
    { id: 'currency', name: 'Currency', icon: DollarSign },
  ];

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
          <form className="space-y-4">
            <Input
              label="Business Name"
              defaultValue={tenant?.name}
              placeholder="Enter business name"
            />
            <Input
              label="Email"
              type="email"
              defaultValue={tenant?.email}
              placeholder="business@example.com"
            />
            <Input
              label="Phone"
              type="tel"
              defaultValue={tenant?.phone}
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="Website"
              type="url"
              defaultValue={tenant?.website}
              placeholder="https://example.com"
            />
            <div className="flex justify-end pt-4">
              <Button>Save Changes</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Branding */}
      {activeTab === 'branding' && (
        <Card title="Branding & Customization">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo
              </label>
              <FileUploader
                id="company-logo"
                accept="image"
                variant="dropzone"
                value={logoUrl || tenant?.branding?.logoUrl}
                onChange={async (file) => {
                  try {
                    const url = await handleUpload(file, 'company-logo');
                    setLogoUrl(url);
                    toast({
                      title: 'Success',
                      description: 'Logo uploaded successfully',
                    });
                  } catch (err: any) {
                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: err.message || 'Failed to upload logo',
                    });
                  }
                }}
                onRemove={() => setLogoUrl(undefined)}
                progress={uploadProgress['company-logo'] || 0}
                isUploading={isUploading}
                showPreview={true}
              />
              {error && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  defaultValue={tenant?.branding?.primaryColor || '#3b82f6'}
                  className="h-10 w-20 rounded border border-gray-300"
                />
                <Input
                  defaultValue={tenant?.branding?.primaryColor || '#3b82f6'}
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
                defaultValue={tenant?.branding?.invoiceFooter}
                placeholder="Thank you for your business!"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address
              </label>
              <textarea
                className="input min-h-[100px]"
                defaultValue={tenant?.branding?.companyAddress}
                placeholder="123 Main St, City, Country"
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button>Save Changes</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Currency */}
      {activeTab === 'currency' && (
        <Card title="Currency Settings">
          <form className="space-y-4">
            <Input
              label="Base Currency"
              defaultValue={tenant?.currencyConfig?.baseCurrency}
              disabled
              helperText="Base currency is always USD"
            />
            <Input
              label="Secondary Currency"
              defaultValue={tenant?.currencyConfig?.secondaryCurrency}
              disabled
              helperText="Secondary currency is always LBP"
            />
            <Input
              label="Exchange Rate (USD to LBP)"
              type="number"
              defaultValue={tenant?.currencyConfig?.exchangeRate}
              placeholder="88000"
              helperText="Current exchange rate for converting USD to LBP"
            />
            <div className="flex justify-end pt-4">
              <Button>Update Exchange Rate</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
