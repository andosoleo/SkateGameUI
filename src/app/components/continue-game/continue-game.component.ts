import { Component, output } from '@angular/core';

@Component({
  selector: 'app-continue-game',
  templateUrl: './continue-game.component.html',
  styleUrl: './continue-game.component.scss'
})
export class ContinueGameComponent {
  readonly backToLanding = output<void>();
}
