/* eslint-disable max-lines */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AcceptComponent } from '@app/components/accept-pop-up/accept-pop-up.component';
import { ButtonTextPopComponent } from '@app/components/button-text-pop/button-text-pop.component';
import { PopupComponent } from '@app/components/player-name-dialog/player-name-dialog.component';
import { ACCEPTED, REFUSED } from '@app/const';
import { GameService } from '@app/services/game.service';
import { RequestHandler } from '@app/services/request-handler.service';
import { of, Subject } from 'rxjs';
import { Socket } from 'socket.io-client';
import { GameSheetComponent } from './game-sheet.component';

describe('GameSheetComponent', () => {
    let component: GameSheetComponent;
    let fixture: ComponentFixture<GameSheetComponent>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let requestHandlerSpy: jasmine.SpyObj<RequestHandler>;

    beforeEach(() => {
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        requestHandlerSpy = jasmine.createSpyObj('RequestHandler', ['deleteGame']);
        requestHandlerSpy.deleteGame.and.returnValue(of());
        gameServiceSpy = jasmine.createSpyObj('GameService', ['setupGame', 'joinGame', 'cancelGame', 'acceptPlayerConnection']);
        gameServiceSpy.joinableChangeObject = new Subject();
        TestBed.configureTestingModule({
            declarations: [GameSheetComponent, PopupComponent],
            providers: [
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: RequestHandler, useValue: requestHandlerSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GameSheetComponent);
        component = fixture.componentInstance;
        component.game = {
            id: '1',
            name: 'Game 1',
            pixelRadius: '10',
            difficulty: 'Easy',
            originalImage: '',
            modifiedImage: '',
            topSoloPlayers: [],
            topVersusPlayers: [],
            topSoloTimes: [],
            topVersusTimes: [],
            numberOfDifferences: 5,
            joinable: true,
        };
        component.isSelected = true;
        component.dialog = matDialogSpy;
        component.router = routerSpy;
        component.gameService = gameServiceSpy;
        component.requestHandler = requestHandlerSpy;
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should subscribe at joinableChangeObject of gameService', () => {
        const subscibeSpy = spyOn(gameServiceSpy.joinableChangeObject, 'subscribe');
        component.ngOnInit();
        expect(subscibeSpy).toHaveBeenCalled();
    });

    it('should change value of game.joinable when joinableChangeObject is called', () => {
        component.ngOnInit();
        gameServiceSpy.joinableChangeObject.next({ id: '1', value: false });
        expect(component.game.joinable).toBeFalse();
    });

    it('should not change value of game.joinable if wrong id', () => {
        component.ngOnInit();
        gameServiceSpy.joinableChangeObject.next({ id: '2', value: false });
        expect(component.game.joinable).toBeTruthy();
    });

    it('should unsubscribe when ngOnDestroy is called', () => {
        const unSubscribeSpy = spyOn(component.joinableSubscription, 'unsubscribe');
        component.ngOnDestroy();
        expect(unSubscribeSpy).toHaveBeenCalled();
    });

    it('should setup game and navigate to game page', async () => {
        spyOn(component, 'openPopUpName').and.returnValue(Promise.resolve('test'));
        await component.solo();

        expect(component.openPopUpName).toHaveBeenCalled();
        expect(component.gameService.setupGame).toHaveBeenCalled();
    });

    it('should join game', async () => {
        spyOn(component, 'openPopUpName').and.returnValue(Promise.resolve('test'));
        spyOn(component, 'joinGameView');
        await component.join();

        expect(component.openPopUpName).toHaveBeenCalled();
        expect(component.gameService.joinGame).toHaveBeenCalled();
        expect(component.joinGameView).toHaveBeenCalled();
    });

    it('should create game', async () => {
        spyOn(component, 'openPopUpName').and.returnValue(Promise.resolve('test'));
        spyOn(component, 'createGameView');
        await component.create();

        expect(component.openPopUpName).toHaveBeenCalled();
        expect(component.gameService.setupGame).toHaveBeenCalled();
        expect(component.createGameView).toHaveBeenCalled();
    });

    it('should open the PopupComponent and return the entered name', async () => {
        const removeDialogFromPopUpArraySpy = spyOn(component, 'removeDialogFromPopUpArray');

        const dialogRef = {
            afterClosed: () => of('test'),
            close: () => {
                ('');
            },
        } as MatDialogRef<PopupComponent, string>;

        matDialogSpy.open.and.returnValue(dialogRef);
        const result = await component.openPopUpName();

        expect(matDialogSpy.open).toHaveBeenCalledWith(PopupComponent, {
            width: '250px',
            data: { playerName: '' },
        });
        expect(removeDialogFromPopUpArraySpy).toHaveBeenCalled();
        expect(result).toBe('test');
    });

    it('joinGameView case when player leave waiting room', async () => {
        const handleJoinResponseSpy = spyOn(component, 'handleJoinResponse');
        const removeDialogFromPopUpArraySpy = spyOn(component, 'removeDialogFromPopUpArray');

        const socketSpy = {
            emit: (event: string) => {
                expect(event).toBe('leaveQueue');
            },
            off: (event: string) => {
                expect(event).toBe('joinResponse');
            },
        };

        component.gameService.socket = socketSpy as unknown as Socket;

        const dialogRef = {
            afterClosed: () => of('exit'),
            close: () => {
                ('');
            },
        } as MatDialogRef<ButtonTextPopComponent, string>;

        matDialogSpy.open.and.returnValue(dialogRef);
        await component.joinGameView();

        expect(removeDialogFromPopUpArraySpy).toHaveBeenCalled();
        expect(handleJoinResponseSpy).toHaveBeenCalled();
    });

    it('joinGameView case if player join', async () => {
        const handleJoinResponseSpy = spyOn(component, 'handleJoinResponse');
        const removeDialogFromPopUpArraySpy = spyOn(component, 'removeDialogFromPopUpArray');

        const dialogRef = {
            afterClosed: () => of(''),
            close: () => {
                ('');
            },
        } as MatDialogRef<ButtonTextPopComponent, string>;

        matDialogSpy.open.and.returnValue(dialogRef);
        await component.joinGameView();

        expect(removeDialogFromPopUpArraySpy).toHaveBeenCalled();
        expect(handleJoinResponseSpy).toHaveBeenCalled();
    });

    it('creationGameView case when player leave waiting room', async () => {
        const handleJoinRequestSpy = spyOn(component, 'handleJoinRequest');
        const handleDeletedGameSpy = spyOn(component, 'handleDeletedGame');
        const removeDialogFromPopUpArraySpy = spyOn(component, 'removeDialogFromPopUpArray');
        const dialogRef = {
            afterClosed: () => of('exit'),
            close: () => {
                ('');
            },
        } as MatDialogRef<ButtonTextPopComponent, string>;

        matDialogSpy.open.and.returnValue(dialogRef);
        await component.createGameView();

        expect(handleDeletedGameSpy).toHaveBeenCalled();
        expect(component.gameService.cancelGame).toHaveBeenCalled();
        expect(removeDialogFromPopUpArraySpy).toHaveBeenCalled();
        expect(handleJoinRequestSpy).toHaveBeenCalled();
    });

    it('creationGameView case player create', async () => {
        const handleJoinRequestSpy = spyOn(component, 'handleJoinRequest');
        const handleDeletedGameSpy = spyOn(component, 'handleDeletedGame');
        const removeDialogFromPopUpArraySpy = spyOn(component, 'removeDialogFromPopUpArray');
        const dialogRef = {
            afterClosed: () => of(''),
            close: () => {
                ('');
            },
        } as MatDialogRef<ButtonTextPopComponent, string>;

        matDialogSpy.open.and.returnValue(dialogRef);
        await component.createGameView();

        expect(handleDeletedGameSpy).toHaveBeenCalled();
        expect(component.gameService.cancelGame).not.toHaveBeenCalled();
        expect(removeDialogFromPopUpArraySpy).toHaveBeenCalled();
        expect(handleJoinRequestSpy).toHaveBeenCalled();
    });

    it('manageDecision should navigate to game is verdict is ACCEPTED', () => {
        const verdict = ACCEPTED;
        const closeAllPopUpsSpy = spyOn(component, 'closeAllPopUps');
        component.manageDecision(verdict, 'playerName');

        expect(closeAllPopUpsSpy).toHaveBeenCalled();
        expect(component.gameService.acceptPlayerConnection).toHaveBeenCalledWith('playerName', true);
    });

    it('manageDecision should call createGameView is verdict is REFUSED', () => {
        const verdict = REFUSED;

        component.manageDecision(verdict, 'playerName');

        expect(component.gameService.acceptPlayerConnection).toHaveBeenCalledWith('playerName', false);
    });

    it('handleJoinResponse should manage joining player if accepted', () => {
        const joinResponse = {
            isAccepted: true,
            gameData: {
                id: '2',
                name: 'test',
                pixelRadius: '3',
                difficulty: 'Facile',
                originalImage: 'testImage',
                modifiedImage: 'testModifiedImage',
                topSoloPlayers: ['test1', 'test2', 'test3'],
                topVersusPlayers: ['versus1', 'versus2', 'versus3'],
                topSoloTimes: ['0.00', '0.00', '0.00'],
                topVersusTimes: ['0.00', '0.00', '0.00'],
                numberOfDifferences: 6,
                joinable: true,
            },
        };

        const socketSpy = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === 'joinResponse') {
                    callback(joinResponse);
                } else if (event === 'error') {
                    callback();
                }
            }),
            off: () => {
                ('');
            },
        };

        const dialogRef = {
            afterClosed: () => of(''),
            close: () => {
                ('');
            },
        } as MatDialogRef<ButtonTextPopComponent, string>;

        const closeSpy = spyOn(dialogRef, 'close');
        const offSpy = spyOn(socketSpy, 'off');

        component.gameService.socket = socketSpy as unknown as Socket;

        component.handleJoinResponse(dialogRef);
        expect(offSpy).toHaveBeenCalled();
        expect(closeSpy).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('handleJoinResponse should manage joining player if refused', () => {
        const joinResponse = {
            isAccepted: false,
            gameData: {
                id: '2',
                name: 'test',
                pixelRadius: '3',
                difficulty: 'Facile',
                originalImage: 'testImage',
                modifiedImage: 'testModifiedImage',
                topSoloPlayers: ['test1', 'test2', 'test3'],
                topVersusPlayers: ['versus1', 'versus2', 'versus3'],
                topSoloTimes: ['0.00', '0.00', '0.00'],
                topVersusTimes: ['0.00', '0.00', '0.00'],
                numberOfDifferences: 6,
                joinable: true,
            },
        };

        const socketSpy = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === 'joinResponse') {
                    callback(joinResponse);
                } else if (event === 'error') {
                    callback();
                }
            }),
            off: () => {
                ('');
            },
        };

        const waitingRoom = {
            afterClosed: () => of(''),
            close: () => {
                ('');
            },
        } as MatDialogRef<ButtonTextPopComponent, string>;

        const closeSpy = spyOn(waitingRoom, 'close');
        const offSpy = spyOn(socketSpy, 'off');
        component.gameService.socket = socketSpy as unknown as Socket;

        component.handleJoinResponse(waitingRoom);
        expect(offSpy).toHaveBeenCalled();
        expect(closeSpy).toHaveBeenCalled();
        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('handleJoinRequest should manage request by joining player', () => {
        const removeDialogFromPopUpArraySpy = spyOn(component, 'removeDialogFromPopUpArray');
        const manageDecisionSpy = spyOn(component, 'manageDecision');
        const newPlayerName = 'newPlayer';
        const socketSpy = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === 'joinRequest') {
                    callback(newPlayerName);
                } else if (event === 'playerLeftQueue') {
                    callback(newPlayerName);
                }
            }),
            off: () => {
                ('');
            },
        };

        component.gameService.socket = socketSpy as unknown as Socket;

        const acceptPop = {
            afterClosed: () => of(''),
            close: () => {
                ('');
            },
        } as MatDialogRef<ButtonTextPopComponent, string>;

        matDialogSpy.open.and.returnValue(acceptPop);

        component.handleJoinRequest();

        expect(manageDecisionSpy).toHaveBeenCalled();
        expect(removeDialogFromPopUpArraySpy).toHaveBeenCalled();
    });

    it('handleJoinRequest should manage joining player left queue', () => {
        const removeDialogFromPopUpArraySpy = spyOn(component, 'removeDialogFromPopUpArray');
        const manageDecisionSpy = spyOn(component, 'manageDecision');
        const newPlayerName = 'newPlayer';

        const socketSpy = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === 'joinRequest') {
                    callback(newPlayerName);
                } else if (event === 'playerLeftQueue') {
                    callback(newPlayerName);
                }
            }),
            off: () => {
                ('');
            },
        };

        component.gameService.socket = socketSpy as unknown as Socket;

        const acceptPop = {
            afterClosed: () => of(''),
            close: () => {
                ('');
            },
        } as MatDialogRef<ButtonTextPopComponent, string>;

        matDialogSpy.open.and.returnValue(acceptPop);

        const dialogRef = jasmine.createSpyObj<MatDialogRef<AcceptComponent, string>>('MatDialogRef', ['close']);

        const mockPlayersJoining = new Map([['newPlayer', dialogRef]]);

        component.handleJoinRequest(mockPlayersJoining);

        expect(dialogRef.close).toHaveBeenCalledWith('leftQueue');
        expect(manageDecisionSpy).toHaveBeenCalled();
        expect(removeDialogFromPopUpArraySpy).toHaveBeenCalled();
    });

    it('handleDeletedGame should closeAllPopUps when game is deleted', () => {
        const closeAllPopUpsSpy = spyOn(component, 'closeAllPopUps');
        const gameId = '1';
        const socketSpy = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === 'deletedGame') {
                    callback(gameId);
                }
            }),
            off: () => {
                ('');
            },
        };

        component.gameService.socket = socketSpy as unknown as Socket;

        component.handleDeletedGame();

        expect(closeAllPopUpsSpy).toHaveBeenCalled();
        expect(component.gameService.cancelGame).toHaveBeenCalled();
        expect(matDialogSpy.open).toHaveBeenCalled();
    });

    it('should get the correct time', () => {
        const time = 5;
        component.game.topSoloTimes = ['100', '200', '300'];
        component.game.topVersusTimes = ['400', '500', '600'];
        expect(component.getTime(0, 'solo')).toBe('100');
        expect(component.getTime(1, 'versus')).toBe('500');
        expect(component.getTime(time, 'blabla')).toEqual('Spécifier si solo ou versus');
    });

    it('should call deleteGame from RequestHandler service', async () => {
        await component.deleteGame();
        expect(component.requestHandler.deleteGame).toHaveBeenCalled();
    });

    it('should remove the dialog reference from the popUpArray', () => {
        const dialogRef = {} as MatDialogRef<unknown>;
        component.popUpArray = [dialogRef];
        expect(component.popUpArray.length).toEqual(1);
        component.removeDialogFromPopUpArray(dialogRef);
        expect(component.popUpArray.length).toEqual(0);
    });

    it("should close all popups in the array with 'gameStarted' as the parameter", () => {
        const dialogRef = jasmine.createSpyObj<MatDialogRef<ButtonTextPopComponent, string>>('MatDialogRef', ['close']);
        const dialogRef1 = jasmine.createSpyObj<MatDialogRef<ButtonTextPopComponent, string>>('MatDialogRef', ['close']);
        component.popUpArray = [dialogRef, dialogRef1];

        component.closeAllPopUps();

        expect(dialogRef.close).toHaveBeenCalledWith('gameStarted');
        expect(dialogRef1.close).toHaveBeenCalledWith('gameStarted');
    });
});
