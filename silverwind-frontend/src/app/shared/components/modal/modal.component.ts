import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isOpen"
      class="relative z-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <!-- Background backdrop -->
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        (click)="close()"
      ></div>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div
          class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        >
          <div
            class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-100"
          >
            <!-- Header -->
            <div
              class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50"
            >
              <h3 class="text-lg font-semibold leading-6 text-gray-900" id="modal-title">
                {{ title }}
              </h3>
              <button (click)="close()" class="text-gray-400 hover:text-gray-500 transition-colors">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-4">
              <ng-content></ng-content>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Input() title = '';

  close() {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }
}
