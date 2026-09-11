> ⚠️ Internal development document. Not a public API contract.
> Decisions may have evolved during implementation. See README.md for final documentation.


# MERN Blogging Platform — Backend Technical Blueprint

---

## Requirement Classification

### Confirmed Requirements (from project spec)
- Blog post CRUD operations
- Comment CRUD on posts
- Search and pagination for posts
- Authentication guarding write/edit/delete operations
- MongoDB schema for posts and comments
- REST API backend

### Assumptions (filled in because spec doesn't specify)
- Two roles only: `user` (authenticated) and `admin`. Admins can delete any post/comment; users can only mutate their own.
- JWT-based stateless auth with short-lived access tokens + refresh token rotation stored in `httpOnly` cookie.
- No email verification or password reset in v1 — login/register only (can be added later).
- A post has a single author; co-authorship is out of scope.
- Comments are flat (no nested/threaded replies) in v1.
- No file upload / cover image in v1 (can be added with Cloudinary later).
- Search operates on post title and body via MongoDB text index. No external search engine needed at this scale.
- No payment, no OAuth, no real-time (WebSocket) — out of scope.
- Portfolio/learning scale project — prefer simple, maintainable over enterprise patterns.

### Decisions — All Resolved

| # | Decision | Resolution |
|---|---|---|
| 1 | Password Reset / Email Verification | ❌ Not in v1. No email integration. |
| 2 | Post drafts/publish toggle | ❌ No draft state. Every saved post is immediately public. |
| 3 | Comment author editing | ❌ Delete only. No `PUT` on comments in v1. |
| 4 | Admin role bootstrap | ✅ Seed script. Credentials documented in seed output. |
| 5 | Likes/reactions | ❌ Not in scope for v1 or v2 planning. |

---

## 1. Application Understanding

### What the App Does
A multi-user blogging platform where:
- **Anyone (public)** can browse, search, and read posts.
- **Authenticated users** can create posts, edit/delete their own posts, and add/delete their own comments.
- **Admins** can delete any post or comment (moderation).

### Primary Users / Roles
| Role | Description |
|------|-------------|
| `guest` | Unauthenticated visitor — read-only access |
| `user` | Registered and logged-in author/commenter |
| `admin` | Elevated role with moderation powers |

### Core Entities
| Entity | Relationships |
|--------|--------------|
| `User` | Has many `Post`s, has many `Comment`s |
| `Post` | Belongs to one `User` (author), has many `Comment`s |
| `Comment` | Belongs to one `Post`, belongs to one `User` (author) |

### Core Workflows
1. **Register / Login** → receive JWT pair → store refresh token in cookie
2. **Create Post** → authenticated user POSTs body → stored with `author` ref
3. **Read / Search Posts** → public, paginated, full-text search on title + body
4. **Update / Delete Post** → author or admin only
5. **Add Comment** → authenticated user POSTs to `/posts/:postId/comments`
6. **Delete Comment** → commenter or admin only
7. **Token Refresh** → client uses refresh cookie → new access token issued

### Ambiguities Flagged
- No mention of tags/categories — treated as **Optional**, schema-ready slot added.
- No mention of post images — excluded from v1 schema.
- "Auth required for edits" leaves open who can edit others' posts — defaulting to **own post only**, admin can delete any.

---

## 2. Backend Feature Inventory

### 2.1 Authentication & Session Management
- **Purpose:** Register, login, logout, token refresh
- **Entities:** `User`
- **APIs:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`
- **Auth:** Public endpoints; refresh requires valid cookie
- **Edge Cases:** Duplicate email on register, invalid credentials, expired/tampered tokens
- **V1:** ✅ Essential

### 2.2 Post CRUD
- **Purpose:** Core content creation and management
- **Entities:** `Post`, `User`
- **APIs:** `GET /posts`, `POST /posts`, `GET /posts/:id`, `PUT /posts/:id`, `DELETE /posts/:id`
- **Auth:** Read = public; Create = `user`; Update = owner; Delete = owner or `admin`
- **V1:** ✅ Essential

### 2.3 Post Search, Pagination & Filtering
- **Purpose:** Browse and discover posts
- **Entities:** `Post`
- **APIs:** Query params on `GET /posts` — `?search=`, `?page=`, `?limit=`, `?sort=`
- **Auth:** Public
- **V1:** ✅ Essential

### 2.4 Comment CRUD
- **Purpose:** Reader engagement on posts
- **Entities:** `Comment`, `Post`, `User`
- **APIs:** `GET /posts/:postId/comments`, `POST /posts/:postId/comments`, `DELETE /posts/:postId/comments/:commentId`
- **Auth:** Read = public; Create = `user`; Delete = owner or `admin`
- **V1:** ✅ Essential

### 2.5 User Profile (Own)
- **Purpose:** View and update own account info
- **Entities:** `User`
- **APIs:** `GET /users/me`, `PUT /users/me`
- **Auth:** Authenticated user only
- **V1:** ✅ Essential (minimal — username, bio update)

### 2.6 Admin Moderation
- **Purpose:** Delete any post or comment; view all users
- **Entities:** `Post`, `Comment`, `User`
- **APIs:** Reuse existing DELETE endpoints with role check; `GET /admin/users`
- **Auth:** `admin` role only
- **V1:** ✅ Essential (admin delete); user list is **Recommended**

### 2.7 Password Reset via Email
- **Not in v1.** Decided out of scope. No email provider integration.
- **Future consideration:** If added in v2, requires `passwordResetToken` + `passwordResetExpires` fields added to User schema at that time via migration.

### 2.8 Tags / Categories on Posts
- **Purpose:** Topic-based filtering
- **Entities:** `Post` (`tags` array field)
- **APIs:** Filter `GET /posts?tag=javascript`
- **V1:** 🟡 **Recommended** — cheap to add to schema now; filter route is easy

### 2.9 Soft Deletion of Posts
- **Purpose:** Allow recovery, audit trail
- **Entities:** `Post` (`deletedAt` field)
- **V1:** 🟡 **Recommended** — one field, prevents data loss; admin can hard-delete if needed

### 2.10 Rate Limiting
- **Purpose:** Brute-force and spam protection on auth + write endpoints
- **V1:** ✅ **Required** — even portfolio apps get abused

### 2.11 Activity Tracking / Analytics
- **Purpose:** View counts, post stats
- **V1:** ❌ **Optional** — adds complexity with marginal v1 value

### 2.12 Likes / Reactions
- **Not in scope.** Decided out of scope for v1 and not planned for v2.

---

## 3. Database & Schema Design

### 3.1 User Schema

```
Collection: users

