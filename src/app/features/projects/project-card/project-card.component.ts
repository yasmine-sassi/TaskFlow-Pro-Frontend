import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsService } from '../../../core/services/projects.service';
import { Project, ProjectMember } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.css',
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Input() canEdit = false;
  @Input() isAdmin = false;
  @Output() projectDeleted = new EventEmitter<string>();
  @Output() projectUpdated = new EventEmitter<Project>();
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

  getProgressPercentage(): number {
    const total = this.getTaskCount();
    if (total === 0) return 0;
    return (this.getCompletedTaskCount() / total) * 100;
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
