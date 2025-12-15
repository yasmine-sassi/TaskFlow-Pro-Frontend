# TaskFlow Pro - Component-Based Team Division

**Team Size:** 6 People  
**Project:** Angular Frontend - TaskFlow Pro  
**Division Strategy:** Component-based (each person owns a feature module)  
**Timeline:** 4 days  
**Start Date:** December 15, 2025

---

## Overview

Instead of role-based division (routing, UI, services), we're using **component-based division** where each person owns a complete feature module including:
- Component creation & templates
- Styling (Tailwind CSS)
- Forms & validation
- Local state management (signals)
- API integration (using shared services)
- Child components & nested routing
- Testing their module

This allows parallel development with clear ownership and minimal blocking.

---

## Team Assignments

### **Person 1 - Tasks Module** 🎯
**Components:** Tasks List, Task Detail, Task Create/Edit, Comments Section  
**Current Status:** 20% (basic TasksComponent exists)  
**Priority:** HIGH

#### Responsibilities:
- **Task List Component**
  - Display all tasks with infinite scroll/pagination
  - Filters: by status, priority, assignee, due date
  - Search functionality
  - Sort options (by name, priority, due date, assignee)
  - Task cards with quick-actions (edit, delete, status change)
  - Responsive design (mobile-friendly)

- **Task Detail Page**
  - Full task information display
  - Description (rich text)
  - Assignees management
  - Due date picker
  - Priority selector
  - Status dropdown
  - Activity/timeline section
  - Related tasks section

- **Create/Edit Task Modal**
  - Form with validation (title required, min 3 chars)
  - Description editor
  - Project selector
  - Assignee multi-select
  - Priority & status selectors
  - Due date picker
  - Submit & cancel actions

- **Comments Section**
  - Comment list with user avatars
  - Comment creation form
  - Edit/delete own comments
  - Nested replies (optional)
  - Timestamp formatting
  - Real-time updates (via signals)

#### Files to Create:
```
src/app/features/tasks/
├── tasks.component.ts/html/css              (list)
├── task-detail/
│   ├── task-detail.component.ts/html/css    (detail page)
│   └── task-activity.component.ts/html/css  (timeline)
├── task-modal/
│   └── task-modal.component.ts/html/css     (create/edit)
├── comments/
│   └── comments.component.ts/html/css       (comments section)
└── models/
    └── task-form.model.ts                   (form types)
```

#### Dependencies:
- TaskService (from Person 6 / shared)
- Custom form validators
- PriorityColorPipe, StatusBadgePipe
- DateFormatPipe
- AuthService (current user for assignees)

#### Acceptance Criteria:
- ✅ All task CRUD operations working
- ✅ Filters & search functional
- ✅ Comments can be added/edited/deleted
- ✅ Responsive on mobile/tablet/desktop
- ✅ Form validation working
- ✅ Unit tests for components (80% coverage)

---

### **Person 2 - Projects Module** 📁
**Components:** Projects List, Project Create Modal, Project Settings  
**Current Status:** 30% (sidebar exists, main pages missing)  
**Priority:** HIGH

#### Responsibilities:
- **Projects List Component**
  - Display all projects in grid/list view (toggle)
  - Search projects by name
  - Filter by status (active, archived)
  - Sort options (by name, created date, last modified)
  - Project cards showing:
    - Project name & description
    - Member count
    - Task count
    - Last activity date
    - Quick actions (open, settings, delete)
  - Create project button
  - Empty state

- **Create Project Modal**
  - Form with validation
  - Project name (required, 3-50 chars)
  - Description (optional, rich text)
  - Color/icon selector
  - Initial members (multi-select)
  - Submit & cancel

- **Project Settings Page**
  - General settings (name, description, color, icon)
  - Visibility (private/public)
  - Archive/delete options
  - Linked services (optional)
  - Export/backup option

#### Files to Create:
```
src/app/features/projects/
├── projects/
│   └── projects.component.ts/html/css       (list)
├── project-modal/
│   └── project-modal.component.ts/html/css  (create)
├── project-settings/
│   └── project-settings.component.ts/html/css (settings)
└── models/
    └── project-form.model.ts
```

#### Dependencies:
- ProjectsService (already exists)
- AuthService
- Custom validators

