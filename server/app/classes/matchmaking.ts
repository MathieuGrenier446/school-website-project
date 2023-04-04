import { Server } from 'socket.io';
import { Player } from '@app/classes/player';
import { Subscription } from 'rxjs';
import { GameDataService } from '@app/services/game-data.service';
import { Container, Service } from 'typedi';
import { WaitingRoom } from './waiting-room';
@Service()
export class Matchmaking {
    waitingRoomByGameId: Map<string, WaitingRoom> = new Map();
    playerWaitingLimitedGame: Player | null;
    deletedGameSubscription: Subscription;
    gameDataService: GameDataService;

    constructor(public sio: Server) {
        this.gameDataService = Container.get(GameDataService);
        this.deletedGameSubscription = this.gameDataService.lastDeletedGameId.subscribe((gameId: string) => {
            this.sio.emit('deletedGame', gameId);
        });
    }

    async createGame(gameId: string, player: Player, isMultiplayer: boolean) {
        if (this.waitingRoomByGameId.has(gameId)) {
            player.emit('error');
            return;
        }
        return player
            .createClassicGame(gameId)
            .then(() => {
                console.log('y2');
                if (isMultiplayer) {
                    const waitingRoom = new WaitingRoom(player);
                    this.waitingRoomByGameId.set(gameId, waitingRoom);
                } else {
                    player.loadClient();
                }
            })
            .catch((e) => {
                console.log(e);
                console.log('e2');
            });
    }

    async joinLimitedTimeGame(player: Player, isMultiplayer: boolean) {
        if (isMultiplayer && this.playerWaitingLimitedGame) {
            player.joinPlayer(this.playerWaitingLimitedGame);
            player.loadClient();
            this.playerWaitingLimitedGame = null;
        } else {
            if (isMultiplayer) this.playerWaitingLimitedGame = player;
            return player.createLimitedGame();
        }
    }

    async joinQueue(gameId: string, player: Player) {
        const waitingRoom = this.waitingRoomByGameId.get(gameId);
        return new Promise<void>((resolve, reject) => {
            if (waitingRoom) {
                waitingRoom.addPlayer(player);
                resolve();
            } else {
                reject();
            }
        });
    }

    leaveQueue(player: Player) {
        const gameId = player.game?.gameData?.id;
        if (!gameId) return;
        const waitingRoom = this.waitingRoomByGameId.get(gameId);
        if (waitingRoom) {
            waitingRoom.removePlayer(player);
        } else {
            player.leaveGame();
        }
    }

    async handleHostDecision(host: Player, socketId: string, isAccepted: boolean) {
        const waitingRooms = Array.from(this.waitingRoomByGameId.values());
        const waitingRoom = waitingRooms.find((currentRoom: WaitingRoom) => {
            return currentRoom.roomId === host.room;
        });
        if (!waitingRoom) return;

        if (isAccepted) {
            return waitingRoom.acceptPlayer(socketId);
        } else {
            return waitingRoom.refusePlayer(socketId);
        }
    }
}
