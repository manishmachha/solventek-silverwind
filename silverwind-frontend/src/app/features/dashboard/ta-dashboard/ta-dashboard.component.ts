import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderService } from '../../../core/services/header.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { JobService } from '../../../core/services/job.service';
import { ApplicationService } from '../../../core/services/application.service';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin } from 'rxjs';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  bgStyle: string;
  link?: string;
}

@Component({
  selector: 'app-ta-dashboard',
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
            </div>
            <div
              class="p-3 rounded-xl bg-white/20 backdrop-blur-sm group-hover:scale-110 transition-transform"
            >
              <i [class]="stat.icon + ' text-xl text-white'"></i>
            </div>
          </div>
        </a>
      </div>

      <!-- Recruitment Funnel -->
      <div
        class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
      >
        <h3 class="font-bold text-gray-700 mb-6 flex items-center gap-2">
          <div class="p-2 rounded-lg bg-purple-50 text-purple-600">
            <i class="bi bi-funnel"></i>
          </div>
          Recruitment Funnel
        </h3>
        <div class="grid grid-cols-5 gap-4">
          <div *ngFor="let stage of funnelStages(); let i = index" class="relative">
            <div
              class="text-center p-4 rounded-xl transition-all hover:scale-105 cursor-pointer"
              [style.background]="stage.bgColor"
            >
              <p class="text-3xl font-bold" [style.color]="stage.color">{{ stage.count }}</p>
              <p class="text-sm font-medium text-gray-600 mt-1">{{ stage.name }}</p>
            </div>
            <div
              *ngIf="i < funnelStages().length - 1"
              class="absolute top-1/2 -right-2 transform -translate-y-1/2"
            >
              <i class="bi bi-chevron-right text-gray-300"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Applications by Job -->
        <div
          class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[320px] hover:shadow-md transition-shadow"
        >
          <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <div class="p-2 rounded-lg bg-blue-50 text-blue-600">
              <i class="bi bi-briefcase"></i>
            </div>
            Applications by Job
          </h3>
          <div class="flex-1 relative min-w-0 min-h-0">
            <canvas
              baseChart
              [data]="jobsChartData"
              [type]="'bar'"
              [options]="barChartOptions"
              class="w-full h-full"
            ></canvas>
          </div>
        </div>

        <!-- Source Analytics -->
        <div
          class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[320px] hover:shadow-md transition-shadow"
        >
          <h3 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <i class="bi bi-pie-chart"></i>
            </div>
            Candidate Sources
          </h3>
          <div class="flex-1 relative min-w-0 min-h-0">
            <canvas
              baseChart
              [data]="sourceChartData"
              [type]="'doughnut'"
              [options]="doughnutChartOptions"
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
            style="background: linear-gradient(to bottom right, #6366f1, #4f46e5)"
          >
            <i class="bi bi-plus-lg text-xl"></i>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Create Job
            </h3>
            <p class="text-sm text-gray-500">Post new opening</p>
          </div>
          <i
            class="bi bi-arrow-right ml-auto text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
          ></i>
        </a>

        <a
          routerLink="/applications"
          class="card-modern bg-white p-5 flex items-center gap-4 group cursor-pointer hover:border-purple-100 hover:shadow-lg transition-all"
        >
          <div
            class="p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"
            style="background: linear-gradient(to bottom right, #a855f7, #9333ea)"
          >
            <i class="bi bi-kanban text-xl"></i>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              Pipeline
            </h3>
            <p class="text-sm text-gray-500">Manage applications</p>
          </div>
          <i
            class="bi bi-arrow-right ml-auto text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
          ></i>
        </a>

        <a
          routerLink="/jobs"
          class="card-modern bg-white p-5 flex items-center gap-4 group cursor-pointer hover:border-emerald-100 hover:shadow-lg transition-all"
        >
          <div
            class="p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform"
            style="background: linear-gradient(to bottom right, #10b981, #059669)"
          >
            <i class="bi bi-briefcase text-xl"></i>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              All Jobs
            </h3>
            <p class="text-sm text-gray-500">View & manage jobs</p>
          </div>
          <i
            class="bi bi-arrow-right ml-auto text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
          ></i>
        </a>
      </div>
    </div>
  `,
})
export class TaDashboardComponent implements OnInit {
  authStore = inject(AuthStore);
  headerService = inject(HeaderService);
  jobService = inject(JobService);
  applicationService = inject(ApplicationService);

  loading = signal(true);
  stats = signal<StatCard[]>([
    {
      label: 'Open Jobs',
      value: 0,
      icon: 'bi bi-briefcase-fill',
      bgStyle: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
      link: '/jobs',
    },
    {
      label: 'Total Applications',
      value: 0,
      icon: 'bi bi-file-earmark-person-fill',
      bgStyle: 'linear-gradient(to bottom right, #a855f7, #9333ea)',
      link: '/applications',
    },
    {
      label: 'In Interview',
      value: 0,
      icon: 'bi bi-camera-video-fill',
      bgStyle: 'linear-gradient(to bottom right, #10b981, #059669)',
      link: '/applications',
    },
    {
      label: 'Offers Extended',
      value: 0,
      icon: 'bi bi-award-fill',
      bgStyle: 'linear-gradient(to bottom right, #f97316, #ea580c)',
      link: '/applications',
    },
  ]);

  funnelStages = signal([
    { name: 'Applied', count: 0, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
    { name: 'Screening', count: 0, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    { name: 'Interview', count: 0, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.1)' },
    { name: 'Offer', count: 0, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    { name: 'Hired', count: 0, color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)' },
  ]);

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: { x: { beginAtZero: true } },
    plugins: { legend: { display: false } },
  };

  doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 10 } } },
  };

  jobsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Applications',
        backgroundColor: '#6366f1',
        borderRadius: 4,
      },
    ],
  };

  sourceChartData: ChartData<'doughnut'> = {
    labels: ['Vendor', 'Direct', 'Referral', 'LinkedIn', 'Job Portal'],
    datasets: [
      {
        data: [],
        backgroundColor: ['#8b5cf6', '#6366f1', '#10b981', '#0077b5', '#f59e0b'],
      },
    ],
  };

  ngOnInit() {
    this.headerService.setTitle(
      'TA Dashboard',
      'Talent acquisition and recruitment pipeline',
      'bi bi-person-plus',
    );
    this.loadData();
  }

  loadData() {
    forkJoin({
      jobs: this.jobService.getJobs(0, 100), // Get enough jobs
      applications: this.applicationService.getApplications(undefined, 0, 1000), // Get enough applications
    }).subscribe({
      next: ({ jobs, applications }) => {
        const apps = applications.content; // Assuming PageResponse contains content
        const jobList = jobs.content; // Assuming PageResponse contains content

        const applied = apps.filter((a: any) => a.status === 'APPLIED').length;
        const screening = apps.filter((a: any) =>
          ['SCREENING', 'SHORTLISTED'].includes(a.status),
        ).length;
        const interview = apps.filter((a: any) =>
          ['INTERVIEW_SCHEDULED', 'INTERVIEW_PASSED', 'INTERVIEW_FAILED'].includes(a.status),
        ).length;
        const offer = apps.filter((a: any) =>
          ['OFFER_RELEASED', 'OFFER_ACCEPTED', 'OFFERED'].includes(a.status),
        ).length;
        const hired = apps.filter((a: any) =>
          ['ONBOARDING_IN_PROGRESS', 'ONBOARDED', 'CONVERTED_TO_FTE', 'HIRED'].includes(a.status),
        ).length;

        const currentStats = this.stats();
        currentStats[0].value = jobs.totalElements; // Open Jobs
        currentStats[1].value = applications.totalElements; // Total Apps
        currentStats[2].value = interview;
        currentStats[3].value = offer;
        this.stats.set([...currentStats]);

        this.funnelStages.set([
          { name: 'Applied', count: applied, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
          {
            name: 'Screening',
            count: screening,
            color: '#8b5cf6',
            bgColor: 'rgba(139, 92, 246, 0.1)',
          },
          {
            name: 'Interview',
            count: interview,
            color: '#a855f7',
            bgColor: 'rgba(168, 85, 247, 0.1)',
          },
          { name: 'Offer', count: offer, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
          { name: 'Hired', count: hired, color: '#059669', bgColor: 'rgba(5, 150, 105, 0.1)' },
        ]);

        // Process Charts
        this.updateCharts(jobList, apps);

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  updateCharts(jobs: any[], apps: any[]) {
    // Applications by Job
    // Group apps by job ID
    const appsByJob: Record<string, number> = {};
    apps.forEach((app) => {
      const title = app.job?.title || 'Unknown Job';
      appsByJob[title] = (appsByJob[title] || 0) + 1;
    });

    // Sort by count and take top 5
    const topJobs = Object.entries(appsByJob)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    this.jobsChartData = {
      labels: topJobs.map(([t]) => t),
      datasets: [
        {
          data: topJobs.map(([, c]) => c),
          label: 'Applications',
          backgroundColor: '#6366f1',
          borderRadius: 4,
        },
      ],
    };

    // Source Analytics
    // Since 'source' field is not strictly in JobApplication based on my prev check,
    // I will infer it: Vendor applications have 'vendor' field. Others might be direct.
    // This is an approximation as requested to be "real data".
    const vendorApps = apps.filter((a: any) => !!a.vendor).length;
    const directApps = apps.length - vendorApps;

    // We can split directApps into 'Direct', 'Referral', 'LinkedIn' randomly or just show Direct vs Vendor for accuracy
    // User requested "fetched from api". Accurate data is Vendor vs Internal/Direct.
    // I will distribute 'directApps' into 'Direct' to be safe, filtering 0s.

    this.sourceChartData = {
      labels: ['Vendor', 'Direct / Internal'],
      datasets: [
        {
          data: [vendorApps, directApps],
          backgroundColor: ['#8b5cf6', '#10b981'],
        },
      ],
    };
  }
}
