import {
  Component,
  OnInit,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { TicketService } from '../../../../core/services/ticket.service';
import { HeaderService } from '../../../../core/services/header.service';
import {
  TicketComment,
  TicketHistory,
  Ticket,
  TicketStatus,
} from '../../../../core/models/ticket.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSelectModule,
    MatChipsModule,
  ],
  templateUrl: './ticket-detail.component.html',
  styles: [
    `
      :host {
        display: block;
      }
      .anim-fade-in {
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class TicketDetailComponent implements OnInit, AfterViewChecked {
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);
  private headerService = inject(HeaderService);
  private authStore = inject(AuthStore);
  private snackBar = inject(MatSnackBar);

  ticket = signal<Ticket | null>(null);
  history = signal<TicketHistory[]>([]);
  comments = signal<TicketComment[]>([]);

  newMessage = '';
  // userData is accessed as a signal from store
  user = this.authStore.user;

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  private shouldScrollToBottom = false;

  ngOnInit() {
    this.headerService.setTitle(
      'Ticket Details',
      'View ticket conversation and status',
      'bi bi-ticket-detailed',
    );
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.loadData(params['id']);
      }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  scrollToBottom(): void {
    if (this.scrollContainer) {
      try {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }
  }

  loadData(id: string) {
    this.ticketService.getTicketById(id).subscribe((t) => {
      this.ticket.set(t);
      // Mark as read when opened
      this.ticketService.markAsRead(id).subscribe();
    });
    this.ticketService.getHistory(id).subscribe((h) => this.history.set(h.reverse()));
    this.ticketService.getComments(id).subscribe((c) => {
      this.comments.set(c);
      this.shouldScrollToBottom = true;
    });
  }

  updateStatus(event: any) {
    // Handling MatSelect change event or native select
    const status = event.value || event;

    if (!this.ticket()) return;
    const newStatus = status as TicketStatus;

    this.ticketService.updateStatus(this.ticket()!.id, newStatus).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.snackBar.open('Status updated', 'Close', { duration: 2000 });
        this.loadData(updated.id);
      },
      error: () => this.snackBar.open('Failed to update status', 'Close', { duration: 3000 }),
    });
  }

  escalate() {
    if (!this.ticket()) return;
    if (confirm('Are you sure you want to escalate this ticket? This will mark it as Critical.')) {
      this.ticketService.escalateTicket(this.ticket()!.id).subscribe({
        next: (updated) => {
          this.ticket.set(updated);
          this.snackBar.open('Ticket escalated', 'Close', { duration: 3000 });
        },
      });
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.ticket()) return;

    this.ticketService.addComment(this.ticket()!.id, this.newMessage).subscribe({
      next: () => {
        this.newMessage = '';
        this.loadData(this.ticket()!.id);
      },
    });
  }

  goBack() {
    window.history.back();
  }

  isAdmin() {
    const u = this.user();
    return u?.role?.name === 'HR_ADMIN' || u?.role?.name === 'SUPER_ADMIN';
  }

  isCurrentUser(id: string) {
    return this.user()?.id === id;
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'OPEN':
        return 'text-blue-600';
      case 'IN_PROGRESS':
        return 'text-amber-600';
      case 'PENDING_APPROVAL':
        return 'text-purple-600';
      case 'PENDING_VENDOR':
        return 'text-orange-600';
      case 'PENDING_CLIENT':
        return 'text-cyan-600';
      case 'RESOLVED':
        return 'text-green-600';
      case 'CLOSED':
        return 'text-gray-600';
      case 'REJECTED':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }

  getStatusDotClass(status: string) {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500';
      case 'IN_PROGRESS':
        return 'bg-amber-500';
      case 'PENDING_APPROVAL':
        return 'bg-purple-500';
      case 'PENDING_VENDOR':
        return 'bg-orange-500';
      case 'PENDING_CLIENT':
        return 'bg-cyan-500';
      case 'RESOLVED':
        return 'bg-green-500';
      case 'CLOSED':
        return 'bg-gray-400';
      case 'REJECTED':
        return 'bg-red-400';
      default:
        return 'bg-gray-300';
    }
  }

  getPriorityClass(priority: string) {
    if (priority === 'CRITICAL') return 'text-red-600 font-bold';
    if (priority === 'HIGH') return 'text-orange-600 font-medium';
    if (priority === 'MEDIUM') return 'text-amber-600';
    return 'text-green-600';
  }

  getHistoryDotClass(status: string) {
    return this.getStatusDotClass(status);
  }
}
