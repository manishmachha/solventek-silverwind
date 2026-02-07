import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderService } from '../../../core/services/header.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { AttendanceService } from '../../attendance/services/attendance.service';
import { LeaveService } from '../../leave/services/leave.service';
import { ProjectService } from '../../../core/services/project.service';
import { TicketService } from '../../../core/services/ticket.service';
import { HolidayService } from '../../../core/services/holiday.service';
import { NotificationService } from '../../../core/services/notification.service';
import { forkJoin } from 'rxjs';
interface QuickLink {
  label: string;
  icon: string;
  link: string;
  bgStyle: string; // Changed from gradient class to inline style
  cardBg: string;
  description: string;
}

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Personal Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <!-- Attendance Status -->
        <div
          class="stat-card hover:-translate-y-1 transition-all duration-300 text-white"
          [style.background]="
            checkedIn()
              ? 'linear-gradient(to bottom right, #10b981, #059669)'
              : 'linear-gradient(to bottom right, #f59e0b, #d97706)'
          "
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-white/90">Today's Status</p>
              <p class="text-xl font-bold mt-1 text-white">
                {{ checkedIn() ? 'Checked In' : 'Not Checked In' }}
              </p>
              <p class="text-xs text-white/80 mt-1">
                {{ checkedIn() ? 'Since 9:15 AM' : 'Tap to check in' }}
              </p>
            </div>
            <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
              <i
                class="bi text-xl text-white"
                [class]="checkedIn() ? 'bi-check-circle-fill' : 'bi-clock-fill'"
              ></i>
            </div>
          </div>
        </div>

        <!-- Leave Balance -->
        <a
          routerLink="/my-leaves"
          class="stat-card hover:-translate-y-1 transition-all duration-300 cursor-pointer group text-white"
          style="background: linear-gradient(to bottom right, #3b82f6, #2563eb)"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-white/90">Leave Balance</p>
              <p class="text-2xl md:text-3xl font-bold text-white mt-1">{{ leaveBalance() }}</p>
              <p class="text-xs text-white/80 mt-1">days remaining</p>
            </div>
            <div
              class="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform"
            >
              <i class="bi bi-calendar-check text-xl text-white"></i>
            </div>
          </div>
        </a>

        <!-- Active Projects -->
        <a
          routerLink="/projects"
          class="stat-card hover:-translate-y-1 transition-all duration-300 cursor-pointer group text-white"
          style="background: linear-gradient(to bottom right, #a855f7, #9333ea)"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-white/90">My Projects</p>
              <p class="text-2xl md:text-3xl font-bold text-white mt-1">{{ projectCount() }}</p>
              <p class="text-xs text-white/80 mt-1">active assignments</p>
            </div>
            <div
              class="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform"
            >
              <i class="bi bi-kanban text-xl text-white"></i>
            </div>
          </div>
        </a>

        <!-- Open Tickets -->
        <a
          routerLink="/portal/tickets"
          class="stat-card hover:-translate-y-1 transition-all duration-300 cursor-pointer group text-white"
          style="background: linear-gradient(to bottom right, #f97316, #ea580c)"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-white/90">My Tickets</p>
              <p class="text-2xl md:text-3xl font-bold text-white mt-1">{{ openTickets() }}</p>
              <p class="text-xs text-white/80 mt-1">open tickets</p>
            </div>
            <div
              class="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 transition-transform"
            >
              <i class="bi bi-ticket-detailed text-xl text-white"></i>
            </div>
          </div>
        </a>
      </div>

      <!-- Quick Actions Grid -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <i class="bi bi-lightning-charge"></i>
          </div>
          Quick Actions
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            *ngFor="let action of quickActions"
            [routerLink]="action.link"
            class="p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group cursor-pointer"
            [style.background]="action.cardBg"
          >
            <div
              class="p-3 rounded-xl mb-3 w-fit group-hover:scale-110 transition-transform"
              [style.background]="action.bgStyle"
            >
              <i [class]="action.icon + ' text-xl text-white'"></i>
            </div>
            <h4 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {{ action.label }}
            </h4>
            <p class="text-xs text-gray-500 mt-1">{{ action.description }}</p>
          </a>
        </div>
      </div>

      <!-- Upcoming Holidays -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <div class="p-2 rounded-lg bg-amber-50 text-amber-600">
            <i class="bi bi-calendar-event"></i>
          </div>
          Upcoming Holidays
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            *ngFor="let holiday of upcomingHolidays"
            class="flex items-center gap-4 p-4 rounded-xl"
            style="background: linear-gradient(to right, #fffbeb, #fff7ed)"
          >
            <div class="text-center">
              <p class="text-2xl font-bold text-amber-600">{{ holiday.day }}</p>
              <p class="text-xs text-amber-700 uppercase">{{ holiday.month }}</p>
            </div>
            <div>
              <p class="font-semibold text-gray-900">{{ holiday.name }}</p>
              <p class="text-sm text-gray-500">{{ holiday.dayOfWeek }}</p>
            </div>
          </div>
        </div>
        <a
          routerLink="/holidays"
          class="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          View All Holidays <i class="bi bi-arrow-right"></i>
        </a>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <i class="bi bi-clock-history"></i>
          </div>
          Recent Activity
        </h3>
        <div class="space-y-4">
          <div
            *ngFor="let activity of recentActivities"
            class="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div class="p-2 rounded-lg" [class]="activity.iconBg">
              <i [class]="activity.icon + ' text-sm'" [class]="activity.iconColor"></i>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ activity.title }}</p>
              <p class="text-xs text-gray-500">{{ activity.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EmployeeDashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  headerService = inject(HeaderService);

  attendanceService = inject(AttendanceService);
  leaveService = inject(LeaveService);
  projectService = inject(ProjectService);
  ticketService = inject(TicketService);
  holidayService = inject(HolidayService);
  notificationService = inject(NotificationService);

  checkedIn = signal(false);
  leaveBalance = signal(0);
  projectCount = signal(0);
  openTickets = signal(0);

  quickActions: QuickLink[] = [
    {
      label: 'My Attendance',
      icon: 'bi bi-calendar-check',
      link: '/my-attendance',
      bgStyle: 'linear-gradient(to bottom right, #10b981, #059669)',
      cardBg: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)',
      description: 'View attendance records',
    },
    {
      label: 'Apply Leave',
      icon: 'bi bi-calendar-plus',
      link: '/my-leaves',
      bgStyle: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
      cardBg: 'linear-gradient(to bottom right, #eff6ff, #dbeafe)',
      description: 'Request time off',
    },
    {
      label: 'My Payslips',
      icon: 'bi bi-receipt',
      link: '/my-payslips',
      bgStyle: 'linear-gradient(to bottom right, #a855f7, #9333ea)',
      cardBg: 'linear-gradient(to bottom right, #faf5ff, #f3e8ff)',
      description: 'View salary slips',
    },
    {
      label: 'My Assets',
      icon: 'bi bi-laptop',
      link: '/my-assets',
      bgStyle: 'linear-gradient(to bottom right, #6366f1, #4f46e5)',
      cardBg: 'linear-gradient(to bottom right, #eef2ff, #e0e7ff)',
      description: 'Assigned equipment',
    },
    {
      label: 'Raise Ticket',
      icon: 'bi bi-ticket-detailed',
      link: '/portal/tickets',
      bgStyle: 'linear-gradient(to bottom right, #f97316, #ea580c)',
      cardBg: 'linear-gradient(to bottom right, #fff7ed, #ffedd5)',
      description: 'Submit a request',
    },
    {
      label: 'My Profile',
      icon: 'bi bi-person',
      link: '/profile',
      bgStyle: 'linear-gradient(to bottom right, #ec4899, #db2777)',
      cardBg: 'linear-gradient(to bottom right, #fdf2f8, #fce7f3)',
      description: 'View & edit profile',
    },
    {
      label: 'Organization',
      icon: 'bi bi-building',
      link: '/organization/my-organization',
      bgStyle: 'linear-gradient(to bottom right, #14b8a6, #0d9488)',
      cardBg: 'linear-gradient(to bottom right, #f0fdfa, #ccfbf1)',
      description: 'Company directory',
    },
    {
      label: 'Holidays',
      icon: 'bi bi-calendar-event',
      link: '/holidays',
      bgStyle: 'linear-gradient(to bottom right, #f59e0b, #d97706)',
      cardBg: 'linear-gradient(to bottom right, #fffbeb, #fef3c7)',
      description: 'View holiday list',
    },
  ];

  upcomingHolidays: any[] = [];
  recentActivities: any[] = [];

  ngOnInit() {
    this.headerService.setTitle(
      'My Dashboard',
      `Welcome, ${this.authStore.user()?.firstName}!`,
      'bi bi-grid',
    );
    this.loadData();
  }

  loadData() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    forkJoin({
      attendance: this.attendanceService.getMyAttendanceByRange(todayStr, todayStr), // Check today
      leaves: this.leaveService.getMyBalances(),
      projects: this.projectService.getProjects(),
      tickets: this.ticketService.getMyTickets(),
      holidays: this.holidayService.getHolidays(),
      notifications: this.notificationService.getNotifications(0, 5),
    }).subscribe({
      next: ({ attendance, leaves, projects, tickets, holidays, notifications }) => {
        // Attendance
        const todayRecord = attendance.find((a) => a.date === todayStr);
        this.checkedIn.set(!!todayRecord && !todayRecord.checkOutTime);

        // Leaves - Sum all balances
        const totalBalance = leaves.reduce((sum, l) => sum + l.remainingDays, 0);
        this.leaveBalance.set(totalBalance);

        // Projects
        this.projectCount.set(projects.length);

        // Tickets
        const open = tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
        this.openTickets.set(open);

        // Holidays
        this.upcomingHolidays = holidays
          .filter((h) => new Date(h.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3)
          .map((h) => ({
            day: new Date(h.date).getDate(),
            month: new Date(h.date).toLocaleString('default', { month: 'short' }),
            name: h.name,
            dayOfWeek: new Date(h.date).toLocaleString('default', { weekday: 'long' }),
          }));

        // Recent Activities (Mapped from Notifications)
        this.recentActivities = notifications.content.map((n) => {
          const { bg, text } = this.notificationService.getColorClass(n);
          return {
            title: n.title,
            time: this.notificationService.getRelativeTime(n.createdAt),
            icon: this.notificationService.getIconClass(n),
            iconBg: bg,
            iconColor: text,
          };
        });
      },
      error: (err) => console.error('Failed to load employee dashboard', err),
    });
  }
}