#### Acceptance Criteria:
- ✅ Projects list with filters & search
- ✅ Create project working
- ✅ Settings page functional
- ✅ Edit project metadata
- ✅ Archive/delete projects
- ✅ Responsive design
- ✅ Unit tests (80% coverage)

---

### **Person 3 - Board Module** 🎨
**Components:** Kanban Board, Project Members, Activity Timeline  
**Current Status:** 20%  
**Priority:** HIGH

#### Responsibilities:
- **Kanban Board Component**
  - Display tasks in columns (To Do, In Progress, Review, Done)
  - Drag-drop tasks between columns (CDK drag-drop)
  - Column auto-scrolling when dragging
  - Create task from column header
  - Filter tasks (by assignee, priority)
  - Search tasks in board
  - Responsive (mobile: column slider instead of grid)

- **Task Cards on Board**
  - Task name & description preview
  - Priority badge (colored)
  - Status indicator
  - Assigned to avatars
  - Due date badge
  - Hover actions (quick edit, quick view)

- **Project Members Panel**
  - List members with roles
  - Add member button (modal)
  - Edit role dropdown
  - Remove member button
  - Member search

- **Activity Timeline**
  - Recent project activity
  - Who did what when
  - Activity filtering (all, tasks, comments, members)
  - Timestamps

#### Files to Create:
```
src/app/features/board/
├── board.component.ts/html/css              (main board)
├── board-card/
│   └── task-board-card.component.ts/html/css
├── members-panel/
│   └── members-panel.component.ts/html/css
├── activity-timeline/
│   └── activity-timeline.component.ts/html/css
└── models/
    └── board.model.ts
```

#### Dependencies:
- TaskService
- ProjectsService
- @angular/cdk/drag-drop
- PriorityColorPipe, StatusBadgePipe
- DateFormatPipe

#### Acceptance Criteria:
- ✅ Kanban board rendering with proper columns
- ✅ Drag-drop fully functional
- ✅ Members panel showing project team
- ✅ Activity timeline displaying recent changes
- ✅ Mobile responsive (column slider)
- ✅ Quick task edit from card
- ✅ Unit tests (80% coverage)

---

### **Person 4 - Admin Dashboard** ⚙️
**Components:** User Management, Activity Logs, System Settings  
**Current Status:** 10%  
**Priority:** MEDIUM

#### Responsibilities:
- **User Management**
  - List all users with pagination
  - User table columns: name, email, role, status, joined date
  - Search users
  - Edit user role (USER, ADMIN, MODERATOR)
  - Ban/unban users
  - Delete users (soft delete)
  - Bulk actions (select multiple users)

- **Activity Logs**
  - Display all system activities
  - Filter by: user, action type, date range
  - Search logs
  - Export logs (CSV)
  - Log details modal (show full details)

- **Admin Settings**
  - System notifications (enable/disable)
  - Email settings
  - API keys management
  - Backup & restore options
  - System logs viewer

#### Files to Create:
```
src/app/features/admin/
├── admin.component.ts/html/css
├── users/
│   └── user-management.component.ts/html/css
├── logs/
│   └── activity-logs.component.ts/html/css
├── settings/
│   └── admin-settings.component.ts/html/css
└── models/
    └── admin.model.ts
```

#### Dependencies:
- AdminService (needs creation)
- AuthService
- Custom pipes for status/roles

#### Acceptance Criteria:
- ✅ User CRUD operations
- ✅ Role management
- ✅ Activity logs with filtering
- ✅ Admin settings saved to backend
- ✅ Pagination on large datasets
- ✅ Unit tests (80% coverage)

---

### **Person 5 - Settings Page** ⚙️‍🧩
**Components:** User Profile, Preferences, Security, Notifications  
**Current Status:** 0%  
**Priority:** MEDIUM

#### Responsibilities:
- **User Profile**
  - Display current user info
  - Edit profile (name, email, avatar)
  - Avatar upload
  - Bio/description field
  - Show role & permissions

- **Preferences**
  - Theme selector (light/dark/system)
  - Language selector
  - Timezone selector
  - Date format preferences
  - Default project selector

