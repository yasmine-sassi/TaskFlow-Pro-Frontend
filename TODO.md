Auth Guard
Role Guard

Components : Login Form , Task Card ,Task Column,Task Board ,Task Form,Task Detail
App Routes
Admin Routes (Lazy Loaded)
Components : Dashboard Layout,Dashboard Home
pipes : Priority Filter, Date Filter
directives : Urgent Highlight

task-management-app/
├── src/
│ ├── app/
│ │ ├── core/
│ │ │ ├── guards/
│ │ │ │ └── auth.guard.ts
│ │ │ │
│ │ │ ├── interceptors/
│ │ │ │ ├── auth.interceptor.ts
│ │ │ │ └── error.interceptor. ts
│ │ │ │
│ │ │ ├── services/
│ │ │ │ ├── auth.service.ts
│ │ │ │ ├── task. service.ts
│ │ │ │ ├── project.service.ts
│ │ │ │ ├── notification.service.ts
│ │ │ │ └── search.service.ts
│ │ │ │
│ │ │ └── models/
│ │ │ ├── user.model.ts
│ │ │ ├── task. model.ts
│ │ │ ├── project.model.ts
│ │ │ ├── notification.model. ts
│ │ │ └── common.model.ts # Pagination, etc.
│ │ │
│ │ ├── shared/
│ │ │ ├── components/
│ │ │ │ ├── user-avatar.component.ts
│ │ │ │ ├── loading-spinner.component.ts
│ │ │ │ ├── empty-state.component.ts
│ │ │ │ ├── confirm-dialog.component.ts
│ │ │ │ ├── notification-bell.component.ts
│ │ │ │ ├── pagination.component.ts
│ │ │ │ └── search-bar.component.ts
│ │ │ │
│ │ │ ├── directives/
│ │ │ │ ├── drag-drop.directive.ts
│ │ │ │ ├── priority-highlight.directive.ts
│ │ │ │ └── tooltip.directive.ts
│ │ │ │
│ │ │ └── pipes/
│ │ │ ├── time-ago.pipe.ts
│ │ │ ├── task-status.pipe.ts
│ │ │ ├── full-name.pipe.ts
│ │ │ └── file-size.pipe.ts
│ │ │
│ │ ├── pages/
│ │ │ ├── auth/
│ │ │ │ ├── login.component.ts
│ │ │ │ ├── register.component. ts
│ │ │ │ └── auth. routes.ts
│ │ │ │
│ │ │ ├── dashboard/
│ │ │ │ └── dashboard.component.ts
│ │ │ │
│ │ │ ├── projects/
│ │ │ │ ├── project-list.component.ts
│ │ │ │ ├── project-detail.component.ts
│ │ │ │ ├── project-form.component.ts
│ │ │ │ └── projects.routes.ts
│ │ │ │
│ │ │ ├── tasks/
│ │ │ │ ├── task-board.component.ts # Kanban view
│ │ │ │ ├── task-list.component.ts # List view
│ │ │ │ ├── task-detail.component.ts # Detail modal/page
│ │ │ │ ├── task-form. component.ts # Create/Edit
│ │ │ │ └── tasks.routes.ts
│ │ │ │
│ │ │ ├── search/
│ │ │ │ └── search-results.component.ts
│ │ │ │
│ │ │ ├── notifications/
│ │ │ │ └── notification-list.component.ts
│ │ │ │
│ │ │ └── settings/
│ │ │ └── settings.component.ts
│ │ │
│ │ ├── layout/
│ │ │ ├── header.component.ts
│ │ │ ├── sidebar.component.ts
│ │ │ └── main-layout.component.ts
│ │ │
│ │ ├── app.component.ts
│ │ ├── app.config.ts
│ │ └── app.routes.ts
│ │
│ ├── assets/
│ │ └── images/
│ │ └── logo.svg
│ │
│ ├── environments/
│ │ ├── environment.ts
│ │ └── environment.prod.ts
│ │
│ ├── styles/
│ │ ├── \_variables.scss
│ │ └── \_utilities.scss
│ │
│ ├── styles.scss
│ ├── index.html
│ └── main.ts
│
├── . gitignore
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
