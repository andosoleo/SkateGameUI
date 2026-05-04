import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameRound, GameState, Trick } from '../../models/skate-game.models';
import { SkateGameApiService } from '../../services/skate-game-api.service';

type GamePhase = 'setup' | 'offense' | 'defense' | 'complete';

@Component({
  selector: 'app-in-game',
  imports: [CommonModule, FormsModule],
  templateUrl: './in-game.component.html',
  styleUrl: './in-game.component.scss'
})
export class InGameComponent implements OnInit {
  private readonly skateGameApi = inject(SkateGameApiService);

  readonly backToLanding = output<void>();

  protected readonly phase = signal<GamePhase>('setup');
  protected readonly tricks = signal<Trick[]>([]);
  protected readonly game = signal<GameState | null>(null);
  protected readonly error = signal('');
  protected readonly isBusy = signal(false);

  protected playerOneName = '';
  protected playerTwoName = '';
  protected selectedTrickId: number | null = null;
  protected wasSetSuccessfully = true;
  protected wasDefendedSuccessfully = true;
  protected pendingTrick: Trick | null = null;

  protected readonly currentOffensivePlayer = computed(() => {
    const game = this.game();
    return game ? this.getPlayerName(game.currentOffensivePlayerNumber) : '';
  });

  protected readonly currentDefensivePlayer = computed(() => {
    const game = this.game();
    return game ? this.getPlayerName(game.currentDefensivePlayerNumber) : '';
  });

  protected readonly roundNumber = computed(() => (this.game()?.rounds.length ?? 0) + 1);

  protected readonly lastRound = computed(() => {
    const rounds = this.game()?.rounds ?? [];
    return rounds.length ? rounds[rounds.length - 1] : null;
  });

  protected readonly lastRoundSummary = computed(() => {
    const round = this.lastRound();
    if (!round) {
      return '';
    }

    const offense = this.getPlayerName(round.offensivePlayerNumber);
    const defense = this.getPlayerName(round.defensivePlayerNumber);

    if (!round.wasSetSuccessfully) {
      return `${offense} missed ${round.trickName}. ${defense} takes offense.`;
    }

    if (round.wasDefendedSuccessfully) {
      return `${offense} set ${round.trickName}, and ${defense} matched it.`;
    }

    return `${offense} set ${round.trickName}. ${defense} missed and took a letter.`;
  });

  protected readonly selectedTrickName = computed(() => {
    return this.tricks().find((trick) => trick.id === Number(this.selectedTrickId))?.name ?? '';
  });

  protected readonly availableTricks = computed(() => {
    const usedTrickIds = new Set(this.game()?.usedTricks.map((trick) => trick.id) ?? []);
    return this.tricks().filter((trick) => !usedTrickIds.has(trick.id));
  });

  ngOnInit(): void {
    this.loadTricks();
  }

  protected createGame(): void {
    this.clearMessages();

    if (!this.playerOneName.trim() || !this.playerTwoName.trim()) {
      this.error.set('Enter both player names to start.');
      return;
    }

    this.isBusy.set(true);
    this.skateGameApi.createGame({
      playerOneName: this.playerOneName,
      playerTwoName: this.playerTwoName
    }).subscribe({
      next: (game) => {
        this.game.set(game);
        this.resetRoundInput();
        this.phase.set(game.status === 'Completed' ? 'complete' : 'offense');
        this.isBusy.set(false);
      },
      error: () => {
        this.error.set(`Could not start the game. Check that ${this.skateGameApi.gamesUrl} is reachable.`);
        this.isBusy.set(false);
      }
    });
  }

  protected submitOffense(): void {
    this.clearMessages();

    const trick = this.tricks().find((candidate) => candidate.id === Number(this.selectedTrickId));
    if (!trick) {
      this.error.set('Pick a trick for the offensive attempt.');
      return;
    }

    if (this.wasSetSuccessfully) {
      this.pendingTrick = trick;
      this.wasDefendedSuccessfully = true;
      this.phase.set('defense');
      return;
    }

    this.submitRound(false, null);
  }

  protected submitDefense(): void {
    this.submitRound(true, this.wasDefendedSuccessfully);
  }

  protected cancelDefense(): void {
    this.pendingTrick = null;
    this.phase.set('offense');
  }

  protected startOver(): void {
    this.playerOneName = '';
    this.playerTwoName = '';
    this.selectedTrickId = null;
    this.pendingTrick = null;
    this.game.set(null);
    this.clearMessages();
    this.phase.set('setup');
    this.resetRoundInput();
  }

  protected exitGame(): void {
    this.backToLanding.emit();
  }

  protected getPlayerName(playerNumber: number): string {
    const game = this.game();
    if (!game) {
      return '';
    }

    return playerNumber === 1 ? game.playerOneName : game.playerTwoName;
  }

  protected getLettersFor(playerNumber: number): string {
    const game = this.game();
    if (!game) {
      return '';
    }

    return playerNumber === 1 ? game.playerOneLetters : game.playerTwoLetters;
  }

  protected getLetterSlots(playerNumber: number): string[] {
    const letters = this.getLettersFor(playerNumber);
    return 'SKATE'.split('').map((letter, index) => index < letters.length ? letter : '');
  }

  protected getGameOverTitle(game: GameState): string {
    const loser = this.getPlayerName(game.loserPlayerNumber || 0);
    return loser ? `${loser} loses` : 'Game complete';
  }

  protected getGameOverDetail(game: GameState): string {
    const winner = this.getPlayerName(game.winnerPlayerNumber || 0);
    return winner ? `${winner} wins the game.` : 'The game has ended.';
  }

  protected trackByRoundId(_: number, round: GameRound): number {
    return round.id;
  }

  private submitRound(wasSetSuccessfully: boolean, wasDefendedSuccessfully: boolean | null): void {
    const game = this.game();
    const trickId = this.pendingTrick?.id ?? Number(this.selectedTrickId);

    if (!game || !trickId) {
      this.error.set('The round is missing game or trick data.');
      return;
    }

    this.isBusy.set(true);
    this.skateGameApi.addRound(game.id, {
      trickId,
      wasSetSuccessfully,
      wasDefendedSuccessfully
    }).subscribe({
      next: (updatedGame) => {
        this.game.set(updatedGame);
        this.resetRoundInput();
        this.phase.set(updatedGame.status === 'Completed' ? 'complete' : 'offense');
        this.isBusy.set(false);
      },
      error: (response) => {
        this.error.set(response.error || 'Could not save the round.');
        this.isBusy.set(false);
      }
    });
  }

  private loadTricks(): void {
    this.isBusy.set(true);
    this.skateGameApi.getTricks().subscribe({
      next: (tricks) => {
        this.tricks.set(tricks);
        this.selectedTrickId = tricks[0]?.id ?? null;
        this.isBusy.set(false);
      },
      error: () => {
        this.error.set(`Could not load tricks from ${this.skateGameApi.tricksUrl}. Make sure the API is running on http://localhost:5259.`);
        this.isBusy.set(false);
      }
    });
  }

  private resetRoundInput(): void {
    this.pendingTrick = null;
    this.wasSetSuccessfully = true;
    this.wasDefendedSuccessfully = true;
    this.selectedTrickId = this.availableTricks()[0]?.id ?? this.tricks()[0]?.id ?? null;
  }

  private clearMessages(): void {
    this.error.set('');
  }
}
