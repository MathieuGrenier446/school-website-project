/* eslint-disable @angular-eslint/use-lifecycle-interface */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CLASSIC_BIT_DEPTH, DEFAULT_HEIGHT, DEFAULT_IMAGE, DEFAULT_SIZE, DEFAULT_WIDTH } from '@app/const';
import { Vec2 } from '@app/interfaces/vec2';
import { DrawService } from '@app/services/draw.service';

@Component({
    selector: 'app-image-upload-canvas',
    templateUrl: './image-upload-canvas.component.html',
    styleUrls: ['./image-upload-canvas.component.scss', './../../pages/creation-page/creation-page.component.scss'],
    providers: [DrawService],
})
export class ImageUploadCanvasComponent {
    @Input() id = '';
    @Output() copyDrawCanvas = new EventEmitter();
    @Output() newState = new EventEmitter();
    @ViewChild('imageCanvas', { static: false }) private imageCanvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('drawCanvas', { static: false }) private drawCanvas!: ElementRef<HTMLCanvasElement>;
    mousePosition: Vec2 = { x: 0, y: 0 };
    url = DEFAULT_IMAGE;
    isDrawing: boolean;
    lastX: number;
    lastY: number;
    currentTool: string = 'pen';
    currentColor: string = '#000';
    currentSize: number = DEFAULT_SIZE;
    isFillColorChecked = false;
    snapshot: any;
    isShiftPressed: boolean = false;

    private canvasSize = { x: DEFAULT_WIDTH, y: DEFAULT_HEIGHT };
    private readonly drawServiceImage: DrawService;
    private readonly drawServiceSketch: DrawService;
    constructor() {
        this.drawServiceImage = new DrawService();
        this.drawServiceSketch = new DrawService();
    }

    get width(): number {
        return this.canvasSize.x;
    }

    get height(): number {
        return this.canvasSize.y;
    }

    ngAfterViewInit(): void {
        this.drawServiceImage.context = this.imageCanvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.drawServiceImage.fillWhite();
        this.drawServiceSketch.context = this.drawCanvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
    }

    setUrl(url: string): void {
        this.url = url;
        this.drawServiceImage.drawImage(this.url);
    }

    async onFileSelected(event: Event) {
        const target = event.target as HTMLInputElement;

        if (target.files) {
            const file = target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                this.setUrl(reader.result as string);
                this.verifyImage();
            };
        }
    }

    isBmp() {
        return this.url.includes('bmp');
    }

    async checkSize(): Promise<boolean> {
        const image = new Image();
        image.src = this.url;

        return new Promise((resolve) => {
            image.onload = () => {
                resolve(image.width === DEFAULT_WIDTH && image.height === DEFAULT_HEIGHT);
            };
        });
    }

    async verifyImage() {
        if (!this.isBmp()) {
            window.alert('Format invalide');
            this.clearImage();
            return false;
        }

        const bitDepth = await this.getImageBitDepth();
        if (bitDepth !== CLASSIC_BIT_DEPTH) {
            window.alert('Profondeur des couleurs invalide');
            this.clearImage();
            return false;
        }

        let validSize;
        await this.checkSize().then((result) => (validSize = result));

        if (!validSize) {
            window.alert('Format invalide');
            this.clearImage();
            return false;
        }
        return true;
    }

    async getImageBitDepth(): Promise<number> {
        const bit = 28;
        const response = await fetch(this.url);
        const buffer = await response.arrayBuffer();
        const dataView = new DataView(buffer);
        const bitDepth = dataView.getUint16(bit, true);

        return bitDepth;
    }

    clearImage() {
        this.setUrl(DEFAULT_IMAGE);
    }

    onMouseDown(event: MouseEvent) {
        this.isDrawing = true;
        this.lastX = event.offsetX;
        this.lastY = event.offsetY;
        this.snapshot = this.drawServiceSketch.context.getImageData(0, 0, this.canvasSize.x, this.canvasSize.y);
        switch (this.currentTool) {
            case 'pen': {
                this.drawServiceSketch.drawPen(this.lastX, this.lastY, event.offsetX, event.offsetY, this.currentColor, this.currentSize);
                break;
            }
            case 'eraser': {
                this.drawServiceSketch.erase(event.offsetX, event.offsetY, this.currentSize);
                break;
            }
        }
    }

    onMouseUp() {
        if (this.isDrawing === true) {
            this.isDrawing = false;
            this.newState.emit();
        }
    }

    onMouseMove(event: MouseEvent) {
        if (event.offsetX < 0 || event.offsetX > this.canvasSize.x || event.offsetY < 0 || event.offsetY > this.canvasSize.y) {
            // Trigger the onMouseUp event handler to stop the drawing function
            this.onMouseUp();
            return;
        }
        switch (this.currentTool) {
            case 'pen': {
                if (this.isDrawing) {
                    this.drawServiceSketch.drawPen(this.lastX, this.lastY, event.offsetX, event.offsetY, this.currentColor, this.currentSize);
                    this.lastX = event.offsetX;
                    this.lastY = event.offsetY;
                }

                break;
            }
            case 'rectangle': {
                if (this.isDrawing) {
                    this.drawServiceSketch.context.putImageData(this.snapshot, 0, 0);
                    this.drawServiceSketch.drawRectangle(
                        this.lastX,
                        this.lastY,
                        event.offsetX,
                        event.offsetY,
                        this.currentColor,
                        this.isFillColorChecked,
                        this.isShiftPressed,
                    );
                }

                break;
            }
            case 'eraser': {
                if (this.isDrawing) {
                    this.drawServiceSketch.erase(event.offsetX, event.offsetY, this.currentSize);
                }

                break;
            }
            // No default
        }
    }

    selectTool(tool: string): void {
        this.currentTool = tool;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectColor(event: any): void {
        this.currentColor = event.target.value;
    }

    mergeCanvas(): string {
        const mergedCanvas = document.createElement('canvas');
        mergedCanvas.width = this.canvasSize.x;
        mergedCanvas.height = this.canvasSize.y;
        const context = mergedCanvas.getContext('2d');

        if (context != null) {
            // Draw the first canvas onto the merged canvas
            context.drawImage(this.imageCanvas.nativeElement, 0, 0);

            // Draw the second canvas onto the merged canvas
            context.drawImage(this.drawCanvas.nativeElement, 0, 0);
        }

        // Get the base64-encoded URL of the merged canvas
        const dataUrl = mergedCanvas.toDataURL('image/png;base64');
        return dataUrl;
    }

    clearCanvas() {
        this.drawServiceSketch.resetCanvas();
        this.newState.emit();
    }

    getSketchData(): any {
        return this.drawServiceSketch.context.getImageData(0, 0, this.canvasSize.x, this.canvasSize.y);
    }

    copySketchData(sketchData: any) {
        // this.clearCanvas();
        this.drawServiceSketch.context.putImageData(sketchData, 0, 0);
    }

    copyCanvas() {
        this.copyDrawCanvas.emit();
        this.newState.emit();
    }

    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Shift') {
            this.isShiftPressed = true;
        }
    }

    onKeyUp(event: KeyboardEvent) {
        if (event.key === 'Shift') {
            this.isShiftPressed = false;
        }
    }
}
