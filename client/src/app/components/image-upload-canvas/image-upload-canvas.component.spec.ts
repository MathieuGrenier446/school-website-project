import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CLASSIC_BIT_DEPTH, DEFAULT_HEIGHT, DEFAULT_IMAGE, DEFAULT_WIDTH } from '@app/const';
import { DrawService } from '@app/services/draw.service';
import { ImageUploadCanvasComponent } from './image-upload-canvas.component';
const TIMEOUT = 3000;
const COORD_X = 10;
const COORD_Y = 20;

describe('ImageUploadCanvasComponent', () => {
    let component: ImageUploadCanvasComponent;
    let fixture: ComponentFixture<ImageUploadCanvasComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ImageUploadCanvasComponent],
            providers: [DrawService],
        }).compileComponents();
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(ImageUploadCanvasComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should resolve with true when the image has the correct size', async () => {
        const mockedImage = new Image();
        mockedImage.width = DEFAULT_WIDTH;
        mockedImage.height = DEFAULT_HEIGHT;
        spyOn(window, 'Image').and.returnValue(mockedImage);
        const checkSizePromise = component.checkSize();
        // Wait for the Promise to resolve
        const result = await checkSizePromise;
        expect(result).toBe(true);
    });

    it('should clear the image if the format is invalid', async () => {
        component.url = 'data:image/png;base64,iVBORw0KG...';
        await component.verifyImage();
        expect(component.url).toEqual(DEFAULT_IMAGE);
    });

    it('should clear the image if the bitdepth is invalid', async () => {
        const badBitDepth = 4;
        spyOn(component, 'getImageBitDepth').and.returnValue(Promise.resolve(badBitDepth));
        component.url = 'data:image/bmp;base64,iVBORw0KG...';
        await component.verifyImage();
        expect(component.url).toEqual(DEFAULT_IMAGE);
    });

    it('should clear the image if the size is invalid', async () => {
        spyOn(component, 'getImageBitDepth').and.returnValue(Promise.resolve(CLASSIC_BIT_DEPTH));
        component.url = 'data:image/bmp;base64,Qk32...';
        spyOn(component, 'checkSize').and.returnValue(Promise.resolve(false));
        await component.verifyImage();
        expect(component.url).toEqual(DEFAULT_IMAGE);
    });

    it('should not clear the image if the format and size are valid', async () => {
        spyOn(component, 'getImageBitDepth').and.returnValue(Promise.resolve(CLASSIC_BIT_DEPTH));
        component.url = 'data:image/bmp;base64,Qk32...';
        spyOn(component, 'checkSize').and.returnValue(Promise.resolve(true));
        await component.verifyImage();
        expect(component.url).not.toEqual(DEFAULT_IMAGE);
    });

    it('should set the url attribute on file selection', async () => {
        spyOn(component, 'getImageBitDepth').and.returnValue(Promise.resolve(CLASSIC_BIT_DEPTH));
        const file = new File(['content'], 'filename.bmp', { type: 'image/bmp' });
        const fakeEvent = { target: { files: [file] } } as unknown as Event;

        component.onFileSelected(fakeEvent);
        await new Promise((resolve) => setTimeout(resolve, TIMEOUT));

        expect(component.url).toEqual('data:image/bmp;base64,Y29udGVudA==');
    });

    it('should set url and draw image on canvas', () => {
        const spy = spyOn(component['drawServiceImage'], 'drawImage');
        const url = DEFAULT_IMAGE;
        component.setUrl(url);
        expect(component.url).toBe(url);
        expect(spy).toHaveBeenCalledWith(url);
    });

    it('should start drawing when mouse down event is triggered', () => {
        const drawServiceSketchSpy = spyOn(component['drawServiceSketch'], 'drawPen');
        const getImageDataSpy = spyOn(component['drawServiceSketch'].context, 'getImageData');
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: COORD_X,
            clientY: COORD_Y,
        });
        component.onMouseDown(mouseEvent);
        expect(component.isDrawing).toBeTrue();
        expect(component.lastX).toBe(COORD_X);
        expect(component.lastY).toBe(COORD_Y);
        expect(getImageDataSpy).toHaveBeenCalled();
        expect(drawServiceSketchSpy).toHaveBeenCalledWith(COORD_X, COORD_Y, COORD_X, COORD_Y, component.currentColor, component.currentSize);
    });

    it('should erase when eraser tool is selected', () => {
        const drawServiceSketchSpy = spyOn(component['drawServiceSketch'], 'erase');
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: COORD_X,
            clientY: COORD_Y,
        });
        component.currentTool = 'eraser';
        component.onMouseDown(mouseEvent);
        expect(component.isDrawing).toBeTrue();
        expect(drawServiceSketchSpy).toHaveBeenCalledWith(COORD_X, COORD_Y, component.currentSize);
    });

    it('should emit newState event on mouse up', () => {
        const emitSpy = spyOn(component.newState, 'emit');
        component.isDrawing = true;
        component.onMouseUp();
        expect(component.isDrawing).toBe(false);
        expect(emitSpy).toHaveBeenCalled();
    });

    it('should stop drawing when mouse moves outside canvas', () => {
        const onMouseUpSpy = spyOn(component, 'onMouseUp');
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: -5,
            clientY: -5,
        });
        component.onMouseMove(mouseEvent);
        expect(onMouseUpSpy).toHaveBeenCalledWith();
    });

    it('should draw a line with the pen tool when isDrawing is true', () => {
        const drawServiceSketchSpy = spyOn(component['drawServiceSketch'], 'drawPen');
        const finalCoordX = 5;
        const finalCoordY = 10;
        const size = 5;
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: COORD_X,
            clientY: COORD_Y,
        });
        component.isDrawing = true;
        component.lastX = finalCoordX;
        component.lastY = finalCoordY;
        component.currentColor = 'black';
        component.currentSize = size;
        component.currentTool = 'pen';
        component.onMouseMove(mouseEvent);
        expect(drawServiceSketchSpy).toHaveBeenCalledWith(finalCoordX, finalCoordY, COORD_X, COORD_Y, 'black', size);
        expect(component.lastX).toEqual(COORD_X);
        expect(component.lastY).toEqual(COORD_Y);
    });

    it('should draw a rectangle when the current tool is "rectangle" and isDrawing is true', () => {
        const drawRectangleSpy = spyOn(component['drawServiceSketch'], 'drawRectangle');
        const putImageDataSpy = spyOn(component['drawServiceSketch'].context, 'putImageData');
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: COORD_X,
            clientY: COORD_Y,
        });
        component.currentTool = 'rectangle';
        component.isDrawing = true;
        component.lastX = 0;
        component.lastY = 0;
        component.snapshot = {} as ImageData;
        component.onMouseMove(mouseEvent);
        expect(putImageDataSpy).toHaveBeenCalled();
        expect(drawRectangleSpy).toHaveBeenCalledWith(
            0,
            0,
            COORD_X,
            COORD_Y,
            component.currentColor,
            component.isFillColorChecked,
            component.isShiftPressed,
        );
    });

    it('should erase part of the canvas with the eraser tool when isDrawing is true', () => {
        const drawServiceSketchSpy = spyOn(component['drawServiceSketch'], 'erase');
        const size = 10;
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: COORD_X,
            clientY: COORD_Y,
        });
        component.isDrawing = true;
        component.currentSize = size;
        component.currentTool = 'eraser';
        component.onMouseMove(mouseEvent);
        expect(drawServiceSketchSpy).toHaveBeenCalledWith(COORD_X, COORD_Y, size);
    });

    it('should select the pen tool when selectTool is called with "pen"', () => {
        component.selectTool('pen');
        expect(component.currentTool).toEqual('pen');
    });

    it('should select the eraser tool when selectTool is called with "eraser"', () => {
        component.selectTool('eraser');
        expect(component.currentTool).toEqual('eraser');
    });

    it('should select the color "#00FF00" when selectColor is called with an event containing target.value of "#00FF00"', () => {
        const event = { target: { value: '#00FF00' } };
        component.selectColor(event);
        expect(component.currentColor).toEqual('#00FF00');
    });

    it('should merge the two canvases and return the base64-encoded URL', () => {
        // Create a mock canvas element
        const canvasElement = document.createElement('canvas');
        canvasElement.width = 500;
        canvasElement.height = 500;

        // Mock the imageCanvas and drawCanvas elements
        component['imageCanvas'] = { nativeElement: canvasElement };
        component['drawCanvas'] = { nativeElement: canvasElement };

        // Call the mergeCanvas function
        const mergedCanvas = component.mergeCanvas();

        // Check that the mergedCanvas is a base64-encoded URL
        expect(mergedCanvas).toMatch(/^data:image\/png;base64,/);
    });

    it('should clear the canvas', () => {
        spyOn(component.newState, 'emit');
        const resetCanvasSpy = spyOn(component['drawServiceSketch'], 'resetCanvas');
        component.clearCanvas();
        expect(resetCanvasSpy).toHaveBeenCalled();
        expect(component.newState.emit).toHaveBeenCalled();
    });

    it('should return the bit depth of an image', async () => {
        const bitDepth = await component.getImageBitDepth();
        // Default image has the good bitdepth
        expect(bitDepth).toEqual(CLASSIC_BIT_DEPTH);
    });

    it('should get the sketch data', () => {
        const getImageDataSpy = spyOn(component['drawServiceSketch'].context, 'getImageData');
        component.getSketchData();
        expect(getImageDataSpy).toHaveBeenCalledWith(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT);
    });

    it('should copy the sketch data to the canvas', () => {
        const putImageDataSpy = spyOn(component['drawServiceSketch'].context, 'putImageData');
        const sketchData = {} as ImageData;
        component.copySketchData(sketchData);
        expect(putImageDataSpy).toHaveBeenCalled();
    });

    it('should copy the canvas', () => {
        spyOn(component.copyDrawCanvas, 'emit');
        spyOn(component.newState, 'emit');
        component.copyCanvas();
        expect(component.copyDrawCanvas.emit).toHaveBeenCalled();
        expect(component.newState.emit).toHaveBeenCalled();
    });

    it('should set isShiftPressed to true when Shift key is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'Shift' });
        component.onKeyDown(event);
        expect(component.isShiftPressed).toBeTrue();
    });

    it('should set isShiftPressed to false when Shift key is released', () => {
        const event = new KeyboardEvent('keyup', { key: 'Shift' });
        component.onKeyUp(event);
        expect(component.isShiftPressed).toBeFalse();
    });
});
