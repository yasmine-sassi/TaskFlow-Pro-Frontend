# TaskFlow Pro - Flutter Development Task Division (6-Person Team)

**Project Timeline:** December 13, 2025 onwards  
**Framework:** Flutter 3.x with Dart 3.x  
**Backend:** NestJS + Prisma (running on http://localhost:3000)  
**State Management:** Riverpod (recommended) or BLoC

---

## Team Structure & Responsibilities

### **Person 1: Architecture & State Management Lead**
**Focus:** Project structure, state management, dependency injection, API service layer

#### Phase 1: Architecture Foundation (Days 1-2)
- [ ] **Create Flutter project structure**
  ```
  lib/
    ├── core/
    │   ├── constants/
    │   ├── di/ (dependency injection)
    │   ├── errors/
    │   ├── network/
    │   └── utils/
    ├── data/
    │   ├── models/
    │   ├── repositories/
    │   └── datasources/
    ├── domain/
    │   ├── entities/
    │   ├── repositories/
    │   └── usecases/
    ├── presentation/
    │   ├── screens/
    │   ├── widgets/
    │   ├── providers/ (or blocs)
    │   └── theme/
    └── main.dart
  ```

- [ ] **Setup State Management**
  - Install Riverpod: `flutter_riverpod: ^2.x`
  - OR install BLoC: `flutter_bloc: ^8.x`
  - Create provider/bloc architecture
  - Document state management pattern
  - Setup global providers (auth, theme, etc.)

- [ ] **Setup Dependency Injection**
  - Install `get_it: ^7.x` for service locator
  - Create dependency injection container
  - Register services, repositories, use cases
  - Setup lazy singletons vs factories

- [ ] **Network Layer Setup**
  - Install `dio: ^5.x` for HTTP
  - Create DioClient singleton
  - Create API endpoints constants
  - Setup base URL configuration
  - Create request/response interceptors

- [ ] **Create Interceptors**
  - Auth Token Interceptor (add token to headers)
  - Error Handling Interceptor (401/403 handling)
  - Logging Interceptor (dev mode)
  - Retry Interceptor (for failed requests)

#### Phase 2: Data Layer (Days 3-4)
- [ ] **Create Data Models** (JSON serialization)
  - UserModel with `fromJson()` and `toJson()`
  - ProjectModel
  - TaskModel
  - CommentModel
  - ActivityModel
  - Use `json_serializable: ^6.x` for code generation

- [ ] **Create Repositories (Implementation)**
  - AuthRepository - login, register, logout, getCurrentUser
  - ProjectRepository - CRUD operations
  - TaskRepository - CRUD, filters, assign/unassign
  - CommentRepository - CRUD
  - ActivityRepository - fetch logs

- [ ] **Create DataSources**
  - RemoteDataSource for API calls
  - LocalDataSource for caching (SharedPreferences, Hive)
  - Error handling with Either<Failure, Success>
  - Use `dartz: ^0.10.x` for functional programming

- [ ] **Setup Error Handling**
  - Create Failure classes (ServerFailure, CacheFailure, NetworkFailure)
  - Create custom exceptions
  - Error message mapping

---

### **Person 2: Routing & Navigation**
**Focus:** Navigation setup, route management, deep linking, guards

#### Phase 1: Navigation Setup (Days 1-2)
- [ ] **Setup GoRouter** (recommended) or Navigator 2.0
  - Install `go_router: ^14.x`
  - Create route configuration
  - Define all routes with paths:
    - `/` → Splash/Home
    - `/auth/login` → Login
    - `/auth/register` → Register
    - `/projects` → Projects List
    - `/projects/:id` → Project Detail
    - `/projects/:id/tasks` → Tasks List
    - `/tasks/:id` → Task Detail
    - `/settings` → Settings
    - `/profile` → User Profile

- [ ] **Route Guards/Redirects**
  - Auth guard - redirect to login if not authenticated
  - Admin guard - check user role
  - Project member guard - check membership
  - Implement redirect logic in GoRouter

- [ ] **Deep Linking Setup**
  - Configure Android deep links
  - Configure iOS universal links
  - Test deep linking scenarios

- [ ] **Route Transitions**
  - Custom page transitions
  - Material/Cupertino transitions
  - Hero animations between screens

#### Phase 2: Navigation Widgets (Days 3-4)
- [ ] **Create Navigation Widgets**
  - AppDrawer - side navigation drawer
  - BottomNavBar - for main tabs
  - Breadcrumbs widget (web/tablet)
  - Back button handling

- [ ] **Create Navigation Service**
  - NavigationService for programmatic navigation
  - Show dialogs, bottom sheets, snackbars
  - Navigation history management

- [ ] **Nested Navigation**
  - Setup nested navigators for tabs
  - Maintain state across navigation

- [ ] **Test all navigation scenarios**
  - Forward/backward navigation
  - Deep linking
  - Route guards redirects
  - State preservation

---

### **Person 3: UI Components & Theme**
**Focus:** Reusable widgets, custom widgets, theme, animations

#### Phase 1: Theme & Design System (Days 1-2)
- [ ] **Create App Theme**
  - ThemeData setup (light & dark themes)
  - Color scheme matching Tailwind colors from Angular
  - Typography system
  - Custom TextStyles
  - Spacing constants
  - Border radius constants

- [ ] **Create Theme Provider/Notifier**
  - Theme toggle functionality
  - Persist theme preference
  - System theme detection

- [ ] **Create Base Widgets Library**
  - AppButton (primary, secondary, danger variants)
  - AppTextField (with validation styling)
  - AppCard (with elevation options)
  - AppChip (for tags, status badges)
  - AppAvatar (user avatar with fallback initials)
  - AppLoadingIndicator
  - AppEmptyState
  - AppErrorWidget

#### Phase 2: Complex Widgets (Days 3-4)
- [ ] **Create Layout Widgets**
  - ResponsiveBuilder (mobile, tablet, desktop)
  - AppScaffold (with drawer, bottom nav)
  - SectionHeader widget
  - ListTile variants

- [ ] **Create Status & Priority Widgets**
  - TaskStatusBadge (TODO, IN_PROGRESS, DONE)
  - TaskPriorityBadge (LOW, MEDIUM, HIGH, URGENT)
  - ProjectColorIndicator

- [ ] **Create Dialog Widgets**
  - ConfirmDialog
  - FormDialog
  - LoadingDialog
  - ErrorDialog with retry

- [ ] **Create Bottom Sheet Widgets**
  - FilterBottomSheet (for task filters)
  - SortBottomSheet
  - ActionBottomSheet (task actions)

- [ ] **Create Custom Animations**
  - Fade in animation
  - Slide animation
  - Scale animation
  - Staggered list animations
  - Use `flutter_animate: ^4.x` or custom AnimationController

- [ ] **Create Responsive Utilities**
  - Responsive breakpoints
  - Adaptive widgets (Material on Android, Cupertino on iOS)
  - Platform-specific UI adjustments

---

### **Person 4: Forms & Validation**
**Focus:** Form management, validation, input widgets

#### Phase 1: Form Infrastructure (Days 1-2)
- [ ] **Setup Form Management**
  - Install `flutter_form_builder: ^9.x`
  - OR use FormKey with TextEditingController pattern
  - Create form validation utilities

- [ ] **Create Custom Validators**
  - EmailValidator
  - PasswordStrengthValidator
  - RequiredValidator
  - MinLengthValidator
  - MaxLengthValidator
  - MatchValidator (password confirmation)
  - DateRangeValidator
  - Create validator composition utilities

- [ ] **Create Form Field Widgets**
  - FormTextField (with error text)
  - FormDropdown (for status, priority selection)
  - FormDatePicker (for due date)
  - FormMultiSelect (for assignees)
  - FormCheckbox
  - FormSwitch
  - FormRadioGroup

#### Phase 2: Screen Forms (Days 3-4)
- [ ] **Create Auth Forms**
  - LoginForm - email, password validation
  - RegisterForm - email, firstName, lastName, password, confirmPassword
  - Email validators + async email check
  - Password strength indicator

- [ ] **Create Project Forms**
  - CreateProjectForm - name, description, color
  - EditProjectForm
  - AddMemberForm - search users, select role

- [ ] **Create Task Forms**
  - CreateTaskForm - title, description, status, priority, dueDate, assignees
  - EditTaskForm
  - TaskFilterForm - multiple filter options
  - Use FormArray equivalent for dynamic assignees

- [ ] **Create Comment Form**
  - CommentForm - text input with submit
  - Edit comment form

- [ ] **Form State Management**
  - Form submission loading states
  - Form error handling
  - Form reset functionality
  - Dirty form detection (unsaved changes)
  - Show confirmation before leaving form

- [ ] **Real-time Validation**
  - Validate on change for immediate feedback
  - Debounce async validation
  - Show validation errors conditionally

---

### **Person 5: Business Logic & Use Cases**
**Focus:** Domain layer, use cases, business logic, providers/BLoCs

#### Phase 1: Domain Layer (Days 1-2)
- [ ] **Create Domain Entities**
  - User entity
  - Project entity
  - Task entity
  - Comment entity
  - Activity entity
  - Convert models to entities (clean architecture)

- [ ] **Create Repository Interfaces** (Abstract classes)
  - IAuthRepository
  - IProjectRepository
  - ITaskRepository
  - ICommentRepository
  - IActivityRepository

- [ ] **Create Use Cases**
  - **Auth Use Cases:**
    - LoginUseCase
    - RegisterUseCase
    - LogoutUseCase
    - GetCurrentUserUseCase
  
  - **Project Use Cases:**
    - GetProjectsUseCase
    - GetProjectByIdUseCase
    - CreateProjectUseCase
    - UpdateProjectUseCase
    - DeleteProjectUseCase
    - AddProjectMemberUseCase
    - RemoveProjectMemberUseCase
  
  - **Task Use Cases:**
    - GetTasksUseCase (with filters)
    - GetTaskByIdUseCase
    - CreateTaskUseCase
    - UpdateTaskUseCase
    - DeleteTaskUseCase
    - AssignTaskUseCase
    - UnassignTaskUseCase

#### Phase 2: State Management Implementation (Days 3-4)
- [ ] **Create Riverpod Providers** (or BLoC)
  - **AuthProvider/AuthBloc:**
    - currentUserProvider
    - isAuthenticatedProvider
    - Login, register, logout actions
    - State: AuthState (initial, loading, authenticated, unauthenticated, error)
  
  - **ProjectProvider/ProjectBloc:**
    - projectsProvider (list)
    - currentProjectProvider
    - projectMembersProvider
    - CRUD actions
    - State: ProjectsState, ProjectDetailState
  
  - **TaskProvider/TaskBloc:**
    - tasksProvider (filtered)
    - taskFiltersProvider (status, priority, assignee)
    - currentTaskProvider
    - CRUD actions
    - State: TasksState, TaskDetailState
  
  - **CommentProvider/CommentBloc:**
    - commentsProvider (for task)
    - Add/edit/delete actions

- [ ] **Implement Computed/Derived State**
  - filteredTasksProvider (combines tasks + filters)
  - tasksByStatusProvider (grouped by status)
  - overdueTasksProvider
  - highPriorityTasksProvider
  - projectStatsProvider

- [ ] **Implement Side Effects**
  - Listen to auth state changes (redirect on logout)
  - Refresh data on app resume
  - Show notifications on task assigned
  - Auto-save draft forms

- [ ] **Implement Caching Strategy**
  - Cache projects list
  - Cache current user
  - Invalidate cache on mutations
  - Implement offline support with Hive

- [ ] **Error Handling in State**
  - Handle errors from repositories
  - Show error messages to user
  - Retry logic for failed operations

---

### **Person 6: API Integration, Persistence & Performance**
**Focus:** API services, local storage, optimization, testing

#### Phase 1: API Services (Days 1-2)
- [ ] **Create API Service Classes**
  - AuthApiService
    - login(email, password)
    - register(data)
    - getCurrentUser()
    - logout()
  
  - ProjectApiService
    - getProjects()
    - getProject(id)
    - createProject(data)
    - updateProject(id, data)
    - deleteProject(id)
    - getMembers(projectId)
    - addMember(projectId, userId, role)
    - removeMember(projectId, userId)
  
  - TaskApiService
    - getTasks(projectId, filters)
    - getTask(id)
    - createTask(data)
    - updateTask(id, data)
    - deleteTask(id)
    - assignTask(taskId, userId)
    - unassignTask(taskId, userId)
  
  - CommentApiService
    - getComments(taskId)
    - createComment(data)
    - updateComment(id, data)
    - deleteComment(id)

- [ ] **API Response Handling**
  - Handle success responses
  - Handle error responses (401, 403, 404, 500)
  - Parse error messages
  - Type-safe responses with models

- [ ] **Implement Retry Logic**
  - Exponential backoff for retries
  - Max retry attempts
  - Network connectivity check

- [ ] **Token Management**
  - Store JWT token securely (flutter_secure_storage)
  - Refresh token logic
  - Auto-logout on token expiration

#### Phase 2: Persistence & Performance (Days 3-4)
- [ ] **Local Storage Setup**
  - Install `shared_preferences: ^2.x` for simple data
  - Install `hive: ^2.x` for complex objects
  - Install `flutter_secure_storage: ^9.x` for tokens
  - Setup Hive adapters for models

- [ ] **Implement Caching Layer**
  - Cache user profile
  - Cache projects list
  - Cache tasks
  - Cache expiration strategy
  - Offline mode support

- [ ] **Create Utility Classes**
  - DateFormatter (relative time, format dates)
  - StringUtils (truncate, initials, etc.)
  - ValidationUtils
  - Constants (API URLs, keys, etc.)

- [ ] **Performance Optimization**
  - Implement pagination for lists
  - Use ListView.builder for long lists
  - Lazy loading images (cached_network_image)
  - Debounce search inputs
  - Optimize setState calls
  - Use const constructors where possible
  - Profile with Flutter DevTools

- [ ] **Image Handling**
  - Install `cached_network_image: ^3.x`
  - Avatar image loading with cache
  - Placeholder and error widgets
  - Image compression for uploads

- [ ] **Implement Search with Debounce**
  - Search tasks with debounce (500ms)
  - Search users for assigning
  - Search history persistence

- [ ] **Create Custom Extensions**
  - DateTime extensions (isToday, isTomorrow, etc.)
  - String extensions (capitalize, truncate, etc.)
  - BuildContext extensions (theme, mediaQuery shortcuts)

- [ ] **Testing**
  - Unit tests for use cases
  - Unit tests for repositories
  - Widget tests for key components
  - Integration tests for critical flows
  - Mock API responses with `mockito: ^5.x`

---

## Cross-Cutting Concerns (All Team Members)

### Platform-Specific Features
- Android notification setup
- iOS notification setup
- Permission handling (camera, storage, etc.)
- Biometric authentication (optional)

### Accessibility
- Semantic labels for screen readers
- Color contrast compliance
- Font scaling support
- Focus management

### Internationalization (i18n)
- Install `flutter_localizations`
- Setup translation files (en, fr, etc.)
- Context-aware date/time formatting
- RTL support

### Error Handling
- Global error handler
- Crash reporting (Firebase Crashlytics or Sentry)
- User-friendly error messages
- Logging strategy

### Testing
- Unit tests coverage >70%
- Widget tests for custom widgets
- Integration tests for user flows
- Golden tests for UI consistency

---

## Package Dependencies (Install These)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_riverpod: ^2.5.1  # OR flutter_bloc: ^8.1.3
  
  # Networking
  dio: ^5.4.0
  retrofit: ^4.0.0  # Optional: Type-safe HTTP client
  
  # Dependency Injection
  get_it: ^7.6.0
  injectable: ^2.3.0  # Optional: Code generation for DI
  
  # Local Storage
  shared_preferences: ^2.2.0
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  flutter_secure_storage: ^9.0.0
  
  # JSON Serialization
  json_annotation: ^4.8.0
  
  # Routing
  go_router: ^14.0.0
  
  # Forms
  flutter_form_builder: ^9.1.0
  
  # UI/UX
  cached_network_image: ^3.3.0
  flutter_svg: ^2.0.0
  shimmer: ^3.0.0
  pull_to_refresh: ^2.0.0
  flutter_animate: ^4.5.0
  
  # Utilities
  intl: ^0.19.0
  equatable: ^2.0.5
  dartz: ^0.10.1  # Functional programming
  
  # Date/Time
  timeago: ^3.6.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Code Generation
  build_runner: ^2.4.0
  json_serializable: ^6.7.0
  hive_generator: ^2.0.0
  retrofit_generator: ^8.0.0
  injectable_generator: ^2.4.0
  
  # Testing
  mockito: ^5.4.0
  bloc_test: ^9.1.0  # If using BLoC
  
  # Linting
  flutter_lints: ^3.0.0
```

---

## Phase Timeline

### **Phase 1: Foundation (Days 1-2)** - Parallel Work
- **P1** → Architecture, state management, DI, network layer
- **P2** → Routing setup, navigation config
- **P3** → Theme system, base widgets
- **P4** → Form infrastructure, validators
- **P5** → Domain layer, use cases
- **P6** → API services setup

### **Phase 2: Feature Implementation (Days 3-4)** - Builds on Phase 1
- **P1** → Data models, repositories, error handling
- **P2** → Navigation widgets, route guards
- **P3** → Complex widgets, animations
- **P4** → Screen forms (auth, project, task)
- **P5** → State management providers/BLoCs
- **P6** → API integration, caching, performance

### **Phase 3: Screen Development (Days 5-6)** - All Together
- **All team members** build screens using components:
  - Splash screen
  - Login/Register screens
  - Projects list screen
  - Project detail screen
  - Tasks list screen with filters
  - Task detail screen
  - Task create/edit screens
  - Comments section
  - Profile/Settings screens

### **Phase 4: Polish & Testing (Days 7-8)**
- UI polish and animations
- Error handling refinement
- Performance optimization
- Unit and widget testing
- Integration testing
- Bug fixes
- Documentation

---

## Screen Architecture Pattern

Each screen should follow this structure:

```dart
// presentation/screens/tasks/tasks_screen.dart
class TasksScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch providers
    final tasksState = ref.watch(tasksProvider);
    final filters = ref.watch(taskFiltersProvider);
    
    return Scaffold(
      appBar: TasksAppBar(),
      body: tasksState.when(
        data: (tasks) => TasksList(tasks: tasks),
        loading: () => LoadingIndicator(),
        error: (error, stack) => ErrorWidget(error: error),
      ),
      floatingActionButton: CreateTaskButton(),
    );
  }
}
```

---

## Screens To Build (Distribution Among Team)

### Auth Screens (P4 Forms + P3 UI)
- Splash screen with auto-login check
- Login screen
- Register screen
- Forgot password (optional)

### Projects Screens (P5 Logic + P3 UI)
- Projects list (grid/list view)
- Create project dialog/screen
- Project detail (tasks overview, members)
- Project settings
- Add member dialog

### Tasks Screens (P5 Logic + P3 UI + P4 Forms)
- Tasks list with filters and sorting
- Task detail with comments
- Create task screen/dialog
- Edit task screen
- Task filter bottom sheet

### Comments (P6 API + P3 UI)
- Comments list
- Add comment input
- Edit comment
- Delete confirmation

### Activity/Notifications (P6 API + P3 UI)
- Activity feed
- Notification list
- Mark as read

### Profile & Settings (P1 + P3)
- User profile screen
- Edit profile
- Settings (theme toggle, notifications)
- About screen

---

## Success Criteria Checklist

### Architecture
- [ ] Clean architecture (data, domain, presentation layers)
- [ ] Proper folder structure
- [ ] No business logic in widgets
- [ ] Dependency injection setup
- [ ] State management implemented

### Features Implemented
- [ ] Authentication (login/register/logout)
- [ ] Project CRUD operations
- [ ] Task CRUD with filtering
- [ ] Comments system
- [ ] Project member management
- [ ] Activity logging display
- [ ] Search functionality

### Technical Requirements
- [ ] State management (Riverpod or BLoC)
- [ ] Routing with guards
- [ ] Forms with validation
- [ ] API integration with error handling
- [ ] Local persistence (cache + secure storage)
- [ ] Responsive UI (mobile, tablet)
- [ ] Dark mode support
- [ ] Animations and transitions
- [ ] Pagination for lists
- [ ] Pull-to-refresh
- [ ] Loading states
- [ ] Error handling UI
- [ ] Empty states

### Code Quality
- [ ] No warnings or errors
- [ ] Consistent coding style
- [ ] Code documented
- [ ] Unit tests for use cases
- [ ] Widget tests for key widgets
- [ ] Integration tests for flows

### Performance
- [ ] Smooth scrolling (60fps)
- [ ] Fast startup time
- [ ] Efficient image loading
- [ ] No memory leaks
- [ ] Optimized builds (const constructors)
- [ ] Lazy loading where needed

### Platform Support
- [ ] Android (test on multiple screen sizes)
- [ ] iOS (test on multiple devices)
- [ ] Responsive for tablets
- [ ] Web (optional, if time permits)

---

## Dependencies Between Team Members

```
P1 (Architecture) → DI, Network, State Management
   ↓
