import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
  useAuth as useClerkAuth,
} from '@clerk/clerk-react';
import { ApolloProvider } from '@apollo/client';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './components/theme-provider';
import { apolloClient, setAuthTokenGetter } from './graphql/client';
import Layout from './components/layout/Layout';
import { Component, ErrorInfo, ReactNode, useEffect } from 'react';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductCreate from './pages/ProductCreate';
import Customers from './pages/Customers';
import CustomerCreate from './pages/CustomerCreate';
import Orders from './pages/Orders';
import OrderCreate from './pages/OrderCreate';
import Invoices from './pages/Invoices';
import InvoiceCreate from './pages/InvoiceCreate';
import Settings from './pages/Settings';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#6b7280', textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
          Configuration Error
        </h1>
        <p style={{ color: '#6b7280', textAlign: 'center' }}>
          Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in your environment
          variables.
        </p>
        <pre
          style={{
            background: '#f3f4f6',
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#374151',
          }}
        >
          VITE_CLERK_PUBLISHABLE_KEY=your_key_here
        </pre>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="erp-ui-theme">
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          routerPush={(to) => window.history.pushState(null, '', to)}
          routerReplace={(to) => window.history.replaceState(null, '', to)}
        >
          <AuthTokenSetter />
          <ApolloProvider client={apolloClient}>
            <Router>
              <SignedIn>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/new" element={<ProductCreate />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/new" element={<CustomerCreate />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/new" element={<OrderCreate />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/invoices/new" element={<InvoiceCreate />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </SignedIn>
              <SignedOut>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    width: '100vw',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      padding: '2rem',
                    }}
                  >
                    <SignIn routing="hash" signUpUrl="/sign-up" />
                  </div>
                </div>
              </SignedOut>
            </Router>
            <Toaster />
          </ApolloProvider>
        </ClerkProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Component to set auth token getter for Apollo Client
function AuthTokenSetter() {
  const { getToken, isSignedIn } = useClerkAuth();

  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(async () => {
        try {
          return await getToken();
        } catch (error) {
          console.error('Error getting token:', error);
          return null;
        }
      });
    } else {
      setAuthTokenGetter(async () => null);
    }
  }, [isSignedIn, getToken]);

  return null;
}

export default App;
