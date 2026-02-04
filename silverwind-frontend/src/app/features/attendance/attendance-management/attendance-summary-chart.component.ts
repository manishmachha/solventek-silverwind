import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-attendance-summary-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="w-full h-[300px] flex items-center justify-center">
      <canvas baseChart [data]="chartData" [type]="chartType" [options]="chartOptions"> </canvas>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class AttendanceSummaryChartComponent implements OnChanges {
  @Input() entries: any[] = [];

  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
    },
  };
  public chartType: ChartType = 'doughnut';
  public chartData: ChartData<'doughnut'> = {
    labels: ['Present', 'Absent', 'On Leave', 'Weekend'],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#10b981', '#ef4444', '#3b82f6', '#a855f7'], // Green, Red, Blue, Purple
      },
    ],
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries']) {
      this.updateChart();
    }
  }

  private updateChart() {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let weekend = 0;

    if (this.entries) {
      this.entries.forEach((entry) => {
        if (entry.status === 'PRESENT' || entry.status === 'HALF_DAY') present++;
        else if (entry.status === 'ABSENT') absent++;
        else if (entry.status === 'ON_LEAVE') leave++;
        else if (entry.status === 'WEEKEND') weekend++;
      });
    }

    this.chartData = {
      ...this.chartData,
      datasets: [
        {
          data: [present, absent, leave, weekend],
          backgroundColor: ['#10b981', '#ef4444', '#3b82f6', '#a855f7'],
        },
      ],
    };
  }
}
