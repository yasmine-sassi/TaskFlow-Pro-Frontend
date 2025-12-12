# TaskFlow Pro — Project Roadmaps (Frontend Angular + Backend NestJS)

Date: 2025-12-12
Authors: Team TaskFlow

---

## Overview
TaskFlow Pro is a team task management application built with Angular (standalone, signals, new control flow) and NestJS (REST API with JWT). This document outlines two complete roadmaps—one for the Angular frontend and one for the NestJS backend—including milestones, responsibilities, and deliverables. Use this as a handoff document and export to PDF.

---

## Angular Frontend Roadmap (TaskFlow Pro)
Stack: Angular 17+/19, Standalone Components, Signals, New Control Flow (@for/@if/@switch), RxJS, Resource API, HttpClient, Routing with lazy loading.

### M0: Setup & Structure
- Enable strict TypeScript and recommended compiler options.
- Create structure:
  - `src/app/core/{services,guards,interceptors,models}`
  - `src/app/shared/{components,directives,pipes}`
  - `src/app/features/{auth,tasks,admin}`
  - `src/environments/`
- Routing:
  - Configure lazy routes for `auth`, `tasks`, `admin` in `src/app/app.routes.ts` using `loadComponent`/`loadChildren`.
  - Add a 404 fallback route and optional named outlet for modal.

### M1: Core Plumbing
- Services:
  - `ApiService`: wraps `HttpClient`; base URL from `environment`.
  - `AuthService`: signals for `currentUser`, `token`, `role`; persist to `localStorage`.
- DI Tokens:
  - `API_URL`, `AUTH_API_URL` (string tokens or `InjectionToken<string>`).
- Interceptors:
  - `AuthInterceptor`: adds `Authorization: Bearer <token>`.
  - `ErrorInterceptor`: maps server errors to user-friendly messages.
  - `LoadingInterceptor`: toggles a global loading signal.
- Global Error Handling:
  - Provide `provideBrowserGlobalErrorListeners()` and a user-facing `ErrorBannerComponent`.
- Guards:
  - `authGuard` (canActivate), `roleGuard` (canMatch), `pendingChangesGuard` (canDeactivate for forms).

### M2: Auth Feature (Template-Driven)
- `LoginComponent` (standalone, template-driven):
  - Fields: email, password; built-in validators; form feedback.
  - Calls `/auth/login`; on success sets `AuthService` signals and navigates.
- Optional: `RegisterComponent` and `ForgotPasswordComponent` stub routes.

### M3: Tasks Feature (Reactive + Resource)
- Tasks List:
  - Use `resource()` to fetch tasks with reactive loading/error states.
  - `@for` with `track` expression for performance.
  - Search/filter: `debounceTime`, `distinctUntilChanged`, `combineLatest` for sort+filter.
  - Display via `async` pipe; avoid manual subscriptions.
- Task Detail Route `tasks/:id`:
  - Resolver to preload task; edit form; optimistic updates or refetch.
- Task Form (FormBuilder):
  - `FormArray` for subtasks; custom sync validator (title uniqueness in form).
  - Async validator (server title check), cross-field validator (due date > today).
  - `valueChanges` subscriptions with `takeUntilDestroyed`.
- CRUD API calls via `ApiService`; type-safe models.

### M4: Admin Feature (Lazy)
- `AdminDashboardComponent` with resolver preloading users/roles.
- Child routes (e.g., `admin/users`, `admin/settings`).
- Use `IfPermissionDirective` (structural) to gate actions by role.

### M5: Shared UI & Behavior
- Directives:
  - `HighlightDirective` (attribute hover/active styling).
  - `TooltipDirective` (attribute with aria support).
  - `IfPermissionDirective` (structural directive for role-based content).
- Pipes:
  - `CapitalizePipe` (pure), `DurationPipe` (pure, e.g., minutes → h:mm), `FilterTasksPipe` (chainable).
- Presentational Components (OnPush):
  - Task card, status badge, toolbar. Smart/container components orchestrate services.
- UX Components:
  - Loading indicator, error banner, validation message list.

### M6: Signals & Performance
- Signals:
  - `signal()` for local UI state; `computed()` for derived counts; `effect()` to persist filters to storage.
  - `linkedSignal()` tying filter criteria and pagination.
- Performance:
  - OnPush for presentational components; trackBy in `@for`; `async` pipe; DestroyRef or `takeUntilDestroyed`.

### M7: Testing & Polish
- E2E tests (Cypress/Playwright): login + tasks CRUD + guard redirects.
- Unit tests: pipes, directives, guards, services.
- Accessibility: aria labels, focus management (search/modal), keyboard navigation.
- Bundle analysis: verify lazy route splits; optional custom preloading strategy.

### Feature: Task Management & Team Collaboration (Kanban)
- Standalone components: task cards, kanban board columns, user avatars.
- Data binding: status, assignees, due dates bound via inputs and signals.
- Control flow: `@for` for columns/items, `@if` for empty states, `@switch` for status badges.
- Component interaction: list ↔ detail modal ↔ filters with `@Input`/`@Output`, `@ViewChild`, and service-based comms.
- Directives: custom drag-and-drop directive (attribute) and priority-highlight directive.
- Pipes: date formatting, task status mapping, priority sorting (chained pipes where useful).
- DI: `TaskService`, `AuthService`, `NotificationService` provided via DI tokens.
- Signals: `linkedSignal` to compute project progress from tasks; `signal/computed/effect` for board state.
- Routing: `project/:id` routes, team pages, settings, and nested child routes.
- Forms: template-driven quick task creation (inline add) + reactive project creation (custom validators, FormArray subtasks).
- HTTP: CRUD operations for tasks/projects with interceptors (auth/error/loading) and typed models.
- RxJS: real-time updates (via websockets or polling), collaborative filters/search with `debounceTime`/`distinctUntilChanged`, combination operators for board views.
- Resource API: declarative loading of project data and team members with loading/error states.
- Lazy loading: reports and settings modules loaded on demand.
- Change detection: OnPush + track expressions to optimize frequent task updates.

