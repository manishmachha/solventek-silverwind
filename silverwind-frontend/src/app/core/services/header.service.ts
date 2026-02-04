import { Injectable, signal, computed } from '@angular/core';

export interface HeaderState {
  title: string;
  subtitle?: string;
  icon?: string; // class name for bootstrap/material icon
}

@Injectable({
  providedIn: 'root',
})
export class HeaderService {
  private state = signal<HeaderState>({
    title: 'Silverwind',
    subtitle: 'Enterprise Portal',
    icon: 'bi bi-wind',
  });

  readonly title = computed(() => this.state().title);
  readonly subtitle = computed(() => this.state().subtitle);
  readonly icon = computed(() => this.state().icon);

  setTitle(title: string, subtitle?: string, icon?: string) {
    this.state.set({ title, subtitle, icon });
  }

  reset() {
    this.state.set({
      title: 'Silverwind',
      subtitle: 'Enterprise Portal',
      icon: 'bi bi-wind',
    });
  }
}