Fields:
  _id           ObjectId    auto
  username      String      required, unique, trim, 3–30 chars
  email         String      required, unique, lowercase, trim
  password      String      required, select: false (never returned in queries)
  role          String      enum: ['user', 'admin'], default: 'user'
  bio           String      optional, maxLength: 300
  avatar        String      optional (URL — reserved for v2 Cloudinary integration)
  refreshToken  String      select: false (stored hashed)
  createdAt     Date        auto (timestamps)
  updatedAt     Date        auto (timestamps)

Note: No passwordResetToken / passwordResetExpires fields — password reset is out of scope for v1.
      Add these fields via a migration script if/when email auth is introduced in v2.

Indexes:
  { email: 1 }    unique: true   — login lookup
  { username: 1 } unique: true   — profile lookup

Hooks:
  pre('save'): hash password if modified
  pre('save'): hash refreshToken if modified

Virtuals:
  posts → virtual populate from Post.author (on-demand, not always populated)

Timestamps: true
Soft Delete: Not applicable — users aren't deleted in v1
```

### 3.2 Post Schema

```
Collection: posts

Fields:
  _id         ObjectId    auto
  title       String      required, trim, 5–200 chars
  body        String      required, minLength: 20
  author      ObjectId    ref: 'User', required, indexed
  tags        [String]    optional, each maxLength: 30, max 10 tags
  slug        String      unique, auto-generated from title + nanoid suffix
  deletedAt   Date        default: null  (soft delete flag)
  createdAt   Date        auto
  updatedAt   Date        auto

Note: No isPublished field — every saved post is immediately public. Draft support is out of scope.

Indexes:
  { author: 1 }                          — "my posts" queries
  { slug: 1 }             unique: true   — SEO/URL lookup
  { tags: 1 }                            — tag filter queries
  { deletedAt: 1 }                       — filter out deleted in all queries
  { title: 'text', body: 'text' }        — full-text search (MongoDB Atlas or local text index)
  { createdAt: -1 }                      — default sort (newest first)

Compound indexes:
  { deletedAt: 1, createdAt: -1 }        — "active posts sorted by date" is the most common query

Hooks:
  pre('save'): auto-generate slug from title if new document
  pre('find'): add { deletedAt: null } filter automatically (via plugin or service layer)

Virtuals:
  commentCount → virtual from Comment count (computed at query time, not stored)

Timestamps: true
Soft Delete: Yes — deletedAt field; hard delete only by admin action
```

### 3.3 Comment Schema

```
Collection: comments

Fields:
  _id       ObjectId    auto
  body      String      required, trim, 1–1000 chars
  author    ObjectId    ref: 'User', required, indexed
  post      ObjectId    ref: 'Post', required, indexed
  createdAt Date        auto
  updatedAt Date        auto

Indexes:
  { post: 1, createdAt: 1 }   — "fetch all comments for a post, oldest first"
  { author: 1 }               — "comments by this user" (admin moderation)

Timestamps: true
Soft Delete: No — comments are hard deleted (low risk, simpler)
```

### 3.4 Relationships Summary

| Relationship | Type | Strategy | Reason |
|---|---|---|---|
| User → Post | One-to-Many | Referenced (`author` ObjectId on Post) | Posts are unbounded in count; can query independently |
| Post → Comment | One-to-Many | Referenced (`post` ObjectId on Comment) | Comments queried separately with pagination |
| User → Comment | One-to-Many | Referenced (`author` ObjectId on Comment) | Same as above |
| Comment embedded in Post | Not used | — | Would bloat Post doc as comments grow |

**Why not embed comments in posts?**  
A post with 200 comments would require loading the entire comment array even when only the post body is needed. Separate collection + index on `post` is the right tradeoff at any scale.

---

## 4. API Design

All routes prefixed with `/api/v1`.

### Auth Routes (`/auth`)

| Method | Route | Purpose | Auth | Role | Body | Response | Errors |
|--------|-------|---------|------|------|------|----------|--------|
| POST | `/auth/register` | Create account | Public | — | `{username, email, password}` | `201 {success, message, data: {user}}` | 400 validation, 409 duplicate email/username |
| POST | `/auth/login` | Login | Public | — | `{email, password}` | `200 {success, data: {user, accessToken}}` + refresh cookie | 400 validation, 401 invalid credentials |
| POST | `/auth/logout` | Logout | Protected | `user` | — | `200 {success, message}` | 401 not authenticated |
| POST | `/auth/refresh` | Get new access token | Cookie | — | — | `200 {success, data: {accessToken}}` | 401 invalid/expired refresh token |

### Post Routes (`/posts`)

| Method | Route | Purpose | Auth | Role | Params/Query/Body | Response | Errors |
|--------|-------|---------|------|------|------|----------|--------|
| GET | `/posts` | List posts (paginated, searchable) | Public | — | `?page=1&limit=10&search=&tag=&sort=newest` | `200 {success, data: {posts[], pagination}}` | — |
| POST | `/posts` | Create post | Protected | `user` | `{title, body, tags[]}` | `201 {success, data: {post}}` | 400 validation, 401 |
| GET | `/posts/:id` | Get single post | Public | — | `:id` (ObjectId or slug) | `200 {success, data: {post}}` | 404 |
| PUT | `/posts/:id` | Update post | Protected | owner | `:id`, `{title?, body?, tags?}` | `200 {success, data: {post}}` | 400, 401, 403, 404 |
| DELETE | `/posts/:id` | Delete post (soft) | Protected | owner \| `admin` | `:id` | `200 {success, message}` | 401, 403, 404 |

### Comment Routes (`/posts/:postId/comments`)

| Method | Route | Purpose | Auth | Role | Params/Query/Body | Response | Errors |
|--------|-------|---------|------|------|------|----------|--------|
| GET | `/posts/:postId/comments` | List comments on a post | Public | — | `?page=1&limit=20` | `200 {success, data: {comments[], pagination}}` | 404 post |
| POST | `/posts/:postId/comments` | Add comment | Protected | `user` | `{body}` | `201 {success, data: {comment}}` | 400, 401, 404 post |
| DELETE | `/posts/:postId/comments/:commentId` | Delete comment | Protected | owner \| `admin` | `:postId`, `:commentId` | `200 {success, message}` | 401, 403, 404 |

### User Routes (`/users`)

| Method | Route | Purpose | Auth | Role | Body | Response | Errors |
|--------|-------|---------|------|------|------|----------|--------|
| GET | `/users/me` | Get own profile | Protected | `user` | — | `200 {success, data: {user}}` | 401 |
| PUT | `/users/me` | Update own profile | Protected | `user` | `{username?, bio?, avatar?}` | `200 {success, data: {user}}` | 400, 401, 409 duplicate username |
| GET | `/users/:id/posts` | Public posts by a user | Public | — | `?page=&limit=` | `200 {success, data: {posts[], pagination}}` | 404 user |

### Admin Routes (`/admin`)

| Method | Route | Purpose | Auth | Role | Response | Errors |
|--------|-------|---------|------|------|----------|--------|
| GET | `/admin/users` | List all users | Protected | `admin` | `200 {success, data: {users[], pagination}}` | 401, 403 |
| DELETE | `/admin/users/:id` | Delete a user account | Protected | `admin` | `200 {success, message}` | 401, 403, 404 |

> **Note:** Admin delete on posts/comments is handled by role check in the existing POST/COMMENT DELETE routes — no separate admin endpoint needed, keeping the API surface small.

---

## 5. Architecture Layers & Folder Structure

### Folder Structure

```
src/
├── config/           # App, DB, and external service configuration
├── constants/        # Role enums, pagination defaults, error codes
├── controllers/      # HTTP handlers — parse req, call service, send res
├── services/         # Business logic — queries, rules, orchestration
├── models/           # Mongoose schemas and model exports
├── routes/           # Express router definitions
├── middleware/        # Auth, role guard, validation, error handler, rate limit
├── validators/       # Joi/Zod schema validators for req.body and req.query
├── utils/            # Reusable helpers: ApiError, ApiResponse, slugify, token helpers
├── jobs/             # Background jobs (deferred to v2 unless email added)
└── app.js            # Express app setup (middleware chain, route mounting)
    server.js         # HTTP server boot, DB connect
