import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  OnInit,
  OnDestroy,
  signal,
  effect,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { SpeechService } from '../../core/services/speech.service';

interface ChatMessage {
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
})
export class ChatbotComponent implements OnInit, OnDestroy {
  private readonly chatService = inject(ChatService);
  private readonly speechService = inject(SpeechService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  // State using Signals to match reference implementation and fix NG0100
  isOpen = signal(false);
  isMinimized = signal(false);
  isLoading = signal(false);
  messages = signal<ChatMessage[]>([]);

  inputMessage = '';
  isListening = false;
  interimTranscript = '';
  selectedIntent: 'AUTO' | 'POLICY' | 'ACTION' = 'AUTO';

  isSpeechSupported = false;

  constructor() {
    // Initial welcome message
    this.messages.set([
      {
        content: `👋 **Hi! I'm Nova**, your Silverwind AI assistant.

I can help you with:
- **Policy questions** - Company handbook, HR policies
- **Actions** - Leave balance, apply leave, create tickets, view payslips

Just ask me anything!`,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);

    // Effect to auto-scroll when messages change
    effect(() => {
      const msgs = this.messages();
      // Use timeout to allow DOM to update before scrolling
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  ngOnInit() {
    this.isSpeechSupported = this.speechService.isSupported();

    // Subscribe to speech transcript
    this.speechService.transcript$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      // Always update input with latest transcript (interim or final)
      if (event.transcript) {
        this.inputMessage = event.transcript;
        this.cdr.detectChanges(); // Force UI update
      }

      if (event.isFinal) {
        // Auto-send after final transcript
        setTimeout(() => this.sendMessage(), 300);
      }
    });

    // Subscribe to listening state
    this.speechService.listening$.pipe(takeUntil(this.destroy$)).subscribe((listening) => {
      this.isListening = listening;
      this.cdr.detectChanges(); // Force UI update
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChat() {
    if (this.isOpen()) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    this.isOpen.set(true);
    this.isMinimized.set(false);
    setTimeout(() => this.focusInput(), 100);
  }

  closeChat() {
    this.isOpen.set(false);
    this.isMinimized.set(false);
  }

  minimizeChat() {
    this.isMinimized.set(true);
  }

  restoreChat() {
    this.isMinimized.set(false);
    setTimeout(() => this.focusInput(), 100);
  }

  sendMessage() {
    const message = this.inputMessage.trim();
    if (!message || this.isLoading()) return;

    // Add user message
    this.messages.update((msgs) => [
      ...msgs,
      {
        content: message,
        sender: 'user',
        timestamp: new Date(),
      },
    ]);

    this.inputMessage = '';
    this.isLoading.set(true);

    // Determine intent to send
    const intent = this.selectedIntent === 'AUTO' ? undefined : this.selectedIntent;

    // Send to backend (Synchronous)
    this.chatService.sendMessage(message, intent).subscribe({
      next: (res) => {
        // Add bot message
        this.messages.update((msgs) => [
          ...msgs,
          {
            content: res.data.response,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);

        this.messages.update((msgs) => [
          ...msgs,
          {
            content: 'Sorry, I encountered an error. Please try again.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
      },
    });
  }

  toggleVoiceInput() {
    this.speechService.toggleListening();
  }

  clearHistory() {
    this.messages.set([
      {
        content: '🔄 Conversation cleared. How can I help you?',
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
    this.chatService.clearHistory().subscribe();
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom() {
    if (this.messagesContainer?.nativeElement) {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    }
  }

  private focusInput() {
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.focus();
    }
  }
}
