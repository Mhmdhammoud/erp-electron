import { useMyTenantQuery } from '../types/generated';

export interface TenantBranding {
  logoUrl?: string;
  primaryColor?: string;
  invoiceFooter?: string;
  companyAddress?: string;
}

export interface CurrencyConfig {
  baseCurrency: string;
  secondaryCurrency: string;
  exchangeRate: number;
  updatedAt: string;
}

export interface Tenant {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  branding: TenantBranding;
  currencyConfig: CurrencyConfig;
  language: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function useTenant() {
  const { data, loading, error, refetch } = useMyTenantQuery({
    fetchPolicy: 'cache-and-network',
  });

  const tenant = data?.myTenant?.tenant as Tenant | undefined;

  return {
    tenant,
    loading,
    error: data?.myTenant?.error || error,
    exchangeRate: tenant?.currencyConfig?.exchangeRate || 88000,
    branding: tenant?.branding,
    language: tenant?.language || 'en',
    refetch,
  };
}
