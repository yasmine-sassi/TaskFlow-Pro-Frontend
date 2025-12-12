# TaskFlow Pro — Flutter Mobile Roadmap (Client for NestJS Backend)

Date: 2025-12-12
Authors: Team TaskFlow

---

## Overview
Flutter mobile app for TaskFlow Pro using the same NestJS backend as the Angular web client. This roadmap covers architecture, state management, networking/auth, feature milestones, testing, performance, and CI. It’s designed to keep contracts consistent with the backend and ensure a smooth shared development workflow.

---

## Tech Stack & Conventions
- Flutter 3.x (stable), Dart 3.x.
- State management: Riverpod 2.x (recommended) or Bloc.
- Networking: Dio (HTTP client) with interceptors for JWT, error handling, and logging.
- Routing: go_router for declarative routes + guard-like redirection.
- Persistence: flutter_secure_storage for JWT; shared_preferences for UI settings.
- Forms & validation: flutter_form_builder or native `Form` + custom validators.
- Localization & accessibility: flutter_localizations; semantics/focus navigation.
- Flavor-based config: dev/staging/prod base URLs via `.env`-style or build flavors.

---

## Project Structure (Clean Architecture-inspired)
```
lib/
  core/                  # common utils, env config, error types
  data/                  # DTOs, repositories, Dio client, interceptors
    services/            # AuthApi, TasksApi
    models/              # UserDto, TaskDto, SubtaskDto
    interceptors/        # auth_interceptor.dart, error_interceptor.dart
  domain/                # entities, use-cases, repositories interfaces
    entities/            # User, Task, Subtask
    usecases/            # login, loadTasks, createTask, etc.
  features/
    auth/                # screens, controllers/providers, widgets
    tasks/               # list/detail/editor, providers, widgets
    admin/               # dashboard, users management
  shared/                # reusable widgets, themes, utils
    widgets/             # LoadingOverlay, ErrorBanner, TaskCard
    theme/               # colors, typography
  app.dart               # App root (MaterialApp + go_router)
```
- Separate **domain** from **data** to keep logic testable and replaceable.
- Keep **features** independent: auth, tasks, admin. Shared UI under `shared/`.

---

## Milestones

### M0: Setup & Foundation
- Install Flutter SDK; create project with "TaskFlow" name.
- Add dependencies: `flutter_riverpod`, `go_router`, `dio`, `flutter_secure_storage`, `shared_preferences`, `intl`.
- Configure flavors (dev/prod) and environment loader for `API_BASE_URL`.
- Set up `go_router` with public/authenticated routes and redirect logic based on auth state (Riverpod provider).

### M1: Networking & Auth Plumbing
- Create Dio client with base URL from env; add interceptors:
  - **AuthInterceptor**: inject `Authorization: Bearer <token>` from secure storage/Riverpod provider.
  - **ErrorInterceptor**: map backend errors to uniform `AppError` type.
  - **LoggingInterceptor**: dev-only, pretty-print requests/responses.
- Services:
  - `AuthApi`: `login(email, password)`, `me()`, `refresh()` if implemented.
  - `TasksApi`: CRUD (`list`, `get`, `create`, `update`, `delete`) with filters, pagination.
- Providers:
  - `authStateProvider` (Riverpod): holds `User?`, `token`, `role`, loading/error; persists token in secure storage.

### M2: Auth Feature
- Screens:
  - Login screen: email/password form; validate email format; submit → `AuthApi.login`.
  - Profile screen (optional): show `me` info; logout.
- Flow:
  - On login success, save JWT in secure storage, update `authStateProvider`, navigate to tasks.
  - Error messages from `AppError` surfaced in UI.

### M3: Tasks Feature (List/Detail/Editor)
- **List Screen**:
  - Fetch tasks with pagination; search bar uses `debounce` via Riverpod or RxDart if preferred.
  - Filters: status, priority. Combine with search (use `combineLatest` in providers or compute function).
  - Show loading/error via `LoadingOverlay`/`ErrorBanner` widgets.
- **Detail Screen**:
  - Route `/tasks/:id`; load by id; show task info and subtasks.
- **Editor Screen**:
  - Form with title/description/status/priority/dueDate; dynamic subtasks list (add/remove items).
  - Custom validators: title not empty, dueDate ≥ today; async validator to check title uniqueness (optional).
  - Submit create/update to `TasksApi`; optimistic UI updates or refetch.