P5 (Use Cases), P6 (API Services)
   ↓
P2 (Routing), P3 (Widgets), P4 (Forms)
   ↓
All team members build screens
```

**Critical Path:**
1. P1 sets up architecture and DI (Day 1-2)
2. P5 creates domain layer and use cases (Day 1-3)
3. P6 implements API services (Day 1-3)
4. P2, P3, P4 create navigation, widgets, forms (Day 2-4)
5. All build screens together (Day 5-6)
6. Testing and polish (Day 7-8)

---

## Communication & Coordination

- **Daily standups** (15 minutes)
- **Code reviews** before merging
- **Shared component library** - document widgets in README
- **API mock data** - use for development before backend is ready
- **Git branching strategy** - feature branches, PR reviews
- **Documentation** - document custom widgets, state management patterns

---

## Testing Strategy

### Person 1 & Person 5 - Unit Tests
- Repository tests
- Use case tests
- State management tests

### Person 3 & Person 4 - Widget Tests
- Form validation tests
- Custom widget tests
- UI component tests

### Person 6 - Integration Tests
- Auth flow test
- Create project flow test
- Create task flow test
- Filter tasks flow test

---

## Notes
- Flutter DevTools for debugging and profiling
- Use Flutter Inspector for widget tree analysis
- Test on real devices, not just emulators
- Consider Material 3 design system
- Implement pull-to-refresh on lists
- Add shimmer loading for better UX
- Use Hero animations for smooth transitions
- Implement offline mode for better UX
