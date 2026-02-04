import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);

  isLoading = signal(false);
  error = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  hidePassword = signal(true);

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

  getError(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Invalid email address';
    }
    return '';
  }
}
