# MERN Blogging Platform — Frontend Technical Blueprint

> ⚠️ **Internal development document.** Not a public API contract or replacement for README.md.
> Decisions may evolve during implementation. See README.md for final project documentation.

---

## Requirement Classification

### Confirmed Requirements (from project spec + backend handoff)
- Blog UI in React displaying posts and comments
- Full CRUD for posts (create, read, update, delete)
- Comment create and delete
- Search and pagination for the post list
- Auth system: register, login, logout, session persistence
- Auth-guarded create/edit/delete UI
- Frontend connected to backend REST API (`/api/v1`)
- Two roles: `user` and `admin`

### Assumptions
- **Build tool:** Vite — fast HMR, zero CRA baggage, first-class ESM.
- **Routing:** React Router v6 with nested routes.
- **State:** Redux Toolkit for auth state only. Local component state + URL params for everything else. No RTK Query or TanStack Query — they're overkill for this scale.
- **HTTP client:** Axios — interceptors are required for transparent token attach + silent refresh. Native `fetch` cannot do this cleanly.
- **Forms:** React Hook Form + Zod — uncontrolled inputs, minimal re-renders, schema-first validation.
- **Styling:** Vanilla CSS with CSS custom properties — no Tailwind, no CSS-in-JS, maximum control.
- **No SSR** — pure SPA. SEO is not a v1 requirement.
- **No real-time** — no WebSocket, no polling.
- **No file uploads** — avatar is a URL string field; Cloudinary upload is a v2 concern.

### Decisions — All Resolved

| # | Decision | Resolution |
|---|---|---|
| 1 | Build tool | Vite |
| 2 | Routing | React Router v6 |
| 3 | Global state | Redux Toolkit (auth only) |
| 4 | Server state | Local state in hooks — no TanStack Query/SWR |
| 5 | HTTP client | Axios with interceptors |
| 6 | Forms | React Hook Form + Zod |
| 7 | Styling | Vanilla CSS + CSS custom properties |
| 8 | Access token storage | Redux state (memory) — NOT localStorage |
| 9 | Refresh token | httpOnly cookie (browser-managed, not JS-accessible) |
| 10 | URL state for search | Yes — search/page/tag/sort live in URL query params |

---

## 1. Application Understanding

### What the App Does
A multi-user blogging platform where:
- **Guests** (unauthenticated) browse, search, and read posts and comments.
- **Users** (authenticated) write and manage their own posts, add and delete their own comments, and update their profile.
- **Admins** do everything users can, plus delete any post or comment (moderation) and view/delete users via an admin panel.

### Primary User Journeys

**Guest:**
1. Land on homepage → browse paginated post list → click a post → read it + comments
2. Search for posts by keyword or filter by tag → paginate results
3. Click author name → see all posts by that author
4. Attempt to create a post → redirected to login → after login, redirected back

**Authenticated User:**
1. Register or login → redirected to homepage
2. Write a new post → fill form → submit → land on the new post's detail page
3. Return to own post → edit or delete it
4. Read another user's post → add a comment → delete own comment
5. View and update profile (username, bio)

**Admin:**
1. All user journeys above
2. Delete any post or comment
3. Visit `/admin/users` → view all registered users → delete a user account

### Key Auth/Authorization Requirements
- Auth guards are **UX only** — the real security boundary is the backend. The frontend hides/disables UI elements based on auth state and role, but the backend rejects unauthorized requests regardless.
- Three distinct access levels: `guest` (no token), `user` (valid token, role=user), `admin` (valid token, role=admin).
- Ownership is post-level — edit button appears only if `currentUser._id === post.author._id`. Admin sees a delete button on all posts/comments.

### Ambiguities Flagged
- No explicit rich text / markdown editor specified — treating post body as plain text with `<pre>` or `white-space: pre-wrap` rendering in v1. Add a Markdown parser (e.g., `marked`) as a clear v2 upgrade.
- "Auth required for edits" doesn't specify UI for unauthenticated users attempting to navigate to `/posts/new` directly — handled by `ProtectedRoute` with redirect to `/login` + post-login redirect back.

---

## 2. Frontend Feature Inventory