```

### What Doesn't Belong Where
- `controllers/` — No DB queries, no business rules, no `Model.find()` calls
- `services/` — No `req`/`res` objects, no HTTP status codes
- `models/` — No business logic beyond schema hooks/virtuals
- `routes/` — No logic; only `router.method(path, [...middlewares], controller)`

### Request Flow

```
HTTP Request
    │
    ▼
Route (routes/)
    │  Applies middleware chain:
    ▼
[rateLimiter] → [authenticate] → [requireRole] → [validateBody/Query]
    │
    ▼
Controller (controllers/)
    │  Extracts: req.params, req.query, req.body, req.user
    │  Calls service method(s)
    ▼
Service (services/)
    │  Business logic, authorization ownership checks
    │  Queries Model(s)
    ▼
Model (models/)
    │  Mongoose schema, hooks, validators
    ▼
MongoDB
    │
    ▼
Service returns plain data object
    │
    ▼
Controller wraps in ApiResponse → res.json()
    │
    ▼
[Global Error Handler middleware] ← catches any thrown ApiError or unhandled error
```

**Where each concern lives:**
| Concern | Layer |
|---|---|
| Input validation (body/query) | `validators/` middleware before controller |
| Auth check (token valid?) | `authenticate` middleware |
| Role check (admin?) | `requireRole` middleware |
| Ownership check (is this your post?) | `Service` layer |
| Business rules | `Service` layer |
| HTTP status and response shape | `Controller` + `ApiResponse` util |
| DB error handling | `Service` + Global Error Handler |
| External API calls | `Service` layer (or dedicated integration module) |

---

## 6. Controllers & Services

### Controllers

#### `AuthController`
- **Handles:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`
- **Calls:** `AuthService.register()`, `AuthService.login()`, `AuthService.logout()`, `AuthService.refresh()`
- **Responsibility:** Extract body/cookies, set/clear `httpOnly` refresh cookie, return `ApiResponse`
- **Does NOT do:** Password hashing, token signing, DB queries

#### `PostController`
- **Handles:** All `GET|POST|PUT|DELETE /posts` endpoints and `GET /users/:id/posts`
- **Calls:** `PostService.createPost()`, `PostService.getPosts()`, `PostService.getPostById()`, `PostService.updatePost()`, `PostService.deletePost()`
- **Responsibility:** Pass `req.user._id`, `req.params.id`, `req.body`, `req.query` to service; return shaped response

#### `CommentController`
- **Handles:** All `/posts/:postId/comments` endpoints
- **Calls:** `CommentService.addComment()`, `CommentService.getComments()`, `CommentService.deleteComment()`

#### `UserController`
- **Handles:** `GET /users/me`, `PUT /users/me`
- **Calls:** `UserService.getProfile()`, `UserService.updateProfile()`

#### `AdminController`
- **Handles:** `GET /admin/users`, `DELETE /admin/users/:id`
- **Calls:** `UserService.getAllUsers()`, `UserService.deleteUser()`

---

### Services

#### `AuthService`
- **Methods:** `register(dto)`, `login(dto)`, `logout(userId, refreshToken)`, `refresh(rawRefreshToken)`
- **Rules:**
  - `register`: check duplicate email/username, hash password, create User, generate token pair, hash + store refresh token
  - `login`: find user by email, compare password, generate + store refresh token
  - `logout`: find user, null out `refreshToken` field
  - `refresh`: find user with matching hashed refresh token, verify expiry, issue new pair (rotation)
- **Touches:** `User` model, token util, hash util

#### `PostService`
- **Methods:** `createPost(authorId, dto)`, `getPosts(query)`, `getPostById(id)`, `updatePost(postId, userId, role, dto)`, `deletePost(postId, userId, role)`
- **Rules:**
  - `getPosts`: build MongoDB query from search/tag/sort params, apply `{deletedAt: null}` filter always, return paginated results with metadata
  - `updatePost`: verify post exists and `deletedAt === null`; check `post.author.equals(userId) || role === 'admin'` — throw `403` if not
  - `deletePost`: same ownership/role check; set `deletedAt = new Date()` (soft delete)
  - Slug auto-generation happens in schema hook, not service

#### `CommentService`
- **Methods:** `addComment(postId, authorId, dto)`, `getComments(postId, query)`, `deleteComment(commentId, userId, role)`
- **Rules:**
  - `addComment`: verify post exists and is not deleted before allowing comment
  - `deleteComment`: ownership check same pattern as PostService

#### `UserService`
- **Methods:** `getProfile(userId)`, `updateProfile(userId, dto)`, `getAllUsers(query)`, `deleteUser(targetId)`
- **Rules:**
  - `updateProfile`: check new username uniqueness if changed; never allow role change through this endpoint
  - `deleteUser` (admin): soft-delete user (`deletedAt` on User) + retain their posts/comments with author reference intact. Posts remain readable but author profile shows as deleted. This is the simplest strategy — no cascade, no transaction needed.

---

## 7. Middleware

### `authenticate` — **Required**
- **Purpose:** Verify JWT access token on protected routes
- **Receives:** `Authorization: Bearer <token>` header
- **On success:** Attaches `req.user = { _id, role, email }` (decoded payload — no DB hit)
- **On failure:** Throws `401 ApiError` (missing, malformed, expired token)
- **Why no DB hit:** At portfolio scale, stateless JWT is sufficient. Token revocation is handled via refresh token deletion on logout.