### Deliverables Checklist
- Standalone components only; modular folder structure.
- Component communication: `@Input`, `@Output`, `@ViewChild`, `ContentChild`, service-based.
- Data binding types; new control flow (`@if`, `@for`, `@switch`).
- 2–3 custom directives; 2–3 custom pipes.
- DI with tokens; interceptors; global error handler.
- Signals: `signal`, `computed`, `effect`, `linkedSignal`; DestroyRef.
- Routing: lazy, params, child routes, guards, resolver.
- Forms: template-driven login; reactive task editor with validators.
- HTTP & Resource API; error/loading states; typed models.
- RxJS operators coverage; Subjects; proper subscription management.
- Performance optimizations and accessibility features.

---

## NestJS Backend Roadmap (TaskFlow API)
Stack: NestJS 10+, JWT Auth, Prisma/TypeORM, class-validator, Guards/Interceptors/Filters.

### B0: Setup & Foundation
- Create Nest project; strict TS; eslint/prettier.
- ORM: Prisma (recommended) or TypeORM; set `DATABASE_URL` in `.env`.
- Base modules: `auth`, `users`, `tasks`, `admin` (optional), `common` (filters/interceptors/guards/dtos).

### B1: Domain Modeling
- Entities / Prisma schema:
  - `User`: id, email, passwordHash, role (enum: user/admin), createdAt.
  - `Task`: id, title, description, status (enum), priority, dueDate, ownerId.
  - `Subtask`: id, taskId, title, done.
  - Optional: `AuditLog`.
- Migrations; seed script for admin + sample users/tasks.

### B2: Authentication
- Strategies: Local (email/password), JWT access (short-lived) + optional refresh.
- Hashing: bcrypt; never return passwordHash.
- Guards: `JwtAuthGuard`, `RolesGuard` (decorator: `@Roles('admin')`).
- AuthController: `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`.

### B3: Tasks Module
- Endpoints:
  - `GET /tasks`: pagination, filters (status, priority), search (title), sort.
  - `GET /tasks/:id`: ownership check.
  - `POST /tasks`: validation DTOs; business rules (dueDate >= today).
  - `PATCH /tasks/:id`: partial updates; status transitions.
  - `DELETE /tasks/:id`: owner/admin only.
- Validation: `ValidationPipe` (global, whitelist, transform). DTOs with `class-validator`.
- Ownership/permission checks in services/guards.

### B4: Admin Module
- `GET /admin/users`: list; filter by role/status.
- `PATCH /admin/users/:id/role`: update user role.
- `DELETE /admin/users/:id`: deactivate.
- Restricted by `RolesGuard`.

### B5: Cross-Cutting Concerns
- Global Filters: `HttpExceptionFilter` for consistent error shape `{message, code, details}`.
- Interceptors: Logging, Timeout (optional), Transform (response mapping).
- Config Module: environment-driven configuration; typed getters.
- CORS: allow Angular origin; Auth header exposure.

### B6: Testing
- Unit: AuthService, UsersService, TasksService; mock repositories.
- E2E: `@nestjs/testing` + supertest; login, tasks CRUD, permissions.

### B7: Performance & Ops
- DB Indexes: title/status for search; pagination patterns.
- Rate limiting; health check `/health`.
- Monitoring/logging (Nest built-in or external).

### B8: Realtime Collaboration (WebSockets)
- Gateway: `TasksGateway` using Socket.IO or `@WebSocketGateway()` for task events.
- Events: `task.created`, `task.updated`, `task.deleted`, `project.progressChanged`.
- Auth: JWT guard for socket connections; namespace per project/team.
- Backoff & reliability: acknowledge events, optional replay (server emits after change commit).
- Fallback: long-polling endpoint for clients that cannot use websockets.

### API Contracts (Frontend Integration)
- Auth login response:
  ```json
  { "accessToken": "string", "user": {"id": "uuid", "email": "string", "role": "user|admin"} }
  ```
- Task DTO:
  ```json
  { "id": "uuid", "title": "string", "description": "string", "status": "todo|in_progress|done", "priority": "low|medium|high", "dueDate": "ISO", "subtasks": [{"id": "uuid", "title": "string", "done": true}], "ownerId": "uuid" }
  ```
- Error shape:
  ```json
  { "message": "string", "code": "string", "details": {} }
  ```

---

## Team Assignment
- A: Angular core + auth + interceptors/guards.
- B: Angular tasks feature (reactive + resource, directives/pipes).
- C: NestJS auth/users + guards/JWT.
- D: NestJS tasks module + filters/interceptors + testing.

---

## Export to PDF (Quick Instructions)
1. Open this file in VS Code.
2. Use the Markdown preview: `Ctrl+Shift+V`.
3. Right-click the preview → "Print" → choose "Microsoft Print to PDF" (Windows) and save.
   - Alternatively, install "Markdown PDF" extension in VS Code and run "Markdown PDF: Export (pdf)" on this file.

---

## Notes
- Keep versions aligned: Angular CLI and TypeScript versions compatible; NestJS with Node LTS.
- Document environment variables and base URLs in `src/environments` (frontend) and `.env` (backend).
- Maintain strict typing; avoid `any`.
