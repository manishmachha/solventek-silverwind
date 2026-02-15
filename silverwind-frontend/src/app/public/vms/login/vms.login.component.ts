import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vms-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './vms.login.component.html',
  styleUrl: './vms.login.component.css',
})
export class VMSLoginComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  isLoading = signal(false);
  error = signal<string | null>(null);
  hidePassword = signal(true);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.maxLength(100)]],
  });

  togglePasswordVisibility(event: Event) {
    event.preventDefault();
    this.hidePassword.update((value) => !value);
  }

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
