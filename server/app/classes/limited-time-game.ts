import { GameData } from '@app/interfaces/game-data';
import { Subscription } from 'rxjs';
import { Timer } from './timer';
import { PlayerData } from '@app/interfaces/player-data';
import { Game } from './game';

export class LimitedTimeGame extends Game {
    timeSubscription: Subscription;
    timer: Timer = new Timer();
    players: PlayerData[] = [];
    isGameOver: boolean = false;
    gameIdsLeft: string[];
    gameBuffer: GameData[];

    constructor(public emitToRoom: (event: string, payload?: object) => void) {
        super(emitToRoom);
        this.timer.increment = false;
        const taMere = 5;
        this.timer.setTime(taMere, 0);
    }

    async init() {
        this.gameIdsLeft = await this.gameDataService.getGameIds();
        this.shuffleArray(this.gameIdsLeft);
        const gameIds = this.gameIdsLeft.splice(0, 3);
        this.gameBuffer = await this.gameDataService.getGamesByIds(gameIds);
        return new Promise<void>((resolve, reject) => {
            if (this.gameBuffer) {
                resolve();
            } else {
                reject();
            }
        });
    }

    setTimeSubscription(): void {
        this.timeSubscription = this.timer.getTimer().subscribe((time: object) => {
            this.emitToRoom('timerTick', time);
            if (this.timer.expired) {
                this.endGame();
            }
        });
    }

    verifyGameState() {
        this.getNextGame();
    }

    stopGame() {
        if (this.timeSubscription) this.timeSubscription.unsubscribe();
        this.isGameOver = true;
    }

    async getNextGame() {
        const gameId = this.gameIdsLeft.shift();
        if (gameId) {
            const game = await this.gameDataService.getGameById(gameId);
            this.gameBuffer.push(game);
        } else {
            this.endGame();
        }
    }

    endGame() {
        this.stopGame();
        this.emitToRoom('endGame');
    }
    shuffleArray<T>(array: T[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}
