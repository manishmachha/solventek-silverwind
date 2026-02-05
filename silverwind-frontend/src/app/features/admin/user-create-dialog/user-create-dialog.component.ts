import { Component, Inject, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RbacService } from '../../../core/services/rbac.service';
import { UserService } from '../../../core/services/user.service';
import { Role, User } from '../../../core/models/auth.model';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatSnackBarModule],
  templateUrl: './user-create-dialog.component.html',
  styleUrls: ['./user-create-dialog.component.css'],
})
export class UserCreateDialogComponent implements OnInit {
  private authStore = inject(AuthStore); // Inject AuthStore
  userForm: FormGroup;
  isEditMode = false;
  isSaving = false;
  rolesLoaded = false;

  // Multi-step
  steps = ['Account', 'Employment', 'Address', 'Other'];
  step = 0;

  availableRoles: Role[] = [];

  private readonly PHONE_REGEX = /^[+]?\d{10,15}$/;
  private readonly POSTAL_REGEX = /^[0-9A-Za-z\- ]{4,12}$/;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private rbacService: RbacService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<UserCreateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user?: User; restricted?: boolean } | null,
  ) {
    this.isEditMode = !!data?.user;

    this.userForm = this.fb.group({
      // Step 1: Account
      employeeCode: ['', [Validators.maxLength(30)]],
      username: ['', [Validators.maxLength(60)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      lastName: ['', [Validators.required, Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      phone: ['', [Validators.pattern(this.PHONE_REGEX)]],
      roleId: ['', [Validators.required]],

      // Step 2: Employment
      dateOfBirth: [''],
      gender: [null],
      profilePhotoUrl: ['', [Validators.maxLength(2048)]],
      dateOfJoining: [''],
      employmentStatus: ['ACTIVE'],
      department: ['', [Validators.maxLength(80)]],
      designation: ['', [Validators.maxLength(80)]],
      employmentType: ['FTE'],
      workLocation: ['', [Validators.maxLength(120)]],
      gradeLevel: ['', [Validators.maxLength(120)]],

      // Step 3: Address (matches backend Address.java)
      address: this.fb.group({
        street: ['', [Validators.maxLength(200)]],
        city: ['', [Validators.maxLength(80)]],
        state: ['', [Validators.maxLength(80)]],
        country: ['', [Validators.maxLength(80)]],
        zipCode: ['', [Validators.pattern(this.POSTAL_REGEX)]],
      }),

      // Step 4: Other
      // EmergencyContact matches backend EmergencyContact.java
      emergencyContact: this.fb.group({
        contactName: ['', [Validators.maxLength(120)]],
        relationship: ['', [Validators.maxLength(40)]],
        contactPhone: ['', [Validators.pattern(this.PHONE_REGEX)]],
        contactEmail: ['', [Validators.email]],
      }),
      // BankDetails matches backend BankDetails.java
      bankDetails: this.fb.group({
        bankName: ['', [Validators.maxLength(120)]],
        accountNumber: ['', [Validators.maxLength(30)]],
        ifscCode: ['', [Validators.maxLength(20)]],
        branchName: ['', [Validators.maxLength(80)]],
      }),
      taxIdPan: ['', [Validators.maxLength(20)]],
    });
  }

  ngOnInit() {
    // Load roles after component is initialized to avoid NG0100 error
    this.rbacService.getRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles;
        this.rolesLoaded = true;

        // If edit mode, patch values after roles are loaded
        if (this.isEditMode && this.data?.user) {
          this.patchValues(this.data.user);

          // Apply restrictions if needed
          if (this.data.restricted) {
            this.applyRestrictions();
          }
        }

        // Manually trigger change detection
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load roles:', err);
        this.rolesLoaded = true;
        this.cdr.detectChanges();
      },
    });
  }

  applyRestrictions() {
    // VENDOR users can edit everything (single user per org)
    if (this.authStore.userRole() === 'VENDOR') {
      return;
    }

    // Disable fields that regular users cannot edit
    const fieldsToDisable = [
      'employeeCode',
      'username',
      'email',
      'roleId', // Account
      'dateOfJoining',
      'employmentStatus',
      'department',
      'designation',
      'employmentType',
      'workLocation',
      'gradeLevel',
      'dateOfBirth', // Employment
      'taxIdPan', // Other
    ];

    // Also disable Bank Details? Usually users can edit bank details?
    // Let's assume yes, or maybe not. employee-profile didn't have it.
    // sticking to personal info only:

    fieldsToDisable.forEach((f) => this.userForm.get(f)?.disable());

    // Bank Details - Disable for now as employee-profile didn't expose it
    this.userForm.get('bankDetails')?.disable();
  }

  /**
   * Patch form values from User object returned by backend
   */
  patchValues(u: User) {
    // Format dates for HTML date inputs (YYYY-MM-DD)
    const formatDate = (dateStr?: string): string => {
      if (!dateStr) return '';
      try {
        // Already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        // Try to parse and format
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      } catch (e) {}
      return '';
    };

    this.userForm.patchValue({
      // Step 1: Account
      employeeCode: u.employeeCode || '',
      username: u.username || '',
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phone: u.phone || '',
      roleId: u.role?.id || '',

      // Step 2: Employment
      dateOfBirth: formatDate(u.dateOfBirth),
      gender: u.gender || null,
      profilePhotoUrl: u.profilePhotoUrl || '',
      dateOfJoining: formatDate(u.dateOfJoining),
      employmentStatus: u.employmentStatus || 'ACTIVE',
      department: u.department || '',
      designation: u.designation || '',
      employmentType: u.employmentType || 'FTE',
      workLocation: u.workLocation || '',
      gradeLevel: u.gradeLevel || '',

      // Step 3: Address
      address: {
        street: u.address?.street || '',
        city: u.address?.city || '',
        state: u.address?.state || '',
        country: u.address?.country || '',
        zipCode: u.address?.zipCode || '',
      },

      // Step 4: Other
      emergencyContact: {
        contactName: u.emergencyContact?.contactName || '',
        relationship: u.emergencyContact?.relationship || '',
        contactPhone: u.emergencyContact?.contactPhone || '',
        contactEmail: u.emergencyContact?.contactEmail || '',
      },
      bankDetails: {
        bankName: u.bankDetails?.bankName || '',
        accountNumber: u.bankDetails?.accountNumber || '',
        ifscCode: u.bankDetails?.ifscCode || '',
        branchName: u.bankDetails?.branchName || '',
      },
      taxIdPan: u.taxIdPan || '',
    });
  }

  /**
   * Build the payload matching backend CreateUserRequest DTO
   */
  buildPayload(): any {
    // Use getRawValue() to include disabled fields (crucial for update where we need all fields or need to preserve values)
    const formValue = this.userForm.getRawValue();

    // Helper to convert empty strings to null for dates
    const toDateOrNull = (val: string): string | null => {
      return val && val.trim() ? val : null;
    };

    // Helper to clean nested object - return null if all values are empty
    const cleanNestedObject = (obj: any): any | null => {
      if (!obj) return null;
      const hasValue = Object.values(obj).some((v) => v && String(v).trim());
      return hasValue ? obj : null;
    };

    return {
      // Account
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone || null,
      roleId: formValue.roleId || null,
      employeeCode: formValue.employeeCode || null,
      username: formValue.username || null,

      // Employment
      dateOfBirth: toDateOrNull(formValue.dateOfBirth),
      gender: formValue.gender || null,
      profilePhotoUrl: formValue.profilePhotoUrl || null,
      dateOfJoining: toDateOrNull(formValue.dateOfJoining),
      employmentStatus: formValue.employmentStatus || null,
      department: formValue.department || null,
      designation: formValue.designation || null,
      employmentType: formValue.employmentType || null,
      workLocation: formValue.workLocation || null,
      gradeLevel: formValue.gradeLevel || null,

      // Address (matches backend Address.java)
      address: cleanNestedObject(formValue.address),

      // EmergencyContact (matches backend EmergencyContact.java)
      emergencyContact: cleanNestedObject(formValue.emergencyContact),

      // BankDetails (matches backend BankDetails.java)
      bankDetails: cleanNestedObject(formValue.bankDetails),

      // Tax ID
      taxIdPan: formValue.taxIdPan || null,
    };
  }

  // Helper for template
  c(path: string): AbstractControl | null {
    return this.userForm.get(path);
  }

  goToStep(i: number) {
    if (i <= this.step) {
      this.step = i;
      return;
    }
    this.next();
  }

  back() {
    this.step = Math.max(0, this.step - 1);
  }

  next() {
    this.markStepTouched(this.step);
    if (this.stepInvalid(this.step)) return;
    this.step = Math.min(this.steps.length - 1, this.step + 1);
  }

  private stepInvalid(step: number): boolean {
    const controls = this.stepControlPaths(step);
    return controls.some((p) => this.userForm.get(p)?.invalid);
  }

  private markStepTouched(step: number) {
    const controls = this.stepControlPaths(step);
    controls.forEach((p) => {
      const ctrl = this.userForm.get(p);
      if (!ctrl) return;
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity({ onlySelf: true });
      if ((ctrl as any).controls) {
        Object.values((ctrl as any).controls).forEach((c: any) => {
          c.markAsTouched();
          c.updateValueAndValidity({ onlySelf: true });
        });
      }
    });
  }

  private stepControlPaths(step: number): string[] {
    switch (step) {
      case 0:
        return ['employeeCode', 'username', 'firstName', 'lastName', 'email', 'phone', 'roleId'];
      case 1:
        return [
          'dateOfBirth',
          'gender',
          'profilePhotoUrl',
          'dateOfJoining',
          'employmentStatus',
          'department',
          'designation',
          'employmentType',
          'workLocation',
          'gradeLevel',
        ];
      case 2:
        return ['address'];
      case 3:
        return ['emergencyContact', 'bankDetails', 'taxIdPan'];
      default:
        return [];
    }
  }

  getRoleName(roleId: string): string {
    return this.availableRoles.find((r) => r.id === roleId)?.name || roleId;
  }

  onSubmit() {
    this.userForm.markAllAsTouched();
    if (this.userForm.invalid) {
      for (let i = 0; i < this.steps.length; i++) {
        if (this.stepInvalid(i)) {
          this.step = i;
          break;
        }
      }
      return;
    }

    this.isSaving = true;
    const payload = this.buildPayload();

    console.log('Submitting payload:', JSON.stringify(payload, null, 2));

    const userId = this.data?.user?.id;
    const request$ =
      this.isEditMode && userId
        ? this.userService.updateUser(userId, payload)
        : this.userService.createUser(payload);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open(
          this.isEditMode ? 'User updated successfully' : 'User created successfully',
          'Close',
          { duration: 3000, panelClass: ['success-snackbar'] },
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving user:', err);
        const errorMsg = err?.error?.message || 'Error saving user. Please try again.';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      },
    });
  }
}
