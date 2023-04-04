import { PlayerData } from '@app/interfaces/player-data';
import { Vec2 } from '@app/interfaces/vec2';
import { randomUUID } from 'crypto';
import { Socket } from 'socket.io';
import { Game } from './game';
import { LimitedTimeGame } from './limited-time-game';

export class Player {
    game?: Game;
    room: string;
    playerData: PlayerData = {} as PlayerData;

    constructor(public socket: Socket) {
        this.room = socket.id;
    }

    sendMessage(message: string) {
        this.emit('roomMessage', message);
    }

    clickDifference(coords: Vec2) {
        this.game?.checkCoordinate(this.socket.id, coords);
    }

    cheat() {
        const differences = this.game?.getAllDifferences();
        this.socket.emit('cheatMode', differences);
    }

    getClue() {
        const clue = null;
        this.socket.emit('clue', clue);
    }

    async createClassicGame(gameId: string) {
        this.room = `game_${randomUUID()}`;
        this.socket.join(this.room);
        this.game = new Game(this.emit);
        return this.game
            .init(gameId)
            .then(() => {
                console.log('y3');
            })
            .catch(() => {
                console.log('e3');
            });
    }

    async createLimitedGame() {
        this.room = `game_${randomUUID()}`;
        this.socket.join(this.room);
        this.game = new LimitedTimeGame(this.emit);
        await this.game.init('');
    }

    loadClient() {
        const gameData = this.game?.getClientGameData();
        this.emit('connectionAccepted', gameData);
    }

    startGame() {
        this.game?.startGame();
    }

    leaveGame() {
        this.game?.disconnectPlayer(this.socket.id);
        this.socket.leave(this.room);
    }

    joinPlayer(player: Player) {
        this.room = player.room;
        this.game = player.game;
        this.socket.join(this.room);
    }

    emit<T>(ev: string, ...args: T[]) {
        this.socket.to(this.room).emit(ev, args);
        this.socket.emit(ev, args);
    }
}
