import { Component, signal } from '@angular/core';
import { ContinueGameComponent } from './components/continue-game/continue-game.component';
import { InGameComponent } from './components/in-game/in-game.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';

type AppView = 'landing' | 'inGame' | 'continueGame';

@Component({
  selector: 'app-root',
  imports: [ContinueGameComponent, InGameComponent, LandingPageComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly currentView = signal<AppView>('landing');

  protected showLanding(): void {
    this.currentView.set('landing');
  }

  protected startNewGame(): void {
    this.currentView.set('inGame');
  }

  protected continueGame(): void {
    this.currentView.set('continueGame');
  }
}
