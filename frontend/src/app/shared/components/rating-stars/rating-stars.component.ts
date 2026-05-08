import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="flex items-center gap-1">
      @for (star of stars; track $index) {
        <mat-icon class="text-sm" [class.text-yellow-400]="$index < note" [class.text-gray-300]="$index >= note">
          star
        </mat-icon>
      }
      @if (showCount && count !== undefined) {
        <span class="text-sm text-gray-500 ml-1">({{ count }})</span>
      }
    </div>
  `,
})
export class RatingStarsComponent {
  @Input() note = 0;
  @Input() count?: number;
  @Input() showCount = true;
  stars = [0, 1, 2, 3, 4];
}