### 2.1 Authentication & Session Management — Required
- **Purpose:** Register, login, logout, silent session restore on page reload
- **Roles:** All (public for login/register; authenticated for logout)
- **Pages/Components:** `LoginPage`, `RegisterPage`, `Navbar` (logout button)
- **APIs:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`
- **State:** Redux `authSlice` — `user`, `accessToken`, `isAuthenticated`, `status`
- **Forms:** `LoginForm`, `RegisterForm`
- **Permission:** Public endpoints; refresh uses cookie automatically

### 2.2 Post List with Search, Filtering & Pagination — Required
- **Purpose:** Core browsing experience
- **Roles:** Guest + User + Admin
- **Pages/Components:** `PostsPage`, `PostCard`, `PostList`, `SearchBar`, `TagFilter`, `SortSelect`, `Pagination`
- **APIs:** `GET /posts?page=&limit=&search=&tag=&sort=`
- **State:** Local state in `usePosts` hook; URL query params for search/page/tag/sort
- **Permission:** Fully public

### 2.3 Post Detail View — Required
- **Purpose:** Read a single post with comments
- **Roles:** Guest + User + Admin (edit/delete buttons conditionally shown)
- **Pages/Components:** `PostDetailPage`, `PostDetail`, `CommentList`, `CommentItem`, `CommentForm`
- **APIs:** `GET /posts/:id`, `GET /posts/:postId/comments`
- **State:** Local state in `usePost` and `useComments` hooks
- **Permission:** Public read; comment write requires auth; delete requires ownership or admin

### 2.4 Post Create — Required
- **Purpose:** Authenticated user writes a new post
- **Roles:** User, Admin
- **Pages/Components:** `CreatePostPage`, `PostForm`
- **APIs:** `POST /posts`
- **State:** Local form state (React Hook Form)
- **Forms:** Title, body, optional tags
- **Permission:** Protected route — redirect to `/login` if not authenticated

### 2.5 Post Edit — Required
- **Purpose:** Author edits their own post
- **Roles:** Post owner only
- **Pages/Components:** `EditPostPage`, `PostForm` (same form, different mode)
- **APIs:** `GET /posts/:id` (pre-fill), `PUT /posts/:id`
- **State:** Local form state
- **Permission:** Protected route; backend enforces ownership via 403. Frontend shows edit button only if `user._id === post.author._id`.

### 2.6 Post Delete — Required
- **Purpose:** Author or admin deletes a post
- **Roles:** Owner or Admin
- **Components:** Delete button in `PostDetail`; confirmation dialog before fire
- **APIs:** `DELETE /posts/:id`
- **State:** Local loading state during delete
- **Permission:** Button visible if owner or admin; backend enforces

### 2.7 Comment Add & Delete — Required
- **Purpose:** Reader engagement
- **Roles:** Add = User+Admin; Delete = owner or Admin
- **Components:** `CommentForm`, `CommentItem` (with delete button)
- **APIs:** `POST /posts/:postId/comments`, `DELETE /posts/:postId/comments/:commentId`
- **State:** Local state in `useComments` hook (optimistic delete)
- **Permission:** Delete button visible if `user._id === comment.author._id || user.role === 'admin'`

### 2.8 User Profile View & Edit — Required
- **Purpose:** View own profile; update username and bio
- **Roles:** Authenticated user
- **Pages/Components:** `ProfilePage`, `EditProfilePage`, `EditProfileForm`
- **APIs:** `GET /users/me`, `PUT /users/me`
- **State:** Reads from Redux `authSlice.user`; updates Redux on success
- **Forms:** Username (optional), bio (optional)
- **Permission:** Protected route

### 2.9 User's Public Post List — Required
- **Purpose:** See all posts by a specific author (public)
- **Roles:** Guest + User + Admin
- **Pages/Components:** `UserPostsPage`, `PostList`, `Pagination`
- **APIs:** `GET /users/:id/posts`
- **State:** Local state in hook
- **Permission:** Public

### 2.10 Admin User Management — Required
- **Purpose:** View all registered users; delete a user account
- **Roles:** Admin only
- **Pages/Components:** `AdminUsersPage`, `UserTable`, `UserRow`
- **APIs:** `GET /admin/users`, `DELETE /admin/users/:id`
- **State:** Local state in hook
- **Permission:** Admin-only protected route; non-admin user redirect to `/`

### 2.11 Protected Route Guards — Required
- **Purpose:** Prevent unauthenticated and unauthorized route access at the UI level
- **Components:** `ProtectedRoute`, `AdminRoute`
- **Behavior:** Redirect with saved `location.state.from` for post-login redirect

### 2.12 Global Toast Notifications — Required
- **Purpose:** Non-blocking success/error feedback (post created, comment deleted, etc.)
- **Components:** `Toast` (fixed position, auto-dismiss)
- **State:** `uiSlice` in Redux — thin, cross-cutting concern

### 2.13 Not Found / Error Pages — Required
- **Purpose:** 404 fallback for unmatched routes; also handles deleted post 404
- **Components:** `NotFoundPage`

### 2.14 Tags Filtering — Recommended
- **Purpose:** Click a tag → filter post list by that tag
- **Behavior:** `TagBadge` component navigates to `/?tag=react`

### 2.15 Post Delete Confirmation — Recommended
- **Purpose:** Prevent accidental permanent deletion
- **Component:** `ConfirmDialog` modal — "Are you sure?" before DELETE fires

---

## 3. Pages & Routing Architecture

### Page Groups

#### Public Pages
| Route | Page | API Calls | Notes |
|---|---|---|---|
| `/` | `PostsPage` | `GET /posts` | Search, tag, sort, pagination via URL params |
| `/posts/:id` | `PostDetailPage` | `GET /posts/:id`, `GET /posts/:postId/comments` | `:id` can be ObjectId or slug |
| `/users/:id/posts` | `UserPostsPage` | `GET /users/:id/posts` | All posts by a specific author |
| `*` | `NotFoundPage` | None | Catch-all |

#### Auth Pages (redirect to `/` if already authenticated)
| Route | Page | API Calls |
|---|---|---|
| `/login` | `LoginPage` | `POST /auth/login` |
| `/register` | `RegisterPage` | `POST /auth/register` |

#### User Protected Pages (redirect to `/login` if not authenticated)
| Route | Page | API Calls | Notes |
|---|---|---|---|
| `/posts/new` | `CreatePostPage` | `POST /posts` | Must be defined before `/posts/:id` in router |
| `/posts/:id/edit` | `EditPostPage` | `GET /posts/:id`, `PUT /posts/:id` | Redirects to `/` if 403 from backend |
| `/profile` | `ProfilePage` | `GET /users/me` | Reads Redux; optional re-fetch |
| `/profile/edit` | `EditProfilePage` | `PUT /users/me` | — |

#### Admin Protected Pages (redirect to `/` if authenticated but not admin)
| Route | Page | API Calls |
|---|---|---|
| `/admin/users` | `AdminUsersPage` | `GET /admin/users`, `DELETE /admin/users/:id` |

### Complete Route Map

```
/ (PublicLayout)
├── /                          → PostsPage          [public]
├── /login                     → LoginPage          [public; redirect→/ if authed]
├── /register                  → RegisterPage       [public; redirect→/ if authed]
├── /posts/new                 → CreatePostPage     [protected: user]
├── /posts/:id                 → PostDetailPage     [public]
├── /posts/:id/edit            → EditPostPage       [protected: user]
├── /users/:id/posts           → UserPostsPage      [public]
├── /profile                   → ProfilePage        [protected: user]
├── /profile/edit              → EditProfilePage    [protected: user]
├── /admin/users               → AdminUsersPage     [protected: admin]
└── *                          → NotFoundPage       [public]
```

### Route Guard Behavior

**`ProtectedRoute`:**
- While auth status is `'loading'` (session restore in progress) → render `<Spinner />`
- Not authenticated → `<Navigate to="/login" state={{ from: location }} replace />`
- Authenticated → `<Outlet />`

**`AdminRoute`** (wraps inside `ProtectedRoute` logic):
- Authenticated but `role !== 'admin'` → `<Navigate to="/" replace />`
- Authenticated and `role === 'admin'` → `<Outlet />`

**Auth pages (guest-only guard):**
- Already authenticated → `<Navigate to="/" replace />`
- Not authenticated → `<Outlet />`

**Critical ordering:** `/posts/new` must appear before `/posts/:id` in route definitions — React Router v6 matches in declaration order and "new" would otherwise be treated as an `:id` param value.

### Authorization vs. Authentication — Explicit Distinction

| Layer | What it does | Who enforces it |
|---|---|---|
| `ProtectedRoute` | Checks if token exists in Redux | Frontend (UX only) |
| `AdminRoute` | Checks if `role === 'admin'` | Frontend (UX only) |
| Conditional UI (edit/delete buttons) | Checks ownership or role | Frontend (UX only) |
| **Actual security** | Validates JWT, checks ownership, checks role | **Backend — always** |

**Frontend guards are UX conveniences.** A user who manually calls `DELETE /posts/:id` via Postman with someone else's token gets a `403` from the backend regardless of what the UI does or doesn't show.

---

## 4. Folder Structure

### Organization Strategy: **Feature-Based**

**Why feature-based over layer-based for this project:**
- Layer-based (`components/`, `services/`, `hooks/` at root) forces you to mentally map across 4+ folders to understand one feature. At this project's size, that's friction with no benefit.
- Feature-based co-locates everything for `posts` in one place — easy to navigate, easy to delete a feature if needed.
- Cross-feature primitives (Button, Input, etc.) live in `components/common/` — shared freely.

```
Frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   └── store.js                  # Redux store — combines slices
│   │
│   ├── assets/
│   │   └── styles/
│   │       ├── index.css             # CSS custom properties, resets, base styles
│   │       ├── typography.css        # Font import, type scale
│   │       └── utilities.css         # .container, .sr-only, .visually-hidden
│   │
│   ├── components/
│   │   ├── common/                   # Stateless, reusable UI primitives
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Input/
│   │   │   ├── Textarea/
│   │   │   ├── Spinner/
│   │   │   ├── Avatar/
│   │   │   ├── Badge/
│   │   │   ├── EmptyState/
│   │   │   ├── ErrorMessage/
│   │   │   ├── Pagination/
│   │   │   ├── ConfirmDialog/
│   │   │   └── Toast/
│   │   └── layout/
│   │       ├── Navbar/
│   │       │   ├── Navbar.jsx
│   │       │   └── Navbar.module.css
│   │       ├── Footer/
│   │       └── PageWrapper/          # max-width container + consistent padding
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── useLogin.js
│   │   │   │   ├── useRegister.js
│   │   │   │   └── useLogout.js
│   │   │   ├── services/
│   │   │   │   └── auth.api.js
│   │   │   ├── store/
│   │   │   │   └── authSlice.js
│   │   │   └── validators/
│   │   │       ├── loginSchema.js
│   │   │       └── registerSchema.js
│   │   │
│   │   ├── posts/
│   │   │   ├── components/
│   │   │   │   ├── PostCard.jsx
│   │   │   │   ├── PostCard.module.css
│   │   │   │   ├── PostList.jsx
│   │   │   │   ├── PostDetail.jsx
│   │   │   │   ├── PostDetail.module.css
│   │   │   │   ├── PostForm.jsx
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   ├── SortSelect.jsx
│   │   │   │   └── TagBadge.jsx
│   │   │   ├── pages/
│   │   │   │   ├── PostsPage.jsx
│   │   │   │   ├── PostDetailPage.jsx
│   │   │   │   ├── CreatePostPage.jsx
│   │   │   │   ├── EditPostPage.jsx
│   │   │   │   └── UserPostsPage.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePosts.js
│   │   │   │   ├── usePost.js
│   │   │   │   ├── useCreatePost.js
│   │   │   │   ├── useUpdatePost.js
│   │   │   │   └── useDeletePost.js
│   │   │   ├── services/
│   │   │   │   └── posts.api.js
│   │   │   └── validators/
│   │   │       └── postSchema.js
│   │   │
│   │   ├── comments/
│   │   │   ├── components/
│   │   │   │   ├── CommentList.jsx
│   │   │   │   ├── CommentItem.jsx
│   │   │   │   └── CommentForm.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── useComments.js
│   │   │   │   ├── useAddComment.js
│   │   │   │   └── useDeleteComment.js
│   │   │   ├── services/
│   │   │   │   └── comments.api.js
│   │   │   └── validators/
│   │   │       └── commentSchema.js
│   │   │
│   │   ├── user/
│   │   │   ├── components/
│   │   │   │   └── EditProfileForm.jsx
│   │   │   ├── pages/
│   │   │   │   ├── ProfilePage.jsx
│   │   │   │   └── EditProfilePage.jsx
│   │   │   ├── hooks/
│   │   │   │   ├── useProfile.js
│   │   │   │   └── useUpdateProfile.js
│   │   │   ├── services/
│   │   │   │   └── user.api.js
│   │   │   └── validators/
│   │   │       └── editProfileSchema.js
│   │   │
│   │   └── admin/
│   │       ├── components/
│   │       │   ├── UserTable.jsx
│   │       │   └── UserRow.jsx
│   │       ├── pages/
│   │       │   └── AdminUsersPage.jsx
│   │       ├── hooks/
│   │       │   ├── useAdminUsers.js
│   │       │   └── useDeleteUser.js
│   │       └── services/
│   │           └── admin.api.js
│   │
│   ├── hooks/
│   │   └── useDebounce.js            # Cross-feature only — feature hooks go in features/*/hooks/
│   │
│   ├── lib/
│   │   └── axios.js                  # Configured Axios instance with interceptors
│   │
│   ├── router/
│   │   ├── index.jsx                 # All route definitions
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx
│   │
│   ├── utils/
│   │   ├── formatDate.js
│   │   ├── truncate.js
│   │   ├── buildQueryString.js
│   │   └── getErrorMessage.js        # Normalizes all Axios error shapes
│   │
│   ├── constants/
│   │   ├── roles.js                  # ROLES enum
│   │   ├── routes.js                 # ROUTES path constants
│   │   └── pagination.js             # DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT
│   │
│   ├── App.jsx                       # Layout wrapper + route outlet + Toast
│   └── main.jsx                      # React root, Redux Provider, Router, session restore
│
├── .env.development
├── .env.production
├── .env.example
├── .gitignore
├── index.html
├── vite.config.js
└── package.json
```

### Folder Rules
| Folder | Belongs there | Does NOT belong |
|---|---|---|
| `features/*/components/` | Domain-specific UI | Reusable primitives |
| `features/*/hooks/` | Feature-scoped data hooks | Cross-feature hooks |
| `features/*/services/` | Axios calls for that feature | Business logic |
| `features/*/validators/` | Zod schemas for that feature's forms | — |
| `components/common/` | Stateless, reusable primitives | API calls, Redux reads |
| `components/layout/` | Page shell (Navbar, Footer) | Page content |
| `lib/` | Configured Axios instance | Business logic |
| `hooks/` | Cross-feature hooks only | Feature-scoped hooks |
| `utils/` | Pure functions, no React, no imports from features | Components, state |
| `constants/` | Static values same across environments | Computed values, config |
| `router/` | Route definitions, guard components | Page content |

---

## 5. Components Architecture

### Global / Common Components

| Component | Props | Responsibility | Notes |
|---|---|---|---|
| `Button` | `variant` (primary/secondary/danger/ghost), `size` (sm/md/lg), `isLoading`, `disabled`, `type`, `onClick`, `children` | All interactive buttons — never use `<div onClick>` | `isLoading` renders inline spinner + disables click |
| `Input` | `label`, `id`, `error`, `...rest` | Labeled text input with error state | Wraps native `<input>` with `aria-describedby` on error |
| `Textarea` | Same as Input | Multi-line text input | For post body, bio, comment |
| `Spinner` | `size` (sm/md/lg/full) | Loading indicator | `full` centers in viewport for page-level loads |
| `Avatar` | `src`, `username`, `size` | User avatar with initial fallback | Shows first letter of username if no src |
| `Badge` | `label`, `variant`, `onClick?` | Tag display, optionally clickable | Used for post tags |
| `EmptyState` | `title`, `description`, `action?` | "No results" UI | `action` renders a Button CTA |
| `ErrorMessage` | `message` | Inline error text | Used below form fields and for page-level errors |
| `Pagination` | `currentPage`, `totalPages`, `onPageChange` | Page navigation | Prev/next + page number buttons; disables at boundaries |
| `ConfirmDialog` | `isOpen`, `title`, `message`, `onConfirm`, `onCancel`, `isLoading` | Confirmation modal before destructive actions | Traps focus; closes on Escape and backdrop click |
| `Toast` | (reads from Redux `uiSlice`) | Fixed-position success/error/info notification | Auto-dismisses after 3s; rendered in App.jsx |

### Layout Components

| Component | Responsibility | Notes |
|---|---|---|
| `Navbar` | Logo, nav links, auth-conditional buttons, admin link | Reads Redux `authSlice`; shows different items per role |
| `Footer` | Minimal — project name + links | Static |
| `PageWrapper` | `max-width` container with consistent horizontal padding | Every page wraps its content in this |

### Feature-Specific Components

| Component | Feature | Responsibility |
|---|---|---|
| `PostCard` | posts | Renders summary: title, author avatar+name, date, tag badges, truncated excerpt. Clicking navigates to `/posts/:slug` |
| `PostList` | posts | Renders array of `PostCard`s; shows `EmptyState` when empty; shows `Spinner` while loading |
| `PostDetail` | posts | Full post view: title, body, author info, date, tags. Shows edit/delete buttons conditionally |
| `PostForm` | posts | Shared create+edit form: title Input, body Textarea, tags input. `defaultValues` prop makes it work for both modes |
| `SearchBar` | posts | Controlled input; onChange calls `useDebounce` hook; debounced value updates URL param |
| `SortSelect` | posts | `<select>` for newest/oldest — updates URL `sort` param |
| `TagBadge` | posts | Clickable badge that sets `?tag=value` in URL |
| `CommentList` | comments | Renders `CommentItem[]` with pagination; `EmptyState` on no comments; `Spinner` on load |
| `CommentItem` | comments | Comment body, author, date. Delete button if owner or admin — optimistic remove |
| `CommentForm` | comments | Single Textarea + submit. Disabled if not logged in (shows "Log in to comment" message) |
| `EditProfileForm` | user | Username + bio fields; pre-filled from current user |
| `UserTable` | admin | Table of all users with delete action per row |
| `UserRow` | admin | Single user row: username, email, role, delete button |
| `LoginForm` | auth | Email + password fields |
| `RegisterForm` | auth | Username + email + password fields |

### Component Hierarchy Trees

#### PostsPage — Most Complex Page

```
PostsPage
├── PageWrapper
│   ├── [page header: "All Posts"]
│   ├── [search/filter bar]
│   │   ├── SearchBar           ← debounced, writes to URL param
│   │   ├── SortSelect          ← writes to URL param
│   │   └── [active tag display: "Tag: react × clear"]
│   │
│   ├── PostList
│   │   ├── Spinner             ← shown while loading
│   │   ├── ErrorMessage        ← shown on fetch error
│   │   ├── EmptyState          ← shown when posts[] is empty
│   │   └── PostCard[]          ← shown on success
│   │       ├── Avatar
│   │       ├── [title, excerpt, date]
│   │       └── TagBadge[]
│   │
│   └── Pagination              ← shown only when totalPages > 1
```

**Business logic location:** `PostsPage` owns URL param parsing and passes them to `usePosts(params)` hook. `PostList` is pure presentation. `PostCard` is pure presentation.

#### PostDetailPage — Second Most Complex

```
PostDetailPage
├── PageWrapper
│   ├── Spinner                 ← initial post load
│   ├── ErrorMessage / NotFoundPage redirect ← on 404
│   └── [post loaded]
│       ├── PostDetail
│       │   ├── [title, date, tags]
│       │   │   └── TagBadge[]
│       │   ├── [author row]
│       │   │   ├── Avatar
│       │   │   └── [username → /users/:id/posts link]
│       │   ├── [post body]
│       │   └── [action buttons — conditional]
│       │       ├── Button "Edit"   ← if owner
│       │       └── Button "Delete" ← if owner OR admin → ConfirmDialog
│       │
│       └── [comments section]
│           ├── CommentForm         ← if authenticated; disabled if guest
│           └── CommentList
│               ├── Spinner         ← initial comment load
│               ├── EmptyState      ← no comments yet
│               └── CommentItem[]
│                   ├── Avatar
│                   ├── [body, author, date]
│                   └── Button "Delete" ← if owner OR admin
```

**Business logic location:** `PostDetailPage` owns both `usePost(id)` and `useComments(postId)` calls. `PostDetail` receives `post` + `currentUser` as props and derives conditional rendering from them — no direct Redux reads inside `PostDetail`.

---

## 6. State Management

### Classification

| Data | State type | Where it lives | Reason |
|---|---|---|---|
| Current user, access token, auth status | **Global client state** | Redux `authSlice` | Needed by Navbar, route guards, every protected action — truly cross-cutting |
| Toast notifications | **Global UI state** | Redux `uiSlice` | Triggered from async thunks; consumed by `Toast` in App.jsx — cross-cutting |
| Post list (current page) | **Local state** | `usePosts` hook | Only needed by `PostsPage`; stale cache is worse than a re-fetch |
| Post detail | **Local state** | `usePost` hook | Only needed by `PostDetailPage` |
| Comments | **Local state** | `useComments` hook | Scoped to `PostDetailPage` |
| Search / page / tag / sort | **URL state** | `useSearchParams` | Shareable, bookmarkable, survives refresh, browser back/forward works |
| Admin user list | **Local state** | `useAdminUsers` hook | Only needed by `AdminUsersPage` |
| Form state | **Local form state** | React Hook Form | Uncontrolled; doesn't belong in Redux |

**Why no TanStack Query / SWR?**
At this scale, the data requirements are simple: fetch on mount, refetch on action, no complex caching window. TanStack Query earns its keep when you have stale-while-revalidate, background refetch, or shared cache between routes — none of which apply here. Adding it would introduce a new mental model (queries, mutations, invalidation) for zero practical gain.

**Why no Redux for server state?**
Putting fetched posts into Redux creates stale data problems (a deleted post still shows in the Redux store after navigation), requires manual cache invalidation logic, and duplicates state that the URL already partially tracks (current page, filters). Local hooks are simpler, more predictable, and easier to reason about.

### Redux Slices

#### `authSlice` (the only slice that requires Redux)

```
State shape:
  user: {
    _id: string,
    username: string,
    email: string,
    role: 'user' | 'admin',
    bio: string | null,
    avatar: string | null
  } | null
  accessToken: string | null
  isAuthenticated: boolean
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null

