import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ClientService } from '../../../../core/services/client.service';
import { Client } from '../../../../core/models/client.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Client</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="Client Name" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Industry</mat-label>
          <input matInput formControlName="industry" placeholder="Industry" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" placeholder="Email" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" placeholder="Phone" />
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>City</mat-label>
            <input matInput formControlName="city" placeholder="City" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Country</mat-label>
            <input matInput formControlName="country" placeholder="Country" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Website</mat-label>
          <input matInput formControlName="website" placeholder="Website URL" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Logo URL</mat-label>
          <input matInput formControlName="logoUrl" placeholder="Logo Image URL" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Address</mat-label>
          <textarea matInput formControlName="address" rows="3" placeholder="Address"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            placeholder="Description"
          ></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        Save
      </button>
    </mat-dialog-actions>
  `,
})
export class ClientFormComponent {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ClientFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Client | undefined,
  ) {
    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      industry: [data?.industry || ''],
      email: [data?.email || '', [Validators.email]],
      phone: [data?.phone || ''],
      city: [data?.city || ''],
      country: [data?.country || ''],
      website: [data?.website || ''],
      logoUrl: [data?.logoUrl || ''],
      address: [data?.address || ''],
      description: [data?.description || ''],
    });
  }

  save() {
    if (this.form.valid) {
      const clientData = this.form.value;
      if (this.data) {
        this.clientService.updateClient(this.data.id, clientData).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.clientService.createClient(clientData).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }
}
