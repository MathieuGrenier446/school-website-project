import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameData } from '@app/interfaces/game-data';
import { GameService } from '@app/services/game.service';
import { RequestHandler } from '@app/services/request-handler.service';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ScrollBoxComponent } from './scroll-box.component';

describe('ScrollBoxComponent', () => {
    let component: ScrollBoxComponent;
    let fixture: ComponentFixture<ScrollBoxComponent>;
    let requestHandlerSpy: jasmine.SpyObj<RequestHandler>;
    const games: GameData[] = [
        {
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
        },
        {
            id: '2',
            name: 'Game 2',
            pixelRadius: '10',
            difficulty: 'Easy',
            originalImage: '',
            modifiedImage: '',
            topSoloPlayers: [],
            topVersusPlayers: [],
            topSoloTimes: [],
            topVersusTimes: [],
            numberOfDifferences: 3,
        },
        {
            id: '3',
            name: 'Game 3',
            pixelRadius: '10',
            difficulty: 'Easy',
            originalImage: '',
            modifiedImage: '',
            topSoloPlayers: [],
            topVersusPlayers: [],
            topSoloTimes: [],
            topVersusTimes: [],
            numberOfDifferences: 3,
        },
        {
            id: '4',
            name: 'Game 4',
            pixelRadius: '10',
            difficulty: 'Easy',
            originalImage: '',
            modifiedImage: '',
            topSoloPlayers: [],
            topVersusPlayers: [],
            topSoloTimes: [],
            topVersusTimes: [],
            numberOfDifferences: 3,
        },
        {
            id: '5',
            name: 'Game 5',
            pixelRadius: '10',
            difficulty: 'Easy',
            originalImage: '',
            modifiedImage: '',
            topSoloPlayers: [],
            topVersusPlayers: [],
            topSoloTimes: [],
            topVersusTimes: [],
            numberOfDifferences: 3,
        },
    ];

    beforeEach(() => {
        requestHandlerSpy = jasmine.createSpyObj('RequestHandler', ['getData']);
        requestHandlerSpy.getData.and.returnValue(of(games));
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ScrollBoxComponent],
            providers: [
                { provide: HttpClient },
                { provide: HttpHandler },
                { provide: GameService },
                { provide: RequestHandler, useValue: requestHandlerSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ScrollBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        const socketSpy = {
            off: jasmine.createSpy('off'),
        };
        component.gameService.socket = socketSpy as unknown as Socket;

        fixture.destroy();
        expect(socketSpy.off).toHaveBeenCalled();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call ngOnInit', async () => {
        const eventName = 'deletedGame';
        const response = '1';
        component.games = games;
        component.nPage = 2;

        const socketSpy = {
            on: jasmine.createSpy('on').and.callFake((event, callback) => {
                if (event === eventName) {
                    callback(response);
                }
            }),
        };

        component.gameService.socket = socketSpy as unknown as Socket;
        const newGames = games.filter((game) => game.id !== response);

        await component.ngOnInit();
        expect(component.games).toEqual(newGames);
        expect(component.nPage).toBe(1);
    });

    it('A click on next page should call nextPage', () => {
        spyOn(component, 'nextPage');
        component.nextPage();
        expect(component.nextPage).toHaveBeenCalled();
    });

    it('nextPage should not increment if currentPage equals nPage', () => {
        component.nPage = 0;
        component.currentPage = component.nPage - 1;
        expect(component.currentPage).toBe(component.nPage - 1);
    });

    it('nextPage should increment currentPage', () => {
        component.currentPage = 0;
        component.nPage = 2;
        component.nextPage();
        expect(component.currentPage).toBe(1);
    });

    it('A click on previous page should call previousPage', () => {
        spyOn(component, 'previousPage');
        component.previousPage();
        expect(component.previousPage).toHaveBeenCalled();
    });

    it('A click on previous page should call previousPage', () => {
        spyOn(component, 'previousPage');
        component.previousPage();
        expect(component.previousPage).toHaveBeenCalled();
    });

    it('previousPage should not decrement if currentPage equals 0', () => {
        component.currentPage = 0;
        component.previousPage();
        expect(component.currentPage).toBe(0);
    });

    it('previousPage should decrement currentPage', () => {
        component.currentPage = 1;
        component.previousPage();
        expect(component.currentPage).toBe(0);
    });

    it('previousPage should not decrement if currentPage equals 0', () => {
        component.previousPage();
        expect(component.currentPage).toBe(0);
    });

    it('displayedItems should return empty array if games is null', () => {
        expect(component.displayedItems).toBeNull();
    });

    it('displayedItems should return empty array if games is empty', () => {
        component.games = games;
        component.currentPage = 0;
        expect(component.displayedItems).toEqual([games[0], games[1], games[2], games[3]]);
    });
});
