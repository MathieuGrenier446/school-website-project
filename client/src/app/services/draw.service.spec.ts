import { TestBed } from '@angular/core/testing';
import { CanvasTestHelper } from '@app/classes/canvas-test-helper';
import { DrawService } from '@app/services/draw.service';

describe('DrawService', () => {
    let service: DrawService;
    let ctxStub: CanvasRenderingContext2D;

    const CANVAS_WIDTH = 640;
    const CANVAS_HEIGHT = 480;
    const time = 1100;
    const coordX = 50;
    const coordY = 50;
    const size = 5;
    const finalCoord = 100;
    const initialCoord = 200;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DrawService);
        ctxStub = CanvasTestHelper.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT).getContext('2d') as CanvasRenderingContext2D;
        service.context = ctxStub;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it(' width should return the width of the grid canvas', () => {
        expect(service.width).toEqual(CANVAS_WIDTH);
    });

    it(' height should return the height of the grid canvas', () => {
        expect(service.height).toEqual(CANVAS_HEIGHT);
    });

    it(' drawGrid should call moveTo and lineTo 4 times', () => {
        const expectedCallTimes = 4;
        const moveToSpy = spyOn(service.context, 'moveTo').and.callThrough();
        const lineToSpy = spyOn(service.context, 'lineTo').and.callThrough();
        service.drawGrid();
        expect(moveToSpy).toHaveBeenCalledTimes(expectedCallTimes);
        expect(lineToSpy).toHaveBeenCalledTimes(expectedCallTimes);
    });

    it(' drawGrid should color pixels on the canvas', () => {
        let imageData = service.context.getImageData(0, 0, service.width, service.height).data;
        const beforeSize = imageData.filter((x) => x !== 0).length;
        service.drawGrid();
        imageData = service.context.getImageData(0, 0, service.width, service.height).data;
        const afterSize = imageData.filter((x) => x !== 0).length;
        expect(afterSize).toBeGreaterThan(beforeSize);
    });

    it(' drawWord should call fillText on the canvas', () => {
        const fillTextSpy = spyOn(service.context, 'fillText').and.callThrough();
        const position = { x: 100, y: 100 };
        service.drawWord('test', position);
        expect(fillTextSpy).toHaveBeenCalled();
    });

    it(' drawWord should call fillText as many times as letters in a word', () => {
        const fillTextSpy = spyOn(service.context, 'fillText').and.callThrough();
        const word = 'test';
        const position = { x: 100, y: 100 };
        service.drawWord(word, position);
        expect(fillTextSpy).toHaveBeenCalledTimes(word.length);
    });

    it('should call the onload method when the image is loaded', async () => {
        const spy = spyOn(service.context, 'drawImage').and.callThrough();
        const url = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        service.drawImage(url);

        await new Promise((resolve) => {
            const image = new Image();
            image.src = url;
            image.onload = (res) => {
                resolve(res);
            };
        });

        expect(spy).toHaveBeenCalled();
    });

    it('should copy pixels from an image to the canvas', async () => {
        const difference = [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ];
        const replacementReferenceImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        service.copyPixels(difference, replacementReferenceImage);

        await new Promise((resolve) => {
            const image = new Image();
            image.src = replacementReferenceImage;
            image.onload = (res) => {
                for (const pixel of difference) {
                    service.context.drawImage(image, pixel.x, pixel.y, 1, 1, pixel.x, pixel.y, 1, 1);
                }
                resolve(res);
            };
        });
    });

    it('should draw all the pixels in the given array', () => {
        const fillRectSpy = spyOn(service.context, 'fillRect');
        const positionY = 20;

        const pixels = [
            { x: 10, y: positionY },
            { x: 30, y: positionY * 2 },
            { x: 50, y: 60 },
        ];

        service.drawPixels(pixels);

        expect(fillRectSpy).toHaveBeenCalledTimes(pixels.length);
        for (const pixel of pixels) {
            expect(fillRectSpy).toHaveBeenCalledWith(pixel.x, pixel.y, 1, 1);
        }
    });

    it('should call beginPath, moveTo, lineTo, stroke with correct parameters', () => {
        const beginPathSpy = spyOn(service.context, 'beginPath').and.callThrough();
        const moveToSpy = spyOn(service.context, 'moveTo').and.callThrough();
        const lineToSpy = spyOn(service.context, 'lineTo').and.callThrough();
        const strokeSpy = spyOn(service.context, 'stroke').and.callThrough();

        service.drawPen(0, 0, coordX, coordY, 'black', size);

        expect(beginPathSpy).toHaveBeenCalled();
        expect(moveToSpy).toHaveBeenCalledWith(0, 0);
        expect(lineToSpy).toHaveBeenCalledWith(coordX, coordY);
        expect(service.context.lineWidth).toEqual(size);
        expect(service.context.lineCap).toEqual('round');
        expect(service.context.strokeStyle).toEqual('#000000');
        expect(strokeSpy).toHaveBeenCalled();
    });

    it('should draw a rectangle with stroke when isFill is false and shift is not pressed', () => {
        const contextSpy = spyOn(service.context, 'strokeRect').and.callThrough();
        service.drawRectangle(finalCoord, finalCoord, initialCoord, initialCoord, '#000000', false, false);
        expect(contextSpy).toHaveBeenCalledWith(initialCoord, initialCoord, -finalCoord, -finalCoord);
    });

    it('should draw a rectangle with fill when isFill is true and shift is not pressed', () => {
        const contextSpy = spyOn(service.context, 'fillRect').and.callThrough();
        service.drawRectangle(finalCoord, finalCoord, initialCoord, initialCoord, '#000000', true, false);
        expect(contextSpy).toHaveBeenCalledWith(initialCoord, initialCoord, -finalCoord, -finalCoord);
    });

    it('should draw a square with stroke when isFill is false and shift is pressed', () => {
        const contextSpy = spyOn(service.context, 'strokeRect').and.callThrough();
        service.drawRectangle(finalCoord, finalCoord, initialCoord, initialCoord, '#000000', false, true);
        expect(contextSpy).toHaveBeenCalledWith(finalCoord, finalCoord, finalCoord, finalCoord);
    });

    it('should draw a square with fill when isFill is true and shift is pressed', () => {
        const contextSpy = spyOn(service.context, 'fillRect').and.callThrough();
        service.drawRectangle(finalCoord, finalCoord, initialCoord, initialCoord, '#000000', true, true);
        expect(contextSpy).toHaveBeenCalledWith(finalCoord, finalCoord, finalCoord, finalCoord);
    });

    it('should erase when you use the eraser', () => {
        spyOn(service.context, 'clearRect');
        const x = 50;
        const y = 50;
        service.erase(x, y, size);
        expect(service.context.clearRect).toHaveBeenCalledWith(x - size / 2, y - size / 2, size, size);
    });

    it('should reset the canvas', () => {
        spyOn(service.context, 'clearRect');
        service.resetCanvas();
        expect(service.context.clearRect).toHaveBeenCalledWith(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    });

    it('should fill the canvas in white', () => {
        spyOn(service.context, 'fillRect');
        service.fillWhite();
        expect(service.context.fillStyle).toEqual('#ffffff');
        expect(service.context.fillRect).toHaveBeenCalledWith(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    });

    it('should fill the specified pixels with red and then clear them after 1 second', async () => {
        const pixels = [
            { x: 10, y: 10 },
            { x: 20, y: 20 },
            { x: 30, y: 30 },
        ];
        spyOn(service.context, 'fillRect').and.callThrough();
        spyOn(service.context, 'clearRect').and.callThrough();

        service.flashPixels(pixels);
        await new Promise((resolve) => setTimeout(resolve, time));

        expect(service.context.fillStyle).toEqual('#ff0000');
        expect(service.context.fillRect).toHaveBeenCalledTimes(pixels.length);
        expect(service.context.clearRect).toHaveBeenCalledTimes(pixels.length);
    });

    it('should fill the specified pixels with red', () => {
        const pixels = [
            { x: 10, y: 10 },
            { x: 20, y: 20 },
            { x: 30, y: 30 },
        ];
        spyOn(service.context, 'fillRect').and.callThrough();

        service.drawRed(pixels);

        expect(service.context.fillStyle).toEqual('#ff0000');
        expect(service.context.fillRect).toHaveBeenCalledTimes(pixels.length);
    });
});