Async thunks:
  loginUser(credentials)          → POST /auth/login → sets user + accessToken
  registerUser(data)              → POST /auth/register → sets user + accessToken
  logoutUser()                    → POST /auth/logout → clears user + accessToken
  refreshAccessToken()            → POST /auth/refresh → updates accessToken only
  initializeAuth()                → called on app init; dispatches refreshAccessToken;
                                    sets status to reflect whether user is restored or guest

Selectors:
  selectUser                      → state.auth.user
  selectAccessToken               → state.auth.accessToken
  selectIsAuthenticated           → state.auth.isAuthenticated
  selectUserRole                  → state.auth.user?.role ?? null
  selectAuthInitialized           → state.auth.status !== 'loading'

Key rules:
  - On refreshAccessToken success: update accessToken only (user data comes from token payload or separate /users/me call)
  - On refreshAccessToken failure (401): set user = null, accessToken = null, isAuthenticated = false
  - status = 'loading' during initializeAuth → used by ProtectedRoute to show Spinner instead of redirect
```

#### `uiSlice` (thin cross-cutting concern)

```
State shape:
  toast: { message: string, type: 'success' | 'error' | 'info' } | null

Actions:
  showToast({ message, type })
  clearToast()

Used by:
  - Async thunks in authSlice (login success/failure)
  - Hooks in posts/comments features (delete success, create error)
  - Toast component in App.jsx
```

---

## 7. API Integration

### API Client Design: **Axios with Interceptors** — Required

**Why Axios over fetch:**
- Request interceptor for token attachment — clean, centralized, no duplication
- Response interceptor for 401 handling + silent refresh — this pattern requires queuing failed requests and retrying; impossible cleanly with native fetch without significant boilerplate
- Built-in JSON serialization, base URL config, and `withCredentials`

**Why not RTK Query:**
- Designed for tight Redux integration with normalized cache management. Our server state is in local hooks, not Redux slices — RTK Query would fight the architecture.

### Axios Instance (`lib/axios.js`)

```
Configuration:
  baseURL: import.meta.env.VITE_API_BASE_URL
  withCredentials: true              ← sends httpOnly refresh cookie on every request
  headers: { Content-Type: application/json }
  timeout: 10000                     ← 10s timeout

