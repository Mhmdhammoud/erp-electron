import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: [
    {
      [process.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:3000/graphql']: {
        headers: {
          // Add any required headers here
          // For example, if your GraphQL endpoint requires API keys
        },
      },
    },
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
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
    },
  },
};

export default config;
