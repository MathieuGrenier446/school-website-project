import { Player } from '@app/classes/player';
import { Vec2 } from '@app/interfaces/vec2';
import * as http from 'http';
import * as io from 'socket.io';
import { Matchmaking } from './matchmaking';

export class SocketManager {
    sio: io.Server;
    matchmaking: Matchmaking;
    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
        this.matchmaking = new Matchmaking(this.sio);
    }

    handleSockets(): void {
        this.sio.on('connection', (socket) => {
            const player = new Player(socket);

            socket.on('createGame', async (parameters: { gameId: string; playerName: string; isMultiplayer: boolean }) => {
                player.playerData.name = parameters.playerName;
                await this.matchmaking
                    .createGame(parameters.gameId, player, parameters.isMultiplayer)
                    .then(() => {
                        console.log('y1');
                        socket.emit('createGame');
                    })
                    .catch(() => {
                        console.log('e1');
                        socket.emit('error');
                    });
            });

            socket.on('joinResponse', async (parameters: { playerId: string; isAccepted: boolean }) => {
                await this.matchmaking
                    .handleHostDecision(player, parameters.playerId, parameters.isAccepted)
                    .then(() => {
                        socket.emit('joinResponse');
                    })
                    .catch(() => {
                        socket.emit('error');
                    });
            });

            socket.on('joinQueue', async (parameters: { gameId: string; playerName: string }) => {
                player.playerData.name = parameters.playerName;
                await this.matchmaking
                    .joinQueue(parameters.gameId, player)
                    .then(() => {
                        socket.emit('joinQueue');
                    })
                    .catch(() => {
                        socket.emit('error');
                    });
            });

            socket.on('joinLimitedGame', async (parameters: { isMultiplayer: boolean; playerName: string }) => {
                player.playerData.name = parameters.playerName;
                await this.matchmaking
                    .joinLimitedTimeGame(player, parameters.isMultiplayer)
                    .then(() => {
                        socket.emit('joinLimitedGame');
                    })
                    .catch(() => {
                        socket.emit('error');
                    });
            });

            socket.on('startGame', () => {
                player.startGame();
            });

            socket.on('leaveGame', () => {
                player.leaveGame();
            });

            socket.on('mouseClick', (coords: Vec2) => {
                player.clickDifference(coords);
            });

            socket.on('cheatMode', () => {
                player.cheat();
            });

            socket.on('roomMessage', (message: string) => {
                player.sendMessage(message);
            });

            socket.on('leaveQueue', () => {
                this.matchmaking.leaveQueue(player);
            });

            socket.on('disconnect', () => {
                this.matchmaking.leaveQueue(player);
            });
        });
    }
}
