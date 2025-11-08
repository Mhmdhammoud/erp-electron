import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: [
    // Use endpoint first, fallback to local schema file
    process.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:5050/graphql',
    // Fallback to local schema file if endpoint fails
    '../erp-backend/src/graphql/schema.gql',
  ],
  documents: 'src/renderer/graphql/**/*.graphql',
  generates: {
    'src/renderer/types/generated.ts': {
      config: {
        skipTypename: false,
        withHooks: true,
        withHOC: false,
        withComponent: false,
        apolloReactHooksImportFrom: '@apollo/client',
        enumsAsTypes: false,
        avoidOptionals: false,
      },
      plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
    },
  },
};

export default config;
