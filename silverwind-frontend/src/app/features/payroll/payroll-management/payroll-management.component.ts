import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../../core/services/payroll.service';
import { DialogService } from '../../../core/services/dialog.service';
import { UserService } from '../../../core/services/user.service';
import { Payroll, SalaryStructure } from '../../../core/models/payroll.model';
import { User } from '../../../core/models/auth.model';
import { NotificationService } from '../../../core/services/notification.service';
import { HeaderService } from '../../../core/services/header.service';
import { StructureModalComponent } from '../components/structure-modal/structure-modal.component';

@Component({
  selector: 'app-payroll-management',
  standalone: true,
  imports: [CommonModule, FormsModule, StructureModalComponent],
  templateUrl: './payroll-management.component.html',
})
export class PayrollManagementComponent implements OnInit {
  private payrollService = inject(PayrollService);
  private dialogService = inject(DialogService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private headerService = inject(HeaderService);

  salaryStructures = signal<SalaryStructure[]>([]);
  payrolls = signal<Payroll[]>([]);
  unreadPayrollIds = new Set<string>();
  isLoadingStructures = signal<boolean>(true);
  isLoadingPayrolls = signal<boolean>(false);

  activeTab: 'structures' | 'payrolls' = 'structures';

  months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  years: number[] = [];
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  // Modal
  showStructureModal = false;
  isEditingStructure = false;
  users: User[] = [];

  structureForm: any = {};

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 3; i--) {
      this.years.push(i);
    }
    this.headerService.setTitle(
      'Payroll Management',
      'Manage salary structures and generate payrolls',
      'bi bi-wallet2',
    );
    this.loadUnreadPayrollIds();
    this.loadSalaryStructures();
    this.loadUsers();
  }

  loadUnreadPayrollIds() {
    this.notificationService.getUnreadEntityIds('PAYROLL').subscribe({
      next: (ids) => (this.unreadPayrollIds = new Set(ids)),
      error: () => (this.unreadPayrollIds = new Set()),
    });
  }

  hasNotification(payrollId: string): boolean {
    return this.unreadPayrollIds.has(payrollId);
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users = res.content || [];
      },
      error: (err) => console.error('Failed to load users', err),
    });
  }

  loadSalaryStructures() {
    this.isLoadingStructures.set(true);
    this.payrollService.getAllSalaryStructures().subscribe({
      next: (data) => {
        this.salaryStructures.set(data);
        this.isLoadingStructures.set(false);
      },
      error: (err) => {
        console.error('Failed to load salary structures', err);
        this.isLoadingStructures.set(false);
      },
    });
  }

  loadPayrollHistory() {
    this.isLoadingPayrolls.set(true);
    this.activeTab = 'payrolls';
    this.payrollService.getPayrollHistory(this.selectedMonth, this.selectedYear).subscribe({
      next: (data) => {
        // Sort: notified first
        const sorted = [...data].sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          return bHasNotif - aHasNotif;
        });
        this.payrolls.set(sorted);
        this.isLoadingPayrolls.set(false);
      },
      error: (err) => {
        console.error('Failed to load payroll history', err);
        this.isLoadingPayrolls.set(false);
      },
    });
  }

  generatePayrollForUser(userId: string) {
    this.payrollService.generatePayroll(userId, this.selectedMonth, this.selectedYear).subscribe({
      next: (payroll) => {
        this.payrolls.update((list) => [...list, payroll]);
        this.activeTab = 'payrolls';
        this.loadPayrollHistory();
      },
      error: (err) => {
        console.error('Failed to generate payroll', err);
        this.dialogService.open('Error', err.error?.message || 'Failed to generate payroll');
      },
    });
  }

  markAsPaid(payroll: Payroll) {
    this.payrollService.markAsPaid(payroll.id).subscribe({
      next: (updated) => {
        this.payrolls.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
      },
      error: (err) => {
        console.error('Failed to mark as paid', err);
      },
    });
  }

  // Modal Methods
  openCreateStructureModal() {
    this.isEditingStructure = false;
    this.structureForm = null;
    this.showStructureModal = true;
  }

  openEditStructureModal(structure: SalaryStructure) {
    this.isEditingStructure = true;
    this.structureForm = {
      userId: structure.userId,
      userName: structure.userName,
      basic: structure.basic,
      da: structure.da,
      hra: structure.hra,
      medicalAllowance: structure.medicalAllowance,
      specialAllowance: structure.specialAllowance,
      lta: structure.lta,
      communicationAllowance: structure.communicationAllowance,
      otherEarnings: structure.otherEarnings,
      epfDeduction: structure.epfDeduction,
    };
    this.showStructureModal = true;
  }

  closeStructureModal() {
    this.showStructureModal = false;
  }

  onStructureSaved() {
    this.closeStructureModal();
    this.loadSalaryStructures();
  }
}
