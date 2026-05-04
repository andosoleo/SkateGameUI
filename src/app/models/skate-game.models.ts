export interface Trick {
  id: number;
  name: string;
}

export interface GameRound {
  id: number;
  roundNumber: number;
  offensivePlayerNumber: number;
  defensivePlayerNumber: number;
  trickId: number;
  trickName: string;
  wasSetSuccessfully: boolean;
  wasDefendedSuccessfully: boolean | null;
  letterAwardedToPlayerNumber: number | null;
  createdAt: string;
}

export interface GameState {
  id: number;
  playerOneName: string;
  playerTwoName: string;
  currentOffensivePlayerNumber: number;
  currentDefensivePlayerNumber: number;
  playerOneLetters: string;
  playerTwoLetters: string;
  status: string;
  winnerPlayerNumber: number | null;
  loserPlayerNumber: number | null;
  usedTricks: Trick[];
  rounds: GameRound[];
}

export interface CreateGameRequest {
  playerOneName: string;
  playerTwoName: string;
}

export interface AddRoundRequest {
  trickId: number;
  wasSetSuccessfully: boolean;
  wasDefendedSuccessfully: boolean | null;
}