Request Interceptor:
  1. Read accessToken from Redux store (store.getState().auth.accessToken)
  2. If token exists → set Authorization: Bearer <token>
  3. Pass request through

Response Interceptor (401 handling + refresh with race condition guard):
  On 401 response:
    If request URL is /auth/refresh → reject (no retry loop)
    If isRefreshing === true:
      → queue this request (push resolve/reject into failedQueue)
      → return promise that resolves/rejects when refresh completes
    If isRefreshing === false:
      → set isRefreshing = true
      → call POST /auth/refresh
      → on success:
          store.dispatch(setAccessToken(newToken))   ← action in authSlice
          process failedQueue (retry all queued requests with new token)
          isRefreshing = false
          retry original request with new token
      → on failure (refresh also 401):
          process failedQueue (reject all)
          store.dispatch(logoutUser())
          isRefreshing = false
          window.location.href = '/login'            ← hard redirect clears all state
  On other errors: reject with error — let service layer handle

Race condition guard:
  isRefreshing: boolean (module-level variable in axios.js)
  failedQueue: Array<{ resolve, reject }>
  This ensures only ONE refresh call fires when multiple concurrent requests get 401
```

### Request Flow

```
User interaction (e.g., "Create Post" button)
        │
        ▼
useCreatePost() hook
        │  calls
        ▼
posts.api.js → createPost(data)
        │  calls
        ▼
axiosInstance.post('/posts', data)
        │  passes through
        ▼
Request Interceptor → attaches Authorization header
        │
        ▼
Backend (Express) → validates JWT → processes request
        │
        ▼
Response arrives
        │
  [200/201] ─────────────────────────────────────────────→ hook resolves → UI updates
        │
  [401] → Response Interceptor → refresh → retry → [200] → hook resolves
                                          → [401] → logout → /login
        │
  [4xx other] → reject → hook catches → sets error state → UI shows ErrorMessage
        │
  [5xx] → reject → hook catches → dispatches showToast('error') → UI shows toast
```

### API Service Modules

**`auth.api.js`**
```
login(credentials)         → POST /auth/login
register(data)             → POST /auth/register
logout()                   → POST /auth/logout
refresh()                  → POST /auth/refresh
```

**`posts.api.js`**
```
getPosts(params)           → GET /posts?{page,limit,search,tag,sort}
getPostById(id)            → GET /posts/:id
getUserPosts(userId,params)→ GET /users/:id/posts?{page,limit}
createPost(data)           → POST /posts
updatePost(id, data)       → PUT /posts/:id
deletePost(id)             → DELETE /posts/:id
```

**`comments.api.js`**
```
getComments(postId,params) → GET /posts/:postId/comments?{page,limit}
addComment(postId, data)   → POST /posts/:postId/comments
deleteComment(postId, commentId) → DELETE /posts/:postId/comments/:commentId
```

**`user.api.js`**
```
getProfile()               → GET /users/me
updateProfile(data)        → PUT /users/me
```

**`admin.api.js`**
```
getAllUsers(params)         → GET /admin/users?{page,limit}
deleteUser(id)             → DELETE /admin/users/:id
```

---

## 8. Authentication Flow

### Where Auth State Lives
| Token | Storage | Why |
|---|---|---|
| Access token (15min) | Redux `authSlice.accessToken` (JS memory) | Not in localStorage — XSS can read localStorage. Memory is cleared on tab close, restored on reload via refresh. |
| Refresh token (7d) | `httpOnly` cookie (set by server) | Inaccessible to JS entirely. `withCredentials: true` sends it automatically on every request to the API origin. |
| User object | Redux `authSlice.user` | Needs to be read by Navbar, route guards, permission checks across the app |

### App Initialization (Session Restore)

Called from `main.jsx` via `store.dispatch(initializeAuth())` before the React tree renders:

```
initializeAuth() thunk:
  1. Set status = 'loading'
  2. Call POST /auth/refresh (cookie sent automatically)
  3. On success (200):
       → Extract accessToken from response
       → Decode JWT payload to get { _id, role, email } (or call GET /users/me for full user object)
       → Set user, accessToken, isAuthenticated = true, status = 'succeeded'
  4. On failure (401 — no valid refresh token, or first visit):
       → Set user = null, accessToken = null, isAuthenticated = false, status = 'idle'
       → This is NORMAL — not an error. Guest state.
```

**Render gate in `App.jsx`:**
```
if (authStatus === 'loading') return <Spinner size="full" />
// Only render routes after auth initialization completes
// Prevents: flash of logged-out UI for authenticated users
//           ProtectedRoute redirecting before session is restored
```

### Login Flow
```
LoginPage → LoginForm submits → useLogin().login(credentials)
  → dispatch loginUser(credentials)
  → POST /auth/login
  → On success:
      store user + accessToken in Redux
      navigate to location.state?.from?.pathname ?? '/'  ← post-login redirect
      dispatch showToast('Welcome back, username!')
  → On failure:
      set error in authSlice
      useLogin returns error → LoginForm shows inline error below form
```

### Logout Flow
```
Navbar logout button → useLogout().logout()
  → dispatch logoutUser()
  → POST /auth/logout  ← server clears httpOnly cookie
  → clear user + accessToken from Redux
  → navigate to '/'
  → (no toast needed — navigation is sufficient feedback)
```

### Token Expiry Handling
```
Any request with expired access token (15min lifetime):
  → Backend returns 401
  → Axios response interceptor fires
  → POST /auth/refresh with cookie
  → On success: new access token stored, original request retried transparently
  → On failure: logout + redirect to /login

User sees nothing if refresh succeeds. If refresh fails (7d refresh token expired):
  → Logged out, shown toast "Your session expired. Please log in." + redirected to /login.
```

### Register Flow
```
RegisterPage → RegisterForm submits → useRegister().register(data)
  → dispatch registerUser(data)
  → POST /auth/register
  → On success: same as login flow (token returned, redirect to / or state.from)
  → On failure: show field-level errors from errors[] array
