import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../../core/services/payroll.service';
import { Payroll, SalaryStructure } from '../../../core/models/payroll.model';
import { NetPayTrendChartComponent } from './net-pay-trend-chart.component';
import { SalaryBreakdownChartComponent } from './salary-breakdown-chart.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-my-payslips',
  standalone: true,
  imports: [CommonModule, FormsModule, NetPayTrendChartComponent, SalaryBreakdownChartComponent],
  templateUrl: './my-payslips.component.html',
})
export class MyPayslipsComponent implements OnInit {
  private payrollService = inject(PayrollService);
  private notificationService = inject(NotificationService);

  payslips = signal<Payroll[]>([]);
  unreadPayslipIds = new Set<string>();
  salaryStructure = signal<SalaryStructure | null>(null);
  isLoading = signal<boolean>(true);
  isDownloading: string | null = null;

  selectedYear = new Date().getFullYear();
  years: number[] = [];

  ngOnInit() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
    this.loadUnreadPayslipIds();
    this.loadPayslips();
    this.loadSalaryStructure();
  }

  loadUnreadPayslipIds() {
    this.notificationService.getUnreadEntityIds('PAYROLL').subscribe({
      next: (ids) => (this.unreadPayslipIds = new Set(ids)),
      error: () => (this.unreadPayslipIds = new Set()),
    });
  }

  hasNotification(payslipId: string): boolean {
    return this.unreadPayslipIds.has(payslipId);
  }

  loadPayslips() {
    this.isLoading.set(true);
    this.payrollService.getMyPayrollHistory(this.selectedYear).subscribe({
      next: (data) => {
        // Sort: notified first
        const sorted = [...data].sort((a, b) => {
          const aHasNotif = this.hasNotification(a.id) ? 1 : 0;
          const bHasNotif = this.hasNotification(b.id) ? 1 : 0;
          return bHasNotif - aHasNotif;
        });
        this.payslips.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payslips', err);
        this.isLoading.set(false);
      },
    });
  }

  loadSalaryStructure() {
    this.payrollService.getMySalaryStructure().subscribe({
      next: (data) => this.salaryStructure.set(data),
      error: (err) => console.error('Failed to load salary structure', err),
    });
  }

  downloadPayslip(payroll: Payroll) {
    this.isDownloading = payroll.id;
    this.payrollService.downloadPayslip(payroll.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payslip_${payroll.month}_${payroll.year}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading = null;
      },
      error: (err) => {
        console.error('Failed to download payslip', err);
        this.isDownloading = null;
      },
    });
  }

  getMonthName(month: number): string {
    const months = [
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
    return months[month - 1] || '';
  }
}
