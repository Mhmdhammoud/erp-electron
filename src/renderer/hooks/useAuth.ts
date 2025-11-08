import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { setAuthToken } from '../graphql/client';

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

  // Update auth token when user changes
  useEffect(() => {
    const updateToken = async () => {
      if (isSignedIn) {
        const token = await getToken();
        setAuthToken(token);
      } else {
        setAuthToken(null);
      }
    };

    updateToken();
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
