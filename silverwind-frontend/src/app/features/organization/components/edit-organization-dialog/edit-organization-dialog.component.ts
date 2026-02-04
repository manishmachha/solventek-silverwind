import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { OrganizationService } from '../../../../core/services/organization.service';
import { Organization } from '../../../../core/models/auth.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrganizationLogoComponent } from '../../../../shared/components/organization-logo/organization-logo.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-edit-organization-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    OrganizationLogoComponent,
  ],
  templateUrl: './edit-organization-dialog.component.html',
  styles: [
    `
      .dialog-container {
        max-height: 90vh;
        overflow-y: auto;
      }
    `,
  ],
})
export class EditOrganizationDialogComponent {
  form: FormGroup;
  logoFile: File | null = null;
  logoPreview = signal<string | null>(null);
  activeLogoUrl = computed(() => {
    const preview = this.logoPreview();
    if (preview) return preview;

    const org = this.data.org;
    if (!org.logoUrl) return null;

    if (org.logoUrl.startsWith('http') || org.logoUrl.startsWith('data:')) {
      return org.logoUrl;
    }

    // Construct full URL using environment
    const base = environment.apiUrl.endsWith('/')
      ? environment.apiUrl.slice(0, -1)
      : environment.apiUrl;

    // If it's just a filename/path, assume it needs the org endpoint structure or full base
    // Matches OrganizationLogoComponent logic:
    if (org.logoUrl.startsWith('/')) {
      return `${base}${org.logoUrl}`;
    }

    return `${base}/organizations/${org.id}/logo?v=${org.logoUrl}`;
  });
  isSubmitting = signal(false);

  constructor(
    private fb: FormBuilder,
    private orgService: OrganizationService,
    private dialogRef: MatDialogRef<EditOrganizationDialogComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { org: Organization },
  ) {
    const org = data.org;
    this.form = this.fb.group({
      name: [org.name, [Validators.required]],
      description: [org.description],
      website: [org.website],
      industry: [org.industry],
      employeeCount: [org.employeeCount],
      phone: [org.phone],

      // Address
      addressLine1: [org.addressLine1],
      addressLine2: [org.addressLine2],
      city: [org.city],
      state: [org.state],
      country: [org.country],
      postalCode: [org.postalCode],

      serviceOfferings: [org.serviceOfferings],

      // Contact Person
      contactPersonName: [org.contactPersonName],
      contactPersonEmail: [org.contactPersonEmail, [Validators.email]],
      contactPersonPhone: [org.contactPersonPhone],
      contactPersonDesignation: [org.contactPersonDesignation],
    });

    if (org.logoUrl) {
      // Don't set preview here, rely on OrganizationLogoComponent in template to show current logo
      // until user picks a new one.
      // Actually, if we want to show preview of NEW file, we use logoPreview.
      // Current logo is shown via data.org.logoUrl
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validation (Size < 2MB, Type Image)
      if (file.size > 2 * 1024 * 1024) {
        this.snackBar.open('Logo must be smaller than 2MB', 'Close', { duration: 3000 });
        return;
      }

      this.logoFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isSubmitting.set(true);
    const orgId = this.data.org.id;

    // 1. Update Details
    this.orgService.updateOrganization(orgId, this.form.value).subscribe({
      next: (updatedOrg) => {
        // 2. Upload Logo if selected
        if (this.logoFile) {
          this.orgService.uploadLogo(orgId, this.logoFile!).subscribe({
            next: (res) => {
              this.snackBar.open('Organization updated successfully', 'Close', { duration: 3000 });
              this.dialogRef.close(true);
            },
            error: (err) => {
              console.error(err);
              this.snackBar.open('Details updated but Logo upload failed', 'Close', {
                duration: 5000,
              });
              this.isSubmitting.set(false);
            },
          });
        } else {
          this.snackBar.open('Organization updated successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        }
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Failed to update organization', 'Close', { duration: 3000 });
        this.isSubmitting.set(false);
      },
    });
  }
}