### `requireRole(roles[])` — **Required**
- **Purpose:** Guard endpoints by role
- **Receives:** Array of allowed roles, e.g., `requireRole(['admin'])`
- **Runs after:** `authenticate` (depends on `req.user`)
- **On failure:** `403 ApiError`

### `validateBody(schema)` / `validateQuery(schema)` — **Required**
- **Purpose:** Validate and sanitize `req.body` / `req.query` using Joi schema
- **On failure:** `400 ApiError` with `errors[]` array of field-level messages
- **Why middleware, not controller:** Keeps controllers clean; failed validation never reaches business logic

### `rateLimiter` — **Required**
- **Purpose:** Prevent brute-force on auth endpoints; prevent spam on write endpoints
- **Two configs:**
  - `authLimiter`: 10 requests / 15 min per IP (login/register)
  - `writeLimiter`: 30 requests / 1 min per IP (post/comment create)
- **On failure:** `429 Too Many Requests`
- **Library:** `express-rate-limit` — lightweight, no external store needed at this scale

### `errorHandler` — **Required**
- **Purpose:** Global catch-all for all thrown errors
- **Receives:** `(err, req, res, next)` — Express 4-arg error handler
- **Logic:**
  - If `err instanceof ApiError`: use `err.statusCode` and `err.message`
  - If Mongoose `ValidationError`: map to `400` with field errors
  - If Mongoose `CastError` (invalid ObjectId): map to `400`
  - If Mongoose `duplicate key` (code 11000): map to `409`
  - Else: `500` with generic message (never leak stack in production)
- **Logs:** Full error in non-production; sanitized in production

### `notFound` — **Required**
- **Purpose:** Catch unmatched routes; throw `404 ApiError` before error handler
- **Position:** Mounted after all route definitions

### `cors` — **Required**
- **Purpose:** Allow frontend origin; block others
- **Config:** Specific origin from `CORS_ORIGIN` env var, `credentials: true` (required for cookies)

### `helmet` — **Required**
- **Purpose:** Set security headers (XSS protection, no-sniff, frame options, etc.) in one call
- **Reason:** No reason not to; zero complexity, meaningful protection

### `morgan` — **Recommended**
- **Purpose:** HTTP request logging in development
- **Production:** Replace with structured logger (winston) or skip

---

## 8. Validation Strategy

### Library: **Joi** — Recommended
- Declarative, well-documented, returns structured errors, integrates cleanly as middleware. `zod` is equally valid if you prefer TypeScript-style schemas; either earns its place here.

### What Gets Validated Where

| Layer | What | Tool |
|-------|------|------|
| `validators/` middleware | `req.body` shape and field rules | Joi schema |
| `validators/` middleware | `req.query` params (pagination limits, sort enum) | Joi schema |
| Mongoose schema | Field types, required, enum, minLength, maxLength | Built-in validators |
| `Service` layer | Business rules (ownership, uniqueness, referential integrity) | Manual checks → `ApiError` |
| MongoDB | Unique index enforcement | Index constraint |

**Rule:** Never validate the same thing twice unless different concerns (e.g., Mongoose catches type errors; Joi catches "password too short"). Schema-level and body-level validators serve different audiences (DB integrity vs. user feedback).

### Key Validation Rules Per Endpoint

| Endpoint | Key Rules |
|---|---|
| `POST /auth/register` | email format, password min 8 chars, username 3–30 alphanumeric |
| `POST /auth/login` | email format, password required |
| `POST /posts` | title 5–200 chars, body min 20 chars, tags max 10 items each 30 chars |
| `PUT /posts/:id` | At least one field present; same field rules as create |
| `POST /posts/:postId/comments` | body 1–1000 chars |
| `GET /posts` | page min 1, limit 1–50, sort enum `['newest','oldest']` |

---

## 9. Authentication & Authorization

### Strategy: JWT with Refresh Token Rotation — **Required**

**Why JWT over sessions?**  
Stateless — no session store needed at this scale. Access token is verified by signature alone on each request (no DB hit). The tradeoff is that a compromised access token cannot be revoked before expiry — mitigated by keeping it short-lived (15 min).

### Auth Flow

#### Registration
```
POST /auth/register
  → validate body
  → check email/username uniqueness (service)
  → hash password with bcrypt (cost 12)
  → create User document
  → generate accessToken (JWT, 15min, signed with ACCESS_SECRET)
  → generate refreshToken (JWT, 7d, signed with REFRESH_SECRET)
  → hash refreshToken with bcrypt → store on User.refreshToken
  → set refreshToken in httpOnly, Secure, SameSite=Strict cookie (7d)
  → return accessToken + user data in body
```

#### Login
```
POST /auth/login
  → validate body
  → find User by email (select: +password +refreshToken)
  → compare password with bcrypt
  → generate new token pair
  → hash + store new refreshToken (replaces old)
  → set cookie
  → return accessToken + user data
```

#### Protected Request
```
Any protected route
  → authenticate middleware reads Authorization header
  → verify accessToken with ACCESS_SECRET
  → attach decoded { _id, role, email } to req.user
  → route handler proceeds
```

#### Token Refresh
```
POST /auth/refresh
  → read refreshToken from httpOnly cookie
  → verify JWT signature with REFRESH_SECRET
  → find User by _id from token payload
  → bcrypt.compare(rawToken, user.refreshToken)
  → if match: issue new accessToken (+ rotate refreshToken)
  → if no match: 401 (token reuse → possible theft → clear cookie)
```

#### Logout
```
POST /auth/logout
  → authenticate middleware runs
  → service: set user.refreshToken = null
  → clear cookie in response
  → 200
```

### Where Auth State Lives
| Token | Where stored | Lifetime | Why |
|-------|-------------|----------|-----|
| Access Token | Client memory (JS variable / Redux store) | 15 minutes | Never in localStorage (XSS risk) |
| Refresh Token | `httpOnly` cookie | 7 days | Not accessible to JS (XSS protection); sent automatically |
| Hashed Refresh Token | `User.refreshToken` field in MongoDB | 7 days | For revocation on logout and rotation validation |

### Authorization (Ownership)
- Ownership checks happen in **Service layer**, not middleware, because they require a DB query to fetch the resource.
- Pattern: `if (!post.author.equals(userId) && role !== 'admin') throw new ApiError(403, 'Forbidden')`
- Admin can always delete; admin cannot edit another user's post content (moderation ≠ authorship).

### Security Notes
- Refresh token is stored **hashed** in DB — if DB is compromised, attacker cannot use stored values
- `select: false` on `password` and `refreshToken` — never accidentally returned in queries
- Refresh token rotation: each `/auth/refresh` issues a new refresh token and invalidates the old one
- Cookie `SameSite=Strict` blocks CSRF for same-site; cross-origin frontend needs `SameSite=None; Secure`

---

## 10. Error Handling & API Response Contract

### Response Shape

