# Kubernetes Manifest Generator

A web application for easily creating Kubernetes RBAC manifests (Role, ClusterRole, RoleBinding, ServiceAccount).

## Features

- Generate RBAC manifests with a user-friendly interface
- Dark mode support
- Deployed on GitHub Pages

## Development

To start the development server:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or open in a browser tab automatically
npm run dev -- --open
```

## Building and Testing

To create a production build:

```bash
npm run build
```

You can preview the production build locally:

```bash
npm run preview
```

## Deployment to GitHub Pages

This project is configured for deployment to GitHub Pages using a base path of `/kubernetes-manifest-generator/`.

### Deployment Options

#### Automatic Deployment (GitHub Actions)

The project includes a GitHub Actions workflow that automatically deploys to GitHub Pages when changes are pushed to the main branch.

#### Manual Deployment

You can manually deploy the app using:

```bash
npm run deploy
```

This will:
1. Set `NODE_ENV=production` to enable the proper base path
2. Build the application
3. Deploy to the `gh-pages` branch using the `gh-pages` package

### SPA Routing on GitHub Pages

This project implements SPA (Single Page Application) routing for GitHub Pages using:

1. A `404.html` redirect page that captures any direct URL accesses and redirects to the main app with path info
2. A client-side redirect handler (`src/lib/gh-pages-spa-redirect.js`) that processes the redirect parameters
3. All internal links use the `base` path from SvelteKit to ensure proper URLs in both development and production

### Configuration Details

- **Base Path**: Set in `svelte.config.js` to `/kubernetes-manifest-generator` for production
- **Adapter**: Uses `@sveltejs/adapter-static` for static site generation
- **Fallback**: Configured with `fallback: 'index.html'` for SPA behavior

## Accessing the Deployed Application

The live application is available at: [https://nimishgj.github.io/kubernetes-manifest-generator/](https://nimishgj.github.io/kubernetes-manifest-generator/)
