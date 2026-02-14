import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="flex h-screen bg-linear-to-br from-gray-50 to-gray-100 text-gray-900">
      <!-- Mobile Backdrop -->
      <div
        *ngIf="sidebarOpen()"
        (click)="sidebarOpen.set(false)"
        class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
      ></div>

      <!-- Sidebar -->
      <aside
        [class.translate-x-0]="sidebarOpen()"
        [class.-translate-x-full]="!sidebarOpen()"
        class="fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 transform md:translate-x-0 transition-transform duration-300 ease-in-out"
      >
        <app-sidebar
          class="h-full flex flex-col glass md:bg-white md:backdrop-blur-0 border-r border-gray-200/50 shadow-xl md:shadow-sm"
          (menuItemClick)="sidebarOpen.set(false)"
        ></app-sidebar>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Header -->
        <app-header
          class="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm z-30 sticky top-0"
          (toggleSidebar)="sidebarOpen.set(!sidebarOpen())"
          [sidebarOpen]="sidebarOpen()"
        ></app-header>

        <!-- Content Area -->
        <main class="flex-1 overflow-y-auto">
          <div class="p-2 md:p-4 w-full h-full animate-fade-in-up">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  sidebarOpen = signal(false);
}
