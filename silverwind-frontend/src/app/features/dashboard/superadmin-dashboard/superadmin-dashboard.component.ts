import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderService } from '../../../core/services/header.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { DashboardService } from '../dashboard.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  bgStyle: string; // fallback for gradient issues
  trend?: string;
  trendUp?: boolean;
  link?: string;
}

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <a
          *ngFor="let stat of stats()"
          [routerLink]="stat.link"
          class="stat-card group hover:-translate-y-1 transition-all duration-300 cursor-pointer text-white"
          [style.background]="stat.bgStyle"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-white/90">{{ stat.label }}</p>
              <p class="text-2xl md:text-3xl font-bold text-white mt-1">
                {{ loading() ? '&#8212;' : stat.value }}
              </p>
              <p *ngIf="stat.trend" class="text-xs mt-2 font-medium" [class.text-white]="true">
                <i
                  class="bi"
                  [class.bi-arrow-up]="stat.trendUp"
                  [class.bi-arrow-down]="!stat.trendUp"
                ></i>
                {{ stat.trend }}
              </p>
            </div>
            <div
              class="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform"
            >
              <i [class]="stat.icon + ' text-xl text-white'"></i>
            </div>
          </div>
        </a>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Departments Chart -->
        <div
          class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[320px] hover:shadow-md transition-shadow"
        >
          <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <i class="bi bi-people"></i>
            </div>
            Employees by Department
          </h3>
          <div class="flex-1 relative min-w-0 min-h-0">
            <canvas
              baseChart
              [data]="deptChartData"
              [type]="'doughnut'"
              [options]="doughnutChartOptions"
              class="w-full h-full"
            ></canvas>
          </div>
        </div>

        <!-- Project Status Chart -->
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
              [data]="projectChartData"
              [type]="'pie'"
              [options]="pieChartOptions"
              class="w-full h-full"
            ></canvas>
          </div>
        </div>

        <!-- Application Pipeline -->
        <div
          class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[320px] hover:shadow-md transition-shadow"
        >
          <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <div class="p-2 rounded-lg bg-purple-50 text-purple-600">
              <i class="bi bi-funnel"></i>
            </div>
            Recruitment Pipeline
          </h3>
          <div class="flex-1 relative min-w-0 min-h-0">
            <canvas
              baseChart
              [data]="pipelineChartData"
              [type]="'bar'"
              [options]="barChartOptions"
              class="w-full h-full"
            ></canvas>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <a
          routerLink="/jobs/create"
          class="card-modern bg-white p-5 flex items-center gap-4 group cursor-pointer hover:border-indigo-100 hover:shadow-lg transition-all"
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
          <i
            class="bi bi-arrow-right ml-auto text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
          ></i>
        </a>

        <a
          routerLink="/admin/employees"
          class="card-modern bg-white p-5 flex items-center gap-4 group cursor-pointer hover:border-purple-100 hover:shadow-lg transition-all"
        >
          <div
            class="p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"
            style="background: linear-gradient(to bottom right, #a855f7, #9333ea)"
          >
            <i class="bi bi-people text-xl"></i>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Manage Employees
            </h3>
            <p class="text-sm text-gray-500">View & manage employees</p>
          </div>
          <i
            class="bi bi-arrow-right ml-auto text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
          ></i>
        </a>

        <a
          routerLink="/applications"
          class="card-modern bg-white p-5 flex items-center gap-4 group cursor-pointer hover:border-emerald-100 hover:shadow-lg transition-all"
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
            <p class="text-sm text-gray-500">Review recruitment pipeline</p>
          </div>
          <i
            class="bi bi-arrow-right ml-auto text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
          ></i>
        </a>
      </div>
    </div>
  `,
})
export class SuperadminDashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  headerService = inject(HeaderService);
  dashboardService = inject(DashboardService);

  loading = signal(true);
  stats = signal<StatCard[]>([
    {
      label: 'Active Jobs',
      value: 0,
      icon: 'bi bi-briefcase-fill',
      bgStyle: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
      link: '/jobs',
    },
    {
      label: 'Total Employees',
      value: 0,
      icon: 'bi bi-people-fill',
      bgStyle: 'linear-gradient(to bottom right, #a855f7, #9333ea)',
      link: '/admin/employees',
    },
    {
      label: 'Applications',
      value: 0,
      icon: 'bi bi-file-earmark-text-fill',
      bgStyle: 'linear-gradient(to bottom right, #10b981, #059669)',
      link: '/applications',
    },
    {
      label: 'Pending Approvals',
      value: 0,
      icon: 'bi bi-clock-fill',
      bgStyle: 'linear-gradient(to bottom right, #f97316, #ea580c)',
      link: '/applications',
    },
  ]);

  // Chart configurations
  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
  };

  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } },
  };

  deptChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  projectChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  pipelineChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Candidates', backgroundColor: '#6366f1' }],
  };

  ngOnInit() {
    this.headerService.setTitle(
      'SuperAdmin Dashboard',
      'Organization overview and management',
      'bi bi-speedometer2',
    );
    this.loadData();
  }

  loadData() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        // Update Stats Cards
        this.stats.update((stats) => [
          { ...stats[0], value: data.totalActiveJobs || 0 }, // Active Jobs
          { ...stats[1], value: data.totalEmployees || 0 }, // Total Employees
          { ...stats[2], value: data.totalApplications || 0 }, // Applications
          { ...stats[3], value: data.pendingApprovals || 0 }, // Pending Approvals
        ]);

        // Update charts with real data if available
        // Update charts
        this.deptChartData = {
          labels: data.employeesByDepartment.map((d) => d.label),
          datasets: [
            {
              data: data.employeesByDepartment.map((d) => d.value),
              backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
            },
          ],
        };

        this.projectChartData = {
          labels: data.projectsByStatus.map((d) => d.label),
          datasets: [
            {
              data: data.projectsByStatus.map((d) => d.value),
              backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#3b82f6', '#8b5cf6'],
            },
          ],
        };

        this.pipelineChartData = {
          labels: data.recruitmentPipeline ? data.recruitmentPipeline.map((d) => d.label) : [],
          datasets: [
            {
              data: data.recruitmentPipeline ? data.recruitmentPipeline.map((d) => d.value) : [],
              label: 'Candidates',
              backgroundColor: '#6366f1',
              borderRadius: 6,
            },
          ],
        };

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
