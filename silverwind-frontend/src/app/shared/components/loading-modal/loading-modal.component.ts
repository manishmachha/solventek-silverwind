import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isOpen"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-2xl p-8 flex flex-col items-center shadow-xl">
        <div
          class="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"
        ></div>
        <div class="text-lg font-bold text-gray-900">{{ title }}</div>
        <p class="text-gray-500" *ngIf="message">{{ message }}</p>
      </div>
    </div>
  `,
})
export class LoadingModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Loading...';
  @Input() message = '';
}