**Success (single resource):**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": { "post": { ... } }
}
```

**Success (list with pagination):**
```json
{
  "success": true,
  "message": "Posts fetched successfully",
  "data": {
    "posts": [ ... ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "must be a valid email" },
    { "field": "password", "message": "must be at least 8 characters" }
  ]
}
```

**Auth / Auth Error (401/403):**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "errors": []
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Something went wrong. Please try again.",
  "errors": []
}
```

### Custom Error Class: `ApiError`
```
class ApiError extends Error {
  constructor(statusCode, message, errors = [], isOperational = true)
  fields: statusCode, message, errors[], isOperational, stack
}
```

**Operational vs. Programming Errors:**
- **Operational** (`isOperational: true`): Expected failures — 400, 401, 403, 404, 409, 429. Safe to send details to client.
- **Programming** (`isOperational: false`): Unexpected bugs, DB connection failures. Log full error; send generic 500 to client.

### `ApiResponse` Utility
```
class ApiResponse {
  static success(res, statusCode, message, data)
  static created(res, message, data)
  static paginated(res, message, data, pagination)
}
```

### Global Error Handler Position
Mounted as last middleware in `app.js`, after all routes and `notFound` handler. Catches errors thrown anywhere in the async chain via `express-async-errors` (or manual `try/catch` + `next(err)`).

---

## 11. Pagination, Filtering, Sorting & Search

**Applies to:** `GET /posts`, `GET /posts/:postId/comments`, `GET /users/:id/posts`, `GET /admin/users`

### Query Parameters

| Param | Type | Default | Max | Applies To |
|-------|------|---------|-----|------------|
| `page` | integer | 1 | — | All lists |
| `limit` | integer | 10 | 50 | All lists |
| `search` | string | — | — | Posts only |
| `tag` | string | — | — | Posts only |
| `sort` | enum: `newest`, `oldest` | `newest` | — | Posts only |

### DB Strategy
- **Pagination:** `Model.find(query).skip((page-1)*limit).limit(limit)` — sufficient for this scale. Cursor-based pagination is overkill.
- **Text Search:** MongoDB text index on `{title: 'text', body: 'text'}`. Query: `{ $text: { $search: req.query.search } }`. Score sort: `{ score: { $meta: 'textScore' } }` when search term present.
- **Tag Filter:** `{ tags: req.query.tag }` — exact match on array element. Works with `{ tags: 1 }` index.
- **Deleted filter:** Always append `{ deletedAt: null }` to every post query in service layer.
- **Count:** Run `Model.countDocuments(query)` in parallel with the paginated find (use `Promise.all`) for performance.

### Pagination Metadata Shape
```json
{
  "currentPage": 2,
  "totalPages": 8,
  "totalItems": 73,
  "limit": 10,
  "hasNextPage": true,
  "hasPrevPage": true
}
```

---

## 12. File Uploads & Media

**Not applicable in v1.** The spec doesn't mention image/file requirements. The `avatar` field on `User` and potential `coverImage` on `Post` are reserved as URL strings in the schema, ready for Cloudinary integration in v2 without schema migration.

**When adding in v2:** Use `multer` (memory storage) → Cloudinary SDK upload → store returned URL in document. Validate: image MIME types only (`image/jpeg`, `image/png`, `image/webp`), max 5MB.

---

## 13. External Integrations

### V1 — None Required
All v1 functionality is self-contained. No payment, email, OAuth, or cloud storage dependency.

### V2 — Cloudinary (Optional, for avatars/cover images)
- **Why:** Managed image storage, CDN delivery, on-the-fly transforms
- **Data flow:** `multer` (memory) → `cloudinary.uploader.upload()` → store URL in User/Post doc
- **Env vars:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Failure:** If Cloudinary upload fails, don't update DB; return 502

### V2 — Email Provider (for password reset / verification)
- **Not applicable.** Password reset and email verification are out of scope for v1.
- If added in v2, recommended provider: **Resend** (simplest API, good free tier, minimal setup).

---

## 14. Background Jobs

**Not applicable in v1.** No email queue, no scheduled cleanup, no report generation required. A queue system (BullMQ, Agenda) would be overengineering for this project. If email is added in v2, a simple inline `sendEmail()` util is sufficient at this scale — no queue unless volume demands it.

---

## 15. Security Architecture

### Password Security
- bcrypt with cost factor **12** (cost 10 is the tutorial default; 12 is the production minimum — benchmark to ensure < 200ms on your hardware)
- `select: false` on `password` field — never accidentally serialized
- Passwords never logged

### JWT Security
- Two separate secrets: `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` — compromise of one doesn't compromise both
- Short access token lifetime (15 min) limits blast radius of a leaked token
- Refresh token stored hashed; raw value only in `httpOnly` cookie

### Cookie Security
```
httpOnly: true       // inaccessible to JavaScript → XSS protection
secure: true         // HTTPS only in production (env-gated)
sameSite: 'Strict'   // CSRF protection for same-origin; use 'None' for cross-origin frontend
maxAge: 7d
```

### CORS
- Allowlist: only `CORS_ORIGIN` env var value (your React dev/prod URL)
- `credentials: true` required for cookie-carrying requests
- Never use `origin: '*'` in production

### NoSQL Injection
- Mongoose sanitizes ObjectId casts (`CastError` on invalid ids)
- Use `express-mongo-sanitize` to strip `$` operators from `req.body`/`req.query` — **Recommended**, one line of setup

### Rate Limiting
- Auth endpoints: 10 req/15min per IP — brute-force login protection
- Write endpoints: 30 req/min per IP — spam protection
- `express-rate-limit` with default in-memory store is sufficient; use Redis store only if multi-instance

### XSS
- Access token stored in memory (not localStorage) — not vulnerable to XSS token theft
- Refresh token in `httpOnly` cookie — inaccessible to JS
- Response body is JSON, not HTML — XSS via response not a concern
- `helmet` adds `X-XSS-Protection` and `Content-Security-Policy` headers

### Security Headers (`helmet` defaults cover)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- Removal of `X-Powered-By: Express`

### Secrets Management
- All secrets in `.env` — never committed (`.gitignore`)
- Provide `.env.example` with placeholder values
- Never log: passwords, tokens, cookie values, `Authorization` headers

### Input Validation as Defense
- Joi validation rejects malformed input before it reaches service or DB
- `limit` capped at 50 in query validation — prevents accidental full-collection dumps

---

## 16. Logging & Monitoring

### What to Log
| Event | Level | Info to include |
|-------|-------|----------------|
| HTTP request | `info` | method, route, status, response time |
| Auth events | `info` | userId, action (login/logout/register), IP |
| Business errors (4xx) | `warn` | route, error message, userId if known |
| Unhandled errors (5xx) | `error` | full stack trace, route, userId |
| DB connection events | `info` | connected, disconnected, retrying |

