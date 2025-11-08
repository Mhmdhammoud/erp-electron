# ERP Electron Application

A modern, multi-tenant retail ERP system built with **Electron**, **React**, **TypeScript**, **HeroUI**, and **GraphQL**.

## 🚀 Features

- **Desktop-First Experience**: Built with Electron for Windows, macOS, and Linux
- **Beautiful UI**: Powered by HeroUI and TailwindCSS
- **Multi-Tenant Architecture**: Secure tenant isolation with Clerk authentication
- **GraphQL API**: Real-time data fetching with Apollo Client
- **Type-Safe**: Full TypeScript support with GraphQL code generation
- **Offline Support**: Apollo cache persistence for offline functionality
- **Multi-Currency**: USD/LBP dual display throughout the app

## 📋 Prerequisites

- Node.js 20 LTS or higher
- npm or yarn
- Access to the ERP backend GraphQL API

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd erp-electron
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your credentials:
   ```env
   # Clerk Authentication
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

   # GraphQL API
   VITE_GRAPHQL_ENDPOINT=http://localhost:3000/graphql

   # For code generation
   GRAPHQL_ENDPOINT=http://localhost:3000/graphql
   ```

## 🏃 Development

### Start the development server

```bash
npm run dev
```

This will start the Vite dev server on `http://localhost:5173`

### Run in Electron

```bash
npm run electron:dev
```

This starts both Vite and Electron in development mode.

### Generate TypeScript types from GraphQL schema

```bash
npm run codegen
```

This generates type-safe hooks and types from your GraphQL schema.

## 🏗️ Build

### Build for development

```bash
npm run build:dev
```

### Build for production

```bash
npm run build
```

### Build Electron app

```bash
npm run electron:build
```

This creates distributable packages for your current platform in the `dist` folder.

## 📁 Project Structure

```
erp-electron/
├── src/
│   ├── main/                 # Electron main process
│   │   └── main.ts
│   ├── preload/              # Electron preload scripts
│   │   └── preload.ts
│   └── renderer/             # React app
│       ├── components/
│       │   ├── common/       # Reusable components
│       │   └── layout/       # Layout components
│       ├── graphql/
│       │   └── client.ts     # Apollo Client setup
│       ├── hooks/            # Custom React hooks
│       ├── pages/            # Page components
│       ├── store/            # Zustand stores
│       ├── styles/           # Global styles
│       ├── types/            # TypeScript types
│       ├── utils/            # Utility functions
│       ├── App.tsx           # Root component
│       └── main.tsx          # React entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎨 Tech Stack

### Core
- **Electron** 27+ - Desktop application framework
- **React** 18.x - UI library
- **TypeScript** 5.x - Type safety
- **Vite** 5.x - Build tool and dev server

### UI & Styling
- **HeroUI** 2.x - Modern React component library
- **TailwindCSS** 3.x - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Framer Motion** - Animations (HeroUI dependency)

### State & Data
- **Apollo Client** 3.8+ - GraphQL client
- **Zustand** - Lightweight state management
- **React Hook Form** - Form handling
- **Zod** - Runtime validation

### Authentication
- **@clerk/clerk-react** - Authentication and user management

### Development
- **GraphQL Code Generator** - Type-safe GraphQL operations
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📖 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build without electron-builder |
| `npm run electron:dev` | Run Electron in development |
| `npm run electron:build` | Build Electron app |
| `npm run codegen` | Generate TypeScript from GraphQL |
| `npm run lint` | Lint code with ESLint |
| `npm run format` | Format code with Prettier |

## 🔑 Key Features

### Authentication
- Clerk-based authentication with JWT
- Automatic token management
- Tenant-based access control

### Multi-Tenancy
- Automatic tenant isolation
- Tenant-specific branding
- Per-tenant currency settings

### GraphQL Integration
- Type-safe queries and mutations
- Automatic code generation
- Optimistic UI updates
- Cache persistence for offline support

### Pages
- 📊 **Dashboard** - KPIs, metrics, and analytics
- 📦 **Products** - Inventory management
- 👥 **Customers** - Customer relationship management
- 🛒 **Orders** - Sales order processing
- 📄 **Invoices** - Invoice generation and payment tracking
- ⚙️ **Settings** - Business configuration

## 🎯 Development Guidelines

### Adding a New Page

1. Create page component in `src/renderer/pages/`
2. Add route in `src/renderer/App.tsx`
3. Add navigation item in `src/renderer/components/layout/Sidebar.tsx`

### Creating GraphQL Queries

1. Add query in `src/renderer/graphql/queries/`
2. Run `npm run codegen` to generate types
3. Use generated hooks in your components

### Using HeroUI Components

```tsx
import { Button, Input, Card } from '@heroui/react';

function MyComponent() {
  return (
    <Card>
      <Input label="Name" />
      <Button color="primary">Submit</Button>
    </Card>
  );
}
```

### Custom Hooks

- `useAuth()` - Access user authentication state
- `useTenant()` - Access tenant information
- `useCurrency()` - Currency formatting and conversion

## 🐛 Troubleshooting

### GraphQL Endpoint Issues
- Ensure backend is running on the correct port
- Verify `VITE_GRAPHQL_ENDPOINT` in `.env`
- Check network connectivity

### Clerk Authentication
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is set correctly
- Ensure you're using the correct Clerk environment (dev/prod)

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team

---

Built with ❤️ using Vite, React, TypeScript, and HeroUI
