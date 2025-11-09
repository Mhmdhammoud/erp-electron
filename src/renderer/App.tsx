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
import ProductDetail from './pages/ProductDetail';
import ProductEdit from './pages/ProductEdit';
import Customers from './pages/Customers';
import CustomerCreate from './pages/CustomerCreate';
import CustomerDetail from './pages/CustomerDetail';
import CustomerEdit from './pages/CustomerEdit';
import Orders from './pages/Orders';
import OrderCreate from './pages/OrderCreate';
import OrderDetail from './pages/OrderDetail';
import OrderEdit from './pages/OrderEdit';
import Invoices from './pages/Invoices';
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceDetail from './pages/InvoiceDetail';
import InvoiceEdit from './pages/InvoiceEdit';
import Settings from './pages/Settings';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!CLERK_PUBLISHABLE_KEY) {
  console.error('VITE_CLERK_PUBLISHABLE_KEY is not set');
}

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
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="erp-ui-theme">
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
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
                    <Route path="/products/:id/edit" element={<ProductEdit />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/new" element={<CustomerCreate />} />
                    <Route path="/customers/:id/edit" element={<CustomerEdit />} />
                    <Route path="/customers/:id" element={<CustomerDetail />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/new" element={<OrderCreate />} />
                    <Route path="/orders/:id/edit" element={<OrderEdit />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/invoices/new" element={<InvoiceCreate />} />
                    <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />
                    <Route path="/invoices/:id" element={<InvoiceDetail />} />
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
