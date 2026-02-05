import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { LeaveType } from '../../models/leave.model';
import { HeaderService } from '../../../../core/services/header.service';

@Component({
  selector: 'app-leave-configuration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './leave-configuration.component.html',
})
export class LeaveConfigurationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private leaveService = inject(LeaveService);
  private dialogService = inject(DialogService);
  private headerService = inject(HeaderService);

  leaveTypes = signal<LeaveType[]>([]);
  showModal = signal<boolean>(false);
  submitting = signal<boolean>(false);

  leaveForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    description: ['', [Validators.maxLength(200)]],
    defaultDaysPerYear: [20, [Validators.required, Validators.min(0)]],
    carryForwardAllowed: [false],
    accrualFrequency: ['ANNUALLY', [Validators.required]],
    maxDaysPerMonth: [null, [Validators.min(0)]], // Optional
    maxConsecutiveDays: [null, [Validators.min(0)]], // Optional
    requiresApproval: [true],
  });

  ngOnInit() {
    this.headerService.setTitle(
      'Leave Configuration',
      'Configure leave types and policies',
      'bi bi-gear',
    );
    this.loadLeaveTypes();
  }

  loadLeaveTypes() {
    this.leaveService.getAllLeaveTypes().subscribe((data) => this.leaveTypes.set(data));
  }

  openModal() {
    this.leaveForm.reset({
      defaultDaysPerYear: 20,
      accrualFrequency: 'ANNUALLY',
      carryForwardAllowed: false,
      requiresApproval: true,
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.leaveForm.invalid) return;

    this.submitting.set(true);
    const formValue = this.leaveForm.value;

    // Construct DTO
    const leaveType: LeaveType = {
      name: formValue.name,
      description: formValue.description,
      defaultDaysPerYear: formValue.defaultDaysPerYear,
      carryForwardAllowed: formValue.carryForwardAllowed,
      isActive: true,
      accrualFrequency: formValue.accrualFrequency,
      maxDaysPerMonth: formValue.maxDaysPerMonth || null,
      maxConsecutiveDays: formValue.maxConsecutiveDays || null,
      requiresApproval: formValue.requiresApproval,
    };

    this.leaveService.createLeaveType(leaveType).subscribe({
      next: (newItem) => {
        this.leaveTypes.update((types) => [...types, newItem]);
        this.closeModal();
        this.submitting.set(false);
      },
      error: (err) => {
        console.error('Failed to create leave type', err);
        this.dialogService.open('Error', 'Failed to create leave type');
        this.submitting.set(false);
      },
    });
  }

  deleteType(id: string) {
    if (!confirm('Are you sure you want to delete this leave policy?')) return;

    this.leaveService.deleteLeaveType(id).subscribe({
      next: () => {
        this.leaveTypes.update((types) => types.filter((t) => t.id !== id));
      },
      error: () => this.dialogService.open('Error', 'Failed to delete leave type'),
    });
  }
}
