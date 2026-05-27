import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LandingModule } from './landing/landing-module';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <main class="app">
      <router-outlet />
    </main>
  `,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('adqwest-me');
}
