import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { EndGameComponent } from '@app/components/end-game-pop-up/end-game-pop-up.component';
import { SERVER_MESSAGE_FOUND_MULTIPLAYER, SERVER_MESSAGE_FOUND_SINGLPLAYER } from '@app/const';
import { GameService } from '@app/services/game.service';
import { TextVerification } from '@app/services/text-verification.service';
import { of } from 'rxjs';
describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let textVerificationSpy: jasmine.SpyObj<TextVerification>;

    const mockDialogRef = {
        componentInstance: {
            winner: false,
            winnerName: '',
        },
        afterClosed: () => of(true),
    };

    beforeEach(async () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        Audio.prototype.play = () => {}; // Function to stop the Audio from playing and causing problem in test engine, used in code
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        textVerificationSpy = jasmine.createSpyObj('TextVerifivation', ['verifText']);
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: {
                params: {
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
                },
            },
        });
        gameServiceSpy = jasmine.createSpyObj('GameService', ['startGame', 'disconnect', 'uploadImage', 'sendMessage', 'turnOffSocketGame'], {
            time: of({ min: 1, sec: 30 }),
            gameState: of({}),
            lastDifferenceFound: of({}),
            roomMessageObs: of('testMessage'),
            joinableChangeObject: of({}),
            totalDifferences: 5,
        });
        await TestBed.configureTestingModule({
            declarations: [GamePageComponent],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: TextVerification, useValue: textVerificationSpy },
                { provide: MatDialog, useValue: matDialogSpy, mockDialogRef },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.playerName = 'testPlayer';
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should unsubscribe on destroy', () => {
        spyOn(component['numDiffSubscription'], 'unsubscribe');
        spyOn(component['gameStateSubscription'], 'unsubscribe');
        spyOn(component['timeSubscription'], 'unsubscribe');
        spyOn(component['messagesSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(component['numDiffSubscription'].unsubscribe).toHaveBeenCalled();
        expect(component['gameStateSubscription'].unsubscribe).toHaveBeenCalled();
        expect(component['timeSubscription'].unsubscribe).toHaveBeenCalled();
        expect(component.gameService.disconnect).toHaveBeenCalled();
        expect(component['messagesSubscription'].unsubscribe).toHaveBeenCalled();
        expect(gameServiceSpy.turnOffSocketGame).toHaveBeenCalled();
    });

    it('should call router navigate on quitPage if confirmed', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        component.quitPage();
        expect(gameServiceSpy.sendMessage).toHaveBeenCalledWith('[Serveur] : testPlayer a abandonné la partie');
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/selection']);
    });

    it('should not call router navigate on quitPage if not confirmed', () => {
        spyOn(window, 'confirm').and.returnValue(false);
        component.quitPage();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should open the congratulations dialog when the game is won', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
        gameServiceSpy.gameState.next;
        expect(matDialogSpy.open).toHaveBeenCalledWith(EndGameComponent, { width: '500px' });
    });

    it('should add a difference found to player if singlePlayer', () => {
        component.differencesFoundPlayer = 0;
        component.addDifference(SERVER_MESSAGE_FOUND_SINGLPLAYER);
        expect(component.differencesFoundPlayer).toEqual(1);
    });

    it('should add a difference found to player if name is in messsage', () => {
        component.differencesFoundPlayer = 0;
        component.addDifference(SERVER_MESSAGE_FOUND_MULTIPLAYER + component.playerName);
        expect(component.differencesFoundPlayer).toEqual(1);
    });

    it('should add a difference found to opponent if opponentName is in messsage', () => {
        component.opponentName = 'opponentName';
        component.differencesFoundOpponent = 0;
        component.addDifference(SERVER_MESSAGE_FOUND_MULTIPLAYER + component.opponentName);
        expect(component.differencesFoundOpponent).toEqual(1);
    });

    it('should send a formatted message if the message respects the rules', async () => {
        textVerificationSpy.verifText.and.returnValue(await Promise.resolve(true));
        component.isMultiplayer = true;
        component.message = 'test';
        const goodMessage = 'this is a good message';
        expect(gameServiceSpy.sendMessage).toHaveBeenCalled();
        component.formatAndSend(goodMessage);
        expect(gameServiceSpy.sendMessage).toHaveBeenCalledWith('[' + component.playerName + ']' + ' : ' + goodMessage);
    });

    it('should not send a formatted message if the game is single player', async () => {
        textVerificationSpy.verifText.and.returnValue(await Promise.resolve(true));
        component.isMultiplayer = false;
        component.message = 'test';
        const goodMessage = 'this is a good message';
        component.formatAndSend(goodMessage);
        expect(gameServiceSpy.sendMessage).not.toHaveBeenCalledWith('[' + component.playerName + ']' + ' : ' + goodMessage);
    });

    it('should not send a formatted message if the message is not valid', async () => {
        textVerificationSpy.verifText.and.returnValue(await Promise.resolve(false));
        component.isMultiplayer = false;
        component.message = 'test';
        const goodMessage = '  this is not a good message';
        component.formatAndSend(goodMessage);
        expect(gameServiceSpy.sendMessage).not.toHaveBeenCalledWith('[' + component.playerName + ']' + ' : ' + goodMessage);
    });

    it('should set the opponentName when a new player connects', () => {
        const message = '[Serveur] : User2 connecté';
        component.analyzeMessage(message);
        expect(component.opponentName).toEqual('User2');
    });

    it('should call addDifference when one is found', () => {
        const differenceSpy = spyOn(component, 'addDifference');
        const message = SERVER_MESSAGE_FOUND_MULTIPLAYER + component.playerName;
        component.analyzeMessage(message);
        expect(differenceSpy).toHaveBeenCalled();
    });
});