- **Security Settings**
  - Change password form
  - Active sessions list
  - Logout from other sessions
  - Two-factor authentication setup
  - Connected devices

- **Notification Settings**
  - Email notifications (toggle by type)
  - In-app notifications (toggle by type)
  - Push notifications (if applicable)
  - Do Not Disturb hours
  - Notification digest frequency

#### Files to Create:
```
src/app/features/settings/
├── settings.component.ts/html/css           (main page)
├── profile/
│   └── profile.component.ts/html/css
├── preferences/
│   └── preferences.component.ts/html/css
├── security/
│   └── security.component.ts/html/css
├── notifications/
│   └── notifications.component.ts/html/css
└── models/
    └── settings.model.ts
```

#### Dependencies:
- AuthService (current user)
- SettingsService (needs creation)
- Form validators
- File upload service

#### Acceptance Criteria:
- ✅ Profile editing working
- ✅ Avatar upload functional
- ✅ Theme persistence
- ✅ Preferences saved to backend
- ✅ Security settings operational
- ✅ Notification preferences working
- ✅ Unit tests (80% coverage)

---

### **Person 6 - Search, Notifications & Shared Components** 🔍
**Components:** Global Search, Notifications Panel, Shared Utilities  
**Current Status:** 70% (some services exist, need more)  
**Priority:** HIGH (blocks everyone)

#### Responsibilities:
- **Global Search Component**
  - Search across all entities (tasks, projects, users)
  - Real-time search with debounce
  - Search results grouped by type
  - Navigate to result
  - Recent searches history
  - Search suggestions/autocomplete

- **Notifications Panel**
  - Display user notifications
  - Mark as read/unread
  - Delete notifications
  - Filter by type (task, project, comment, admin)
  - Real-time updates (via WebSocket/polling)
  - Notification sound/badge

- **Custom Pipes** (create these for other team members)
  - `priorityColor`: Returns Tailwind color class for priority level
  - `statusBadge`: Formats task status with styling
  - `dateFormat`: Format dates (relative: "2 hours ago" or absolute)
  - `roleDisplay`: Format user role for display
  - `initials`: Extract initials from name
  - `truncate`: Truncate long strings

- **Custom Directives** (create for other team members)
  - `appPermission`: Show/hide based on user role
  - `appTooltip`: Simple tooltip directive
  - `appHighlight`: Highlight search terms
  - `appDebounce`: Debounce click events
  - `appClickOutside`: Detect outside clicks

- **Shared UI Components** (reusable across app)
  - Modal/Dialog component
  - Toast/Snackbar notifications
  - Loading spinner/skeleton
  - Confirm dialog
  - Dropdown menu
  - Tabs component
  - Badge component
  - Avatar component

- **Enhanced Services**
  - TaskService (CRUD + list with filters)
  - CommentService (add, edit, delete comments)
  - ActivityService (track system activities)
  - NotificationService (manage notifications)
  - SearchService (global search)
  - SettingsService (user preferences)

- **Custom Form Validators**
  - `emailValidator`: Validate email format + check uniqueness
  - `passwordValidator`: Min length, complexity, special chars
  - `projectNameValidator`: Name length + uniqueness
  - `dateRangeValidator`: Validate start/end dates

#### Files to Create:
```
src/app/shared/
├── pipes/
│   ├── priority-color.pipe.ts                (exists)
│   ├── status-badge.pipe.ts
│   ├── date-format.pipe.ts
│   ├── role-display.pipe.ts
│   ├── initials.pipe.ts
│   └── truncate.pipe.ts
├── directives/
│   ├── permission.directive.ts
│   ├── tooltip.directive.ts
│   ├── highlight.directive.ts
│   ├── debounce.directive.ts
│   └── click-outside.directive.ts
├── components/
│   ├── modal/
│   │   └── modal.component.ts/html/css
│   ├── toast/
│   │   └── toast.component.ts/html/css
│   ├── spinner/
│   │   └── spinner.component.ts/html/css
│   ├── confirm-dialog/
│   │   └── confirm-dialog.component.ts/html/css
│   ├── dropdown/
│   │   └── dropdown.component.ts/html/css
│   ├── tabs/
│   │   └── tabs.component.ts/html/css
│   ├── badge/
│   │   └── badge.component.ts/html/css
│   └── avatar/
│       └── avatar.component.ts/html/css
├── search/
│   └── global-search.component.ts/html/css
└── notifications/
    └── notifications.component.ts/html/css

src/app/core/services/
├── task.service.ts                          (enhance existing)
├── comment.service.ts                       (new)
├── activity.service.ts                      (new)
├── notification.service.ts                  (new)
├── search.service.ts                        (new)
├── settings.service.ts                      (new)
└── validators/
    ├── email.validator.ts
    ├── password.validator.ts
    ├── project.validator.ts
    └── date-range.validator.ts
```

