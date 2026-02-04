import { Component, Input, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineService, TimelineEvent } from '../../../core/services/timeline.service';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flow-root">
      <ul role="list" class="-mb-8">
        <li *ngFor="let event of events(); let last = last">
          <div class="relative pb-8">
            <span
              *ngIf="!last"
              class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
              aria-hidden="true"
            ></span>
            <div class="relative flex space-x-3">
              <div>
                <span
                  class="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white"
                >
                  <i class="bi bi-clock text-white text-sm"></i>
                </span>
              </div>
              <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                <div>
                  <p class="text-sm text-gray-500">
                    <span class="font-medium text-gray-900">{{ event.action }}</span>
                    {{ event.description }}
                  </p>
                </div>
                <div class="text-right text-sm whitespace-nowrap text-gray-500">
                  <time [attr.datetime]="event.createdAt">{{
                    event.createdAt | date: 'medium'
                  }}</time>
                </div>
              </div>
            </div>
          </div>
        </li>
        <li *ngIf="events().length === 0" class="text-center text-gray-500 text-sm py-4">
          No history available.
        </li>
      </ul>
    </div>
  `,
})
export class TimelineComponent implements OnInit {
  @Input() entityType!: string;
  @Input() entityId!: string;

  timelineService = inject(TimelineService);
  events = signal<TimelineEvent[]>([]);

  ngOnInit() {
    if (this.entityType && this.entityId) {
      this.loadTimeline();
    }
  }

  loadTimeline() {
    this.timelineService.getTimeline(this.entityType, this.entityId).subscribe((page) => {
      this.events.set(page.content);
    });
  }
}
