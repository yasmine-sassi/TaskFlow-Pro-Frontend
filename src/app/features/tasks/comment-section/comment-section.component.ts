import { Component, input, output, signal, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Comment } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-section.component.html',
  styleUrl: './comment-section.component.css',
})
export class CommentSectionComponent {
  comments = input.required<Comment[]>();
  availableUsers = input.required<User[]>();
  currentUserId = input.required<string>();

  addComment = output<{ content: string; mentions: string[] }>();

  @ViewChild('textareaRef') textareaRef!: ElementRef<HTMLTextAreaElement>;

  content = signal('');
  showMentions = signal(false);
  mentionSearch = signal('');
  cursorPosition = signal(0);

  filteredUsers = signal<User[]>([]);

  // Watch for content changes to update mentions
  constructor() {
    effect(() => {
      const content = this.content();
      const textarea = this.textareaRef?.nativeElement;
      if (!textarea) return;

      const position = textarea.selectionStart || 0;
      this.cursorPosition.set(position);

      // Check for @ mentions
      const textBeforeCursor = content.slice(0, position);
      const atIndex = textBeforeCursor.lastIndexOf('@');
      
      if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === ' ')) {
        const searchText = textBeforeCursor.slice(atIndex + 1);
        if (!searchText.includes(' ')) {
          this.mentionSearch.set(searchText);
          this.showMentions.set(true);
          this.filteredUsers.set(
            this.availableUsers().filter(u => 
              `${u.firstName.toLowerCase()} ${u.lastName.toLowerCase()}`.includes(searchText.toLowerCase()) ||
              u.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
              u.lastName.toLowerCase().includes(searchText.toLowerCase())
            )
          );
          return;
        }
      }
      this.showMentions.set(false);
    });
  }

  onContentChange(value: string) {
    this.content.set(value);
  }

  insertMention(user: User) {
    const currentContent = this.content();
    const position = this.cursorPosition();
    const textBeforeCursor = currentContent.slice(0, position);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = currentContent.slice(position);
    
    const newContent = textBeforeCursor.slice(0, atIndex) + `@${user.firstName} ${user.lastName} ` + textAfterCursor;
    this.content.set(newContent);
    this.showMentions.set(false);
    
    setTimeout(() => {
      if (this.textareaRef?.nativeElement) {
        this.textareaRef.nativeElement.focus();
        // Set cursor after the inserted mention
        const newPosition = textBeforeCursor.slice(0, atIndex).length + `@${user.firstName} ${user.lastName} `.length;
        this.textareaRef.nativeElement.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSubmit();
    }
  }

  handleSubmit() {
    if (!this.content().trim()) return;
    
    const mentions = this.extractMentions(this.content());
    this.addComment.emit({
      content: this.content().trim(),
      mentions
    });
    this.content.set('');
  }

  extractMentions(text: string): string[] {
    const mentionRegex = /@([A-Za-z]+\s[A-Za-z]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const [fullName, userName] = match;
      const [firstName, lastName] = userName.split(' ');
      const user = this.availableUsers().find(u => 
        u.firstName === firstName && u.lastName === lastName
      );
      if (user) {
        mentions.push(user.id);
      }
    }
    return mentions;
  }

  renderComment(text: string): string {
    // Escape HTML to prevent XSS
    let escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    // Replace mentions with highlighted spans
    return escapedText.replace(/@([A-Za-z]+\s[A-Za-z]+)/g, (match) => {
      const userName = match.slice(1); // Remove @
      const [firstName, lastName] = userName.split(' ');
      const user = this.availableUsers().find(u => 
        u.firstName === firstName && u.lastName === lastName
      );
      if (user) {
        return `<span class="text-primary font-medium">${match}</span>`;
      }
      return match;
    });
  }

  getAuthorName(userId: string): string {
    const user = this.availableUsers().find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  }

  getAuthorInitials(userId: string): string {
    const user = this.availableUsers().find(u => u.id === userId);
    if (!user) return 'UU';
    return (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
  }

  getFullName(userId: string): string {
    const user = this.availableUsers().find(u => u.id === userId);
    if (!user) return 'Unknown User';
    return `${user.firstName} ${user.lastName}`;
  }

  formatTime(date: string): string {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return 'recently';
    }
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserId();
  }
}