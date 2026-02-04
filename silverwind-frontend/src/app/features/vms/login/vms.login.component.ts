import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex">
      <!-- Left Side - Branding -->
      <div
        class="hidden lg:flex lg:w-1/2 bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden"
      >
        <!-- Decorative Elements -->
        <div
          class="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"
        ></div>
        <div
          class="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3"
        ></div>
        <div class="absolute top-1/4 right-1/4 w-40 h-40 bg-white/5 rounded-full"></div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div class="flex items-center gap-4 mb-8">
            <div
              class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center"
            >
              <i class="bi bi-wind text-3xl"></i>
            </div>
            <div>
              <h1 class="text-3xl font-bold">Silverwind</h1>
              <p class="text-white/70 text-sm">by Solventek</p>
            </div>
          </div>

          <h2 class="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            Vendor Management<br />Made Simple
          </h2>

          <p class="text-white/80 text-lg max-w-md leading-relaxed">
            Streamline your vendor relationships, manage candidates, and track applications all in
            one place.
          </p>

          <!-- Features -->
          <div class="mt-12 space-y-4">
            <div class="flex items-center gap-3 text-white/90">
              <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <i class="bi bi-check2"></i>
              </div>
              <span>End-to-end hiring workflow</span>
            </div>
            <div class="flex items-center gap-3 text-white/90">
              <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <i class="bi bi-check2"></i>
              </div>
              <span>Real-time application tracking</span>
            </div>
            <div class="flex items-center gap-3 text-white/90">
              <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <i class="bi bi-check2"></i>
              </div>
              <span>Multi-role collaboration</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Login Form -->
      <div class="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gray-50">
        <div class="w-full max-w-md">
          <!-- Mobile Logo -->
          <div class="lg:hidden text-center mb-8">
            <div
              class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-white mb-4"
            >
              <i class="bi bi-wind text-3xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Silverwind</h1>
            <p class="text-sm text-gray-500">by Solventek</p>
          </div>

          <!-- Form Card -->
          <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in-up">
            <div class="text-center mb-8">
              <h2 class="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p class="text-gray-500 mt-2">Sign in to your account to continue</p>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div class="relative">
                  <i
                    class="bi bi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  ></i>
                  <input
                    type="email"
                    formControlName="email"
                    class="input-modern pl-11"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div class="relative">
                  <i class="bi bi-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="password"
                    formControlName="password"
                    class="input-modern pl-11"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <!-- Error Message -->
              <div
                *ngIf="error()"
                class="p-4 rounded-xl bg-red-50 border border-red-100 animate-scale-in"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-red-100">
                    <i class="bi bi-exclamation-triangle text-red-600"></i>
                  </div>
                  <p class="text-sm font-medium text-red-600">{{ error() }}</p>
                </div>
              </div>

              <button
                type="submit"
                [disabled]="loginForm.invalid || isLoading()"
                class="w-full btn-primary py-3.5 rounded-xl font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span *ngIf="!isLoading()" class="flex items-center justify-center gap-2">
                  <i class="bi bi-box-arrow-in-right"></i>
                  Sign In
                </span>
                <span *ngIf="isLoading()" class="flex items-center justify-center gap-2">
                  <i class="bi bi-arrow-repeat animate-spin"></i>
                  Signing in...
                </span>
              </button>
            </form>

            <!-- Vendor Signup Link -->
            <div class="mt-8 pt-6 border-t border-gray-100 text-center">
              <p class="text-sm text-gray-500">
                New vendor?
                <a
                  routerLink="/vms/vendor-signup"
                  class="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Register your company
                </a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <p class="mt-8 text-center text-xs text-gray-400">
            &copy; 2026 Solventek Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
      .animate-spin {
        animation: spin 1s linear infinite;
      }
    `,
  ],
})
export class VMSLoginComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  isLoading = signal(false);
  error = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);
      const { email, password } = this.loginForm.value;

      this.authService.login({ email: email!, password: password! }).subscribe({
        next: (response: any) => {
          const orgType = response.user.orgType;
          const userRole = response.user.role;
          console.log('orgType', orgType);
          console.log('userRole', userRole);

          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isLoading.set(false);
          this.error.set('Invalid credentials. Please check your email and password.');
        },
      });
    }
  }
}
