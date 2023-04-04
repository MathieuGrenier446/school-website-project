import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { TIMER_CHEAT } from '@app/const';
import { Vec2 } from '@app/interfaces/vec2';

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let mouseEvent: MouseEvent;
    const offsetChange = 10;
    const RESPONSE_DELAY = 1000;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PlayAreaComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call drawService.drawWord if difference is empty', () => {
        spyOn(component['drawServiceSketch'], 'drawWord');
        component['gameService'].lastDifferenceFound.next([]);

        expect(component['drawServiceSketch'].drawWord).toHaveBeenCalledWith('ERREUR', component.mousePosition);
    });

    it('should call flashPixels from drawService when calling flashRed', () => {
        spyOn(component['drawServiceSketch'], 'flashPixels');
        component.flashRed([{ x: 1, y: 2 }]);
        expect(component['drawServiceSketch'].flashPixels).toHaveBeenCalledWith([{ x: 1, y: 2 }]);
    });

    it('should call copyPixels from drawService when calling flashRed', () => {
        spyOn(component['drawServiceImage'], 'copyPixels');
        component.removeDifference([{ x: 1, y: 2 }], 'referenceImage');
        expect(component['drawServiceImage'].copyPixels).toHaveBeenCalledWith([{ x: 1, y: 2 }], 'referenceImage');
    });

    it('should draw "ERREUR" on sketch canvas and set canClick to false after receiving empty difference', fakeAsync(() => {
        spyOn(component['drawServiceSketch'], 'drawWord');
        component['gameService'].lastDifferenceFound.next([]);
        tick();

        expect(component['drawServiceSketch'].drawWord).toHaveBeenCalledWith('ERREUR', component.mousePosition);
        expect(component.canClick).toBe(false);

        tick(RESPONSE_DELAY + 1);

        expect(component.canClick).toBe(true);
    }));

    it('should remove difference and call cheat mode after a timeout', (done) => {
        spyOn(component, 'flashRed');
        spyOn(component, 'removeDifference');
        spyOn(component['gameService'], 'cheatMode');

        const difference = [{ x: 1, y: 2 }];
        const originalImage = 'original image';
        component['gameService'].originalImage = originalImage;

        const mousePosition = { x: 10, y: 20 };
        component.mousePosition = mousePosition;

        component['gameService'].lastDifferenceFound.next(difference);

        component.ngAfterViewInit();

        setTimeout(() => {
            expect(component.flashRed).toHaveBeenCalledWith(difference);
            expect(component.removeDifference).toHaveBeenCalledWith(difference, originalImage);
            expect(component['gameService'].cheatMode).toHaveBeenCalled();
            expect(component.isDifferenceFound).toBe(false);
            done();
        }, RESPONSE_DELAY);
    });

    it('mouseHitDetect should not change the mouse position if it is not a left click', () => {
        const expectedPosition: Vec2 = { x: 0, y: 0 };
        mouseEvent = {
            offsetX: expectedPosition.x + offsetChange,
            offsetY: expectedPosition.y + offsetChange,
            button: 1,
        } as MouseEvent;
        component.mouseHitDetect(mouseEvent);
        expect(component.mousePosition).not.toEqual({ x: mouseEvent.offsetX, y: mouseEvent.offsetY });
        expect(component.mousePosition).toEqual(expectedPosition);
    });

    it('should set mousePosition and call gameService.sendDifference when the left mouse button is clicked', () => {
        mouseEvent = new MouseEvent('mousedown', { button: 0 });
        spyOn(component['gameService'], 'sendDifference');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component.mouseHitDetect(mouseEvent as any);

        expect(component.mousePosition).toEqual({ x: mouseEvent.offsetX, y: mouseEvent.offsetY });
        expect(component['gameService'].sendDifference).toHaveBeenCalledWith({ x: mouseEvent.offsetX, y: mouseEvent.offsetY });
    });

    it('should call activateCheat when subscribing to cheatModeDifferences', () => {
        const differences = [[{ x: 1, y: 2 }]];
        const spy = spyOn(component, 'activateCheat');

        component['gameService'].cheatModeDifferences.next(differences);

        expect(spy).toHaveBeenCalledWith(differences);
    });

    it('should toggle isTKeyPressed and call cheatMode when the "t" key is pressed', () => {
        const event = new KeyboardEvent('keyup', { key: 't' });
        spyOn(component['gameService'], 'cheatMode');

        expect(component.isTKeyPressed).toBeFalse();
        component.handleKeyboardEvent(event);
        expect(component.isTKeyPressed).toBeTrue();
        expect(component['gameService'].cheatMode).toHaveBeenCalled();

        // Press "t" key again
        component.handleKeyboardEvent(event);
        expect(component.isTKeyPressed).toBeFalse();
    });

    it('should not activate cheat if T key is not pressed', async () => {
        spyOn(component, 'delay').and.returnValue(Promise.resolve());
        component.isTKeyPressed = false;
        const differences = [[{ x: 1, y: 2 }]];
        spyOn(component['drawServiceSketch'], 'drawRed');
        spyOn(component['drawServiceSketch'], 'resetCanvas');

        await component.activateCheat(differences);

        expect(component['drawServiceSketch'].drawRed).not.toHaveBeenCalled();
        expect(component['drawServiceSketch'].resetCanvas).not.toHaveBeenCalled();
    });

    it('should activate cheat while the T key is pressed and differences are not found', async () => {
        const differences = [[{ x: 1, y: 2 }], [{ x: 3, y: 4 }]];
        spyOn(component, 'delay').and.returnValue(Promise.resolve());
        spyOn(component['drawServiceSketch'], 'drawRed');
        spyOn(component['drawServiceSketch'], 'resetCanvas');

        component.isTKeyPressed = true;

        const activateCheatPromise = component.activateCheat(differences);

        await component.delay(2 * TIMER_CHEAT);

        expect(component['drawServiceSketch'].drawRed).toHaveBeenCalledTimes(2);
        expect(component['drawServiceSketch'].resetCanvas).toHaveBeenCalledTimes(2);

        component.isTKeyPressed = false;

        await activateCheatPromise;
    });

    it('should stop activating cheat when the T key is released', async () => {
        const differences = [[{ x: 1, y: 2 }], [{ x: 3, y: 4 }]];
        spyOn(component, 'delay').and.returnValue(Promise.resolve());
        spyOn(component['drawServiceSketch'], 'drawRed');
        spyOn(component['drawServiceSketch'], 'resetCanvas');

        component.isTKeyPressed = true;

        const activateCheatPromise = component.activateCheat(differences);

        await component.delay(3 * TIMER_CHEAT);

        component.isTKeyPressed = false;

        await activateCheatPromise;

        expect(component['drawServiceSketch'].drawRed).toHaveBeenCalledTimes(2);
        expect(component['drawServiceSketch'].resetCanvas).toHaveBeenCalledTimes(2);
    });

    it('should delay for the specified amount of time', async () => {
        const delay1 = 1000;
        const delay2 = 1050;
        const startTime = Date.now();
        await component.delay(delay1);
        const endTime = Date.now();
        const elapsed = endTime - startTime;
        expect(elapsed).toBeGreaterThanOrEqual(delay1);
        expect(elapsed).toBeLessThan(delay2);
    });
});
