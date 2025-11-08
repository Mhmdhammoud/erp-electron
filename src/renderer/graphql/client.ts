import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { CachePersistor } from 'apollo3-cache-persist';

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:3000/graphql';

// Log the endpoint being used
console.log('[Apollo Client] GraphQL Endpoint:', GRAPHQL_ENDPOINT);

// Create HTTP link with fetch options
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
  fetchOptions: {
    mode: 'cors',
  },
});

// Enhanced error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    for (const { message, locations, path, extensions } of graphQLErrors) {
      console.error('[GraphQL error]:', {
        message,
        locations,
        path,
        extensions,
        operation: operation?.operationName,
      });
    }
  }

  if (networkError) {
    // Provide detailed network error information
    const errorDetails: Record<string, unknown> = {
      message: networkError.message,
      name: networkError.name,
      operation: operation?.operationName,
      variables: operation?.variables,
    };

    // Handle specific error types
    if ('statusCode' in networkError) {
      errorDetails.statusCode = (networkError as { statusCode?: number }).statusCode;
    }

    if ('result' in networkError) {
      errorDetails.result = (networkError as { result?: unknown }).result;
    }

    // Check for common network issues
    if (networkError.message.includes('Failed to fetch')) {
      errorDetails.suggestion = 'Check if the backend server is running and accessible';
      errorDetails.endpoint = GRAPHQL_ENDPOINT;
      console.error('[Network error] Connection failed:', errorDetails);
      console.error('[Network error] Troubleshooting:', {
        endpoint: GRAPHQL_ENDPOINT,
        checkBackend: 'Ensure backend is running on port 3000',
        checkCORS: 'Verify CORS is enabled on the backend',
        checkNetwork: 'Check network connectivity',
      });
    } else if (networkError.message.includes('CORS')) {
      errorDetails.suggestion = 'CORS error - check backend CORS configuration';
      console.error('[Network error] CORS issue:', errorDetails);
    } else {
      console.error('[Network error] Details:', errorDetails);
    }
  }
});

// Token getter function - will be set by AuthProvider
let getAuthToken: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (tokenGetter: () => Promise<string | null>) => {
  getAuthToken = tokenGetter;
};

const authLink = setContext(async (_, { headers }) => {
  try {
    const token = getAuthToken ? await getAuthToken() : null;
    if (!token) {
      console.warn(
        '[Apollo Client] No auth token available - requests may fail if authentication is required'
      );
    }
    return {
      headers: {
        ...headers,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    };
  } catch (error) {
    console.error('[Apollo Client] Error getting auth token:', error);
    return {
      headers: {
        ...headers,
      },
    };
  }
});

// Create cache
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        products: {
          merge(_existing, incoming) {
            return incoming;
          },
        },
        customers: {
          merge(_existing, incoming) {
            return incoming;
          },
        },
        orders: {
          merge(_existing, incoming) {
            return incoming;
          },
        },
        invoices: {
          merge(_existing, incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

// Set up cache persistence
export const persistor = new CachePersistor({
  cache,
  storage: globalThis.localStorage as unknown as Storage,
  maxSize: 1048576, // 1MB
  debug: import.meta.env.DEV ?? false,
});

// Initialize cache persistence
persistor.restore();

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});