```

---

## 9. Custom Hooks

Only hooks with real reuse value. Feature-specific hooks that are used in exactly one place are included because they separate data logic from presentation — but they're not "reusable" in the cross-feature sense.

### Cross-Feature Hooks (`hooks/`)

| Hook | Params | Returns | Used In |
|---|---|---|---|
| `useDebounce(value, delay)` | any, number (ms) | debounced value | `SearchBar` — prevents API call per keystroke; 400ms default |

### Auth Feature Hooks (`features/auth/hooks/`)

| Hook | Returns | Notes |
|---|---|---|
| `useLogin()` | `{ login(credentials), isLoading, error }` | Dispatches `loginUser` thunk; navigates on success; sets error from API on failure |
| `useRegister()` | `{ register(data), isLoading, error }` | Same pattern; field-level errors from `errors[]` array |
| `useLogout()` | `{ logout() }` | Dispatches `logoutUser` thunk; navigates to `/` |

### Post Feature Hooks (`features/posts/hooks/`)

| Hook | Params | Returns | Notes |
|---|---|---|---|
| `usePosts(queryParams)` | `{page, limit, search, tag, sort}` | `{posts, pagination, isLoading, error, refetch}` | Fetches on mount + when params change; local state only |
| `usePost(id)` | post id or slug | `{post, isLoading, error}` | Fetches single post; redirects to NotFoundPage on 404 |
| `useCreatePost()` | — | `{createPost(data), isLoading, error}` | Navigates to `/posts/:slug` on success; dispatches success toast |
| `useUpdatePost()` | — | `{updatePost(id, data), isLoading, error}` | Navigates to `/posts/:id` on success |
| `useDeletePost()` | — | `{deletePost(id), isLoading}` | Navigates to `/` on success; dispatches success toast |

### Comment Feature Hooks (`features/comments/hooks/`)

| Hook | Params | Returns | Notes |
|---|---|---|---|
| `useComments(postId)` | post id | `{comments, pagination, isLoading, error, loadMore}` | `loadMore` fetches next page and appends to list |
| `useAddComment(postId)` | post id | `{addComment(data), isLoading, error}` | On success: prepend new comment to local list, reset form |
| `useDeleteComment(postId)` | post id | `{deleteComment(commentId), isLoading}` | Optimistic: remove from local list immediately, restore on error |

### User Feature Hooks (`features/user/hooks/`)

| Hook | Returns | Notes |
|---|---|---|
| `useProfile()` | `{user}` | Reads directly from Redux `authSlice.user` — no API call needed |
| `useUpdateProfile()` | `{updateProfile(data), isLoading, error}` | Calls API; on success, dispatches `updateUser` action to update Redux |

### Admin Feature Hooks (`features/admin/hooks/`)

| Hook | Params | Returns |
|---|---|---|
| `useAdminUsers(params)` | `{page, limit}` | `{users, pagination, isLoading, error}` |
| `useDeleteUser()` | — | `{deleteUser(id), isLoading}` |

---

## 10. Forms & Validation

### Validation Library: React Hook Form + Zod — Required

**React Hook Form:** Uncontrolled inputs → no re-render per keystroke. `register`, `handleSubmit`, `formState.errors`, `reset` cover all needs here.

**Zod:** Schema-first validation. `@hookform/resolvers/zod` passes schemas directly to RHF. Error messages are defined in one place — the schema.

**Rule:** Client-side validation is for user experience. The backend validates everything independently and is the real enforcement layer. Client schemas should match backend rules (same min/max lengths) but never be trusted as the only check.

### API Errors → Form Errors Pattern
When the backend returns `400` with `errors[]`:
```
errors.forEach(({ field, message }) => {
  form.setError(field, { type: 'server', message })
})
```
This displays backend validation errors inline under the relevant field — same UX as client-side errors.

### Forms Inventory

#### `LoginForm`
| Field | Type | Required | Validation |
|---|---|---|---|
| email | text / email | ✅ | valid email format |
| password | password | ✅ | non-empty |

**Submit:** `POST /auth/login` | **Loading:** submit button shows spinner + disabled | **Error:** "Invalid email or password" shown below password field (generic — don't reveal which is wrong) | **Success:** redirect

#### `RegisterForm`
| Field | Type | Required | Validation |
|---|---|---|---|
| username | text | ✅ | 3–30 chars, alphanumeric + underscore |
| email | text / email | ✅ | valid email format |
| password | password | ✅ | min 8 chars |

**Submit:** `POST /auth/register` | **Error:** field-level from backend `errors[]` (409 → "Username already taken" mapped to username field) | **Success:** redirect

#### `PostForm` (used for both Create and Edit)
| Field | Type | Required | Validation |
|---|---|---|---|
| title | text | ✅ | 5–200 chars |
| body | textarea | ✅ | min 20 chars |
| tags | comma-separated text input | ❌ | max 10 tags, each max 30 chars |

**Create mode:** empty `defaultValues` | **Edit mode:** `defaultValues` pre-filled from `usePost(id)` response; same Zod schema, same form component |
**Loading state:** `usePost(id)` must complete before form renders (show Spinner) — prevents flicker of empty form |
**Submit:** `POST /posts` or `PUT /posts/:id` | **Success:** navigate to post detail

#### `CommentForm`
| Field | Type | Required | Validation |
|---|---|---|---|
| body | textarea | ✅ | 1–1000 chars |

**Conditional render:** If not authenticated → show disabled textarea + "Log in to comment" message (not a validation error — it's a permission message) |
**Submit:** `POST /posts/:postId/comments` | **Success:** clear form, prepend comment to list | **Error:** show error below textarea

#### `EditProfileForm`
| Field | Type | Required | Validation |
|---|---|---|---|
| username | text | ❌ | If provided: 3–30 chars, alphanumeric + underscores |
| bio | textarea | ❌ | max 300 chars |

**Pre-fill:** from `useProfile().user` | **Submit:** `PUT /users/me` | **Error:** 409 → `form.setError('username', ...)` | **Success:** dispatch `updateUser` to Redux + toast "Profile updated"

### Zod Schemas (summary)

```
loginSchema:      email (email format), password (required)
registerSchema:   username (3-30, /^[a-zA-Z0-9_]+$/), email (email), password (min 8)
postSchema:       title (5-200), body (min 20), tags (array max 10, each max 30 chars)
commentSchema:    body (1-1000)
editProfileSchema: username (optional, same rules as register), bio (optional, max 300)
```

---

## 11. Search, Filtering, Sorting & Pagination

**Applies to:** `PostsPage`, `UserPostsPage`, `AdminUsersPage`

### URL State Strategy — Required for PostsPage

Search, tag filter, sort, and page live in URL query params on `PostsPage`:
```
/?page=2&search=react&tag=javascript&sort=oldest
```

**Why URL state (not component state)?**
- Shareable: user can copy the URL and share a filtered view
- Bookmarkable: filtered state survives browser refresh
- Browser back/forward works correctly
- Deep-linking from external sources works

**How:** `useSearchParams()` from React Router v6 — reads and updates URL params without triggering full navigation.

### SearchBar Behavior

```
1. Controlled input binds to URL ?search= param (read on mount)
2. onChange → updates local debounced value (via useDebounce, 400ms)
3. Debounced value change → update URL ?search= param → usePosts refetches
4. On URL param change: reset ?page= to 1 (stale page with new search makes no sense)
```

### Tag Filter

```
TagBadge onClick → navigate to /?tag=<tagValue>&page=1
Active tag shown as dismissable chip above post list
Clicking × or navigating away clears the filter
```

### Sort

```
SortSelect <select> → onChange → update URL ?sort= param → usePosts refetches
Options: newest (default), oldest
```

### Pagination

```
Pagination component receives currentPage + totalPages from pagination metadata
onPageChange → update URL ?page= param → usePosts refetches
Shows: prev button, page numbers (compact for many pages), next button
Prev disabled at page 1; Next disabled at last page
```

### Defaults

```
page:   1
limit:  10  (matches backend DEFAULT_LIMIT)
sort:   newest
search: (empty)
tag:    (none)
```

### UserPostsPage & AdminUsersPage

These use simpler local state (not URL params) since they're narrower pages without shareable filter state:
- Page tracked in local `useState`
- Pagination component updates local page state → hook refetches

---

## 12. File Uploads & Media

**Not applicable in v1.** No file upload UI is needed. The `avatar` field on User is a URL string — it can be set via `PUT /users/me` with `{ avatar: "https://..." }` if a user manually provides a URL, but no upload component is built.

**When adding in v2:** Add an `ImageUpload` component in `components/common/` — file input with preview, `multer`/Cloudinary backend endpoint, validates MIME type (image/jpeg, image/png, image/webp) and max 5MB before uploading.

---

## 13. Layouts, Responsive Design & Accessibility

### Application Layout

**Single shared layout** — all pages use the same `PublicLayout` structure:
```
<div id="app">
  <Navbar />
  <main>
    <PageWrapper>
      <Outlet />         ← page content
    </PageWrapper>
  </main>
  <Footer />
  <Toast />              ← fixed position, outside main flow
  <ConfirmDialog />      ← portal-based modal, outside main flow
