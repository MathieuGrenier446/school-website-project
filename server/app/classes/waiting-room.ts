import { Player } from '@app/classes/player';
import { Container } from 'typedi';
import { GameDataService } from '@app/services/game-data.service';

export class WaitingRoom {
    playersWaiting: Player[] = [];
    roomId: string;
    gameId: string;
    gameDataService: GameDataService;

    constructor(public host: Player) {
        this.gameDataService = Container.get(GameDataService);
        this.roomId = host.room;
        this.gameId = host.game?.gameData.id as string;
        this.gameDataService.gameIsJoinable(this.gameId);
        this.host.socket.broadcast.emit('changeJoinable', { id: this.gameId, value: true });
    }

    addPlayer(player: Player) {
        this.playersWaiting.push(player);
        player.game = this.host.game;
        this.host.emit('joinRequest', { playerName: player.playerData.name, playerId: player.playerData.socketId });
    }

    removePlayer(player: Player) {
        if (player.room === this.roomId) {
            player.leaveGame();
            this.close();
            return;
        }
        const removedPlayer = this.popPlayerBySocketId(player.socket.id);
        if (removedPlayer) {
            this.host.emit('joinRequestCanceled', removedPlayer.socket.id);
        }
    }

    async refusePlayer(socketId: string) {
        return new Promise<void>((resolve, reject) => {
            const player = this.popPlayerBySocketId(socketId);
            if (!player) {
                reject();
            } else {
                player.emit('connectionRefused');
                resolve();
            }
        });
    }

    async acceptPlayer(socketId: string) {
        return new Promise<void>((resolve, reject) => {
            const player = this.popPlayerBySocketId(socketId);
            if (!player) {
                reject();
            } else {
                player.joinPlayer(this.host);
                player.loadClient();
                this.close();
                resolve();
            }
        });
    }

    close() {
        this.playersWaiting.forEach((player: Player) => {
            player.emit('connectionRefused');
        });
        this.gameDataService.gameIsNotJoinable(this.gameId);
        this.host.socket.broadcast.emit('changeJoinable', { id: this.gameId, value: false });
    }

    popPlayerBySocketId(socketId: string) {
        return this.playersWaiting.find((player: Player, index: number) => {
            const isPlayerFound = player.socket.id === socketId;
            if (isPlayerFound) {
                this.playersWaiting.splice(index, 1);
            }
            return isPlayerFound;
        });
    }
}
