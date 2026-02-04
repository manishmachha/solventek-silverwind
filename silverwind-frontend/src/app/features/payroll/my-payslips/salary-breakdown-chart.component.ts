import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { SalaryStructure } from '../../../core/models/payroll.model';

@Component({
  selector: 'app-salary-breakdown-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <h3 class="font-bold text-gray-700 mb-4 text-center">Salary Structure</h3>
      <div class="h-[300px] flex justify-center">
        <canvas baseChart [data]="pieChartData" [type]="pieChartType" [options]="pieChartOptions">
        </canvas>
      </div>
    </div>
  `,
})
export class SalaryBreakdownChartComponent implements OnChanges {
  @Input() salaryStructure: SalaryStructure | null = null;

  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.formattedValue;
            return `${label}: ${value}`;
          },
        },
      },
    },
  };
  public pieChartType: ChartType = 'pie';
  public pieChartData: ChartData<'pie'> = {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }],
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['salaryStructure'] && this.salaryStructure) {
      this.updateChart();
    }
  }

  updateChart() {
    if (!this.salaryStructure) return;

    const s = this.salaryStructure;
    // Assume basic, hra, allowances, deductions logic
    // Create data points
    const labels = ['Basic', 'HRA', 'Da', 'Lta', 'Special Allowance'];
    const data = [s.basic, s.hra, s.da, s.lta, s.specialAllowance];
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Add deductions if available in structure, usually structure defines components
    // If net salary is calculated, maybe show deductions vs net?
    // For now, show GROSS breakdown

    this.pieChartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors,
          hoverOffset: 4,
        },
      ],
    };
  }
}