### What to NEVER Log
- Passwords (plain or hashed)
- JWT tokens (any)
- Cookie values
- Credit card / payment data (not in scope, but noting the rule)
- Full request bodies on auth routes

### Tools
- **Development:** `morgan` (HTTP), `console.error` for unhandled errors
- **Production:** `winston` with JSON transport to file or log aggregator (Logtail, Datadog free tier) — **Recommended** but not required for v1

### Monitoring
- At portfolio scale: uptime monitoring with UptimeRobot (free) is sufficient
- Error tracking: Sentry free tier — **Recommended** for catching production bugs passively

---

## 17. Environment Variables & Configuration

### `.env.example`

```bash
# ── App ─────────────────────────────────────────────
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:5173

# ── Database ─────────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

# ── Auth ─────────────────────────────────────────────
ACCESS_TOKEN_SECRET=your_access_token_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRY=7d

# ── Email (deferred to v2) ────────────────────────────
# EMAIL_PROVIDER=resend
# RESEND_API_KEY=re_xxxxxxxxxxxx
# EMAIL_FROM=noreply@yourdomain.com

# ── Cloud Storage (deferred to v2) ───────────────────
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

### Variable Inventory

| Variable | Required | Used In | Notes |
|---|---|---|---|
| `NODE_ENV` | Required | `app.js`, error handler, cookie config | `development` / `production` / `test` |
| `PORT` | Required | `server.js` | Default 5000 |
| `CORS_ORIGIN` | Required | `cors` middleware | Must match frontend origin exactly |
| `MONGODB_URI` | Required | `config/db.js` | Never commit real URI |
| `ACCESS_TOKEN_SECRET` | Required | `utils/token.js` | Min 32 random chars |
| `ACCESS_TOKEN_EXPIRY` | Required | `utils/token.js` | Format: `15m` |
| `REFRESH_TOKEN_SECRET` | Required | `utils/token.js` | Different from access secret |
| `REFRESH_TOKEN_EXPIRY` | Required | `utils/token.js` | Format: `7d` |

### `config/` Contents
- `config/db.js` — Mongoose connection setup, retry logic
- `config/index.js` — Reads and validates env vars at startup; exports typed config object. App code reads from this, not directly from `process.env`. This allows a single place to validate required env vars on boot.

**Values that must never be committed:** `MONGODB_URI`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, any API keys.

---

## 18. Utilities & Constants

### Utilities (`utils/`)

| Utility | Inputs | Outputs | Used In |
|---------|--------|---------|---------|
| `ApiError` | `(statusCode, message, errors[], isOperational)` | Error object | Controllers, Services, Middleware |
| `ApiResponse` | `(res, statusCode, message, data)` | `res.json()` call | Controllers |
| `generateTokens` | `(userId, role)` | `{accessToken, refreshToken}` | AuthService |
| `hashToken` | `(rawToken)` | bcrypt hash string | AuthService (refresh token storage) |
| `compareToken` | `(rawToken, hash)` | boolean | AuthService (refresh validation) |
| `slugify` | `(title, nanoidSuffix)` | URL-safe slug string | Post model `pre('save')` hook |
| `paginationMeta` | `(total, page, limit)` | pagination metadata object | Services returning lists |
| `asyncHandler` | `(fn)` | Express middleware wrapping fn in try/catch | Route definitions |

> **`asyncHandler` note:** Either use this wrapper or install `express-async-errors` (patches Express to handle async throws automatically). Pick one approach and use it consistently — don't mix.

### Constants (`constants/`)

| Constant | Value | Why a constant |
|---|---|---|
| `ROLES` | `{ USER: 'user', ADMIN: 'admin' }` | Used in schema enum, middleware, service checks — single source of truth |
| `PAGINATION` | `{ DEFAULT_PAGE: 1, DEFAULT_LIMIT: 10, MAX_LIMIT: 50 }` | Query validation defaults; referenced in validators and service |
| `SORT_OPTIONS` | `{ NEWEST: 'newest', OLDEST: 'oldest' }` | Validated in query schema; used in service query builder |
| `COOKIE_OPTIONS` | `{ httpOnly: true, secure: NODE_ENV==='production', sameSite: 'Strict', maxAge: 7*24*60*60*1000 }` | Consistent cookie config across auth endpoints |
| `FILE_LIMITS` | `{ MAX_SIZE_BYTES: 5*1024*1024, ALLOWED_TYPES: ['image/jpeg','image/png','image/webp'] }` | Ready for v2 upload validation |

**Why constants instead of config?** Config values change by environment (ports, URIs). Constants are business rules that don't change by environment (roles, pagination caps). If a value would be the same in dev, staging, and prod, it's a constant.

---

## 19. Testing Strategy

### Priority Order
1. **AuthService** — highest risk, most security-critical
2. **PostService** — core business logic, ownership rules
3. **CommentService** — ownership + referential integrity
4. **API integration tests** — end-to-end route testing with a real DB

### Unit Tests (Services + Utils)

**AuthService:**
- `register`: creates user, hashes password, generates tokens, rejects duplicate email
- `login`: rejects wrong password, returns tokens on success
- `refresh`: rejects tampered token, rotates refresh token correctly
- `logout`: nullifies refresh token

**PostService:**
- `createPost`: stores correct author, auto-generates slug
- `getPosts`: text search returns relevant results, tag filter works, deleted posts excluded
- `updatePost`: owner can update, non-owner gets 403, admin cannot edit (only delete)
- `deletePost`: owner soft-deletes, admin hard-deletes (if implemented), 404 on missing post

**CommentService:**
- `addComment`: fails with 404 if post doesn't exist or is deleted
- `deleteComment`: owner can delete, non-owner gets 403

**Utils:**
- `slugify`: produces URL-safe output, handles special chars, uniqueness via suffix
- `paginationMeta`: correct `hasNextPage` / `hasPrevPage` logic at boundaries

### Integration Tests (API Routes)
- `POST /auth/login` with valid/invalid credentials → correct status codes + cookie behavior
- `POST /posts` without token → 401
- `DELETE /posts/:id` as non-owner → 403
- `DELETE /posts/:id` as admin → 200
- `GET /posts?search=nodejs` → returns only matching posts

### Test Tools
- **Jest** (test runner + assertions) — **Required**
- **Supertest** (HTTP integration testing) — **Required**
- **mongodb-memory-server** (in-memory MongoDB for tests) — **Required** (no test DB needed)
- **Faker.js** (realistic test data) — **Recommended**

### What to Test First
Auth flow → Post CRUD with ownership → Comment CRUD with ownership → Pagination/search correctness

---

## 20. Dependency Plan

### Required

| Package | Reason |
|---------|--------|
| `express` | HTTP server framework |
| `mongoose` | MongoDB ODM — schemas, hooks, validation |
| `bcryptjs` | Password and refresh token hashing |
| `jsonwebtoken` | JWT sign and verify |
| `joi` | Request body/query validation |
| `express-rate-limit` | Auth and write endpoint rate limiting |
| `helmet` | Security headers in one call |
| `cors` | Cross-origin request handling with credentials |
| `cookie-parser` | Parse `httpOnly` refresh token cookie |
| `dotenv` | Load `.env` into `process.env` |
| `express-mongo-sanitize` | Strip `$` operators to prevent NoSQL injection |
| `nanoid` | Unique suffix for slug generation (URL-safe) |

### Recommended

| Package | Reason |
|---------|--------|
| `winston` | Structured production logging (dev: morgan is fine) |
| `morgan` | HTTP request logging in development |
| `express-async-errors` | Patches Express async error propagation; eliminates try/catch boilerplate |

### Dev / Test Only

| Package | Reason |
|---------|--------|
| `jest` | Test runner |
| `supertest` | Integration HTTP testing |
| `mongodb-memory-server` | In-memory MongoDB for tests, no external DB |
| `nodemon` | Dev server restart on change |
| `@faker-js/faker` | Realistic seed/test data |

### Deliberately Excluded

| Package | Why excluded |
|---------|-------------|
| `passport` | Adds abstraction complexity for simple JWT; not needed without OAuth |
| `multer` | No file uploads in v1 |
| `agenda` / `bullmq` | No background jobs in v1 |
| `express-validator` | Joi covers validation; two libraries for same job |
| `lodash` | No use case that vanilla JS doesn't handle |

---

## 21. Final Deliverables

### a. Complete Inventory

**Schemas:** `User`, `Post`, `Comment`

**Routes:** `authRoutes`, `postRoutes`, `commentRoutes` (nested under posts), `userRoutes`, `adminRoutes`

**Controllers:** `AuthController`, `PostController`, `CommentController`, `UserController`, `AdminController`

**Services:** `AuthService`, `PostService`, `CommentService`, `UserService`

**Middleware:** `authenticate`, `requireRole`, `validateBody`, `validateQuery`, `authLimiter`, `writeLimiter`, `errorHandler`, `notFound`, `cors`, `helmet`, `express-mongo-sanitize`

**Validators:** `registerValidator`, `loginValidator`, `createPostValidator`, `updatePostValidator`, `createCommentValidator`, `getPaginatedQueryValidator`

**Utils:** `ApiError`, `ApiResponse`, `generateTokens`, `hashToken`, `compareToken`, `slugify`, `paginationMeta`, `asyncHandler`

**Config modules:** `config/db.js`, `config/index.js`

**Constants:** `ROLES`, `PAGINATION`, `SORT_OPTIONS`, `COOKIE_OPTIONS`, `FILE_LIMITS`

**Integrations:** None in v1

**Jobs:** None in v1

**Env vars:** `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `MONGODB_URI`, `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRY`

