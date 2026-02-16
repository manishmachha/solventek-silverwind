import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ClientService } from '../../../../core/services/client.service';
import { Client } from '../../../../core/models/client.model';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule, // Kept for mat-dialog-close directive
  ],
  template: `
    <div class="flex flex-col h-full max-h-[90vh] bg-white rounded-xl overflow-hidden">
      <!-- Header -->
      <div
        class="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
      >
        <h2 class="text-xl font-bold text-gray-900 tracking-tight">
          {{ data ? 'Edit' : 'Add' }} Client
        </h2>
        <button
          type="button"
          mat-dialog-close
          class="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
        <form [formGroup]="form" class="space-y-5">
          <!-- Name -->
          <div class="space-y-1.5 group">
            <label class="text-sm font-semibold text-gray-700 block"
              >Client Name <span class="text-red-500">*</span></label
            >
            <input
              type="text"
              formControlName="name"
              placeholder="E.g. Acme Corp"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm placeholder:text-gray-400 bg-gray-50/30 focus:bg-white hover:border-gray-400"
            />
          </div>

          <!-- Industry -->
          <div class="space-y-1.5 group">
            <label class="text-sm font-semibold text-gray-700 block">Industry</label>
            <input
              type="text"
              formControlName="industry"
              placeholder="E.g. Technology"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm placeholder:text-gray-400 bg-gray-50/30 focus:bg-white hover:border-gray-400"
            />
          </div>

          <!-- Email & Phone Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-1.5 group">
              <label class="text-sm font-semibold text-gray-700 block">Email</label>
              <input
                type="email"
                formControlName="email"
                placeholder="contact@example.com"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm placeholder:text-gray-400 bg-gray-50/30 focus:bg-white hover:border-gray-400"
              />
            </div>
            <div class="space-y-1.5 group">
              <label class="text-sm font-semibold text-gray-700 block">Phone</label>
              <input
                type="tel"
                formControlName="phone"
                placeholder="+1 (555) 000-0000"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm placeholder:text-gray-400 bg-gray-50/30 focus:bg-white hover:border-gray-400"
              />
            </div>
          </div>

          <!-- Location Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-1.5 group">
              <label class="text-sm font-semibold text-gray-700 block">City</label>
              <input
                type="text"
                formControlName="city"
                placeholder="City"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm placeholder:text-gray-400 bg-gray-50/30 focus:bg-white hover:border-gray-400"
              />
            </div>
            <div class="space-y-1.5 group">
              <label class="text-sm font-semibold text-gray-700 block">Country</label>
              <input
                type="text"
                formControlName="country"
                placeholder="Country"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm placeholder:text-gray-400 bg-gray-50/30 focus:bg-white hover:border-gray-400"
              />
            </div>
          </div>

          <!-- Website -->
          <div class="space-y-1.5 group">
            <label class="text-sm font-semibold text-gray-700 block">Website</label>
            <input
              type="url"
              formControlName="website"
              placeholder="https://example.com"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm placeholder:text-gray-400 bg-gray-50/30 focus:bg-white hover:border-gray-400"
            />
          </div>

          <!-- Logo URL -->
          <div class="space-y-1.5 group">
            <label class="text-sm font-semibold text-gray-700 block">Logo URL</label>
            <input
              type="url"
              formControlName="logoUrl"
              placeholder="https://example.com/logo.png"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm placeholder:text-gray-400 bg-gray-50/30 focus:bg-white hover:border-gray-400"
            />
          </div>

          <!-- Address -->
          <div class="space-y-1.5 group">
            <label class="text-sm font-semibold text-gray-700 block">Address</label>
            <textarea
              formControlName="address"
              rows="3"
              placeholder="Full address"
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm placeholder:text-gray-400 bg-gray-50/30 focus:bg-white hover:border-gray-400 resize-none"
            ></textarea>
          </div>

          <!-- Description -->
          <div class="space-y-1.5 group">
            <label class="text-sm font-semibold text-gray-700 block">Description</label>
            <textarea
              formControlName="description"
              rows="3"
              placeholder="Brief description about the client..."
              class="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm placeholder:text-gray-400 bg-gray-50/30 focus:bg-white hover:border-gray-400 resize-none"
            ></textarea>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div
        class="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl"
      >
        <button
          type="button"
          mat-dialog-close
          class="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white hover:border-gray-400 hover:text-gray-900 transition-all text-sm bg-white shadow-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          (click)="save()"
          [disabled]="form.invalid"
          [class.opacity-50]="form.invalid"
          [class.cursor-not-allowed]="form.invalid"
          class="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center gap-2"
        >
          <span>{{ data ? 'Update' : 'Save' }} Client</span>
        </button>
      </div>
    </div>
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
