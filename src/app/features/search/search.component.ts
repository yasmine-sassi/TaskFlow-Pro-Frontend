import { 
  Component, 
  OnInit, 
  OnDestroy,
  signal,
  inject,
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { 
  debounceTime, 
  distinctUntilChanged, 
  switchMap, 
  takeUntil,
  tap,
  catchError,
  finalize
} from 'rxjs/operators';
import { of } from 'rxjs';
import { LucideIconComponent } from '../../shared/components/lucide-icon/lucide-icon.component';
import { SearchService, GlobalSearchResults } from '../../core/services/search.service';
import { LoggerService } from '../../core/services/logger.service';
import { Task } from '../../core/models/task.model';
import { Project } from '../../core/models/project.model';
import { Comment } from '../../core/models/task.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideIconComponent],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit, OnDestroy {
  private searchService = inject(SearchService);
  private router = inject(Router);
  private logger = inject(LoggerService);

  // Reactive Form Control for search input
  searchControl = new FormControl('');

  // Signals for state management
  isLoading = signal(false);
  error = signal<string | null>(null);
  hasSearched = signal(false);
  
  // Results signals
  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  comments = signal<Comment[]>([]);

  // Subject for cleanup
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.setupSearchSubscription();
    this.logger.info('Search page initialized');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscription(): void {
    this.searchControl.valueChanges
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.error.set(null);
        }),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.trim().length < 2) {
            this.clearResults();
            this.hasSearched.set(false);
            return of({
              tasks: [],
              projects: [],
              comments: [],
              loading: false,
              error: null,
            } as GlobalSearchResults);
          }

          this.hasSearched.set(true);
          this.logger.info('Performing search for: ' + query);
          
          return this.searchService.globalSearch(query, 20).pipe(
            catchError((error) => {
              this.logger.error('Search error: ' + error.message);
              this.error.set('Failed to search. Please try again.');
              return of({
                tasks: [],
                projects: [],
                comments: [],
                loading: false,
                error: 'Failed to search. Please try again.',
              } as GlobalSearchResults);
            })
          );
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((results: GlobalSearchResults) => {
        this.tasks.set(results.tasks);
        this.projects.set(results.projects);
        this.comments.set(results.comments);
        this.error.set(results.error);
        this.isLoading.set(false);
      });
  }

  private clearResults() {
    this.tasks.set([]);
    this.projects.set([]);
    this.comments.set([]);
  }

  navigateToTask(task: Task) {
    this.logger.info('Navigating to task: ' + task.id);
    this.router.navigate(['/tasks', task.id]);
  }

  navigateToProject(project: Project) {
    this.logger.info('Navigating to project: ' + project.id);
    this.router.navigate(['/projects', project.id]);
  }

  navigateToComment(comment: Comment) {
    this.logger.info('Navigating to comment: ' + comment.id);
    this.router.navigate(['/tasks', comment.taskId]);
  }

  get hasResults(): boolean {
    return this.tasks().length > 0 || this.projects().length > 0 || this.comments().length > 0;
  }

  get showEmptyState(): boolean {
    return !this.hasSearched() && !this.searchControl.value;
  }

  get showNoResults(): boolean {
    return this.hasSearched() && 
           !this.isLoading() && 
           !this.hasResults && 
           (this.searchControl.value?.length ?? 0) >= 2;
  }

  get totalResults(): number {
    return this.tasks().length + this.projects().length + this.comments().length;
  }
}
