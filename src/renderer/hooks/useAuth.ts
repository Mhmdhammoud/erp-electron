import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { setAuthTokenGetter } from '../graphql/client';

export interface AuthUser {
  userId: string;
  email: string;
  tenantId: string;
  role: 'admin' | 'user' | 'super_admin';
  isSuperAdmin: boolean;
}

export function useAuth() {
  const { getToken, isLoaded, isSignedIn } = useClerkAuth();
  const { user } = useUser();

  // Set token getter function for Apollo Client
  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(async () => {
        return await getToken();
      });
    } else {
      setAuthTokenGetter(async () => null);
    }
  }, [isSignedIn, getToken]);

  if (!isLoaded || !user) {
    return {
      isLoading: !isLoaded,
      userId: null,
      email: null,
      tenantId: null,
      role: null,
      isSuperAdmin: false,
      getToken,
    };
  }

  const metadata = user.publicMetadata as { tenant_id?: string; role?: string };

  return {
    isLoading: false,
    userId: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    tenantId: metadata.tenant_id || '',
    role: (metadata.role as AuthUser['role']) || 'user',
    isSuperAdmin: metadata.role === 'super_admin',
    getToken,
  };
}
