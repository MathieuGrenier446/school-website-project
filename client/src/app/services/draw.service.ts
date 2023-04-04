/* eslint-disable max-params */
/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Vec2 } from '@app/interfaces/vec2';

// TODO : Avoir un fichier séparé pour les constantes et ne pas les répéter!
export const DEFAULT_WIDTH = 640;
export const DEFAULT_HEIGHT = 480;

@Injectable({
    providedIn: 'root',
})
export class DrawService {
    context: CanvasRenderingContext2D;
    private canvasSize: Vec2 = { x: DEFAULT_WIDTH, y: DEFAULT_HEIGHT };

    get width(): number {
        return this.canvasSize.x;
    }

    get height(): number {
        return this.canvasSize.y;
    }

    // TODO : pas de valeurs magiques!! Faudrait avoir une meilleure manière de le faire
    /* eslint-disable @typescript-eslint/no-magic-numbers */
    drawGrid() {
        this.context.beginPath();
        this.context.strokeStyle = 'black';
        this.context.lineWidth = 3;

        this.context.moveTo((this.width * 3) / 10, (this.height * 4) / 10);
        this.context.lineTo((this.width * 7) / 10, (this.height * 4) / 10);

        this.context.moveTo((this.width * 3) / 10, (this.height * 6) / 10);
        this.context.lineTo((this.width * 7) / 10, (this.height * 6) / 10);

        this.context.moveTo((this.width * 4) / 10, (this.height * 3) / 10);
        this.context.lineTo((this.width * 4) / 10, (this.height * 7) / 10);

        this.context.moveTo((this.width * 6) / 10, (this.height * 3) / 10);
        this.context.lineTo((this.width * 6) / 10, (this.height * 7) / 10);

        this.context.stroke();
    }

    drawWord(word: string, startPosition: Vec2) {
        const step = 20;
        this.context.font = '20px system-ui';
        this.context.fillStyle = 'red';
        word.split('').forEach((letter, i) => {
            this.context.fillText(letter, startPosition.x + step * i, startPosition.y);
        });

        setTimeout(() => {
            this.resetCanvas();
        }, 1000);
    }

    drawImage(url: string) {
        const image = new Image();
        image.src = url;
        image.onload = () => {
            this.context.drawImage(image, 0, 0, this.canvasSize.x, this.canvasSize.y);
        };
    }

    copyPixels(difference: Vec2[], replacementReferenceImage: string) {
        const image = new Image();
        image.src = replacementReferenceImage;
        image.onload = () => {
            for (const pixel of difference) {
                this.context.drawImage(image, pixel.x, pixel.y, 1, 1, pixel.x, pixel.y, 1, 1);
            }
        };
    }

    drawPixels(pixels: Vec2[]) {
        this.context.fillStyle = 'red';

        for (const pixel of pixels) {
            this.context.fillRect(pixel.x, pixel.y, 1, 1);
        }
    }

    drawPen(lastX: number, lastY: number, x: number, y: number, color: string, size: number) {
        this.context.beginPath();
        this.context.moveTo(lastX, lastY);
        this.context.lineTo(x, y);
        this.context.lineWidth = size;
        this.context.lineCap = 'round';
        this.context.strokeStyle = color;
        this.context.stroke();
    }

    drawRectangle(lastX: number, lastY: number, x: number, y: number, color: string, isFill: boolean, isShiftPressed: boolean) {
        this.context.strokeStyle = color;
        this.context.fillStyle = color;
        this.context.lineWidth = 5;
        const width = lastX - x;
        const height = lastY - y;

        if (isShiftPressed) {
            // Calculate the length of the square's side
            const side = Math.abs(Math.max(width, height));
            const directionX = Math.sign(width);
            const directionY = Math.sign(height);

            if (!isFill) {
                this.context.strokeRect(lastX, lastY, -side * directionX, -side * directionY);
            } else {
                this.context.fillRect(lastX, lastY, -side * directionX, -side * directionY);
            }
        } else {
            // Draw a rectangle
            if (!isFill) {
                this.context.strokeRect(x, y, width, height);
            } else {
                this.context.fillRect(x, y, width, height);
            }
        }
    }

    erase(x: number, y: number, size: number): void {
        const halfSize = size / 2;
        this.context.clearRect(x - halfSize, y - halfSize, size, size);
    }

    resetCanvas(): void {
        this.context.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);
    }

    flashPixels(pixels: Vec2[]) {
        this.context.fillStyle = 'red';

        for (const pixel of pixels) {
            this.context.fillRect(pixel.x, pixel.y, 1, 1);
        }

        setTimeout(() => {
            for (const pixel of pixels) {
                this.context.clearRect(pixel.x, pixel.y, 1, 1);
            }
        }, 1000);
    }

    drawRed(pixels: Vec2[]) {
        this.context.fillStyle = 'red';

        for (const pixel of pixels) {
            this.context.fillRect(pixel.x, pixel.y, 1, 1);
        }
    }

    fillWhite() {
        this.context.fillStyle = 'white';
        this.context.fillRect(0, 0, this.canvasSize.x, this.canvasSize.y);
    }
}
