import { TestBed } from '@angular/core/testing';
import {
    SERVER_MESSAGE_FOUND_MULTIPLAYER,
    SERVER_MESSAGE_FOUND_SINGLPLAYER,
    SERVER_MESSAGE_NOT_FOUND_MULTIPLAYER,
    SERVER_MESSAGE_NOT_FOUND_SINGLEPLAYER,
} from '@app/const';
import { GameData } from '@app/interfaces/game-data';
import { Player } from '@app/interfaces/player';
import { Vec2 } from '@app/interfaces/vec2';
import { Socket } from 'socket.io-client';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let socket: Socket;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameService);
        service.connect();
        socket = service.socket;
        spyOn(service.socket, 'on');
        spyOn(socket, 'disconnect');
        spyOn(socket, 'emit');
        spyOn(socket, 'connect');
    });

    afterAll(() => {
        if (service.socket) {
            service.disconnect();
        }
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit "leaveGame" and "disconnect" the socket when disconnect() is called', () => {
        service.disconnect();
        expect(socket.disconnect).toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('leaveGame');
    });

    it('should set totalDifferences, call connect() and handleSockets() when setupGame() is called', async () => {
        const game: GameData = {
            numberOfDifferences: 3,
            id: '0',
            name: '',
            pixelRadius: '',
            difficulty: '',
            originalImage: '',
            modifiedImage: '',
            topSoloPlayers: [],
            topVersusPlayers: [],
            topSoloTimes: [],
            topVersusTimes: [],
        };
        service.disconnect();
        const index = '0';
        const totalDifferences = 3;
        const gamemode = 'singleplayer';
        const playerName = 'player';
        const asyncEmit = spyOn(service, 'asyncEmit').and.returnValue(Promise.resolve(game));
        await service.setupGame(index, gamemode, playerName);
        expect(asyncEmit).toHaveBeenCalled();
        expect(service.totalDifferences).toBe(totalDifferences);
    });

    it('should emit "joinRequest" when joinGame() is called', () => {
        const index = '0';
        const gamemode = 'singleplayer';
        const playerName = 'player';
        service.joinGame(index, gamemode, playerName);
        expect(socket.emit).toHaveBeenCalledWith('joinRequest', { index, playerName });
    });

    it('should emit "startGame" when startGame() is called', () => {
        service.startGame();
        expect(socket.emit).toHaveBeenCalledWith('startGame');
    });

    it('should set originalImage when uploadImage() is called', () => {
        const image = 'image';
        service.uploadImage(image);
        expect(service.originalImage).toBe(image);
    });

    it('should emit "mouseClick" with the correct coordinates when sendDifference() is called', () => {
        const coords: Vec2 = { x: 0, y: 0 };
        service.sendDifference(coords);
        expect(socket.emit).toHaveBeenCalledWith('mouseClick', coords);
    });

    it('should emit "joinResponse" with the correct playerName and isAccepted when acceptPlayerConnection() is called', () => {
        const playerName = 'player';
        const isAccepted = true;
        service.acceptPlayerConnection(playerName, isAccepted);
        expect(socket.emit).toHaveBeenCalledWith('joinResponse', { playerName, isAccepted });
    });

    it('should turn off chanel when turnOffSocketGame is called', () => {
        const offTurnOffSocketGameSpy = spyOn(service.socket, 'off');
        service.turnOffSocketGame();
        expect(offTurnOffSocketGameSpy).toHaveBeenCalledWith('timerTick');
        expect(offTurnOffSocketGameSpy).toHaveBeenCalledWith('differenceFound');
        expect(offTurnOffSocketGameSpy).toHaveBeenCalledWith('roomMessage');
    });

    it('should handle "timerTick" event and update time', () => {
        const eventName = 'timerTick';
        const params = { time: 'time' };
        const spySocket = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === eventName) {
                    callback(params);
                }
            }),
        };
        service.socket = spySocket as unknown as Socket;
        service.time.asObservable().subscribe((time: object) => {
            expect(time).toEqual(params);
        });
        service.handleSockets();
    });

    it('should handle "endGame" event and update gameState', () => {
        const eventName = 'endGame';
        const params: Player = { socketID: 'socketID', name: 'name', differencesFound: 0 };
        const spySocket = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === eventName) {
                    callback(params);
                }
            }),
        };
        service.socket = spySocket as unknown as Socket;
        service.gameState.asObservable().subscribe((gameState: object) => {
            expect(gameState).toEqual(params);
        });
        service.handleSockets();
    });

    it('should handle "differenceFound" and call addMessageSingleplayer() for a singleplayer game', () => {
        const addMessageSingleplayerSpy = spyOn(service, 'addMessage');
        service.gamemode = 'singleplayer';
        const eventName = 'differenceFound';
        const coords: Vec2[] = [];
        const params = { difference: coords, player: 'test Name' };
        const spySocket = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === eventName) {
                    callback(params);
                }
            }),
        };
        service.socket = spySocket as unknown as Socket;
        service.lastDifferenceFound.asObservable().subscribe((differenceAndName: object) => {
            expect(differenceAndName).toEqual(params.difference);
        });

        service.handleSockets();
        expect(addMessageSingleplayerSpy).toHaveBeenCalled();
    });

    it('should handle "differenceFound" and call addMessageMulitplayer() for a multiplayer game', () => {
        const addMessageMulitplayerSpy = spyOn(service, 'addMessageMultiplayer');
        service.gamemode = 'multiplayer';
        const eventName = 'differenceFound';
        const coords: Vec2[] = [];
        const params = { difference: coords, player: 'test Name' };
        const spySocket = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === eventName) {
                    callback(params);
                }
            }),
        };
        service.socket = spySocket as unknown as Socket;
        service.lastDifferenceFound.asObservable().subscribe((differenceAndName: object) => {
            expect(differenceAndName).toEqual(params.difference);
        });
        service.handleSockets();
        expect(addMessageMulitplayerSpy).toHaveBeenCalled();
    });

    it('should handle "roomMessage" event call addMessage()', () => {
        const addMessageSpy = spyOn(service, 'addMessage');
        const eventName = 'roomMessage';
        const params = 'message';
        const spySocket = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === eventName) {
                    callback(params);
                }
            }),
        };
        service.socket = spySocket as unknown as Socket;
        service.handleSockets();
        expect(addMessageSpy).toHaveBeenCalled();
    });

    it('should handle "changeJoinable" event and update joinableChangeObject', () => {
        const eventName = 'changeJoinable';
        const params = { id: '1', value: true };
        const spySocket = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === eventName) {
                    callback(params);
                }
            }),
        };
        service.socket = spySocket as unknown as Socket;
        service.joinableChangeObject.asObservable().subscribe((joinableChangeObject: object) => {
            expect(joinableChangeObject).toEqual(params);
        });
        service.handleSockets();
    });

    it('should call addMessage when nbDifference is greater than 0 for singlplayer', () => {
        const addMessageSpy = spyOn(service, 'addMessage');
        const nbDifferences = 1;
        service.addMessageSingleplayer(nbDifferences);
        expect(addMessageSpy).toHaveBeenCalledWith(SERVER_MESSAGE_FOUND_SINGLPLAYER);
    });

    it('should call addMessage when nbDifference is equal to 0 for singlplayer', () => {
        const addMessageSpy = spyOn(service, 'addMessage');
        const nbDifferences = 0;
        service.addMessageSingleplayer(nbDifferences);
        expect(addMessageSpy).toHaveBeenCalledWith(SERVER_MESSAGE_NOT_FOUND_SINGLEPLAYER);
    });

    it('should call addMessage when nbDifference is greater than 0 for multiplayer', () => {
        const addMessageSpy = spyOn(service, 'addMessage');
        const nbDifferences = 1;
        const playerName = 'playerName';
        service.addMessageMultiplayer(nbDifferences, playerName);
        expect(addMessageSpy).toHaveBeenCalledWith(SERVER_MESSAGE_FOUND_MULTIPLAYER + playerName);
    });

    it('should call addMessage when nbDifference is equal to 0 for multiplayer', () => {
        const addMessageSpy = spyOn(service, 'addMessage');
        const nbDifferences = 0;
        const playerName = 'playerName';
        service.addMessageMultiplayer(nbDifferences, playerName);
        expect(addMessageSpy).toHaveBeenCalledWith(SERVER_MESSAGE_NOT_FOUND_MULTIPLAYER + playerName);
    });

    it('should call asyncEmit("cheatMode") when cheatMode() is called', async () => {
        const cheatDifferences: Vec2[][] = [[{ x: 0, y: 0 }]];
        const asyncEmit = spyOn(service, 'asyncEmit').and.returnValue(Promise.resolve(cheatDifferences));
        await service.cheatMode();
        expect(asyncEmit).toHaveBeenCalled();
    });

    it('should call addMessage() and emit to "roomMessage" when sendMessage is called', () => {
        const message = 'message';
        service.sendMessage(message);
        expect(socket.emit).toHaveBeenCalledWith('roomMessage', message);
    });

    it('should emit an event and receive a response', async () => {
        const eventName = 'testEvent';
        const testData = { test: 'data' };
        const testResponse = { test: 'response' };

        const spySocket = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === eventName) {
                    callback(testResponse);
                }
            }),

            emit: jasmine.createSpy('emit'),
            off: jasmine.createSpy('off'),
        };
        service.socket = spySocket as unknown as Socket;

        const result = await service.asyncEmit(eventName, testData);

        expect(service.socket.off).toHaveBeenCalled();
        expect(service.socket.emit).toHaveBeenCalledWith(eventName, testData);
        expect(result).toEqual(testResponse);
    });

    it('should call updapte roomMessageObs when addMessage() is called', () => {
        const nextMessage = 'message';

        service.roomMessageObs.asObservable().subscribe((message: string) => {
            expect(message).toEqual(nextMessage);
        });

        service.addMessage(nextMessage);
    });

    it('should emit to leaveGame when cancelGame() is called', () => {
        service.cancelGame();
        expect(socket.emit).toHaveBeenCalledWith('leaveGame');
    });
});
