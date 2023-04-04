import { GameData } from '@app/interfaces/game-data';
import { Vec2 } from '@app/interfaces/vec2';
import { Subscription } from 'rxjs';
import { Timer } from './timer';
import { PlayerData } from '@app/interfaces/player-data';
import { Container, Service } from 'typedi';
import { GameDataService } from '@app/services/game-data.service';
@Service()
export class Game {
    timeSubscription: Subscription;
    timer: Timer;
    players: PlayerData[] = [];
    isGameOver: boolean = false;
    isMultiplayer: boolean = false;
    gameDataService: GameDataService;
    gameData: GameData;

    // eslint-disable-next-line max-params
    constructor(public emitToRoom: (event: string, payload?: object) => void) {
        this.timer = new Timer();
        this.gameDataService = Container.get(GameDataService);
    }

    async init(gameId: string) {
        try {
            console.log(this.gameDataService.collection);
        } catch (e) {
            console.log(e);
        }

        return this.gameDataService
            .getGameById(gameId)
            .then((game: GameData) => {
                console.log('y4');
                this.gameData = game;
            })
            .catch(() => {
                console.log('e4');
            });
    }

    getClientGameData() {
        // eslint-disable-next-line no-unused-vars
        const { differences, ...clientGameData } = this.gameData;
        return clientGameData;
    }

    connectPlayer(player: PlayerData) {
        this.players.push(player);
        if (this.players.length > 1) {
            this.isMultiplayer = true;
        }
    }

    getAllDifferences() {
        return this.gameData.differences;
    }

    startGame() {
        if (!this.timeSubscription) {
            this.setTimeSubscription();
        }
    }

    setTimeSubscription() {
        this.timeSubscription = this.timer.getTimer().subscribe((time: object) => {
            this.emitToRoom('timerTick', time);
        });
    }

    checkCoordinate(socketId: string, coords: Vec2) {
        const player = this.players.find((element) => {
            return element.socketId === socketId;
        });
        if (!player) {
            this.emitToRoom('error');
            return;
        }
        let difference: Vec2[] = [];
        for (let i = 0; i < this.gameData.differences.length && player; i++) {
            if (this.gameData.differences[i].some((e) => e.x === coords.x && e.y === coords.y)) {
                difference = this.gameData.differences[i];
                this.gameData.differences.splice(i, 1);
                player.differencesFound++;
                this.verifyGameState();
                break;
            }
        }
        this.emitToRoom('differenceFound', { difference, playerName: player.name });
    }

    verifyGameState() {
        switch (this.isMultiplayer) {
            case false: {
                const player = this.players[0];
                if (player.differencesFound === this.gameData.numberOfDifferences) {
                    this.endGame();
                }
                break;
            }
            case true: {
                const winCondition = Math.ceil(this.gameData.numberOfDifferences / 2);
                for (const player of this.players) {
                    if (winCondition === player.differencesFound) {
                        this.endGame(player);
                    }
                }
                break;
            }
        }
    }

    disconnectPlayer(socketId: string) {
        this.players.forEach((value, index) => {
            if (value.socketId === socketId) {
                this.players.splice(index, 1);
            }
        });
        if (!this.isGameOver) {
            this.endGame();
        }
    }

    stopGame() {
        if (this.timeSubscription) this.timeSubscription.unsubscribe();
        this.isGameOver = true;
    }

    endGame(winner: PlayerData = this.players[0]) {
        this.stopGame();
        this.emitToRoom('endGame', winner);
    }
}
