import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingModalComponent } from './shared/components/loading-modal/loading-modal.component';
import { DialogComponent } from './shared/components/dialog/dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogComponent, LoadingModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('silverwind');
}
