import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game.service';
import { Subject } from 'rxjs';
import { ConfigPageComponent } from './config-page.component';

describe('ConfigPageComponent', () => {
    let component: ConfigPageComponent;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['connect', 'handleSockets', 'disconnect']);
        gameServiceSpy.joinableChangeObject = new Subject();
        component = new ConfigPageComponent(routerSpy, gameServiceSpy);

        TestBed.configureTestingModule({
            declarations: [ConfigPageComponent],
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

    it('should destroy', () => {
        component.ngOnDestroy();
        expect(gameServiceSpy.disconnect).toHaveBeenCalled();
    });
});
