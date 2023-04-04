import { AfterViewInit, Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, TIMER_CHEAT } from '@app/const';
import { Vec2 } from '@app/interfaces/vec2';
import { DrawService } from '@app/services/draw.service';
import { GameService } from '@app/services/game.service';

export enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
    Back = 3,
    Forward = 4,
}

@Component({
    selector: 'app-play-area',
    templateUrl: './play-area.component.html',
    styleUrls: ['./play-area.component.scss'],
    providers: [DrawService],
})
export class PlayAreaComponent implements AfterViewInit {
    @Input() imageSource: string | null;
    @ViewChild('gridCanvas', { static: false }) private canvas!: ElementRef<HTMLCanvasElement>;
    @ViewChild('Canvas', { static: false }) private canvas2!: ElementRef<HTMLCanvasElement>;
    mousePosition: Vec2 = { x: 0, y: 0 };
    buttonPressed = '';
    test = '';
    canClick = true;
    isTKeyPressed = false;
    isDifferenceFound = false;

    private canvasSize = { x: DEFAULT_WIDTH, y: DEFAULT_HEIGHT };
    private readonly drawServiceImage: DrawService;
    private readonly drawServiceSketch: DrawService;
    constructor(private readonly gameService: GameService) {
        this.drawServiceImage = new DrawService();
        this.drawServiceSketch = new DrawService();
    }

    get width(): number {
        return this.canvasSize.x;
    }

    get height(): number {
        return this.canvasSize.y;
    }

    @HostListener('document:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (!(event.target instanceof HTMLInputElement)) {
            if (event.key.toLowerCase() === 't') {
                this.isTKeyPressed = !this.isTKeyPressed;
                if (this.isTKeyPressed) {
                    this.gameService.cheatMode();
                }
            }
        }
    }

    ngAfterViewInit(): void {
        const time = 1000;
        const notNullImage = this.imageSource || 'default value';
        this.drawServiceImage.context = this.canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.drawServiceSketch.context = this.canvas2.nativeElement.getContext('2d') as CanvasRenderingContext2D;
        this.drawServiceImage.drawImage(notNullImage);
        this.gameService.lastDifferenceFound.subscribe((difference) => {
            if (difference.length === 0) {
                this.drawServiceSketch.drawWord('ERREUR', this.mousePosition);
                this.canClick = false;
                setTimeout(() => {
                    this.canClick = true;
                }, time);
            } else {
                this.flashRed(difference);
                this.isDifferenceFound = true;
                setTimeout(() => {
                    this.flashRed(difference);
                    this.removeDifference(difference, this.gameService.originalImage);
                    this.isDifferenceFound = false;
                    this.gameService.cheatMode();
                }, time);
            }
        });

        this.gameService.cheatModeDifferences.subscribe((differences) => {
            this.activateCheat(differences);
        });
        this.drawServiceSketch.resetCanvas();

        this.canvas.nativeElement.focus();
    }

    removeDifference(difference: Vec2[], replacementReferenceImage: string) {
        this.drawServiceImage.copyPixels(difference, replacementReferenceImage);
    }

    flashRed(pixels: Vec2[]) {
        this.drawServiceSketch.flashPixels(pixels);
    }

    // TODO : déplacer ceci dans un service de gestion de la souris!
    mouseHitDetect(event: MouseEvent) {
        if (event.button === MouseButton.Left && this.canClick === true) {
            this.mousePosition = { x: event.offsetX, y: event.offsetY };
            this.gameService.sendDifference(this.mousePosition);
        }
    }

    async activateCheat(differences: Vec2[][]) {
        while (!this.isDifferenceFound && this.isTKeyPressed) {
            differences.forEach(async (difference) => {
                this.drawServiceSketch.drawRed(difference);
                await this.delay(TIMER_CHEAT);
                this.drawServiceSketch.resetCanvas();
                await this.delay(TIMER_CHEAT);
            });
            await new Promise((resolve) => setTimeout(resolve, 2 * TIMER_CHEAT));
        }
    }

    async delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
