import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game.service';
import { SelectionPageComponent } from './selection-page.component';

describe('SelectionPageComponent', () => {
    let component: SelectionPageComponent;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['connect', 'handleSockets', 'disconnect']);
        component = new SelectionPageComponent(routerSpy, gameServiceSpy);

        TestBed.configureTestingModule({
            declarations: [SelectionPageComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        }).compileComponents();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to the main page when quitPage is called', () => {
        component.quitPage();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/main-page']);
    });
});
