import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AddRoundRequest, CreateGameRequest, GameState, Trick } from '../models/skate-game.models';

@Injectable({
  providedIn: 'root'
})
export class SkateGameApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5259/api';

  readonly tricksUrl = `${this.apiUrl}/tricks`;
  readonly gamesUrl = `${this.apiUrl}/games`;

  getTricks(): Observable<Trick[]> {
    return this.http.get<Trick[]>(this.tricksUrl);
  }

  createGame(request: CreateGameRequest): Observable<GameState> {
    return this.http.post<GameState>(this.gamesUrl, request);
  }

  addRound(gameId: number, request: AddRoundRequest): Observable<GameState> {
    return this.http.post<GameState>(`${this.gamesUrl}/${gameId}/rounds`, request);
  }
}