</div>
```

No separate `AuthLayout` is needed — `LoginPage` and `RegisterPage` just render a centered card inside `PageWrapper`. No separate `DashboardLayout` — admin page uses the same shell as everything else.

### Responsive Behavior

| Page | Mobile (< 640px) | Tablet (640–1024px) | Desktop (1024px+) |
|---|---|---|---|
| `PostsPage` | Single column; search bar full-width above list | Single column, wider | Two columns: post list (72%) + (future: sidebar) |
| `PostDetailPage` | Full-width; generous padding | Centered, max 640px | Centered, max 720px |
| `CreatePostPage` / `EditPostPage` | Full-width form | Centered, max 600px | Centered, max 600px |
| `LoginPage` / `RegisterPage` | Full-width card | Centered card, max 400px | Centered card, max 400px |
| `AdminUsersPage` | Scrollable table with horizontal scroll | Full table | Full table |
| `Navbar` | Hamburger → slide-down menu | Horizontal | Horizontal with more space |

**Mobile-first:** All CSS written for mobile default. `@media (min-width: ...)` adds complexity at larger sizes.

### Accessibility Essentials

These are non-negotiable even for a portfolio project:

- **Semantic HTML:** `<main>`, `<nav>`, `<article>` (post), `<section>`, `<header>`, `<footer>`, `<time datetime="...">` for dates.
- **Forms:** Every `<input>` and `<textarea>` has an associated `<label>` via matching `htmlFor` + `id`. Error messages use `aria-describedby`.
- **Buttons:** Always native `<button>` — never `<div onClick>`. Icon-only buttons get `aria-label`.
- **Focus management:** After closing `ConfirmDialog`, return focus to the button that opened it. Modal traps focus while open (Tab cycles inside, Escape closes).
- **Focus styles:** Never `outline: none` without an equally visible custom focus ring.
- **Color independence:** Tag badges and toast types (success/error/info) communicate state via text AND color — not color alone.
- **Page titles:** Update `document.title` on each route: `"Create Post | Blogging Platform"`, `"Post Title | Blogging Platform"`, etc.
- **Screen reader only text:** `<span className="sr-only">Loading...</span>` inside `Spinner` for screen readers.
- **Auth guard timing:** `ProtectedRoute` renders `<Spinner />` while auth is initializing — prevents redirect before session is restored, which would flash an incorrect "not logged in" state to users who actually are logged in.

---

## 14. UI / Design System

### Is a Design System Worth It Here?

Yes — a minimal one. This means CSS custom properties (design tokens) defined in `index.css` that every component reads from. No component library (overkill), no Tailwind (not requested, adds learning overhead), no CSS-in-JS (runtime cost).

**Benefits at this scale:** consistent spacing/colors without memorizing class names, easy to tweak the whole palette from one file, zero runtime overhead.

### Core Tokens

```css
/* index.css */
:root {
  /* Color palette */
  --color-primary:        hsl(221, 83%, 53%);
  --color-primary-hover:  hsl(221, 83%, 43%);
  --color-danger:         hsl(0, 72%, 51%);
  --color-danger-hover:   hsl(0, 72%, 41%);
  --color-success:        hsl(142, 71%, 45%);
  --color-warning:        hsl(38, 92%, 50%);

  --color-bg:             hsl(0, 0%, 100%);
  --color-surface:        hsl(210, 17%, 98%);
  --color-border:         hsl(214, 20%, 88%);
  --color-text:           hsl(222, 47%, 11%);
  --color-text-muted:     hsl(215, 16%, 47%);
  --color-text-inverse:   hsl(0, 0%, 100%);

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --leading-tight:  1.25;
  --leading-normal: 1.5;

  /* Spacing scale */
  --space-1:  0.25rem;   /* 4px */
  --space-2:  0.5rem;    /* 8px */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-5:  1.25rem;
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-10: 2.5rem;
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */

  /* Layout */
  --container-max:     72rem;    /* 1152px */
  --container-padding: var(--space-4);

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
}
```

**Dark mode:** Not in v1. Tokens are structured so it can be added later via `@media (prefers-color-scheme: dark)` overriding the custom properties — no component changes needed.

### CSS Modules

Each component that has non-trivial styling gets a `.module.css` file co-located with the `.jsx`. Primitive components like `Button` use CSS modules to scope their variant classes. Layout/page components use regular CSS via `index.css` globals where scoping isn't needed.

---

## 15. Notifications, Error Boundaries & Edge-Case UX

### When to Use What

| Situation | UI pattern | Reason |
|---|---|---|
| Post created successfully | Toast (success, 3s) | Action is done; brief confirmation is sufficient |
| Post deleted | Toast (success) + navigate to `/` | Navigate is the primary feedback; toast is secondary |
| Comment deleted | Optimistic remove from list | Immediate feedback; no toast needed |
| Login failed | Inline error below form | User needs to correct fields; shouldn't disappear |
| 404 post | Full-page error with "Go back" link | Needs to stay visible for user to understand the situation |
| Network error (no response) | Toast (error) | Brief, non-blocking; user can retry |
| Form validation errors | Inline below each field | Must stay visible while user corrects them |
| Delete post confirmation | `ConfirmDialog` modal | Destructive action that can't be undone |

### Toast Specification
- Position: fixed, bottom-right, `z-index: 9999`
- Variants: success (green), error (red), info (blue)
- Auto-dismiss: 3000ms via `setTimeout` → dispatch `clearToast()`
- Max 1 toast at a time (last one wins — simple `uiSlice` design)
- `aria-live="polite"` for accessibility announcements

### React Error Boundaries

**One global error boundary in `App.jsx`** wrapping all routes. Fallback: a centered error page with "Something went wrong. Refresh the page." + a "Report an issue" link. This catches rendering errors that escape all async error handling.

**No feature-level error boundaries** — they add complexity without meaningful benefit at this scale. Async data errors (fetch failures) are handled gracefully in hooks with error state, not by crashing the component tree.

### Edge-Case UX Rules
- **Duplicate submit prevention:** `Button isLoading` is true while any async operation is pending. This disables the button and prevents double-submit.
- **Stale edit form:** On `EditPostPage`, if the user navigates away mid-edit and returns, the form re-fetches the post — no stale draft preserved (v1 simplicity).
- **Deleted post comment form:** If a post is deleted while a user is writing a comment, the `addComment` call returns 404. Show inline error "This post no longer exists" below the form.
- **Admin deleting self:** Not prevented on the frontend (the backend should guard this). If it happens, logout is triggered by the 401 response.

---

## 16. Utilities, Constants & Configuration

### Utilities (`utils/`)

| Utility | Inputs → Outputs | Used In |
|---|---|---|
| `formatDate(dateString)` | ISO string → "Sep 11, 2026" | `PostCard`, `CommentItem`, `ProfilePage` |
| `formatRelativeDate(dateString)` | ISO string → "3 days ago" | `PostCard` (recent posts), `CommentItem` |
| `truncate(str, maxLength)` | string, number → string + "…" | `PostCard` excerpt (body preview) |
| `buildQueryString(params)` | object → "?page=1&limit=10" | `posts.api.js`, `comments.api.js` |
| `getErrorMessage(error)` | Axios error → string | All hooks |

**`getErrorMessage(error)` — required utility, prevents inconsistent error handling:**
```
Priority order:
1. error.response?.data?.message  → use API message directly ("Email already taken")
2. error.code === 'ECONNABORTED'   → "Request timed out. Try again."
3. error.message === 'Network Error' → "Network error. Check your connection."
4. else                            → "Something went wrong. Please try again."
```

### Constants (`constants/`)

| File | Content | Used In |
|---|---|---|
| `roles.js` | `ROLES = { USER: 'user', ADMIN: 'admin' }` | `AdminRoute`, permission checks, `authSlice` |
| `routes.js` | `ROUTES = { HOME: '/', LOGIN: '/login', REGISTER: '/register', POSTS_NEW: '/posts/new', PROFILE: '/profile', ADMIN_USERS: '/admin/users' }` | `<Link to={ROUTES.LOGIN}>`, `navigate(ROUTES.HOME)` — no magic strings |
| `pagination.js` | `PAGINATION = { DEFAULT_LIMIT: 10, DEFAULT_PAGE: 1, COMMENT_LIMIT: 20 }` | Hooks, query builders |

**Why constants and not config?** These values don't change by environment. Config values (`VITE_API_BASE_URL`) are environment-specific; constants are business rules that are the same in dev, staging, and prod.

### Environment Variables

```bash
# .env.example
# Frontend environment variables are bundled into the JS output and visible to anyone.
# NEVER put real secrets here. These are configuration values only.

# ── App ────────────────────────────────────────────
VITE_APP_NAME=Blogging Platform

# ── API ────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

**.env.development:**
```bash
VITE_APP_NAME=Blogging Platform (Dev)
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

**.env.production:**
```bash
VITE_APP_NAME=Blogging Platform
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
```

| Variable | Required | Used In | Notes |
|---|---|---|---|
| `VITE_APP_NAME` | Recommended | `document.title` templates, `<meta name="application-name">` | — |
| `VITE_API_BASE_URL` | **Required** | `lib/axios.js` baseURL | Must match backend CORS_ORIGIN |

**Vite prefix rule:** All env vars exposed to client code MUST be prefixed `VITE_`. Vite strips anything without this prefix from the build. Access via `import.meta.env.VITE_*` — never `process.env.*`.

---

## 17. Performance & Security

### Performance

**Code splitting — Recommended:**
```jsx
// router/index.jsx — lazy-load every page component
const PostsPage = lazy(() => import('../features/posts/pages/PostsPage'))
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'))
// ...etc for all pages

// Wrap router outlet in App.jsx:
<Suspense fallback={<Spinner size="full" />}>
  <Outlet />