#### Dependencies:
- HttpClient (for API calls)
- Angular CDK (optional, for some components)
- RxJS (signals, observables)

#### Acceptance Criteria:
- ✅ Global search working across all entities
- ✅ Search with debounce (not overloading API)
- ✅ Notifications panel real-time updates
- ✅ All 6 pipes working correctly
- ✅ All 5 directives implemented
- ✅ All 8 shared UI components reusable
- ✅ All services with proper CRUD operations
- ✅ Form validators working
- ✅ 90% code coverage (utility code)

---

## Integration Points & Dependencies

### **Service Dependencies:**
```
Person 1 (Tasks) 
  ├─ TaskService (from Person 6)
  ├─ AuthService
  └─ Shared pipes/directives/components

Person 2 (Projects)
  ├─ ProjectsService (exists)
  ├─ AuthService
  └─ Shared pipes/directives/components

Person 3 (Board)
  ├─ TaskService
  ├─ ProjectsService
  ├─ ActivityService (from Person 6)
  └─ Shared pipes/directives/components

Person 4 (Admin)
  ├─ AdminService (new)
  ├─ AuthService
  └─ Shared pipes/components

Person 5 (Settings)
  ├─ SettingsService (from Person 6)
  ├─ AuthService
  └─ Shared pipes/components

Person 6 (Search/Notifications/Shared)
  ├─ ProjectsService
  ├─ TaskService
  └─ All services depend on this
```

### **Critical Path:**
1. **Person 6 START FIRST** - Creates shared services, pipes, directives, components
2. **Person 1, 2, 3, 4, 5** - Can start in parallel once Person 6 has initial services/utilities

### **Data Flow:**
```
Backend API
    ↓
Services (Person 6 + existing)
    ↓
Components (Person 1-5)
    ↓
Shared Pipes/Directives/Components (Person 6)
    ↓
User Interface
```

---

## Timeline & Milestones

| Day | Milestone | Owners |
|-----|-----------|--------|
| **Day 1** | Setup Person 6 services, pipes, basic shared components | Person 6 |
| **Day 2** | Develop core features (list, create, detail views) | Person 1-5 (parallel) |
| **Day 3** | Integrate services, add filtering/search, polish UI | Person 1-5 |
| **Day 4** | Testing, bug fixes, documentation, merge & deploy | Everyone |

---

## Git Workflow

- **Main branch:** production-ready code only
- **Dev branch:** integration branch for all features
- **Feature branches:** `feature/person-X-component-name`
  - Example: `feature/person-1-tasks-list`
  - Example: `feature/person-6-search-component`

---

## Acceptance & Code Review

Before merging to `dev`:
- ✅ Feature 80%+ code coverage
- ✅ No TypeScript errors
- ✅ Tailwind classes used consistently
- ✅ Responsive design tested
- ✅ Accessibility (ARIA labels, semantic HTML)
- ✅ Code reviewed by another team member
- ✅ No console errors/warnings

---

## Success Criteria (End of Day 4)

- ✅ All 6 modules developed & integrated
- ✅ All routes functional
- ✅ Search & notifications working
- ✅ Shared components reusable across app
- ✅ No broken features
- ✅ App deploys successfully
- ✅ Team documentation updated
- ✅ Ready for QA testing

---

## Notes

- **Coordination:** Daily standups (15 min) to sync progress
- **Blockers:** Report immediately to unblock others
- **Shared Code:** Person 6 is the keeper of shared utilities; notify them of new requirements
- **Testing:** Write tests as you go, not after
- **Styling:** Use Tailwind utility classes; avoid custom CSS where possible

Good luck! 🚀

