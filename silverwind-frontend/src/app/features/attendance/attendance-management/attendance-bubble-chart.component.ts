import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import 'chartjs-adapter-date-fns';
import { Attendance } from '../models/attendance.model'; // Using Attendance as entry type or TimesheetEntry

// Use any for entry until model is confirmed
@Component({
  selector: 'app-attendance-bubble-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <div class="block w-full h-[350px]">
      <canvas
        baseChart
        [data]="bubbleChartData"
        [options]="bubbleChartOptions"
        [type]="bubbleChartType"
      >
      </canvas>
    </div>
  `,
})
export class AttendanceBubbleChartComponent implements OnChanges {
  @Input() entries: any[] = [];
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  public bubbleChartType: ChartType = 'bubble';
  public bubbleChartData: ChartData<'bubble'> = {
    datasets: [],
  };

  public bubbleChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM d',
          },
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        min: 0,
        max: 24,
        title: {
          display: true,
          text: 'Start Time (Hour)',
        },
        ticks: {
          stepSize: 2,
          callback: (value) => value + ':00',
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const raw = context.raw as any;
            return `${new Date(raw.x).toLocaleDateString()} (${raw.status}): ${raw.hours} hrs`;
          },
        },
      },
      legend: {
        display: false,
      },
    },
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entries'] && this.entries) {
      this.updateChart();
    }
  }

  updateChart(): void {
    const bgColors: string[] = [];
    const borderColors: string[] = [];

    const dataPoints = this.entries
      .filter((e) => e.date)
      .map((entry) => {
        const date = new Date(entry.date);

        // Determine Color based on Status
        let color = 'rgba(34, 197, 94, 0.6)'; // Default Green (PRESENT)
        let borderColor = 'rgba(34, 197, 94, 1)';

        // Check for specific statuses
        switch (entry.status) {
          case 'ABSENT':
            color = 'rgba(239, 68, 68, 0.6)'; // Red
            borderColor = 'rgba(239, 68, 68, 1)';
            break;
          case 'HALF_DAY':
            color = 'rgba(245, 158, 11, 0.6)'; // Amber/Orange for half day
            borderColor = 'rgba(245, 158, 11, 1)';
            break;
          case 'ON_LEAVE':
            color = 'rgba(59, 130, 246, 0.6)'; // Blue
            borderColor = 'rgba(59, 130, 246, 1)';
            break;
          case 'WEEKEND':
            color = 'rgba(168, 85, 247, 0.6)'; // purple fill
            borderColor = 'rgba(168, 85, 247, 1)';
            break;
        }

        // Store colors for this point
        bgColors.push(color);
        borderColors.push(borderColor);

        // Y-Axis: Start Time
        // If checkInTime is present, use it. Else default to 9:00 AM (e.g. for Leave/Absent placeholders)
        let yValue = 9;
        if (entry.checkInTime) {
          const [hours, minutes] = entry.checkInTime.split(':').map(Number);
          yValue = hours + minutes / 60;
        }

        // Radius: Based on hours worked, but minimum size for 0 hours (Absent/Leave)
        let rValue = (entry.hoursWorked || 0) * 2;
        if (rValue < 6) rValue = 6; // Ensure visibility for non-working days

        return {
          x: date.getTime(),
          y: yValue,
          r: rValue,
          hours: entry.hoursWorked?.toFixed(2) || '0',
          status: entry.status || 'UNKNOWN',
        };
      });

    this.bubbleChartData = {
      datasets: [
        {
          data: dataPoints,
          label: 'Attendance',
          backgroundColor: bgColors,
          borderColor: borderColors,
          hoverBackgroundColor: bgColors.map((c) => c.replace('0.6', '0.8')),
          hoverBorderColor: borderColors,
        },
      ],
    };

    if (this.chart) {
      this.chart.update();
    }
  }
}