</Suspense>
```
Each page becomes a separate JS chunk. Homepage loads only homepage code — not the admin page code.

**Debounced search — Required:**
400ms debounce on `SearchBar` prevents a backend request on every keystroke. Already designed in Section 11.

**`useCallback` / `useMemo` — Skip for now:**
Premature optimization. Add only after profiling identifies a real bottleneck. At this scale (paginated lists of 10 items), memoization adds code noise with no measurable benefit.

**Image lazy loading — Recommended:**
All `<img>` tags get `loading="lazy"`. This is one attribute. Do it.

**Bundle size check — Recommended:**
Run `vite build` before first deployment. Bundle should be under 300KB gzipped for this project. If it's larger, run `npx vite-bundle-visualizer` to identify what's bloating it.

**Virtualization — Not applicable:**
Post lists are paginated to 10 items. Comment lists load in pages of 20. No virtualization needed.

### Security

**Token storage — Access token in Redux (memory):**
- Memory is not persisted across tab closes (desirable — session ends)
- Restored on page reload via the httpOnly cookie refresh mechanism
- Not accessible via `localStorage` or `sessionStorage` XSS attacks
- Tradeoff: if JS is executing on the page (e.g., via XSS), it can theoretically read Redux store via DevTools in development. In production, this vector is significantly reduced. The httpOnly cookie holding the refresh token is the true protection.

**Never in localStorage:**
- Access token ❌
- Refresh token ❌ (it's in httpOnly cookie — you don't manage it)
- User ID, email, role ❌
- Any auth-related data ❌

**Acceptable in localStorage:**
- UI preferences (theme toggle, if added later) ✅

**XSS — dangerouslySetInnerHTML:**
- Never used in v1
- Post body is rendered as plain text (`white-space: pre-wrap`) — no HTML parsing
- If Markdown rendering is added in v2, use `DOMPurify.sanitize(marked(body))` before passing to `dangerouslySetInnerHTML`

**Open redirect prevention:**
After login, the post-login redirect target is `location.state?.from?.pathname`. Validate it starts with `/` before using it:
```js
const redirectTo = location.state?.from?.pathname
const safePath = redirectTo?.startsWith('/') ? redirectTo : '/'
navigate(safePath, { replace: true })
```

**Frontend auth is UX, not security:**
Every protected API call is validated by the backend. A motivated attacker who removes the `ProtectedRoute` wrapper or forges a role in the Redux store still hits a wall at the backend. This is the correct model — design security at the API level, use frontend guards only to improve user experience.

**CORS and cookie:**
`withCredentials: true` on the Axios instance is required to send the httpOnly refresh cookie cross-origin. The backend `CORS_ORIGIN` must match the frontend's exact origin (including port in dev). `SameSite=Strict` on the cookie prevents CSRF for same-site; for cross-origin dev (`localhost:5173` → `localhost:5000`), the backend sets `SameSite=None; Secure`.

---

## 18. Testing Strategy

### Priority Order
1. **Auth flow** — most security-sensitive; most likely to break on token changes
2. **Route guards** — ProtectedRoute and AdminRoute redirect behavior
3. **Form validation** — Zod schemas edge cases; API error mapping to form fields
4. **Post CRUD** — create, edit, delete with permission-conditional UI
5. **Comment CRUD** — optimistic delete, add flow
6. **Pagination / search** — URL param reading, debounce behavior

### Test Tooling
| Tool | Purpose |
|---|---|
| **Vitest** | Test runner — Vite-native, fastest option, Jest-compatible API |
| **React Testing Library** | Component tests — tests behavior, not implementation |
| **MSW (Mock Service Worker)** | API mocking at network level — intercepts real Axios calls |
| **`@testing-library/user-event`** | Realistic user interactions (typing, clicking) |

### What to Test First

**Unit tests — Zod validators:**
- `loginSchema`: valid input passes; invalid email fails; empty password fails
- `registerSchema`: short username fails; valid username passes; short password fails
- `postSchema`: short title fails; short body fails; too many tags fails; valid input passes
- `getErrorMessage(error)`: all four error shapes produce correct strings

**Component tests — RTL:**
- `Button`: renders children; `isLoading` shows spinner; `disabled` prevents click
- `ProtectedRoute`: unauthenticated → redirects to `/login` with `state.from`
- `AdminRoute`: authenticated non-admin → redirects to `/`; admin → renders outlet
- `Pagination`: prev disabled at page 1; next disabled at last page; onPageChange fires with correct page
- `LoginForm`: shows validation errors on submit with empty fields; shows server error from `setError`
- `PostCard`: renders title, author username, formatted date, all tags

**Integration tests — RTL + MSW:**
- Login flow: fill email + password → submit → MSW returns 200 with user + token → Redux updated → navigate to `/`
- Login failure: MSW returns 401 → error message appears below form
- `PostsPage` load: MSW returns paginated posts → `PostCard[]` rendered; `Pagination` shows correct page count
- Search debounce: type in `SearchBar` → wait 400ms → MSW receives request with correct `search` param
- Create post: fill form → submit → MSW returns 201 → navigated to new post's page
- Delete post as owner: click Delete → ConfirmDialog appears → confirm → MSW returns 200 → navigated to `/`
- `ProtectedRoute` on session restore: auth status is 'loading' → Spinner renders; status becomes 'succeeded' with user → route content renders; 'idle' without user → redirect

---

## 19. Dependency Plan

### Required

| Package | Reason |
|---|---|
| `react` | Framework — project spec |
| `react-dom` | DOM rendering |
| `react-router-dom` | Client-side routing, `useSearchParams`, nested routes |
| `@reduxjs/toolkit` | Redux store, `createSlice`, `createAsyncThunk` — minimal boilerplate |
| `react-redux` | `useSelector`, `useDispatch` in components |
| `axios` | HTTP client — interceptors required for token attach + silent refresh |
| `react-hook-form` | Form state management — uncontrolled inputs, minimal re-renders |
| `zod` | Schema validation — consistent rules between frontend and backend expectations |
| `@hookform/resolvers` | Connects Zod schemas to React Hook Form via `zodResolver` |
| `lucide-react` | Icons — tree-shakeable, consistent style |

### Recommended

| Package | Reason |
|---|---|
| `date-fns` | Lightweight date formatting (`formatDistanceToNow`, `format`) — tree-shakeable unlike moment |

### Dev Only

| Package | Reason |
|---|---|
| `vitest` | Test runner — Vite-native, fastest |
| `@testing-library/react` | Component behavior testing |
| `@testing-library/user-event` | Realistic user event simulation |
| `@testing-library/jest-dom` | Custom matchers (`toBeInTheDocument`, `toHaveValue`) |
| `msw` | API mocking at network level for integration tests |
| `jsdom` | DOM environment for Vitest |

### Deliberately Excluded

| Package | Why |
|---|---|
| `@tanstack/react-query` | Overkill — local hooks serve the data needs without extra mental model |
| `swr` | Same as TanStack Query |
| `redux-thunk` (standalone) | Already included in Redux Toolkit |
| `react-query` | Old name for TanStack Query — same reason |
| `formik` | React Hook Form is lighter, faster, and better maintained |
| `yup` | Zod is preferred — better TypeScript inference, same capability |
| `moment` | Not tree-shakeable; date-fns is the modern alternative |
| `styled-components` / `emotion` | CSS-in-JS runtime cost; vanilla CSS is simpler |
| `react-toastify` | Would work, but a 5-line `uiSlice` + `Toast` component owns the same job with no extra dependency |
| `react-helmet` | `document.title` assignment in each page is simpler at this scale |

---

## 20. Backend Contract Check

Cross-checking the Backend Handoff Package against what the frontend actually needs.

### ✅ Endpoints — All Present

Every endpoint the frontend needs is covered in the handoff package. No missing routes.

### ✅ Response Shapes — Match

Post shape includes `slug` — confirmed used for `GET /posts/:id` (id can be slug). Frontend navigates to `/posts/:slug` on creation, which is correct.

### ⚠️ Potential Issue: User Object on Refresh

`POST /auth/refresh` returns only `{ success, data: { accessToken } }` — **no user object**.

**Implication:** On page reload, `initializeAuth()` calls `/auth/refresh` and gets back only a token. To restore `authSlice.user`, the frontend must either:
1. **Decode the JWT payload** — extract `_id`, `role`, `email` from the token (these are in the payload if the backend includes them). Then call `GET /users/me` for the full user object including `bio`, `avatar`, `username`.
2. **Call `GET /users/me` after refresh** — always safe; adds one extra request on reload.

**Recommendation:** After a successful token refresh, always call `GET /users/me` to fully populate `authSlice.user`. This is one extra request on page load only — negligible cost, zero risk of stale data from a decoded token.

**Action required from backend:** Confirm the JWT payload includes at minimum `{ _id, role }` so the frontend can call `/users/me` with the correct authorization header before the user object is populated.

### ⚠️ Missing: Username Existence in Error Response for 409

On `PUT /users/me` returning `409`, the backend's standard error shape is:
```json
{ "success": false, "message": "...", "errors": [] }
```
The `errors[]` array is **empty** for 409 (per the backend blueprint — 409 is not a validation error, it's a conflict). The frontend cannot auto-map this to `form.setError('username', ...)` via the standard `errors.forEach` pattern.

**Fix:** Handle 409 explicitly in `useUpdateProfile`:
```js
if (error.response?.status === 409) {
  form.setError('username', { message: 'Username already taken' })
}
```
This is a frontend-side workaround; no backend change needed.

### ✅ Pagination Metadata — Match

Backend shape: `{ currentPage, totalPages, totalItems, limit, hasNextPage, hasPrevPage }` — matches exactly what `Pagination` component needs.

### ✅ Error Shape — Match

`{ success, message, errors: [{ field, message }] }` — frontend's `getErrorMessage` util and `form.setError` loop are designed for exactly this.

### ⚠️ Post Edit — Ownership UI Check

The backend returns 403 when a non-owner tries to `PUT /posts/:id`. The frontend hides the Edit button if `user._id !== post.author._id`. However, `EditPostPage` also needs to handle the case where a user directly navigates to `/posts/:id/edit` for a post they don't own:
- On mount, `usePost(id)` fetches the post
- After fetch: check `post.author._id !== user._id && user.role !== 'admin'`
- If true: redirect to `/posts/:id` with a toast "You can only edit your own posts"
- This prevents a confusing empty form for a post the user cannot save

This behavior is frontend-only — the backend 403 is the real guard.

### ✅ Comment Pagination — Match

`GET /posts/:postId/comments?page=1&limit=20` — confirmed in handoff. `useComments` hook uses `COMMENT_LIMIT = 20`.

### ✅ Admin Endpoints — Match

Both `GET /admin/users` and `DELETE /admin/users/:id` are present and correct.

### ✅ Role Values — Match

Backend: `ROLES = { USER: "user", ADMIN: "admin" }` — frontend constants match exactly.

---

## 21. Final Deliverables

### a. Complete Inventory

**Pages (11):**
`PostsPage`, `PostDetailPage`, `CreatePostPage`, `EditPostPage`, `UserPostsPage`, `LoginPage`, `RegisterPage`, `ProfilePage`, `EditProfilePage`, `AdminUsersPage`, `NotFoundPage`

**Layout components (3):**
`Navbar`, `Footer`, `PageWrapper`

**Common components (11):**
`Button`, `Input`, `Textarea`, `Spinner`, `Avatar`, `Badge`, `EmptyState`, `ErrorMessage`, `Pagination`, `ConfirmDialog`, `Toast`

**Feature components (12):**
`PostCard`, `PostList`, `PostDetail`, `PostForm`, `SearchBar`, `SortSelect`, `TagBadge`, `CommentList`, `CommentItem`, `CommentForm`, `EditProfileForm`, `UserTable`, `UserRow`

**Route guards (2):**
`ProtectedRoute`, `AdminRoute`

**Redux slices (2):**
`authSlice`, `uiSlice`

**API service modules (5):**
`auth.api.js`, `posts.api.js`, `comments.api.js`, `user.api.js`, `admin.api.js`

**Custom hooks (16):**
`useDebounce` (cross-feature); `useLogin`, `useRegister`, `useLogout`; `usePosts`, `usePost`, `useCreatePost`, `useUpdatePost`, `useDeletePost`; `useComments`, `useAddComment`, `useDeleteComment`; `useProfile`, `useUpdateProfile`; `useAdminUsers`, `useDeleteUser`

**Zod validators (5):**
`loginSchema`, `registerSchema`, `postSchema`, `commentSchema`, `editProfileSchema`

**Utils (5):**
`formatDate`, `formatRelativeDate`, `truncate`, `buildQueryString`, `getErrorMessage`

**Constants (3 files):**
`roles.js`, `routes.js`, `pagination.js`

**Lib (1):**
`axios.js` (configured Axios instance with interceptors)

**Env vars (2):**
`VITE_API_BASE_URL`, `VITE_APP_NAME`

---

### b. Final Folder Tree

```
Frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   └── store.js
│   ├── assets/styles/
│   │   ├── index.css
│   │   ├── typography.css
│   │   └── utilities.css
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Textarea/
│   │   │   ├── Spinner/
│   │   │   ├── Avatar/
│   │   │   ├── Badge/
│   │   │   ├── EmptyState/
│   │   │   ├── ErrorMessage/
│   │   │   ├── Pagination/
│   │   │   ├── ConfirmDialog/
│   │   │   └── Toast/
│   │   └── layout/
│   │       ├── Navbar/
│   │       ├── Footer/
│   │       └── PageWrapper/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/   LoginForm.jsx, RegisterForm.jsx
│   │   │   ├── pages/        LoginPage.jsx, RegisterPage.jsx
│   │   │   ├── hooks/        useLogin.js, useRegister.js, useLogout.js
│   │   │   ├── services/     auth.api.js
│   │   │   ├── store/        authSlice.js
│   │   │   └── validators/   loginSchema.js, registerSchema.js
│   │   ├── posts/
│   │   │   ├── components/   PostCard.jsx, PostList.jsx, PostDetail.jsx,
│   │   │   │                 PostForm.jsx, SearchBar.jsx, SortSelect.jsx, TagBadge.jsx
│   │   │   ├── pages/        PostsPage.jsx, PostDetailPage.jsx, CreatePostPage.jsx,
│   │   │   │                 EditPostPage.jsx, UserPostsPage.jsx
│   │   │   ├── hooks/        usePosts.js, usePost.js, useCreatePost.js,
│   │   │   │                 useUpdatePost.js, useDeletePost.js
│   │   │   ├── services/     posts.api.js
│   │   │   └── validators/   postSchema.js
│   │   ├── comments/
│   │   │   ├── components/   CommentList.jsx, CommentItem.jsx, CommentForm.jsx
│   │   │   ├── hooks/        useComments.js, useAddComment.js, useDeleteComment.js
│   │   │   ├── services/     comments.api.js
│   │   │   └── validators/   commentSchema.js
│   │   ├── user/
│   │   │   ├── components/   EditProfileForm.jsx
│   │   │   ├── pages/        ProfilePage.jsx, EditProfilePage.jsx
│   │   │   ├── hooks/        useProfile.js, useUpdateProfile.js
│   │   │   ├── services/     user.api.js
│   │   │   └── validators/   editProfileSchema.js
│   │   └── admin/
│   │       ├── components/   UserTable.jsx, UserRow.jsx
│   │       ├── pages/        AdminUsersPage.jsx
│   │       ├── hooks/        useAdminUsers.js, useDeleteUser.js
│   │       └── services/     admin.api.js
│   ├── hooks/
│   │   └── useDebounce.js
│   ├── lib/
│   │   └── axios.js
│   ├── router/
│   │   ├── index.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx
│   ├── utils/
│   │   ├── formatDate.js
│   │   ├── truncate.js
│   │   ├── buildQueryString.js
│   │   └── getErrorMessage.js
│   ├── constants/
│   │   ├── roles.js
│   │   ├── routes.js
│   │   └── pagination.js
│   ├── App.jsx
│   └── main.jsx
├── .env.development
├── .env.production
├── .env.example
├── .gitignore
├── index.html
├── vite.config.js
└── package.json
```

---

### c. Implementation Order

| Phase | What | Why first |
|---|---|---|
| 1 | Vite project init, folder structure | Foundation |
| 2 | CSS design tokens in `index.css`, typography, utilities | Every component reads from these |
| 3 | Redux store + `authSlice` + `uiSlice` (slices only, no thunks yet) | Route guards need auth state before anything else |
| 4 | `ProtectedRoute`, `AdminRoute`, router with all routes defined | Routing skeleton must exist before building pages |
| 5 | Layout: `Navbar`, `Footer`, `PageWrapper`, `App.jsx` shell | Needed by every page; verify the layout works |
| 6 | Common components: `Button`, `Input`, `Textarea`, `Spinner`, `ErrorMessage` | Needed by all forms and pages |
| 7 | `lib/axios.js` — base instance (request interceptor only, no refresh logic yet) | API services depend on this |
| 8 | Auth feature: `LoginForm`, `RegisterForm`, `LoginPage`, `RegisterPage`, validators, `auth.api.js`, `authSlice` thunks (`loginUser`, `registerUser`) | Must work end-to-end before testing any protected flow |
| 9 | `initializeAuth()` thunk + session restore on app start + `ProtectedRoute` spinner gate | Auth-dependent pages need this to work correctly |
| 10 | Axios response interceptor (401 → refresh → retry / logout) | Add after auth works; now all API calls handle token expiry |
| 11 | `Post` feature: `PostsPage`, `PostCard`, `PostList`, `usePosts`, `SearchBar`, `SortSelect`, `Pagination`, `TagBadge` | Core browsing experience |
| 12 | `PostDetailPage`, `PostDetail`, `usePost` | Depends on post list |
| 13 | `CreatePostPage`, `EditPostPage`, `PostForm`, `useCreatePost`, `useUpdatePost`, `useDeletePost`, `ConfirmDialog` | Depends on auth + post detail |
| 14 | Comments: `CommentList`, `CommentItem`, `CommentForm`, `useComments`, `useAddComment`, `useDeleteComment` | Scoped to `PostDetailPage` — add after post detail works |
| 15 | User profile: `ProfilePage`, `EditProfilePage`, `EditProfileForm`, `useProfile`, `useUpdateProfile` | Low complexity |
| 16 | Admin: `AdminUsersPage`, `UserTable`, `UserRow`, `useAdminUsers`, `useDeleteUser` | Role guard already built in Phase 4 |
| 17 | `UserPostsPage` — public author post list | Simple; same pattern as `PostsPage` |
| 18 | `Toast` component + `uiSlice` integration, `EmptyState`, `Avatar`, `Badge` | Polish — add after features work |
| 19 | Responsive CSS — mobile breakpoints, Navbar hamburger menu | Add after desktop layout is confirmed |
| 20 | Code splitting — `React.lazy` on all pages | Add last; doesn't affect functionality |
| 21 | Tests — unit (utils/schemas) → component (Button/ProtectedRoute) → integration (auth/posts flows) | Test after patterns stabilize |

---

### d. Open Questions

**No blockers for implementation start.** All decisions are resolved.

**Things to confirm before Phase 9:**
1. **JWT payload contents** — Does the backend encode `{ _id, role, email }` in the JWT payload? This determines whether the frontend needs an extra `GET /users/me` call after refresh to populate the user object. Recommend always calling `/users/me` after refresh for completeness.

**Safe to defer post-v1:**
- Markdown rendering for post body (add `marked` + `DOMPurify` when ready)
- Avatar file upload (Cloudinary v2 plan is already in backend blueprint)
- Dark mode (CSS tokens are structured to support it with `@media prefers-color-scheme`)
- Comment editing (`PUT /posts/:postId/comments/:commentId` — not in backend v1)
- Infinite scroll for comments (currently pagination; trivial swap)
- Post view count display (not in backend schema)

**Where this frontend gets genuinely complex:**
- **Axios refresh interceptor with race condition guard** — The `isRefreshing` + `failedQueue` pattern is the trickiest piece of code in this project. Getting it wrong means either: (a) multiple concurrent refresh calls, causing a cascade of failures, or (b) requests silently dropped. Implement it carefully and test it with parallel requests.
- **`initializeAuth()` timing + ProtectedRoute** — The render gate (show Spinner until auth is initialized) must work before any route guard logic runs. If this is implemented incorrectly, authenticated users will flash the login page on reload.

**Where this should stay simple:**
- State management: local hooks for server data, Redux only for auth. Don't add RTK Query, TanStack Query, or a normalized cache.
- No custom hook for every API call — hooks are worth it only when they abstract real complexity (loading/error state, retry logic, pagination) away from the component.
- No component library — the common components listed are sufficient and fast to build.

---

### e. Architecture Decision Summary

| Decision | Choice | Key Tradeoff |
|---|---|---|
| **Routing** | React Router v6 with nested routes + `useSearchParams` for URL state | URL state for search/filter/pagination makes links shareable and browser back/forward work correctly |
| **State management** | Redux Toolkit for auth + UI only; local state in hooks for server data; URL params for filter/search/sort/page | Avoids stale cache problems of Redux-as-server-cache; keeps server state co-located with the components that need it |
| **API client** | Axios with request + response interceptors (token attach, silent refresh, race condition guard) | The refresh race condition guard is the hardest piece to implement correctly — it's worth the complexity because the alternative (visible logout on concurrent 401s) is a bad UX |
| **Auth strategy** | Access token in Redux memory + refresh token in httpOnly cookie + `initializeAuth()` on app start | Token is lost on tab close and restored via cookie on reload; access token never touches localStorage; the render gate prevents flashing wrong state |
| **Component strategy** | Feature-based folder structure; common primitives in `components/common/`; no component for every JSX fragment | Feature co-location makes the codebase navigable; extracting components only where there's real reuse or complexity worth isolating |
| **Forms** | React Hook Form + Zod | Uncontrolled inputs eliminate re-renders; Zod schemas are the single source of truth for validation rules; `@hookform/resolvers` connects them in one line |
| **Styling** | Vanilla CSS + CSS custom properties (design tokens) | Zero runtime overhead; consistent design without a library; easy to hand-tune; tokens enable future dark mode without component changes |
| **Error handling** | `getErrorMessage` util normalizes all Axios error shapes; field-level errors from `form.setError`; toast for network/server errors; inline `ErrorMessage` for form/page errors | Different error types need different UI — toasts are for transient events; inline messages are for things the user must see and act on |
| **Testing** | Vitest + RTL + MSW; test priority: utils → components → integration flows | MSW mocking at network level means tests exercise the real Axios interceptor logic, not mocked Axios — more realistic test coverage |
| **Key dependencies** | react, react-router-dom, @reduxjs/toolkit, react-redux, axios, react-hook-form, zod, @hookform/resolvers, lucide-react, date-fns | Every package has exactly one non-duplicated role; no utility belts or heavy libraries |
| **Complexity tradeoff** | Simplicity over enterprise patterns — no abstraction layer that isn't justified by a real requirement | This is a portfolio-scale project; the right call is to build the simplest thing that works correctly and is well-organized |