### Kanban & Collaboration Feature Coverage
- UI: standalone widgets for task cards, kanban columns, user avatars.
- Binding: status/assignee/dueDate displayed and edited with providers and forms.
- Control flow: conditional/empty states per column; sorted views per priority.
- Interaction: list ↔ detail modal ↔ filters; shared providers for cross-widget communication.
- Directives/behaviors: drag-and-drop via `LongPressDraggable`/`DragTarget` and custom helpers; priority highlighting.
- Pipes/formatters: date formatting, status labels, priority sort (implemented as functions/providers).
- DI/providers: repositories/services for tasks, auth, notifications via Riverpod.
- Signals/state: Riverpod computed providers for project progress; sync state to storage.
- Routing: `project/:id`, team pages, settings; guarded by auth/role providers.
- Forms: quick add (template-like with `Form`), complex editor (custom validators, dynamic subtasks).
- HTTP: CRUD to Nest backend with Dio interceptors (auth/error/logging).
- Realtime: web sockets with Socket.IO client (or fallback polling) for task updates.
- Lazy-like: defer heavy screens (reports/settings) and load data on demand.
- Performance: item keys for lists, provider memoization, minimal rebuilds.

### M4: Admin Feature (Optional for role-based demo)
- **Admin Dashboard**:
  - View users list; change role; deactivate user.
  - Guard access via `role == admin` check in router redirect.

### M5: Shared UI/Behavior
- Widgets: `TaskCard`, `StatusBadge`, `LoadingOverlay`, `ErrorBanner`, `ValidationMessageList`.
- Theme: Material 3 colors/typography; dark mode toggle saved in preferences.
- Accessibility: semantics labels, focus order, large text support.

### M6: Performance & State
- Riverpod:
  - Separate read-only providers for lists and selected task; computed selectors for derived counts.
  - Keep providers pure; offload IO to repositories.
- Caching:
  - Cache last task list response in memory; optional persistence via Hive/Isar (stretch goal).
- Pagination & scrolling:
  - Use `ListView.builder` with item `key` (trackBy equivalent).

### M7: Testing & CI
- Unit tests: providers (auth/tasks), repositories with mocked Dio.
- Widget tests: login form validation; tasks list renders items; editor form dynamic fields.
- E2E: integration tests with a dev backend (or `flutter_driver` replacement using `integration_test`).
- CI (GitHub Actions): build Android APK/iOS archive; run unit/widget tests; lint.

---

## API Contract Alignment (Shared with Angular)
- **Auth login response**
  ```json
  { "accessToken": "string", "user": {"id": "uuid", "email": "string", "role": "user|admin"} }
  ```
- **Task DTO**
  ```json
  { "id": "uuid", "title": "string", "description": "string", "status": "todo|in_progress|done", "priority": "low|medium|high", "dueDate": "ISO", "subtasks": [{"id": "uuid", "title": "string", "done": true}], "ownerId": "uuid" }
  ```
- **Error shape**
  ```json
  { "message": "string", "code": "string", "details": {} }
  ```
- **CORS & Headers**
  - Backend must allow both Angular and Flutter origins; expose `Authorization` header.
  - Use HTTPS in production; persist tokens in secure storage on mobile.

---

## Flutter Commands (Dev Quick Start)
```bash
# Install dependencies
flutter pub add flutter_riverpod go_router dio flutter_secure_storage shared_preferences intl

# Run app (choose device)
flutter run

# Run tests
flutter test
```

---

## Export to PDF (Quick Instructions)
1. Open this file in VS Code.
2. Use the Markdown preview: `Ctrl+Shift+V`.
3. Right-click the preview → "Print" → choose "Microsoft Print to PDF" (Windows) and save.
   - Alternatively, install "Markdown PDF" extension in VS Code and run "Markdown PDF: Export (pdf)" on this file.

---

## Team Assignment (Mobile)
- Mobile A: Auth plumbing (Dio + interceptors + providers) + Login screen.
- Mobile B: Tasks list + search/filter + detail route.
- Mobile C: Editor form + dynamic subtasks + validators.
- Mobile D: Admin dashboard + role guards + testing/CI.

---

## Notes
- Keep contract parity with Angular; reuse DTO shapes and error mapping.
- Align token lifecycle (refresh vs re-login) with backend design.
- Document environment configs for mobile flavors.
