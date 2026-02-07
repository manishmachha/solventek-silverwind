import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isOpen || loadingService.isLoading()"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-9999 flex items-center justify-center transition-opacity duration-300"
    >
      <div class="bg-white rounded-2xl p-8 flex flex-col items-center shadow-xl animate-fade-in-up">
        <div
          class="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"
        ></div>
        <div class="text-lg font-bold text-slate-900">{{ title }}</div>
        <p class="text-slate-500 text-sm mt-1">{{ message }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.3s ease-out forwards;
      }
    `,
  ],
})
export class LoadingModalComponent {
  loadingService = inject(LoadingService);

  @Input() isOpen = false;
  @Input() title = 'Loading...';
  @Input() message = 'Please wait while we process your request.';
}
