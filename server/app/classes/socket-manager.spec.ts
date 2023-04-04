/* eslint-disable max-lines */
import * as GameClass from '@app/classes/game';
import { SocketManager } from '@app/classes/socket-manager';
import { Player } from '@app/classes/player';
import { GameDataService } from '@app/services/game-data.service';
import { Server } from 'app/server';
import { assert } from 'chai';
import * as sinon from 'sinon';
import { Socket as ClientSocket } from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import { Container } from 'typedi';

// Tiré du exemple de Nikolay : https://gitlab.com/nikolayradoev/socket-io-exemple/-/blob/master/server/app/services/socketManager.service.ts
class MockGame extends GameClass.Game {
    gameData = {
        id: '',
        name: '',
        pixelRadius: '',
        difficulty: '',
        originalImage: '',
        modifiedImage: '',
        topSoloPlayers: [],
        topVersusPlayers: [],
        topSoloTimes: [],
        topVersusTimes: [],
        numberOfDifferences: 0,
        differences: [[{ x: 0, y: 0 }], [{ x: 1, y: 1 }]],
    };
    constructor(...args: unknown[]) {
        super(args[0] as string, args[1] as (event: string, payload?: object | undefined) => void, args[2] as string, args[3] as GameDataService);
    }
    async init() {
        if (this.gameId === 'invalid') {
            throw new Error();
        }
        return new Promise<void>((resolve) => {
            resolve();
        });
    }
}

