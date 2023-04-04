import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ImageUploadCanvasComponent } from '@app/components/image-upload-canvas/image-upload-canvas.component';
import { GameData } from '@app/interfaces/game-data';
import { RequestHandler } from '@app/services/request-handler.service';
import { of } from 'rxjs';
import { CreationPageComponent } from './creation-page.component';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT } from '@app/const';

describe('CreationPageComponent', () => {
    let component: CreationPageComponent;
    let fixture: ComponentFixture<CreationPageComponent>;
    let requestHandlerSpy: jasmine.SpyObj<RequestHandler>;
    let routerSpyObj: jasmine.SpyObj<Router>;
    const NEW_NUMBER_OF_DIFFERENCES = 5;
    const imageData = new ImageData(DEFAULT_WIDTH, DEFAULT_HEIGHT);

    beforeEach(async () => {
        routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
        const requestHandlerSpyObj = jasmine.createSpyObj('RequestHandler', ['postImage', 'postGame']);
        await TestBed.configureTestingModule({
            declarations: [CreationPageComponent, ImageUploadCanvasComponent],
            providers: [{ provide: Router, useValue: routerSpyObj }, { provide: RequestHandler, useValue: requestHandlerSpyObj }, FormBuilder],
        }).compileComponents();

        requestHandlerSpy = TestBed.inject(RequestHandler) as jasmine.SpyObj<RequestHandler>;
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update the `pixels` property when `pixelChange` is called', () => {
        const value = 5;
        const event = { target: { value } };
        component.pixelChange(event);
        expect(component.pixels).toEqual(NEW_NUMBER_OF_DIFFERENCES);
    });

    it('should copy the first image to the second image component when `copyImage` is called', () => {
        component.imageComponents1.url = 'test-url';
        component.copyImage();
        expect(component.imageComponents2.url).toEqual('test-url');
    });

    it('should copy the second image to the first image component when `copyImage` is called', () => {
        component.imageComponents2.url = 'test-url';
        component.copyImage();
        expect(component.imageComponents1.url).toEqual('test-url');
    });

    it('should detect the differences between two images', (done) => {
        requestHandlerSpy.postImage.and.returnValue(of({ processedImage: 'result.png', numberOfDifferences: NEW_NUMBER_OF_DIFFERENCES }));

        component.imageComponents1.url = 'image1.png';
        component.imageComponents2.url = 'image2.png';
        component.pixels = 3;

        component.detectImage(true).then(() => {
            expect(component.detecturl).toEqual('result.png');
            expect(component.numberOfDifferences).toEqual(NEW_NUMBER_OF_DIFFERENCES);
            expect(component.showImage).toBeTrue();
            done();
        });
    });

    it('should not save the game and show an alert when `onSubmit` is called with invalid inputs', async () => {
        spyOn(component, 'detectImage');
        const alertSpy = spyOn(window, 'alert');

        // await component.onSubmit();
        // expect(requestHandlerSpy.postGame).not.toHaveBeenCalled();
        // expect(alertSpy).toHaveBeenCalledWith('Veuillez appuyer sur Detect avant de sauvegarder la partie');

        component.numberOfDifferences = 2;
        await component.onSubmit();
        expect(requestHandlerSpy.postGame).not.toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith("Le nombre de différences n'est pas valide !");
    });

    it('should show an error message if any form data is missing', async () => {
        spyOn(component, 'detectImage');
        component.gameCreationForm.setValue({
            name: 'Test Game',
            pixelRadius: null,
            image1: 'image1.jpg',
            image2: 'image2.jpg',
        });
        component.imageComponents1.url = 'image1.jpg';
        component.imageComponents2.url = 'image2.jpg';
        component.numberOfDifferences = NEW_NUMBER_OF_DIFFERENCES;

        const alertSpy = spyOn(window, 'alert');

        await component.onSubmit();

        expect(alertSpy).toHaveBeenCalledWith('Veuillez remplir tous les champs');
    });

    it('should save the game if all fields are valid', async () => {
        spyOn(component.textVerif, 'verifText').and.returnValue(true);
        spyOn(component, 'detectImage');
        spyOn(component, 'saveGame');
        component.gameCreationForm.setValue({
            name: 'Test Game',
            pixelRadius: '5',
            image1: 'image1.jpg',
            image2: 'image2.jpg',
        });
        component.numberOfDifferences = 5;
        component.imageComponents1.url = 'image1.jpg';
        component.imageComponents2.url = 'image2.jpg';
        await component.onSubmit();
        expect(component.saveGame).toHaveBeenCalled();
    });

    it('should not save the game if the name is not valid', async () => {
        const alertSpy = spyOn(window, 'alert');
        spyOn(component.textVerif, 'verifText').and.returnValue(false);
        spyOn(component, 'detectImage');
        spyOn(component, 'saveGame');
        component.gameCreationForm.setValue({
            name: ' TestGame',
            pixelRadius: '5',
            image1: 'image1.jpg',
            image2: 'image2.jpg',
        });
        component.numberOfDifferences = 5;
        component.imageComponents1.url = 'image1.jpg';
        component.imageComponents2.url = 'image2.jpg';
        await component.onSubmit();
        expect(alertSpy).toHaveBeenCalledWith('Nom de la partie invalide');
    });

    it('should navigate back in browser history when user confirms', () => {
        spyOn(window.history, 'back');
        spyOn(window, 'confirm').and.returnValue(true);
        component.quitPage();
        expect(window.history.back).toHaveBeenCalled();
    });

    it('should not navigate back in browser history when user cancels', () => {
        spyOn(window.history, 'back');
        spyOn(window, 'confirm').and.returnValue(false);
        component.quitPage();
        expect(window.history.back).not.toHaveBeenCalled();
    });

    it('should navigate to /config after saving the game', async () => {
        requestHandlerSpy.postGame.and.returnValue(of({}));
        const game: GameData = {
            id: '',
            name: 'Test Game',
            pixelRadius: '5',
            difficulty: '-',
            originalImage: 'image1.jpg',
            modifiedImage: 'image2.jpg',
            topSoloPlayers: ['-', '-', '-'],
            topVersusPlayers: ['-', '-', '-'],
            topSoloTimes: ['00:00', '00:00', '00:00'],
            topVersusTimes: ['00:00', '00:00', '00:00'],
            numberOfDifferences: 5,
        };
        await component.saveGame(game);
        expect(requestHandlerSpy.postGame).toHaveBeenCalledWith(game);
        expect(routerSpyObj.navigate).toHaveBeenCalledWith(['/config']);
    });

    it('should close image when showImage is false', () => {
        component.showImage = true;
        component.closeImage();
        expect(component.showImage).toBe(false);
    });

    it('should call detectImage if the number of differences is -1', () => {
        spyOn(component, 'detectImage');
        component.numberOfDifferences = -1;
        component.onSubmit();
        expect(component.detectImage).toHaveBeenCalled();
    });

    it('should update image components with file data when `uploadTwoImages` is called', async () => {
        // Create an input element to use as the event target
        const inputElement = document.createElement('input') as HTMLInputElement;
        inputElement.type = 'file';

        // Create a fake file object to use in the event
        const file = new File(['dummy data'], 'dummy-file.jpg', { type: 'image/jpeg' });
        const event = { target: inputElement } as unknown as Event & { target: HTMLInputElement & { files: FileList } };
        Object.defineProperty(event.target, 'files', { value: [file] });

        // Call the function and wait for any asynchronous tasks to complete
        component.uploadTwoImages(event);
        fixture.detectChanges();
        return fixture.whenStable().then(() => {
            // Verify that the image components were updated with the file data
            expect(component.imageComponents1.url).toBeTruthy();
            expect(component.imageComponents2.url).toBeTruthy();
        });
    });

    it('should set showImage to false when it is true', () => {
        component.showImage = true;
        component.closeImage();
        expect(component.showImage).toBeFalse();
    });

    it('should copy sketch data from component 2 to component 1 when id is 1', () => {
        spyOn(component.imageComponents2, 'getSketchData').and.returnValue({
            imageData,
        });
        spyOn(component.imageComponents1, 'copySketchData');

        component.onCopyCanvas(1);

        expect(component.imageComponents2.getSketchData).toHaveBeenCalled();
        expect(component.imageComponents1.copySketchData).toHaveBeenCalledWith({
            imageData,
        });
    });

    it('should copy sketch data from component 1 to component 2 when id is not 1', () => {
        spyOn(component.imageComponents1, 'getSketchData').and.returnValue({
            imageData,
        });
        spyOn(component.imageComponents2, 'copySketchData');

        component.onCopyCanvas(2);

        expect(component.imageComponents1.getSketchData).toHaveBeenCalled();
        expect(component.imageComponents2.copySketchData).toHaveBeenCalledWith({
            imageData,
        });
    });

    it('should copy the image data between components and update the stack', () => {
        spyOn(component.imageComponents1, 'getSketchData').and.returnValue(imageData);
        spyOn(component.imageComponents2, 'getSketchData').and.returnValue(imageData);
        spyOn(component.imageComponents1, 'copySketchData').and.callThrough();
        spyOn(component.imageComponents2, 'copySketchData').and.callThrough();

        component.changeCanvas();
        // expect getSketchData to be called on both components
        expect(component.imageComponents1.getSketchData).toHaveBeenCalled();
        expect(component.imageComponents2.getSketchData).toHaveBeenCalled();

        // expect copySketchData to be called on both components with the expected arguments
        expect(component.imageComponents1.copySketchData).toHaveBeenCalledWith(imageData);
        expect(component.imageComponents2.copySketchData).toHaveBeenCalledWith(imageData);

        // expect the current state to be pushed onto the drawing stack
        expect(component.drawingStack[1]).toEqual([imageData, imageData]);
        expect(component.redoStack).toEqual([]);
    });

    it('should push new state to drawingStack on onNewState()', () => {
        // Set up imageComponents
        spyOn(component.imageComponents1, 'getSketchData').and.returnValue(imageData);
        spyOn(component.imageComponents2, 'getSketchData').and.returnValue(imageData);

        // Call onNewState()
        component.onNewState();

        // Expect drawingStack to contain new state
        expect(component.drawingStack[1]).toEqual([imageData, imageData]);
    });

    it('should undo last drawing when there are more than one items in drawing stack', () => {
        component.imageComponents1.copySketchData(imageData);
        component.imageComponents2.copySketchData(imageData);
        component.drawingStack.push([imageData, imageData]);
        component.drawingStack.push([imageData, imageData]);

        // Call undoLastDrawing method
        component.undoLastDrawing();

        // Check if undo was successful
        expect(component.drawingStack.length).toBe(2);
        expect(component.redoStack.length).toBe(1);
        expect(component.imageComponents1.getSketchData()).toEqual(imageData);
        expect(component.imageComponents2.getSketchData()).toEqual(imageData);
    });

    it('should not undo last drawing when there is only one item in drawing stack', () => {
        component.imageComponents1.copySketchData(imageData);
        component.imageComponents2.copySketchData(imageData);

        // Call undoLastDrawing method
        component.undoLastDrawing();

        // Check if undo was unsuccessful
        expect(component.drawingStack.length).toBe(1);
        expect(component.redoStack.length).toBe(0);
        expect(component.imageComponents1.getSketchData()).toEqual(imageData);
        expect(component.imageComponents2.getSketchData()).toEqual(imageData);
    });

    it('should redo last drawing when there are items in redo stack', () => {
        component.imageComponents1.copySketchData(imageData);
        component.imageComponents2.copySketchData(imageData);
        component.drawingStack.push([imageData, imageData]);
        component.redoStack.push([imageData, imageData]);

        // Call redoLastDrawing method
        component.redoLastDrawing();

        // Check if redo was successful
        expect(component.drawingStack.length).toBe(3);
        expect(component.redoStack.length).toBe(0);
        expect(component.imageComponents1.getSketchData()).toEqual(imageData);
        expect(component.imageComponents2.getSketchData()).toEqual(imageData);
    });

    it('should not redo last drawing when there are no items in redo stack', () => {
        component.imageComponents1.copySketchData(imageData);
        component.imageComponents2.copySketchData(imageData);
        component.drawingStack.push([imageData, imageData]);

        // Call redoLastDrawing method
        component.redoLastDrawing();

        // Check if redo was unsuccessful
        expect(component.drawingStack.length).toBe(2);
        expect(component.redoStack.length).toBe(0);
        expect(component.imageComponents1.getSketchData()).toEqual(imageData);
        expect(component.imageComponents2.getSketchData()).toEqual(imageData);
    });

    it('should call undoLastDrawing() when ctrl+z is pressed', () => {
        spyOn(component, 'undoLastDrawing');
        const event = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
        component.onKeyDown(event);
        expect(component.undoLastDrawing).toHaveBeenCalled();
    });

    it('should call redoLastDrawing() when ctrl+shift+z is pressed', () => {
        spyOn(component, 'redoLastDrawing');
        const event = new KeyboardEvent('keydown', { keyCode: 90, ctrlKey: true, shiftKey: true });
        component.onKeyDown(event);
        expect(component.redoLastDrawing).toHaveBeenCalled();
    });
});
