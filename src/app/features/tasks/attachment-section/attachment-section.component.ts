import { Component, input, output, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Attachment } from '../../../core/models/task.model';

@Component({
  selector: 'app-attachment-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attachment-section.component.html',
  styleUrl: './attachment-section.component.css',
})
export class AttachmentSectionComponent {
  attachments = input.required<Attachment[]>();
  
  addAttachment = output<{ fileName: string; fileUrl: string; mimeType: string; fileSize: number }>();
  removeAttachment = output<string>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      // In production, upload to server/S3 and get URL
      const url = URL.createObjectURL(file);
      this.addAttachment.emit({
        fileName: file.name,
        fileUrl: url,
        mimeType: file.type,
        fileSize: file.size
      });
    });

    // Reset input
    input.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  isPdf(mimeType: string): boolean {
    return mimeType.includes('pdf');
  }

  downloadAttachment(attachment: Attachment) {
    window.open(attachment.fileUrl, '_blank');
  }
}
