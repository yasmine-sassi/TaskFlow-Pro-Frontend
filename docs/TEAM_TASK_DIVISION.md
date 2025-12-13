# TaskFlow Pro - Angular Development Task Division (6-Person Team)

**Project Timeline:** December 13, 2025 onwards  
**Framework:** Angular 21+ with Standalone Components  
**Backend:** NestJS + Prisma (running on http://localhost:3000)

---

## Team Structure & Responsibilities

### **Person 1: Architecture & Core Setup Lead**
**Focus:** Project structure, DI setup, interceptors, guards, core infrastructure

#### Phase 1: Architecture Foundation (Days 1-2)
- [ ] **Create core folder structure** (already started)
  - Finalize `/core` (guards, interceptors, models, services)
  - Create `/shared` (common components, directives, pipes)
  - Create `/features` (feature modules with routing)
  - Document folder organization in README

- [ ] **Setup HTTP Interceptors** (Chapter 13)
  - Auth Token Interceptor (inject token from cookies)
  - Error Handling Interceptor (401/403 handling, user logout)
  - Loading Indicator Interceptor (show/hide spinner)
  - Request/Response Logging Interceptor (dev mode)

- [ ] **Create Route Guards** (Chapter 11)
  - `AuthGuard` - canActivate (redirect to login if not authenticated)
  - `AdminGuard` - canActivate (only ADMIN role)
  - `ProjectMemberGuard` - canActivate (user is project member)
  - `CanDeactivateGuard` - canDeactivate (warn unsaved changes)

- [ ] **Setup DI Configuration** (Chapter 9)
  - Create `InjectionToken` for API_URL configuration
  - Create `InjectionToken` for environment config
  - Setup provider in app.config.ts
  - Document DI patterns

- [ ] **Initialize Environment Configuration**
  - Development environment config
  - Production environment config
  - API URL configuration

#### Phase 2: Core Services (Days 3-4)
- [ ] **Implement Auth Service with Signals** (Chapter 10)
  - Connect to backend: POST /auth/login, POST /auth/register, GET /auth/me
  - currentUserSignal, isAuthenticatedSignal
  - Token management (retrieve from cookies)
  - Logout functionality

- [ ] **Implement base service patterns**
  - Create BaseService with common HTTP methods
  - Error handling patterns
  - Observable patterns for all services

---

### **Person 2: Routing & Navigation**
**Focus:** All routing setup, lazy loading, route resolution, navigation

#### Phase 1: Routing Structure (Days 1-2)
- [ ] **Setup main routing** (Chapter 11)
  - Create `/app.routes.ts` with all main routes
  - Routes: Auth (login, register), Projects, Tasks, Settings, Admin
  - Default redirect to projects (if authenticated)
  - Wildcard route (404)

- [ ] **Create route guards implementation** (work with Person 1)
  - Integrate AuthGuard on protected routes
  - Integrate AdminGuard on admin routes
  - Test guard functionality

- [ ] **Setup lazy loading** (Chapter 18)
  - Lazy load Auth feature: `loadComponent: () => import('./features/auth/...')`
  - Lazy load Projects feature
  - Lazy load Tasks feature
  - Lazy load Settings feature
  - Document lazy loading strategy

- [ ] **Create route resolvers** (Chapter 11)
  - ProjectResolver - fetch project data before route activation
  - UserResolver - fetch current user data
  - ProjectsResolver - fetch user's projects list

#### Phase 2: Navigation & Breadcrumbs (Days 3-4)
- [ ] **Create navigation service**
  - Track current route with signal
  - Provide breadcrumb generation
  - Navigation history management

- [ ] **Create breadcrumb component**
  - Display current navigation path
  - Clickable breadcrumbs for navigation
  - Integration with router

- [ ] **Create sidenav component**
  - Project list navigation
  - Settings link
  - Logout button
  - Mobile responsive (toggle)

- [ ] **Test all routing scenarios**
  - Protected route access
  - Lazy loading verification
  - Route parameter passing
  - Guard redirects

---

### **Person 3: Components & Directives**
**Focus:** Component architecture, custom directives, component communication

#### Phase 1: Structural Directives & Components (Days 1-2)
- [ ] **Create custom structural directives** (Chapter 7)
  - `*appHasRole` directive - show element if user has role
  - `*appHasPermission` directive - show element if user has project permission
  - `*appIsMember` directive - show element if user is project member

- [ ] **Create custom attribute directives** (Chapter 7)
  - `appHighlight` directive - highlight on hover with color
  - `appTooltip` directive - show tooltip on hover/focus
  - `appAppendIcon` directive - append icon to elements

- [ ] **Create Layout Components** (Chapter 6)
  - AppHeaderComponent (smart) - User menu, notification bell
  - AppSidenavComponent (smart) - Navigation, collapsible
  - AppFooterComponent (presentational) - Footer info
  - Test @Input/@Output with parent

- [ ] **Create Auth Components**
  - LoginComponent (smart with form)
  - RegisterComponent (smart with form)
  - ForgotPasswordComponent (if applicable)

#### Phase 2: Common Components (Days 3-4)
- [ ] **Create UI Components** (presentational with @Input/@Output)
  - ButtonComponent - with variants (primary, secondary, danger)
  - CardComponent - with content projection
  - ModalComponent - with close callback @Output
  - BadgeComponent - for status/priority display
  - TabsComponent - tabbed interface with @Output selection

- [ ] **Create Data Display Components**
  - LoadingSpinnerComponent - shown by interceptor
  - EmptyStateComponent - no data message
  - ErrorMessageComponent - error display with retry
  - PaginationComponent - with @Input page info, @Output page change

- [ ] **Implement Component Communication** (Chapter 6)
  - Parent-child via @Input/@Output examples
  - @ViewChild usage examples
  - @ContentChild for content projection
  - Service-based communication examples

- [ ] **Test component hierarchy**
  - Test @Input data flow
  - Test @Output event emission
  - Test content projection

---

### **Person 4: Forms & Validation**
**Focus:** Template-driven and reactive forms, custom validators

#### Phase 1: Template-Driven Forms (Days 1-2)
- [ ] **Create simple forms with ngModel** (Chapter 12)
  - User Profile Form (edit firstName, lastName, avatar)
  - Settings Form (preferences, theme selection)
  - Built-in validators: required, email, minlength, maxlength
  - Test form validity states

- [ ] **Create Custom Validators** (Chapter 12 & 17)
  - `passwordStrengthValidator` - check password complexity
  - `matchPasswordValidator` - confirm password match
  - `uniqueEmailValidator` - async validator for email uniqueness
  - `noSpacesValidator` - no leading/trailing spaces

#### Phase 2: Reactive Forms (Days 3-4)
- [ ] **Create complex reactive forms** (Chapter 12 & 17)
  - **Login Form**: email, password + validators
  - **Register Form**: email, firstName, lastName, password, confirmPassword + custom validators
  - **Create Project Form**: name, description, color, initial members
  - **Create Task Form**: title, description, status, priority, dueDate, assignees
  - **Task Filter Form**: status, priority, assignee (dropdown)

- [ ] **Implement Dynamic Form Controls** (Chapter 12)
  - FormArray for adding multiple assignees
  - FormArray for dynamic team members
  - Add/remove controls dynamically
  - Validation at FormArray level

- [ ] **Implement Cross-Field Validation** (Chapter 17)
  - Password confirmation match validation
  - Date range validation (start < end)
  - Dependent field validation

- [ ] **Form Value Changes & Status** (Chapter 12)
  - Subscribe to valueChanges (use signals or takeUntilDestroyed)
  - Subscribe to statusChanges
  - Real-time form validation feedback
  - Debounce async validators

- [ ] **Test all form scenarios**
  - Form validation states
  - Error messages display
  - Submit handling
  - Form reset

---

### **Person 5: State Management & Reactivity**
**Focus:** Signals, computed properties, effects, service state management

#### Phase 1: Signal-Based State (Days 1-2)
- [ ] **Create ProjectService with Signals** (Chapter 10)
  - projectsSignal: writable signal for projects list
  - currentProjectSignal: writable signal for selected project
  - selectedProjectMembersSignal: for member management
  - loadProjects(): fetch and update signal
  - setCurrentProject(id): update signal
  - Create project, update, delete operations

- [ ] **Create TaskService with Signals** (Chapter 10)
  - tasksSignal: writable signal for tasks
  - filteredTasksSignal: computed from tasksSignal + filters
  - Create/update/delete task operations
  - Assign/unassign user operations

- [ ] **Create User/Team Service with Signals** (Chapter 10)
  - usersSignal: available users in project
  - Create computed for user-related queries

- [ ] **Implement Computed Signals** (Chapter 10)
  - `activeProjectsCount` = computed (count non-archived)
  - `tasksGroupedByStatus` = computed
  - `userTasksCount` = computed
  - `highPriorityTasks` = computed
  - `overdueTasks` = computed

#### Phase 2: Effects & Advanced Reactivity (Days 3-4)
- [ ] **Implement Effects** (Chapter 10)
  - Auto-save form changes every 5 seconds
  - Update title when project changes (effect)
  - Log state changes in development
  - Sync signals with localStorage (persist filter preferences)

- [ ] **Implement LinkedSignal** (Chapter 10)
  - Link currentProjectSignal to route params
  - Link selectedAssignees to task form
  - Demonstrate bidirectional signal relationships

- [ ] **Create computed filters** (Chapter 10)
  - Filter tasks by status (computed)
  - Filter tasks by priority (computed)
  - Filter tasks by assignee (computed)
  - Multi-filter combination

- [ ] **Implement cleanup with DestroyRef** (Chapter 10)
  - Replace OnDestroy with DestroyRef where possible
  - Cleanup effects properly
  - Remove manual unsubscriptions

- [ ] **Test all signal interactions**
  - Verify computed updates trigger
  - Verify effects run correctly
  - Test signal mutations

---

### **Person 6: HTTP, Pipes & Performance**
**Focus:** API integration, custom pipes, performance optimization

#### Phase 1: HTTP & RxJS Integration (Days 1-2)
- [ ] **Implement RxJS Patterns** (Chapter 14)
  - Observable creation: `of()`, `from()`, `interval()`, `timer()`
  - Transformation: `map()`, `switchMap()`, `mergeMap()`, `concatMap()`
  - Filtering: `filter()`, `debounceTime()`, `distinctUntilChanged()`
  - Combination: `combineLatest()`, `forkJoin()`, `merge()`
  - Error handling: `catchError()`, `retry()`
  - Unsubscribe: `takeUntilDestroyed()`, async pipe

- [ ] **Implement API Service Methods** (Chapter 13 + 14)
  - **ProjectService**: 
    - getProjects() with caching
    - getProject(id) with caching
    - createProject(), updateProject(), deleteProject()
    - getProjectMembers(), addMember(), removeMember()
  
  - **TaskService**:
    - getTasksByProject() with pagination
    - getTask(id)
    - createTask(), updateTask(), deleteTask()
    - filterTasks() with multiple filters
    - assignTask(), unassignTask()
  
  - **CommentService**:
    - getTaskComments() with pagination
    - createComment(), updateComment(), deleteComment()
  
  - **SearchService**:
    - searchTasks() with debounce
    - searchComments()

- [ ] **Implement Caching Strategy**
  - Cache project data
  - Cache user data
  - Invalidate cache on mutations
  - Use shareReplay() for expensive operations

- [ ] **Implement Resource API** (Chapter 15 - Angular 19+)
  - Replace some HTTP calls with `resource()`
  - Implement for: getProjects(), getTasks(), getProjectMembers()
  - Show loading/error states from resource

#### Phase 2: Custom Pipes & Performance (Days 3-4)
- [ ] **Create Custom Pure Pipes** (Chapter 8)
  - `initials` pipe - "John Doe" → "JD"
  - `truncate` pipe - truncate text with ellipsis
  - `timeAgo` pipe - "2 hours ago" from Date
  - `taskStatusLabel` pipe - TaskStatus enum to readable text
  - `priorityColor` pipe - priority to color class
  - `taskCount` pipe - format task count with pluralization

- [ ] **Create Custom Async Pipes** (Chapter 8)
  - `loading` pipe - show loading state from observable
  - Test async pipe with signals

- [ ] **Implement Pipe Chaining** (Chapter 8)
  - Chain multiple pipes in templates
  - Complex transformations: `| filter | map | sort | slice`
  - Document pipe usage

- [ ] **Performance Optimization** (Chapter 19)
  - Add `OnPush` change detection to all presentational components
  - Implement trackBy functions for @for loops with object ids
  - Use async pipe instead of manual subscriptions
  - Lazy load heavy features/modules
  - Check bundle sizes
  - Verify no memory leaks with DestroyRef

- [ ] **Performance Testing**
  - Lighthouse audits
  - Bundle analysis
  - Component render performance
  - Memory leak detection

---

## Cross-Cutting Concerns (All Team Members)

### Error Handling Strategy
- All team members implement error handling in their services
- Use consistent error types
- Error messages logged and displayed
- Implement retry logic for failed requests

### Testing Strategy
- Unit tests for services (use Jasmine/Karma)
- Component tests for presentational components
- Integration tests for smart components
- E2E tests for critical user flows (optional)

### Documentation
- Code comments for complex logic
- Component API documentation (@Input/@Output)
- Service method documentation
- Usage examples in components

### Styling
- Use Tailwind CSS (already configured)
- Consistent spacing, colors, typography
- Dark mode support
- Mobile responsive design

---

## Phase Timeline

### **Phase 1: Foundation (Days 1-2)** - Parallel Work
- **P1** → Architecture, DI, Interceptors, Guards
- **P2** → Main routing, lazy loading setup
- **P3** → Custom directives, layout components
- **P4** → Template-driven forms
- **P5** → Signal-based services
- **P6** → HTTP service patterns, RxJS operators

### **Phase 2: Feature Implementation (Days 3-4)** - Builds on Phase 1
- **P1** → Auth service completion, core services
- **P2** → Navigation components, breadcrumbs, resolvers
- **P3** → UI components, component communication
- **P4** → Reactive forms, custom validators
- **P5** → Computed signals, effects, LinkedSignal
- **P6** → Custom pipes, API service completion, Resource API

### **Phase 3: Integration & Polish (Days 5-6)** - All Together
- All team members integrate their parts
- Performance optimization
- Testing & bug fixes
- Documentation completion

### **Phase 4: Review & Deployment (Day 7)**
- Code review across features
- Final testing
- Bundle optimization
- Documentation finalization

---

## Feature Components To Build

### Auth Feature
- Login page
- Register page
- Password reset (optional)
- Auth interceptor (P1)

### Projects Feature
- Projects list view
- Create project modal/form (P4)
- Project detail view
- Project members management
- Project settings

### Tasks Feature
- Tasks list view with filters
- Create task form (P4)
- Task detail view
- Task editing
- Task comments
- Task attachments

### Search Feature
- Global search bar with debounce (P6)
- Search results page
- Recent searches

### Activity/Notifications
- Activity log view
- Notification bell
- Notification list

### Admin Dashboard (if time permits)
- User management
- System statistics
- Activity logs

---

## Success Criteria Checklist

### Architecture
- [ ] All standalone components (no NgModules)
- [ ] Proper folder structure
- [ ] Smart/presentational component separation
- [ ] No circular dependencies

### Features Implemented
- [ ] Authentication (login/register)
- [ ] Project CRUD
- [ ] Task CRUD with filtering
- [ ] Comments system
- [ ] Project member management
- [ ] Activity logging

### Technical Requirements Met
- [ ] Data binding: interpolation, property, event, 2-way
- [ ] Control flow: @if, @for, @switch with track
- [ ] 3+ custom directives
- [ ] 3+ custom pipes
- [ ] DI with InjectionTokens
- [ ] Signals, computed, effects, LinkedSignal
- [ ] Lazy loading working
- [ ] Multiple guards implemented
- [ ] HTTP interceptors working
- [ ] Forms: template-driven + reactive with custom validators
- [ ] RxJS patterns: map, switchMap, filter, combineLatest, catchError, etc.
- [ ] Resource API usage (if Angular 19+)
- [ ] Performance: OnPush, trackBy, async pipe, no memory leaks

### Code Quality
- [ ] TypeScript strict mode
- [ ] No console errors/warnings in dev
- [ ] Proper error handling throughout
- [ ] Code documented
- [ ] Consistent coding style

---

## Dependencies Between Team Members

```
P1 (Architecture) → Interceptors, Guards, DI
   ↓
P6 (HTTP), P2 (Routing), P5 (Services)
   ↓
P3 (Components), P4 (Forms), Others
```

**Critical Path:**
1. P1 sets up architecture (Day 1-2)
2. P2 sets up routing (Day 1-2)
3. P5 creates services with signals (Day 1-4)
4. P3, P4, P6 build on top (Day 3-6)

---

## Notes
- Coordinate with backend team on API endpoint changes
- Test API integration frequently
- Keep commit messages clear and descriptive
- Regular sync meetings (daily 15-min standup recommended)
- Use feature branches for each major feature
- Code review before merging to main
