import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-upload-zone',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      class="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
      [class.border-blue-400]="isDragOver"
      [class.bg-blue-50]="isDragOver"
      [class.border-gray-300]="!isDragOver"
      (dragover)="onDragOver($event)"
      (dragleave)="isDragOver = false"
      (drop)="onDrop($event)"
      (click)="fileInput.click()">
      <mat-icon class="text-4xl text-gray-400 mb-3">cloud_upload</mat-icon>
      <p class="text-gray-600 font-medium">Glissez vos photos ici</p>
      <p class="text-gray-400 text-sm mt-1">ou cliquez pour sélectionner ({{ accept }})</p>
      @if (files.length > 0) {
        <div class="flex flex-wrap gap-2 mt-4 justify-center">
          @for (file of files; track file.name) {
            <div class="relative">
              <img [src]="getPreview(file)" alt="" class="w-20 h-20 object-cover rounded-lg">
              <button (click)="removeFile(file, $event)"
                      class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                ×
              </button>
            </div>
          }
        </div>
      }
      <input #fileInput type="file" [accept]="accept" [multiple]="multiple" class="hidden"
             (change)="onFileSelect($event)">
    </div>
  `,
})
export class UploadZoneComponent {
  @Input() accept = 'image/*';
  @Input() multiple = true;
  @Output() filesSelected = new EventEmitter<File[]>();

  isDragOver = false;
  files: File[] = [];

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = true;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
    const dropped = Array.from(e.dataTransfer?.files || []);
    this.addFiles(dropped);
  }

  onFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    const selected = Array.from(input.files || []);
    this.addFiles(selected);
  }

  removeFile(file: File, e: Event): void {
    e.stopPropagation();
    this.files = this.files.filter(f => f !== file);
    this.filesSelected.emit(this.files);
  }

  getPreview(file: File): string {
    return URL.createObjectURL(file);
  }

  private addFiles(newFiles: File[]): void {
    this.files = this.multiple ? [...this.files, ...newFiles] : newFiles;
    this.filesSelected.emit(this.files);
  }
}
