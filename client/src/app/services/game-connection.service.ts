import { Injectable } from '@angular/core';
import { Socket } from 'socket.io-client';
import { GameService } from '@app/services/game.service';
import { Subject } from 'rxjs';
import { GameData } from '@app/interfaces/game-data';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class GameConnectionService {
    socket: Socket;
    isConnectionAccepted: Subject<boolean> = new Subject();
    deletedGames: Subject<void> = new Subject();
    playerJoinRequest: Subject<{ playerId: string; playerName: string }> = new Subject();
    playerJoinRequestCanceled: Subject<{ playerId: string }> = new Subject();
    joinableChangeObject: Subject<object> = new Subject();
    gameId: string = '';
    playerName: string;

    constructor(private router: Router, public gameService: GameService) {
        this.socket = gameService.socket;
        this.handleSockets();
    }

    handleSockets() {
        this.socket.on('connectionAccepted', (gameData: GameData) => {
            this.gameService.setupGame(gameData, this.playerName);
            this.router.navigate(['./game']);
        });
        this.socket.on('connectionRefused', () => {
            this.isConnectionAccepted.next(false);
        });
        this.socket.on('deletedGame', (gameId: string) => {
            if (this.gameId === gameId) {
                this.leaveQueue();
                this.deletedGames.next();
            }
        });
        this.socket.on('joinRequest', (player: { playerId: string; playerName: string }) => {
            this.playerJoinRequest.next(player);
        });
        this.socket.on('joinRequestCanceled', (playerId: string) => {
            this.playerJoinRequestCanceled.next({ playerId });
        });
        this.socket.on('changeJoinable', (idValueOfJoinable) => {
            this.joinableChangeObject.next(idValueOfJoinable);
        });
    }

    async createMultiplayerGame(playerName: string, gameId: string) {
        this.gameId = gameId;
        this.playerName = playerName;
        return this.asyncEmit('createGame', { playerName, gameId, isMultiplayer: true });
    }

    async createSingleplayerGame(playerName: string, gameId: string) {
        this.gameId = gameId;
        this.playerName = playerName;
        await this.asyncEmit('createGame', { playerName, gameId, isMultiplayer: false });
    }

    async joinQueue(playerName: string, gameId: string) {
        this.gameId = gameId;
        this.playerName = playerName;
        await this.asyncEmit('joinQueue', { playerName, gameId });
    }

    leaveQueue() {
        this.gameId = '';
        this.socket.emit('leaveQueue');
    }

    async acceptPlayer(playerId: string) {
        return this.asyncEmit('joinResponse', { playerId, isAccepted: true });
    }

    refusePlayer(playerId: string) {
        this.socket.emit('joinResponse', { playerId, isAccepted: false });
    }

    async asyncEmit<T>(eventName: string, data?: T) {
        const time = 50000;
        const turnOffSockets = () => {
            this.socket.off(eventName);
            this.socket.off('error');
        };
        return new Promise((resolve, reject) => {
            this.socket.emit(eventName, data);
            this.socket.on(eventName, (result) => {
                turnOffSockets();
                resolve(result);
            });
            this.socket.on('error', () => {
                turnOffSockets();
                reject();
            });
            setTimeout(reject, time);
        });
    }
}