const RESPONSE_DELAY = 200;
const URL_STRING = 'http://localhost:5020';
const HOST_PLAYER = new Player('hostPlayerSocketID', 'Roger');
const JOINING_PLAYER = new Player('joiningPlayerSocketID', 'Denis');
const SOCKET_ROOM = 'testRoom';
const SINGLEPLAYER_GAME = new MockGame(
    '0',
    () => {
        return;
    },
    'singleplayer',
    Container.get(GameDataService),
);
const MULTIPLAYER_GAME = new MockGame(
    '1',
    () => {
        return;
    },
    'multiplayer',
    Container.get(GameDataService),
);
describe('SocketManager', () => {
    let socketManager: SocketManager;
    let server: Server;
    let clientSocket: Socket;

    const callSocketEvent = (eventName: string, payload: unknown = {}, room: string = SOCKET_ROOM) => {
        const spy = sinon.spy(socketManager['sio'], 'on');
        socketManager.handleSockets();
        const socket = {
            on: (event: string, callback: (data: unknown) => void) => {
                if (event === eventName) {
                    socket.data.room = room;
                    callback(payload);
                }
            },
            emit: sinon.spy(),
            join: sinon.spy(),
            data: { room },
            leave: sinon.spy(),
            id: 'joiningPlayerSocketID',
        };
        (spy.args[0][1] as (socket: unknown) => void)(socket);
    };

    beforeEach(async () => {
        server = Container.get(Server);
        server.init();
        socketManager = server['socketManager'];
        clientSocket = ioClient(URL_STRING);
        sinon.stub(GameClass, 'Game').callsFake((...args) => {
            return new MockGame(...args);
        });
    });

    afterEach(() => {
        clientSocket.close();
        socketManager['sio'].close();
        sinon.restore();
    });

    it('should emit error on a joinRequest event when game is not pending', (done) => {
        socketManager.pendingGames.delete(SOCKET_ROOM);
        const spy = sinon.spy(socketManager, 'emitError');
        const parameters = { index: '0', playerName: HOST_PLAYER.name };
        const eventName = 'joinRequest';
        callSocketEvent(eventName, parameters);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a joinRequest event when players are already waiting to join', (done) => {
        socketManager.playersWaitingToJoin.set(SOCKET_ROOM, [JOINING_PLAYER]);
        socketManager.pendingGames.set(MULTIPLAYER_GAME.gameId, SOCKET_ROOM);
        const spy = sinon.spy(socketManager, 'emitToRoom');
        const parameters = { index: MULTIPLAYER_GAME.gameId, playerName: HOST_PLAYER.name };
        const eventName = 'joinRequest';
        callSocketEvent(eventName, parameters);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a joinRequest event', (done) => {
        socketManager.pendingGames.set(MULTIPLAYER_GAME.gameId, SOCKET_ROOM);
        const spy = sinon.spy(socketManager, 'emitToRoom');
        const parameters = { index: MULTIPLAYER_GAME.gameId, playerName: HOST_PLAYER.name };
        const eventName = 'joinRequest';
        callSocketEvent(eventName, parameters);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a createGame event', (done) => {
        const parameters = { index: '0', gamemode: 'multiplayer', playerName: HOST_PLAYER.name };
        const eventName = 'createGame';
        callSocketEvent(eventName, parameters);
        setTimeout(() => {
            assert(socketManager.pendingGames.size === 1);
            done();
        }, RESPONSE_DELAY);
    });

    it('should emit error on a createGame event if the game does not exist', (done) => {
        const parameters = { index: 'invalid', gamemode: 'multiplayer', playerName: HOST_PLAYER.name };
        const eventName = 'createGame';
        const spy = sinon.spy(socketManager, 'emitError');
        callSocketEvent(eventName, parameters);
        setTimeout(() => {
            assert(spy.called);
            spy.restore();
            done();
        }, RESPONSE_DELAY);
    });

    it('should emit error on a joinResponse event if no players are waiting', (done) => {
        const spy = sinon.spy(socketManager, 'emitError');
        const parameters = { playerName: JOINING_PLAYER.name, isAccepted: true };
        const eventName = 'joinResponse';
        callSocketEvent(eventName, parameters);
        spy.restore();
        setTimeout(() => {
            assert(socketManager.playersWaitingToJoin.has(SOCKET_ROOM) === false);
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should emit error on a joinResponse event if no players of that name are waiting', (done) => {
        socketManager.playersWaitingToJoin.set(SOCKET_ROOM, [HOST_PLAYER]);
        const spy = sinon.spy(socketManager, 'emitError');
        const parameters = { playerName: JOINING_PLAYER.name, isAccepted: true };
        const eventName = 'joinResponse';
        callSocketEvent(eventName, parameters);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it("should emit error on a joinResponse event if the host's game no longer exists", (done) => {
        socketManager.playersWaitingToJoin.set(SOCKET_ROOM, [JOINING_PLAYER]);
        socketManager.games.delete(SOCKET_ROOM);
        const playerIndex = socketManager.playersWaitingToJoin.get(SOCKET_ROOM)?.findIndex((player) => {
            return player.name === JOINING_PLAYER.name;
        });
        const indexNotFound = -1;
        const spy = sinon.spy(socketManager, 'emitError');
        const parameters = { playerName: JOINING_PLAYER.name, isAccepted: true };
        const eventName = 'joinResponse';
        callSocketEvent(eventName, parameters);
        spy.restore();
        setTimeout(() => {
            assert(playerIndex !== indexNotFound);
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it("should emit error on a joinResponse event when the joining player's no longer exists", (done) => {
        socketManager.playersWaitingToJoin.set(SOCKET_ROOM, [JOINING_PLAYER]);
        socketManager.games.set(SOCKET_ROOM, MULTIPLAYER_GAME);
        const spy = sinon.spy(socketManager, 'emitError');
        const parameters = { playerName: JOINING_PLAYER.name, isAccepted: true };
        const eventName = 'joinResponse';
        callSocketEvent(eventName, parameters);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a joinResponse event when player has been accepted', (done) => {
        socketManager.playersWaitingToJoin.set(SOCKET_ROOM, [JOINING_PLAYER]);
        socketManager.games.set(SOCKET_ROOM, MULTIPLAYER_GAME);
        sinon.stub(socketManager, 'getSocket').callsFake((socketId: string) => {
            const socket = {
                id: socketId,
                join: sinon.spy(),
                data: { room: SOCKET_ROOM },
            } as unknown as ClientSocket;
            return socket;
        });
        const spy = sinon.spy(socketManager, 'emitToRoom');
        const parameters = { playerName: JOINING_PLAYER.name, isAccepted: true };
        const eventName = 'joinResponse';
        callSocketEvent(eventName, parameters);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            assert(MULTIPLAYER_GAME.players.length === 1);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a joinResponse event when player has been refused', (done) => {
        socketManager.playersWaitingToJoin.set(SOCKET_ROOM, [JOINING_PLAYER]);
        socketManager.games.set(SOCKET_ROOM, MULTIPLAYER_GAME);
        sinon.stub(socketManager, 'getSocket').callsFake((socketId: string) => {
            const socket = {
                id: socketId,
                join: sinon.spy(),
                data: { room: SOCKET_ROOM },
            } as unknown as ClientSocket;
            return socket;
        });
        const spy = sinon.spy(socketManager, 'emitToRoom');
        const parameters = { playerName: JOINING_PLAYER.name, isAccepted: false };
        const eventName = 'joinResponse';
        callSocketEvent(eventName, parameters);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            assert(MULTIPLAYER_GAME.players.length === 1);
            done();
        }, RESPONSE_DELAY);
    });

    it("should emit error on a startGame event if game doesn't exist", (done) => {
        socketManager.games.delete(SOCKET_ROOM);
        const eventName = 'startGame';
        const spy = sinon.spy(socketManager, 'emitError');
        callSocketEvent(eventName);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a startGame event', (done) => {
        socketManager.games.set(SOCKET_ROOM, MULTIPLAYER_GAME);
        const eventName = 'startGame';
        const spy = sinon.spy(MULTIPLAYER_GAME, 'startGame');
        const removePendingGameSpy = sinon.spy(socketManager, 'removePendingGame');
        callSocketEvent(eventName);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            assert(removePendingGameSpy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should remove waitingPlayers and emitError to them on a startGame event', (done) => {
        socketManager.games.set(SOCKET_ROOM, MULTIPLAYER_GAME);
        socketManager.playersWaitingToJoin.set(SOCKET_ROOM, [JOINING_PLAYER]);
        const eventName = 'startGame';
        const startGameSpy = sinon.spy(MULTIPLAYER_GAME, 'startGame');
        callSocketEvent(eventName);
        startGameSpy.restore();
        setTimeout(() => {
            assert(startGameSpy.called);
            assert(socketManager.playersWaitingToJoin.has(SOCKET_ROOM) === false);
            done();
        }, RESPONSE_DELAY);
    });

    it("should emit error on a leaveGame event if game doesn't exist", (done) => {
        socketManager.games.delete(SOCKET_ROOM);
        const eventName = 'leaveGame';
        const spy = sinon.spy(socketManager, 'emitError');
        callSocketEvent(eventName);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a leaveGame event', (done) => {
        socketManager.games.set(SOCKET_ROOM, MULTIPLAYER_GAME);
        const eventName = 'leaveGame';
        const spy = sinon.spy(MULTIPLAYER_GAME, 'disconnectPlayer');
        callSocketEvent(eventName);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it("should emit error on a mouseClick event if game doesn't exist", (done) => {
        socketManager.games.delete(SOCKET_ROOM);
        const eventName = 'mouseClick';
        const spy = sinon.spy(socketManager, 'emitError');
        callSocketEvent(eventName);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a mouseClick event', (done) => {
        socketManager.games.set(SOCKET_ROOM, MULTIPLAYER_GAME);
        const eventName = 'mouseClick';
        const spy = sinon.spy(MULTIPLAYER_GAME, 'checkCoordinate');
        callSocketEvent(eventName);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it("should emit error on a cheatMode event if game doesn't exist", (done) => {
        socketManager.games.delete(SOCKET_ROOM);
        const eventName = 'cheatMode';
        const spy = sinon.spy(socketManager, 'emitError');
        callSocketEvent(eventName);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a cheatMode event', (done) => {
        socketManager.games.set(SOCKET_ROOM, MULTIPLAYER_GAME);
        const eventName = 'cheatMode';
        const spy = sinon.spy(MULTIPLAYER_GAME, 'getAllDifferences');
        callSocketEvent(eventName);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should handle a roomMessage event', (done) => {
        socketManager.games.set(SOCKET_ROOM, MULTIPLAYER_GAME);
        const eventName = 'roomMessage';
        const spy = sinon.spy(socketManager, 'emitToRoom');
        callSocketEvent(eventName);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            done();
        }, RESPONSE_DELAY);
    });

    it('should not add pending game if game is singleplayer', (done) => {
        socketManager.addPendingGame(SOCKET_ROOM, SINGLEPLAYER_GAME);
        assert(socketManager.pendingGames.has(SINGLEPLAYER_GAME.gameId) === false);
        done();
    });

    it('should not remove pending game if game is singleplayer', (done) => {
        socketManager.pendingGames.set(SINGLEPLAYER_GAME.gameId, SOCKET_ROOM);
        socketManager.removePendingGame(SOCKET_ROOM, SINGLEPLAYER_GAME);
        assert(socketManager.pendingGames.has(SINGLEPLAYER_GAME.gameId) === true);
        done();
    });

    it('should emit the gameId to all sockets when game is deleted', (done) => {
        const spy = sinon.spy(socketManager.sio, 'emit');
        socketManager.gameDataService.lastDeletedGameId.next(MULTIPLAYER_GAME.gameId);
        spy.restore();
        assert(spy.calledWith('deletedGame', MULTIPLAYER_GAME.gameId));
        done();
    });

    it('should handle leaveQueue event', (done) => {
        socketManager.playersWaitingToJoin.set(SOCKET_ROOM, [JOINING_PLAYER, HOST_PLAYER]);
        socketManager.playersWaitingToJoin.set(SOCKET_ROOM + '1', [HOST_PLAYER]);
        const eventName = 'leaveQueue';
        const spy = sinon.spy(socketManager, 'emitToRoom');
        callSocketEvent(eventName);
        spy.restore();
        setTimeout(() => {
            assert(spy.called);
            assert(socketManager.playersWaitingToJoin.get(SOCKET_ROOM)?.length === 1);
            done();
        }, RESPONSE_DELAY);
    });
});
