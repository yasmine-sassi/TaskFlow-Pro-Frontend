import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsService } from '../../../core/services/projects.service';
import { Project, ProjectMember } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Input() canEdit = false;
  @Input() isAdmin = false;
  @Output() projectDeleted = new EventEmitter<string>();
  @Output() projectUpdated = new EventEmitter<Project>();
  @Output() selectProject = new EventEmitter<Project>();
  @Output() openEdit = new EventEmitter<Project>();
  @Output() archive = new EventEmitter<Project>();
  @Output() unarchive = new EventEmitter<Project>();

  private projectsService = inject(ProjectsService);

  getProjectColor(): string {
    return this.project.color || '#3B82F6';
  }

  getTaskCount(): number {
    return this.project.tasks?.length || 0;
  }

  getCompletedTaskCount(): number {
    return this.project.tasks?.filter((t) => t.status === 'DONE').length || 0;
  }

  getMemberCount(): number {
    return this.project.members?.length || 0;
  }

  getDisplayMembers(): ProjectMember[] {
    return this.project.members?.slice(0, 4) || [];
  }

  getRemainingMemberCount(): number {
    const total = this.getMemberCount();
    return total > 4 ? total - 4 : 0;
  }

  getInitials(email: string): string {
    return email?.charAt(0).toUpperCase() || 'U';
  }

  getMemberInitials(member: ProjectMember): string {
    const u = member.user as any;

    if (!u) {
      // Check if user data is directly on the member object
      const firstName = (member as any).firstName || '';
      const lastName = (member as any).lastName || '';
      if (firstName || lastName) {
        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        return initials;
      }
      return 'U';
    }

    const first = (u.firstName || '').trim();
    const last = (u.lastName || '').trim();

    // Build initials from first and last name
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }

    // If only first name
    if (first) {
      return first.charAt(0).toUpperCase();
    }

    // If only last name
    if (last) {
      return last.charAt(0).toUpperCase();
    }

    // Fallback to email
    if (u.email) {
      return String(u.email).charAt(0).toUpperCase();
    }

    return 'U';
  }

  getMemberTitle(member: ProjectMember): string {
    const u = member.user as any;
    if (!u) return 'Member';
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return name || u.email || 'Member';
  }

  getProgressPercentage(): number {
    const total = this.getTaskCount();
    if (total === 0) return 0;
    return (this.getCompletedTaskCount() / total) * 100;
  }

  onSelectProject() {
    this.selectProject.emit(this.project);
  }

  onOpenEdit(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!this.canEdit) return;
    this.openEdit.emit(this.project);
  }

  onArchive(event: MouseEvent) {
    event.stopPropagation();
    this.archive.emit(this.project);
  }

  onUnarchive(event: MouseEvent) {
    event.stopPropagation();
    this.unarchive.emit(this.project);
  }

  onDelete(event: MouseEvent) {
    event.stopPropagation();
    if (!this.isAdmin) return;
    this.projectDeleted.emit(this.project.id);
  }
}
