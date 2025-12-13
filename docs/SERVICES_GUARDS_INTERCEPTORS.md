# Services, Guards & Interceptors Quick Reference

## 🛡️ Interceptors

| Name        | Role                                                              |
| ----------- | ----------------------------------------------------------------- |
| **auth**    | Adds JWT token to all HTTP requests (skips /auth endpoints)       |
| **error**   | Handles HTTP errors (401→logout, 403→forbidden, 404/500→messages) |
| **loading** | Shows/hides loading spinner based on active requests              |
| **logging** | Logs HTTP requests/responses in console (dev mode)                |

## 🚪 Guards

| Name               | Role                                               |
| ------------------ | -------------------------------------------------- |
| **auth**           | Redirects to /auth/login if not authenticated      |
| **admin**          | Blocks non-admin users, redirects to /dashboard    |
| **project-member** | Verifies user is project member with required role |
| **can-deactivate** | Warns before leaving page with unsaved changes     |

## 🔧 API Services

| Service           | Purpose                                     |
| ----------------- | ------------------------------------------- |
| **auth**          | Login, register, logout, session management |
| **users**         | Profile, password, account management       |
| **projects**      | CRUD projects, manage members               |
| **tasks**         | CRUD tasks, assignments, move               |
| **activity**      | Activity logs & history                     |
| **comments**      | Task comments CRUD                          |
| **labels**        | Labels/tags, attach/detach                  |
| **subtasks**      | Checklist items, toggle complete            |
| **attachments**   | File metadata management                    |
| **notifications** | Notifications, unread count, mark read      |
| **search**        | Search tasks & comments                     |

## 🛠️ Utilities

| Service            | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| **base**           | Abstract class for API services (buildUrl, http) |
| **loading**        | Global loading state (used by interceptor)       |
| **feature-toggle** | Feature flags & environment config               |
| **logger**         | Centralized logging                              |

## 📐 Flow

```
Component → Service → BaseService → HttpClient
                                        ↓
                            [interceptors] → API
Guards → Route → Component
```
