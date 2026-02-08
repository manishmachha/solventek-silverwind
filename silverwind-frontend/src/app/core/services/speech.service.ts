import { Injectable, NgZone, inject } from '@angular/core';
import { Subject } from 'rxjs';

export interface SpeechEvent {
  transcript: string;
  isFinal: boolean;
}

/**
 * Service for Web Speech API voice input.
 * Provides speech-to-text functionality for the chatbot.
 */
@Injectable({
  providedIn: 'root',
})
export class SpeechService {
  private readonly ngZone = inject(NgZone);
  private recognition: any;
  private isListening = false;

  // Observables for speech events
  private readonly transcriptSubject = new Subject<SpeechEvent>();
  readonly transcript$ = this.transcriptSubject.asObservable();

  private readonly listeningSubject = new Subject<boolean>();
  readonly listening$ = this.listeningSubject.asObservable();

  private readonly errorSubject = new Subject<string>();
  readonly error$ = this.errorSubject.asObservable();

  constructor() {
    this.initRecognition();
  }

  private initRecognition(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      this.ngZone.run(() => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        this.transcriptSubject.next({ transcript, isFinal });
      });
    };

    this.recognition.onerror = (event: any) => {
      this.ngZone.run(() => {
        this.isListening = false;
        this.listeningSubject.next(false);

        if (event.error !== 'aborted') {
          this.errorSubject.next(`Speech recognition error: ${event.error}`);
        }
      });
    };

    this.recognition.onend = () => {
      this.ngZone.run(() => {
        this.isListening = false;
        this.listeningSubject.next(false);
      });
    };
  }

  /**
   * Check if speech recognition is supported.
   */
  isSupported(): boolean {
    return !!this.recognition;
  }

  /**
   * Start listening for speech input.
   */
  startListening(): void {
    if (!this.recognition) {
      this.errorSubject.next('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      return;
    }

    try {
      this.isListening = true;
      this.listeningSubject.next(true);
      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      this.listeningSubject.next(false);
      this.errorSubject.next('Failed to start speech recognition.');
    }
  }

  /**
   * Stop listening for speech input.
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.listeningSubject.next(false);
    }
  }

  /**
   * Toggle listening state.
   */
  toggleListening(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }
}
