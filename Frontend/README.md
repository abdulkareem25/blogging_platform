# Inkline Frontend

React + Vite frontend foundation for the blogging platform.

## Run locally

```bash
npm install
npm run dev
```

The API client defaults to `http://localhost:5000/api/v1`. Copy `.env.example` to `.env` to override `VITE_API_BASE_URL`.

## Included in this initial setup

- Feature-oriented source structure for auth and posts
- Axios client with credentials, access-token attachment, and single-flight refresh handling
- Redux auth state with session restore on startup
- React Router public, guest-only, and protected route foundations
- Editorial posts landing page with URL-driven search, tags, and pagination controls
- Login, registration, profile, and post-detail route shells
- Responsive CSS custom-property styling with no UI framework dependency

The remaining blueprint slices, including full post CRUD, comments, admin management, and toast state, can build on the established services, guards, and layout.
