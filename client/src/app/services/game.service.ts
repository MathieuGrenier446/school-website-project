import { Injectable } from '@angular/core';
import {
    SERVER_MESSAGE_FOUND_MULTIPLAYER,
    SERVER_MESSAGE_FOUND_SINGLPLAYER,
    SERVER_MESSAGE_NOT_FOUND_MULTIPLAYER,
    SERVER_MESSAGE_NOT_FOUND_SINGLEPLAYER,
} from '@app/const';
import { GameData } from '@app/interfaces/game-data';
import { Player } from '@app/interfaces/player';
import { Vec2 } from '@app/interfaces/vec2';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    socket: Socket;
    originalImage: string;
    totalDifferences: number;
    time: Subject<object> = new Subject();
    gameState: Subject<Player> = new Subject();
    lastDifferenceFound: Subject<Vec2[]> = new Subject();
    playerName: string;
    game: GameData;
    roomMessageObs: Subject<string> = new Subject<string>();
    gamemode: string;
    cheatModeDifferences: Subject<Vec2[][]> = new Subject();

    constructor() {
        this.connect();
        this.handleSockets();
    }
    connect() {
        if (!(this.socket && this.socket.connected)) {
            this.socket = io(environment.serverUrl, { transports: ['websocket'], upgrade: false });
        }
    }

    disconnect() {
        this.socket.emit('leaveGame');
        this.socket.disconnect();
    }

    setupGame(gameData: GameData, playerName: string) {
        this.game = gameData;
        this.playerName = playerName;
        this.totalDifferences = this.game.numberOfDifferences;
    }

    startGame() {
        this.socket.emit('startGame');
    }

    uploadImage(image: string) {
        this.originalImage = image;
    }

    sendDifference(difference: Vec2) {
        this.socket.emit('mouseClick', difference);
    }

    acceptPlayerConnection(playerName: string, isAccepted: boolean) {
        this.socket.emit('joinResponse', { playerName, isAccepted });
    }

    handleSockets() {
        this.socket.on('timerTick', (time: object) => {
            this.time.next(time);
        });

        this.socket.on('endGame', (gameState) => {
            this.gameState.next(gameState);
        });

        this.socket.on('differenceFound', (parameters: { difference: Vec2[]; playerName: string }) => {
            const difference = parameters.difference;
            this.lastDifferenceFound.next(difference);
            if (this.game.isMultiplayer) {
                this.addMessageMultiplayer(difference.length, parameters.playerName);
            } else {
                this.addMessageSingleplayer(difference.length);
            }
        });

        this.socket.on('roomMessage', (message: string) => {
            this.addMessage(message);
        });
    }

    addMessageSingleplayer(nbDifferenceFound: number) {
        if (nbDifferenceFound > 0) {
            this.addMessage(SERVER_MESSAGE_FOUND_SINGLPLAYER);
        } else {
            this.addMessage(SERVER_MESSAGE_NOT_FOUND_SINGLEPLAYER);
        }
    }

    addMessageMultiplayer(nbDifferenceFound: number, playerName: string) {
        if (nbDifferenceFound > 0) {
            this.addMessage(SERVER_MESSAGE_FOUND_MULTIPLAYER + playerName);
        } else {
            this.addMessage(SERVER_MESSAGE_NOT_FOUND_MULTIPLAYER + playerName);
        }
    }

    async cheatMode() {
        const differences = await this.asyncEmit('cheatMode');
        this.cheatModeDifferences.next(differences as Vec2[][]);
    }

    async asyncEmit<T>(eventName: string, data?: T) {
        const time = 50000;

        return new Promise((resolve, reject) => {
            this.socket.emit(eventName, data);
            this.socket.on(eventName, (result) => {
                this.socket.off(eventName);
                resolve(result);
            });
            setTimeout(reject, time);
        });
    }

    sendMessage(message: string) {
        if (message.length > 0) {
            this.socket.emit('roomMessage', message);
        }
    }

    addMessage(message: string): void {
        this.roomMessageObs.next(message);
    }

    cancelGame() {
        this.socket.emit('leaveGame');
    }
}