---

### b. Final Folder Tree

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── index.js
│   ├── constants/
│   │   └── index.js          # ROLES, PAGINATION, SORT_OPTIONS, COOKIE_OPTIONS, FILE_LIMITS
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── post.controller.js
│   │   ├── comment.controller.js
│   │   ├── user.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── requireRole.js
│   │   ├── validate.js       # validateBody + validateQuery factories
│   │   ├── rateLimiter.js    # authLimiter, writeLimiter exports
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── post.model.js
│   │   └── comment.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── post.routes.js
│   │   ├── comment.routes.js
│   │   ├── user.routes.js
│   │   ├── admin.routes.js
│   │   └── index.js          # mounts all routers under /api/v1
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── post.service.js
│   │   ├── comment.service.js
│   │   └── user.service.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── token.js          # generateTokens, hashToken, compareToken
│   │   ├── slugify.js
│   │   └── pagination.js     # paginationMeta
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── post.validator.js
│   │   ├── comment.validator.js
│   │   └── query.validator.js
│   ├── app.js
│   └── server.js
├── scripts/
│   └── seed.admin.js         # Creates initial admin user — run once on fresh DB
│                             # Logs credentials to console on success
│                             # Admin: email=admin@blog.dev / password=Admin@1234!
│                             # Change password immediately after first login
├── tests/
│   ├── unit/
│   │   ├── auth.service.test.js
│   │   ├── post.service.test.js
│   │   └── comment.service.test.js
│   ├── integration/
│   │   ├── auth.routes.test.js
│   │   ├── post.routes.test.js
│   │   └── comment.routes.test.js
│   └── setup.js              # mongodb-memory-server setup/teardown
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

### c. Frontend Handoff Package

> Self-contained. Paste this into your frontend blueprint prompt.

---

#### Base URL
```
http://localhost:5000/api/v1
```

#### Auth / Token Flow (Client-Side)
- **Access Token:** Store in memory (React state / Redux). **NOT in localStorage.** Lifetime: 15 minutes.
- **Refresh Token:** Stored automatically in `httpOnly` cookie — you don't manage this manually. Sent by browser automatically.
- **Authorization Header:** `Authorization: Bearer <accessToken>` on every protected request.
- **On 401 response:** Call `POST /auth/refresh` to get a new access token. If that also returns 401, redirect to login.
- **On login/register:** Store the returned `accessToken` in memory. Set up an Axios interceptor or fetch wrapper to attach it.
- **On logout:** Call `POST /auth/logout`, then clear access token from memory.
- **Cookie requirement:** All requests must include `credentials: 'include'` (fetch) or `withCredentials: true` (Axios) for the cookie to be sent.

#### Role / Permission Enum Values
```
ROLES = { USER: "user", ADMIN: "admin" }
```
Role is included in the `user` object returned on login/register. Use it to conditionally render edit/delete UI.

#### Pagination Metadata Shape
```json
{
  "currentPage": 1,
  "totalPages": 5,
  "totalItems": 47,
  "limit": 10,
  "hasNextPage": true,
  "hasPrevPage": false
}
```

#### Standard Error Shape
```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": [
    { "field": "email", "message": "must be a valid email" }
  ]
}
```
`errors[]` is populated on 400 validation failures. Empty array on 401/403/404/500.

#### Endpoint Reference

**AUTH**
```
POST /auth/register
  Body: { username: string, email: string, password: string }
  201: { success, message, data: { user: {_id, username, email, role, bio, avatar} } }
  + sets refresh cookie

POST /auth/login
  Body: { email: string, password: string }
  200: { success, data: { user, accessToken: string } }
  + sets refresh cookie

POST /auth/logout
  Auth: Bearer token
  200: { success, message }
  + clears refresh cookie

POST /auth/refresh
  (no body — cookie sent automatically)
  200: { success, data: { accessToken: string } }
  401: token invalid or expired → redirect to login
```

