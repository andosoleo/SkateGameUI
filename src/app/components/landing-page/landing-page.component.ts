import { Component, output } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  readonly startNewGame = output<void>();
  readonly continueGame = output<void>();
}
