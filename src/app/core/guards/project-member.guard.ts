import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectsService } from '../services/projects.service';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';
import { ProjectMemberRole } from '../models/project.model';

/**
 * Role hierarchy: OWNER > EDITOR > VIEWER
 */
const ROLE_HIERARCHY: Record<ProjectMemberRole, number> = {
  [ProjectMemberRole.OWNER]: 3,
  [ProjectMemberRole.EDITOR]: 2,
  [ProjectMemberRole.VIEWER]: 1,
};

/**
 * Check if userRole meets the minimum required role
 */
function hasMinimumRole(userRole: ProjectMemberRole, minRole: ProjectMemberRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

export interface ProjectMemberGuardConfig {
  minRole?: ProjectMemberRole;
}

/**
 * Guard factory that accepts role requirements
 */
export function projectMemberGuard(config: ProjectMemberGuardConfig = {}): CanActivateFn {
  return (route, state) => {
    const projectsService = inject(ProjectsService);
    const authService = inject(AuthService);
    const router = inject(Router);

    const projectId = route.paramMap.get('projectId');
    const user = authService.getCurrentUser();
    const minRole = config.minRole || ProjectMemberRole.VIEWER;

    if (!projectId) {
      console.error('No projectId in route params');
      router.navigate(['/projects']);
      return false;
    }

    // Admin has access to all projects
    if (user?.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user is a project member with sufficient role
    return projectsService.getProjectMembers(projectId).pipe(
      map((members) => {
        const member = members.find((m) => m.userId === user?.id);

        if (!member) {
          console.warn(`User is not a member of project ${projectId}`);
          router.navigate(['/projects'], {
            queryParams: { error: 'not-a-member' },
          });
          return false;
        }

        // Check if user has minimum required role
        if (!hasMinimumRole(member.role, minRole)) {
          console.warn(`User role ${member.role} is insufficient. Requires ${minRole}`);
          router.navigate(['/projects'], {
            queryParams: { error: 'insufficient-permissions' },
          });
          return false;
        }

        return true;
      }),
      catchError((error) => {
        console.error('Error checking project membership', error);
        router.navigate(['/projects']);
        return of(false);
      })
    );
  };
}
