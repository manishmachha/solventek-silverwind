import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderService } from '../../../core/services/header.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { JobService } from '../../../core/services/job.service';
import { UserService } from '../../../core/services/user.service';
import { ApplicationService } from '../../../core/services/application.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { ProjectService } from '../../../core/services/project.service';
import { DashboardService } from '../dashboard.service';
import { forkJoin, Observable, of } from 'rxjs';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { JobApplication } from '../../../core/models/application.model';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  bgStyle: string; // Changed from gradient class to inline style
  trend?: string;
  trendUp?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, ReactiveFormsModule],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="space-y-6 md:space-y-8 animate-fade-in">
      <!-- Welcome Banner (Dynamic based on Org Type) -->
      <div
        class="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-xl"
        [style.background]="getBannerGradient()"
      >
        <div
          class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 transition-transform duration-700 hover:scale-110"
        ></div>
        <div
          class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 transition-transform duration-700 hover:scale-110"
        ></div>
        <div class="relative z-10">
          <p class="text-white/80 text-sm font-medium mb-1 tracking-wide uppercase">
            {{ getPortalTitle() }}
          </p>
          <h2 class="text-2xl md:text-3xl font-bold mb-2">
            Welcome back, {{ authStore.user()?.firstName }}! {{ getWelcomeEmoji() }}
          </h2>
          <p class="text-white/90 text-sm md:text-base max-w-xl">
            {{ getWelcomeMessage() }}
          </p>
        </div>
      </div>

      <ng-container *ngIf="isSolventek()">
        <!-- vendor stats grid  -->
        <div
          *ngIf="isAdmin()"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up"
          style="animation-delay: 100ms;"
        >
          <!-- Employees by Department -->
          <div
            class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[320px] hover:shadow-md transition-shadow"
          >
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <i class="bi bi-people"></i>
              </div>
              Departments
            </h3>
            <div class="flex-1 relative min-w-0 min-h-0">
              <canvas
                baseChart
                [data]="pieChartData"
                [type]="'pie'"
                [options]="pieChartOptions"
                class="w-full h-full"
              ></canvas>
            </div>
          </div>

          <!-- Project Status -->
          <div
            class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[320px] hover:shadow-md transition-shadow"
          >
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <i class="bi bi-kanban"></i>
              </div>
              Project Status
            </h3>
            <div class="flex-1 relative min-w-0 min-h-0">
              <canvas
                baseChart
                [data]="doughnutChartData"
                [type]="'doughnut'"
                [options]="doughnutChartOptions"
                class="w-full h-full"
              ></canvas>
            </div>
          </div>

          <!-- Employee Status -->
          <div
            class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[320px] hover:shadow-md transition-shadow"
          >
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <div class="p-2 rounded-lg bg-amber-50 text-amber-600">
                <i class="bi bi-person-check"></i>
              </div>
              Employee Status
            </h3>
            <div class="flex-1 relative min-w-0 min-h-0">
              <canvas
                baseChart
                [data]="polarAreaChartData"
                [type]="'polarArea'"
                [options]="polarChartOptions"
                class="w-full h-full"
              ></canvas>
            </div>
          </div>

          <!-- Assets by Type -->
          <div
            class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[320px] md:col-span-2 lg:col-span-2 hover:shadow-md transition-shadow"
          >
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <div class="p-2 rounded-lg bg-blue-50 text-blue-600">
                <i class="bi bi-laptop"></i>
              </div>
              Assets Distribution
            </h3>
            <div class="flex-1 relative min-w-0 min-h-0">
              <canvas
                baseChart
                [data]="barChartData"
                [type]="'bar'"
                [options]="barChartOptions"
                class="w-full h-full"
              ></canvas>
            </div>
          </div>

          <!-- Projects by Client -->
          <div
            class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[320px] hover:shadow-md transition-shadow"
          >
            <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <div class="p-2 rounded-lg bg-purple-50 text-purple-600">
                <i class="bi bi-building"></i>
              </div>
              Client Projects
            </h3>
            <div class="flex-1 relative min-w-0 min-h-0">
              <canvas
                baseChart
                [data]="clientBarChartData"
                [type]="'bar'"
                [options]="clientBarChartOptions"
                class="w-full h-full"
              ></canvas>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div
          class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up"
          [style.animation-delay]="isAdmin() ? '200ms' : '100ms'"
        >
          <div
            *ngFor="let stat of solventekStats(); let i = index"
            class="stat-card hover:-translate-y-1 transition-transform duration-300"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">{{ stat.label }}</p>
                <p class="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                  {{ loading() ? '—' : stat.value }}
                </p>
                <p
                  *ngIf="stat.trend"
                  class="text-xs mt-2 font-medium"
                  [class.text-green-600]="stat.trendUp"
                  [class.text-red-600]="!stat.trendUp"
                >
                  <i
                    class="bi"
                    [class.bi-arrow-up]="stat.trendUp"
                    [class.bi-arrow-down]="!stat.trendUp"
                  ></i>
                  {{ stat.trend }}
                </p>
              </div>
              <div
                class="p-3 rounded-xl shadow-lg shadow-indigo-100"
                [style.background]="stat.bgStyle"
              >
                <i [class]="stat.icon + ' text-xl text-white'"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up"
          [style.animation-delay]="isAdmin() ? '300ms' : '200ms'"
        >
          <a
            routerLink="/jobs/create"
            class="card-modern p-5 flex items-center gap-4 group cursor-pointer hover:border-indigo-100 hover:shadow-md transition-all"
          >
            <div
              class="p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"
              style="background: linear-gradient(to bottom right, #3b82f6, #2563eb)"
            >
              <i class="bi bi-plus-lg text-xl"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Create Job
              </h3>
              <p class="text-sm text-gray-500">Post a new job opening</p>
            </div>
          </a>

          <a
            routerLink="/admin/employees"
            class="card-modern p-5 flex items-center gap-4 group cursor-pointer hover:border-purple-100 hover:shadow-md transition-all"
          >
            <div
              class="p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"
              style="background: linear-gradient(to bottom right, #a855f7, #9333ea)"
            >
              <i class="bi bi-person-plus text-xl"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                View Employees
              </h3>
              <p class="text-sm text-gray-500">Browse talent pool</p>
            </div>
          </a>

          <a
            routerLink="/applications"
            class="card-modern p-5 flex items-center gap-4 group cursor-pointer hover:border-emerald-100 hover:shadow-md transition-all"
          >
            <div
              class="p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"
              style="background: linear-gradient(to bottom right, #10b981, #059669)"
            >
              <i class="bi bi-kanban text-xl"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Applications
              </h3>
              <p class="text-sm text-gray-500">Manage pipeline</p>
            </div>
          </a>
        </div>

        <!-- Recent Activity Section -->
        <div
          class="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up"
          [style.animation-delay]="isAdmin() ? '400ms' : '300ms'"
        >
          <!-- Recent Activity -->
          <div class="card-modern overflow-hidden">
            <div
              class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50"
            >
              <h3 class="text-lg font-bold text-gray-900">Recent Activity</h3>
              <button
                class="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
              >
                View All
              </button>
            </div>
            <div class="p-6">
              <div *ngIf="loadingActivity()" class="space-y-4">
                <div *ngFor="let _ of [1, 2, 3]" class="flex gap-4">
                  <div class="w-10 h-10 rounded-full skeleton"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 w-3/4 skeleton"></div>
                    <div class="h-3 w-1/2 skeleton"></div>
                  </div>
                </div>
              </div>

              <div
                *ngIf="!loadingActivity() && recentActivity().length === 0"
                class="text-center text-gray-500 py-8"
              >
                <i class="bi bi-activity text-4xl mb-3 block text-gray-300"></i>
                <p class="text-sm">No recent activity found</p>
              </div>

              <div *ngIf="!loadingActivity() && recentActivity().length > 0" class="space-y-6">
                <div *ngFor="let activity of recentActivity()" class="flex gap-4 relative">
                  <!-- Timeline Line -->
                  <div
                    class="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-gray-100 last:hidden"
                  ></div>

                  <div
                    class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 z-10 border-2 border-white ring-1 ring-gray-100"
                  >
                    <i class="bi bi-clock-history text-indigo-600"></i>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ activity.action }}</p>
                    <p class="text-xs text-gray-500 mt-0.5">{{ activity.message }}</p>
                    <p class="text-xs text-gray-400 mt-1">
                      {{ activity.createdAt | date: 'short' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pipeline Overview -->
          <div class="card-modern overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 class="text-lg font-bold text-gray-900">Pipeline Overview</h3>
            </div>
            <div class="p-6">
              <div *ngIf="loadingPipeline()" class="space-y-4">
                <div *ngFor="let _ of [1, 2, 3, 4]" class="h-8 skeleton rounded-full"></div>
              </div>
              <div *ngIf="!loadingPipeline()" class="space-y-4">
                <div *ngFor="let stage of pipelineStages()" class="relative">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">{{ stage.name }}</span>
                    <span class="text-sm font-bold" [style.color]="stage.color">{{
                      stage.count
                    }}</span>
                  </div>
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-1000 ease-out"
                      [style.width.%]="stage.percentage"
                      [style.background]="stage.color"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ================================================================================== -->
      <!-- VENDOR DASHBOARD VIEW -->
      <!-- ================================================================================== -->
      <ng-container *ngIf="isVendor()">
        <!-- Stats Grid -->
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in-up"
          style="animation-delay: 100ms;"
        >
          <!-- Published Jobs -->
          <div
            class="stat-card hover:-translate-y-1 transition-transform duration-300 text-white"
            style="background: linear-gradient(to bottom right, #10b981, #059669)"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-semibold text-white/90">Published Jobs</p>
                <p class="text-2xl md:text-3xl font-bold text-white mt-1">
                  {{ activeJobsCount() }}
                </p>
              </div>
              <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <i class="bi bi-briefcase-fill text-xl"></i>
              </div>
            </div>
          </div>

          <!-- My Candidates -->
          <div
            class="stat-card hover:-translate-y-1 transition-transform duration-300 text-white"
            style="background: linear-gradient(to bottom right, #3b82f6, #2563eb)"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-semibold text-white/90">My Candidates</p>
                <p class="text-2xl md:text-3xl font-bold text-white mt-1">
                  {{ candidatesCount() }}
                </p>
              </div>
              <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <i class="bi bi-people-fill text-xl"></i>
              </div>
            </div>
          </div>

          <!-- Submitted -->
          <div
            class="stat-card hover:-translate-y-1 transition-transform duration-300 text-white"
            style="background: linear-gradient(to bottom right, #a855f7, #9333ea)"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-semibold text-white/90">Submitted</p>
                <p class="text-2xl md:text-3xl font-bold text-white mt-1">
                  {{ applicationsCount() }}
                </p>
              </div>
              <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <i class="bi bi-send-fill text-xl"></i>
              </div>
            </div>
          </div>

          <!-- Shortlisted -->
          <div
            class="stat-card hover:-translate-y-1 transition-transform duration-300 text-white"
            style="background: linear-gradient(to bottom right, #f59e0b, #d97706)"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-semibold text-white/90">Shortlisted</p>
                <p class="text-2xl md:text-3xl font-bold text-white mt-1">
                  {{ shortlistedCount() }}
                </p>
              </div>
              <div class="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                <i class="bi bi-star-fill text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div
          class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-fade-in-up"
          style="animation-delay: 200ms;"
        >
          <a
            routerLink="/jobs"
            class="card-modern p-6 flex items-center gap-5 group cursor-pointer hover:border-indigo-100 hover:shadow-md transition-all"
          >
            <div
              class="p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"
              style="background: linear-gradient(to bottom right, #6366f1, #4f46e5)"
            >
              <i class="bi bi-search text-2xl"></i>
            </div>
            <div>
              <h3
                class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors"
              >
                Browse Jobs
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Find published job openings and apply with your candidates
              </p>
            </div>
            <i
              class="bi bi-arrow-right text-2xl text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all ml-auto"
            ></i>
          </a>

          <a
            routerLink="/candidates"
            class="card-modern p-6 flex items-center gap-5 group cursor-pointer hover:border-emerald-100 hover:shadow-md transition-all"
          >
            <div
              class="p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"
              style="background: linear-gradient(to bottom right, #10b981, #059669)"
            >
              <i class="bi bi-person-plus text-2xl"></i>
            </div>
            <div>
              <h3
                class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors"
              >
                Manage Candidates
              </h3>
              <p class="text-sm text-gray-500 mt-1">Add new candidates and update their profiles</p>
            </div>
            <i
              class="bi bi-arrow-right text-2xl text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all ml-auto"
            ></i>
          </a>
        </div>

        <!-- Recent Applications -->
        <div class="card-modern overflow-hidden animate-fade-in-up" style="animation-delay: 300ms;">
          <div
            class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50"
          >
            <h3 class="text-lg font-bold text-gray-900">Recent Applications</h3>
            <a
              routerLink="/track-applications"
              class="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
            >
              View All →
            </a>
          </div>
          <div class="p-6">
            <div *ngIf="loading(); else recentAppsList" class="space-y-4">
              <div *ngFor="let _ of [1, 2, 3]" class="flex gap-4">
                <div class="w-10 h-10 rounded-full skeleton"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 w-3/4 skeleton"></div>
                  <div class="h-3 w-1/2 skeleton"></div>
                </div>
              </div>
            </div>

            <ng-template #recentAppsList>
              <div *ngIf="vendorRecentApps().length === 0" class="text-center text-gray-500 py-8">
                <div
                  class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center"
                >
                  <i class="bi bi-file-earmark-text text-2xl text-gray-300"></i>
                </div>
                <p class="font-medium text-gray-600">No applications yet</p>
                <p class="text-sm mt-1 mb-4">Start by applying candidates to open jobs</p>
                <a
                  routerLink="/jobs"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <i class="bi bi-search"></i> Browse Jobs
                </a>
              </div>

              <div *ngIf="vendorRecentApps().length > 0" class="space-y-4">
                <div
                  *ngFor="let app of vendorRecentApps()"
                  class="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100 group"
                >
                  <div
                    class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0"
                  >
                    {{ app.firstName.charAt(0) }}{{ app.lastName.charAt(0) }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-gray-900 truncate">{{ app.job.title }}</h4>
                    <p class="text-sm text-gray-500 truncate">
                      {{ app.firstName }} {{ app.lastName }}
                    </p>
                  </div>
                  <div class="text-right shrink-0">
                    <span
                      class="px-2.5 py-1 text-xs font-bold rounded-lg"
                      [ngClass]="{
                        'bg-yellow-100 text-yellow-700': app.status === 'APPLIED',
                        'bg-blue-100 text-blue-700': [
                          'SCREENING',
                          'SHORTLISTED',
                          'INTERVIEW_SCHEDULED',
                        ].includes(app.status),
                        'bg-green-100 text-green-700': ['OFFERED', 'HIRED', 'ONBOARDED'].includes(
                          app.status
                        ),
                        'bg-red-100 text-red-700': ['REJECTED', 'DROPPED'].includes(app.status),
                      }"
                    >
                      {{ app.status | titlecase }}
                    </span>
                    <p class="text-[10px] text-gray-400 mt-1">
                      {{ app.createdAt | date: 'MMM d' }}
                    </p>
                  </div>
                </div>
              </div>
            </ng-template>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  headerService = inject(HeaderService);
  authStore = inject(AuthStore);
  fb = inject(FormBuilder);

  // Services
  jobService = inject(JobService);
  userService = inject(UserService);
  applicationService = inject(ApplicationService);
  auditLogService = inject(AuditLogService);
  projectService = inject(ProjectService);
  dashboardService = inject(DashboardService);

  // --- Common Logic ---
  loading = signal(true);

  // --- Solventek State ---
  loadingActivity = signal(true);
  loadingPipeline = signal(true);
  solventekStats = signal<StatCard[]>([
    {
      label: 'Active Jobs',
      value: 0,
      icon: 'bi bi-briefcase-fill',
      bgStyle: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
      trend: '+12% this week',
      trendUp: true,
    },
    {
      label: 'Total Candidates',
      value: 0,
      icon: 'bi bi-people-fill',
      bgStyle: 'linear-gradient(to bottom right, #a855f7, #9333ea)',
      trend: '+8% this week',
      trendUp: true,
    },
    {
      label: 'Total Applications',
      value: 0,
      icon: 'bi bi-file-earmark-text-fill',
      bgStyle: 'linear-gradient(to bottom right, #10b981, #059669)',
    },
    {
      label: 'Pending Approvals',
      value: 0,
      icon: 'bi bi-clock-fill',
      bgStyle: 'linear-gradient(to bottom right, #f97316, #ea580c)',
    },
  ]);
  pipelineStages = signal<any[]>([]);
  recentActivity = signal<any[]>([]);

  // Chart Data (Solventek Admin)
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
  };
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
      },
    ],
  };
  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
  };
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      { data: [], backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'] },
    ],
  };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } },
  };
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Assets', backgroundColor: '#3b82f6', borderRadius: 4 }],
  };
  public polarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
  };
  public polarAreaChartData: ChartData<'polarArea'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'] }],
  };
  public clientBarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: { x: { beginAtZero: true } },
    plugins: { legend: { display: false } },
  };
  public clientBarChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Projects', backgroundColor: '#8b5cf6', borderRadius: 4 }],
  };

  // --- Vendor State ---
  activeJobsCount = signal(0);
  applicationsCount = signal(0);
  shortlistedCount = signal(0);
  candidatesCount = signal(0);
  vendorRecentApps = signal<JobApplication[]>([]);

  // --- Client State ---
  activeProjectsCount = 0;
  clientApplications: JobApplication[] = [];
  totalCandidatesCount = signal(0);
  selectedApp: JobApplication | null = null;
  isApproving = false;
  decisionForm = this.fb.group({
    feedback: ['', Validators.required],
  });

  ngOnInit() {
    this.updateHeader();
    this.loadData();
  }

  updateHeader() {
    const orgType = this.authStore.user()?.orgType;
    let title = 'Dashboard';
    let subtitle = `Welcome back, ${this.authStore.user()?.firstName}`;
    let icon = 'bi bi-grid';

    if (orgType === 'VENDOR') {
      title = 'Vendor Portal';
      subtitle = 'Manage your talent submissions';
      icon = 'bi bi-shop';
    }

    this.headerService.setTitle(title, subtitle, icon);
  }

  loadData() {
    const orgType = this.authStore.user()?.orgType;
    if (orgType === 'SOLVENTEK') {
      this.loadSolventekData();
    } else if (orgType === 'VENDOR') {
      this.loadVendorData();
    }
  }

  // --- Helpers ---
  isSolventek() {
    return this.authStore.user()?.orgType === 'SOLVENTEK';
  }
  isVendor() {
    return this.authStore.user()?.orgType === 'VENDOR';
  }
  isAdmin() {
    return this.authStore.userRole() === 'SUPER_ADMIN' || this.authStore.userRole() === 'HR_ADMIN';
  }

  getBannerGradient(): string {
    if (this.isVendor()) return 'linear-gradient(to right, #059669, #0d9488, #06b6d4)';
    return 'linear-gradient(to right, #4f46e5, #9333ea, #ec4899)';
  }

  getPortalTitle(): string {
    if (this.isVendor()) return 'Vendor Portal';
    return 'Management System';
  }

  getWelcomeEmoji(): string {
    if (this.isVendor()) return '🚀';
    return '👋';
  }

  getWelcomeMessage(): string {
    if (this.isVendor())
      return 'Find opportunities and submit your best candidates for open positions.';
    return "Here's what's happening with your vendor management system today.";
  }

  // --- SOLVENTEK LOGIC ---
  loadSolventekData() {
    this.loading.set(true);
    // ... existing logic ...
    forkJoin({
      jobs: this.jobService.getJobs(0, 1),
      candidates: this.userService.getUsers(0, 1),
      applications: this.applicationService.getApplications(undefined, 0, 100),
      activity: this.auditLogService.getAuditLogs(0, 5),
      dashboardStats: this.isAdmin() ? this.dashboardService.getStats() : of(null),
    }).subscribe({
      next: (results) => {
        const currentStats = this.solventekStats();
        currentStats[0].value = results.jobs.totalElements;
        currentStats[1].value = results.candidates.totalElements;
        const apps = results.applications.content;
        currentStats[2].value = results.applications.totalElements;
        currentStats[3].value = apps.filter((a) => a.status === 'APPLIED').length;
        this.solventekStats.set([...currentStats]);
        this.loading.set(false);

        this.processPipeline(apps, results.applications.totalElements);
        this.loadingPipeline.set(false);
        this.recentActivity.set(results.activity.content);
        this.loadingActivity.set(false);

        if (results.dashboardStats) {
          this.updateCharts(results.dashboardStats);
        }
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.loading.set(false);
        this.loadingActivity.set(false);
        this.loadingPipeline.set(false);
      },
    });
  }

  processPipeline(applications: any[], total: number) {
    if (total === 0) {
      this.pipelineStages.set([{ name: 'Applied', count: 0, percentage: 0, color: '#6366f1' }]);
      return;
    }
    const applied = applications.filter((a) => ['APPLIED'].includes(a.status)).length;
    const screening = applications.filter((a) =>
      ['SCREENING', 'SHORTLISTED'].includes(a.status),
    ).length;
    const interview = applications.filter((a) =>
      ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED'].includes(a.status),
    ).length;
    const offer = applications.filter((a) =>
      ['OFFER_RELEASED', 'OFFER_ACCEPTED', 'HIRED'].includes(a.status),
    ).length;

    this.pipelineStages.set([
      {
        name: 'Applied/Pending',
        count: applied,
        percentage: (applied / total) * 100,
        color: '#6366f1',
      },
      {
        name: 'Screening',
        count: screening,
        percentage: (screening / total) * 100,
        color: '#8b5cf6',
      },
      {
        name: 'Interview',
        count: interview,
        percentage: (interview / total) * 100,
        color: '#a855f7',
      },
      { name: 'Offer/Hired', count: offer, percentage: (offer / total) * 100, color: '#10b981' },
    ]);
  }

  updateCharts(data: any) {
    this.pieChartData = {
      labels: data.employeesByDepartment.map((d: any) => d.label),
      datasets: [
        {
          data: data.employeesByDepartment.map((d: any) => d.value),
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        },
      ],
    };
    this.doughnutChartData = {
      labels: data.projectsByStatus.map((d: any) => d.label),
      datasets: [
        {
          data: data.projectsByStatus.map((d: any) => d.value),
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'],
        },
      ],
    };
    this.barChartData = {
      labels: data.assetsByType.map((d: any) => d.label),
      datasets: [
        {
          data: data.assetsByType.map((d: any) => d.value),
          label: 'Assets',
          backgroundColor: '#3b82f6',
          borderRadius: 4,
        },
      ],
    };
    this.polarAreaChartData = {
      labels: data.employeeStatusDistribution.map((d: any) => d.label),
      datasets: [
        {
          data: data.employeeStatusDistribution.map((d: any) => d.value),
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
        },
      ],
    };
    this.clientBarChartData = {
      labels: data.projectsByClient.map((d: any) => d.label),
      datasets: [
        {
          data: data.projectsByClient.map((d: any) => d.value),
          label: 'Projects',
          backgroundColor: '#8b5cf6',
          borderRadius: 4,
        },
      ],
    };
  }

  // --- VENDOR LOGIC ---
  loadVendorData() {
    this.loading.set(true);
    this.jobService.getJobs().subscribe((page) => this.activeJobsCount.set(page.totalElements));
    this.applicationService.getApplications(undefined, 0, 100, 'OUTBOUND').subscribe({
      next: (page: any) => {
        const apps = page.content;
        this.applicationsCount.set(page.totalElements);
        this.vendorRecentApps.set(apps.slice(0, 5));
        const shortlisted = apps.filter((a: any) =>
          ['SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(a.status),
        ).length;
        this.shortlistedCount.set(shortlisted);
        const uniqueCandidates = new Set(apps.map((a: any) => a.email)).size;
        this.candidatesCount.set(uniqueCandidates);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load vendor stats', err);
        this.loading.set(false);
      },
    });
  }

  // --- CLIENT LOGIC --- (Deprecated - CLIENT org type removed)
  loadClientData() {
    // No-op: CLIENT organization type has been removed
  }

  openDecisionModal(app: JobApplication, approve: boolean) {
    this.selectedApp = app;
    this.isApproving = approve;
    this.decisionForm.reset();
  }

  confirmDecision() {
    if (this.selectedApp && this.decisionForm.valid) {
      const feedback = this.decisionForm.value.feedback!;
      this.applicationService
        .makeClientDecision(this.selectedApp.id, this.isApproving, feedback)
        .subscribe(() => {
          this.selectedApp = null;
          this.loadClientData(); // Refresh
        });
    }
  }
}
