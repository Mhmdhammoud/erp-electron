import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const MY_TENANT_QUERY = gql`
  query MyTenant {
    myTenant {
      data {
        id
        name
        email
        phone
        website
        branding {
          logoUrl
          primaryColor
          invoiceFooter
          companyAddress
        }
        currencyConfig {
          baseCurrency
          secondaryCurrency
          exchangeRate
          updatedAt
        }
        language
        status
        createdAt
        updatedAt
      }
      error {
        field
        message
      }
    }
  }
`;

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
  id: string;
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
  const { data, loading, error, refetch } = useQuery(MY_TENANT_QUERY, {
    fetchPolicy: 'cache-and-network',
  });

  const tenant = data?.myTenant?.data as Tenant | undefined;

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