**POSTS**
```
GET /posts?page=1&limit=10&search=&tag=&sort=newest
  Public
  200: { success, data: { posts: [...], pagination: {...} } }
  Post shape: { _id, title, body, slug, tags, author: {_id, username, avatar}, createdAt, updatedAt }

POST /posts
  Auth: Bearer token | Role: user
  Body: { title: string (5-200), body: string (min 20), tags?: string[] }
  201: { success, data: { post } }

GET /posts/:id
  Public — :id can be ObjectId or slug
  200: { success, data: { post } }
  404: post not found

PUT /posts/:id
  Auth: Bearer token | Role: owner only
  Body: { title?, body?, tags? } — at least one field
  200: { success, data: { post } }
  403: not the owner

DELETE /posts/:id
  Auth: Bearer token | Role: owner or admin
  200: { success, message }
  403: not owner or admin
```

**COMMENTS**
```
GET /posts/:postId/comments?page=1&limit=20
  Public
  200: { success, data: { comments: [...], pagination: {...} } }
  Comment shape: { _id, body, author: {_id, username, avatar}, post, createdAt }

POST /posts/:postId/comments
  Auth: Bearer token | Role: user
  Body: { body: string (1-1000 chars) }
  201: { success, data: { comment } }
  404: post not found

DELETE /posts/:postId/comments/:commentId
  Auth: Bearer token | Role: owner or admin
  200: { success, message }
  403: not owner or admin
```

**USERS**
```
GET /users/me
  Auth: Bearer token
  200: { success, data: { user: {_id, username, email, role, bio, avatar, createdAt} } }

PUT /users/me
  Auth: Bearer token
  Body: { username?, bio?, avatar? }
  200: { success, data: { user } }
  409: username already taken

GET /users/:id/posts?page=1&limit=10
  Public
  200: { success, data: { posts: [...], pagination: {...} } }
```

**ADMIN**
```
GET /admin/users?page=1&limit=10
  Auth: Bearer token | Role: admin
  200: { success, data: { users: [...], pagination: {...} } }

DELETE /admin/users/:id
  Auth: Bearer token | Role: admin
  200: { success, message }
```

---

### d. Implementation Order

| Phase | What | Why first |
|-------|------|----------|
| 1 | `config/`, `constants/`, `utils/` (`ApiError`, `ApiResponse`, `asyncHandler`, `paginationMeta`) | Everything depends on these; no business logic, quick to build correctly |
| 2 | `models/` — User, Post, Comment | Services depend on models; validate schema decisions early |
| 3 | `scripts/seed.admin.js` — admin seed script | Needed before admin routes can be tested; run once immediately after DB is up |
| 4 | Auth — validators, service, controller, routes | All protected routes need auth working first; test register/login manually before anything else |
| 5 | Post CRUD — validators, service, controller, routes | Core feature; validates auth integration (protected create/update/delete) |
| 6 | Comment CRUD — validators, service, controller, routes | Depends on posts existing; straightforward once post pattern is established |
| 7 | User routes — `GET /users/me`, `PUT /users/me` | Low complexity; rounds out the user-facing API |
| 8 | Admin routes | Simple additions; role middleware already exists from Phase 4 |
| 9 | Search + pagination tuning | Requires posts to exist; add text index, test search quality |
| 10 | Middleware hardening — rate limiting, mongo-sanitize, helmet tuning | Add last so it doesn't block development |
| 11 | Tests — unit then integration | Write tests after patterns are stable to avoid rewriting tests during refactoring |

---

### e. Open Questions

**All pre-implementation decisions are resolved.** No blockers before coding.

**Resolved decisions summary:**
| Decision | Resolution |
|---|---|
| Password reset | ❌ Not in v1 |
| Post drafts | ❌ No `isPublished` — every post is immediately public |
| Comment editing | ❌ Delete-only in v1 |
| Admin bootstrap | ✅ Seed script (`scripts/seed.admin.js`). Default creds: `admin@blog.dev` / `Admin@1234!` — change after first login |
| Likes/reactions | ❌ Not in scope |
| Cascade on user delete | ✅ Soft-delete user, retain posts/comments with author ref intact |

**Safe to defer post-v1:**
- Tag-based analytics
- Post view counts
- Image uploads (avatars, cover images via Cloudinary)
- Email notifications and password reset (Resend is the recommended provider when ready)
- Nested/threaded comments
- Comment editing

**Where this backend gets genuinely complex:**
- **Search relevance:** MongoDB text index is adequate but has no ranking, stemming, or typo tolerance. If search quality becomes a complaint, ElasticSearch/Algolia is the upgrade path — don't pre-optimize for it.
- **Token revocation at scale:** A compromised access token cannot be revoked before its 15-min expiry without a Redis blacklist. Acceptable at portfolio scale; worth understanding the tradeoff.
- **Refresh token rotation under race conditions:** Parallel requests both hitting `/auth/refresh` will cause one to fail. At this scale, accept the edge case — the user re-logs in.

**Where this should stay simple:**
- Pagination: skip/limit is correct for this scale. No cursor-based pagination needed.
- Caching: no Redis. MongoDB reads are fast enough for a portfolio platform.
- Queue: no BullMQ or Agenda. Inline service calls only.
- Logging: `morgan` in dev; add `winston` only when deploying to production.

---

### f. Architecture Decision Summary

| Decision | Choice | Tradeoff |
|---|---|---|
| **DB Design** | Separate collections for Post and Comment (referenced, not embedded) | Avoids document bloat as comments grow; requires join-style populate but that's fine for this scale |
| **Auth Strategy** | Stateless JWT (access 15min) + refresh token (7d, httpOnly cookie, stored hashed) | Cannot revoke access token mid-lifetime; mitigated by short expiry. No session store needed. |
| **API Structure** | RESTful, versioned at `/api/v1`, comments nested under `/posts/:postId/comments` | Predictable, frontend-friendly, extensible |
| **Error Handling** | Custom `ApiError` class + global 4-arg Express error handler | Single, consistent error shape across all endpoints; operational vs. programming error distinction |
| **Validation** | Joi in `validators/` middleware; Mongoose for schema integrity | Validation happens before DB; clear separation of HTTP concerns vs. data integrity |
| **Soft Deletion** | Posts soft-deleted via `deletedAt`; comments hard-deleted | Posts have audit value; comments don't. Keeps queries simple for comments. |
| **Ownership Auth** | Checked in Service layer (requires DB query) | Controllers stay thin; service has full context to make the decision |
| **Scale Target** | Portfolio/learning project — simplicity over enterprise patterns | Explicit: no Redis, no queues, no microservices, no cursor pagination. All can be added when actually needed. |
| **Key Dependencies** | express, mongoose, bcryptjs, jsonwebtoken, joi, express-rate-limit, helmet, cors, cookie-parser, nanoid | Every package has a specific, non-duplicated role. No utility belt libraries. |
