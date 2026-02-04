import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Payroll } from '../../../core/models/payroll.model';

@Component({
  selector: 'app-net-pay-trend-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <h3 class="font-bold text-gray-700 mb-4">Net Pay Trend ({{ year }})</h3>
      <div class="h-[300px]">
        <canvas
          baseChart
          [data]="lineChartData"
          [type]="lineChartType"
          [options]="lineChartOptions"
        >
        </canvas>
      </div>
    </div>
  `,
})
export class NetPayTrendChartComponent implements OnChanges {
  @Input() payslips: Payroll[] = [];
  @Input() year: number = new Date().getFullYear();

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [],
  };
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.4, // Smooth curve
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Net Pay (₹)' },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };
  public lineChartType: ChartType = 'line';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['payslips']) {
      this.updateChart();
    }
  }

  updateChart() {
    // Sort payslips by month
    const sorted = [...this.payslips].sort((a, b) => a.month - b.month);

    const labels = sorted.map((p) => this.getMonthName(p.month));
    const data = sorted.map((p) => p.netPay);

    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          label: 'Net Salary',
          fill: true,
          backgroundColor: 'rgba(99, 102, 241, 0.2)', // Indigo with opacity
          borderColor: '#6366f1',
          pointBackgroundColor: '#fff',
          pointBorderColor: '#6366f1',
          pointHoverBackgroundColor: '#6366f1',
          pointHoverBorderColor: '#fff',
        },
      ],
    };
  }

  getMonthName(month: number): string {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month - 1] || '';
  }
}
