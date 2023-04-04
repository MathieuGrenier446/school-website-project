/* eslint-disable deprecation/deprecation */
/* eslint-disable @angular-eslint/use-lifecycle-interface */
/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable @typescript-eslint/no-explicit-any
import { Component, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ImageUploadCanvasComponent } from '@app/components/image-upload-canvas/image-upload-canvas.component';
import { DEFAULT_IMAGE, LENGTH_NAME } from '@app/const';
import { GameData } from '@app/interfaces/game-data';
import { RequestHandler } from '@app/services/request-handler.service';
import { TextVerification } from '@app/services/text-verification.service';
import { firstValueFrom } from 'rxjs';

const defaultNumberOfDifferences = -1;

@Component({
    selector: 'app-creation-page',
    templateUrl: './creation-page.component.html',
    styleUrls: ['./creation-page.component.scss'],
})
export class CreationPageComponent {
    @ViewChild('one') imageComponents1: ImageUploadCanvasComponent;

    @ViewChild('two') imageComponents2: ImageUploadCanvasComponent;

    img = ['img1', 'img2'];
    pixels = 3;
    showImage = false;
    detecturl: string;
    numberOfDifferences: number = defaultNumberOfDifferences;
    gameCreationForm = this.formBuilder.group({
        name: '',
        pixelRadius: '',
        image1: '',
        image2: '',
    });
    selectedRadio = '3';
    drawingStack: any[] = [];
    redoStack: any[] = [];

    constructor(
        readonly requestHandler: RequestHandler,
        public textVerif: TextVerification,
        private formBuilder: FormBuilder,
        public router: Router,
    ) {}

    ngAfterViewInit(): void {
        const data1 = this.imageComponents1.getSketchData();
        const data2 = this.imageComponents2.getSketchData();
        this.drawingStack.push([data1, data2]);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pixelChange(event: any) {
        this.pixels = event.target.value;
    }

    copyImage() {
        if (this.imageComponents1.url !== DEFAULT_IMAGE) {
            this.imageComponents2.setUrl(this.imageComponents1.url);
        } else if (this.imageComponents2.url !== DEFAULT_IMAGE) {
            this.imageComponents1.setUrl(this.imageComponents2.url);
        }
    }

    async detectImage(isDetectPress: boolean) {
        const url1 = this.imageComponents1.mergeCanvas();
        const url2 = this.imageComponents2.mergeCanvas();
        this.imageComponents2.mergeCanvas();

        const postResponse = await firstValueFrom(this.requestHandler.postImage(url1, url2, this.pixels));

        this.detecturl = postResponse.processedImage;
        this.numberOfDifferences = +postResponse.numberOfDifferences;
        this.showImage = isDetectPress;
    }

    async onSubmit() {
        const minimum = 3;
        const maximum = 9;
        const formData = this.gameCreationForm.value;
        formData.image1 = this.imageComponents1.mergeCanvas();
        formData.image2 = this.imageComponents2.mergeCanvas();

        const isDetectPress = false;
        await this.detectImage(isDetectPress);

        const isNumberDifferencesValid = this.numberOfDifferences >= minimum && this.numberOfDifferences <= maximum;
        if (!isNumberDifferencesValid) {
            window.alert("Le nombre de différences n'est pas valide !");
            return;
        }

        if (formData.name && formData.pixelRadius) {
            const game: GameData = {
                id: '',
                name: formData.name,
                pixelRadius: formData.pixelRadius,
                difficulty: '-',
                originalImage: formData.image1,
                modifiedImage: formData.image2,
                topSoloPlayers: ['-', '-', '-'],
                topVersusPlayers: ['-', '-', '-'],
                topSoloTimes: ['00:00', '00:00', '00:00'],
                topVersusTimes: ['00:00', '00:00', '00:00'],
                numberOfDifferences: this.numberOfDifferences,
            };
            if (!this.textVerif.verifText(formData.name, LENGTH_NAME)) {
                window.alert('Nom de la partie invalide');
                return;
            } else {
                await this.saveGame(game);
            }
        } else {
            window.alert('Veuillez remplir tous les champs');
        }
    }

    async saveGame(game: GameData) {
        this.requestHandler.postGame(game).subscribe({
            next: () => {
                this.router.navigate(['/config']);
            },
        });
    }

    closeImage() {
        this.showImage = false;
    }

    quitPage() {
        if (confirm('Vous perdez votre partie en quittant, voulez vous vraiment quitter?')) {
            window.history.back();
        }
    }

    uploadTwoImages(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files) {
            const file = target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                this.imageComponents1.setUrl(reader.result as string);
                this.imageComponents2.setUrl(reader.result as string);
                const isVerified = this.imageComponents1.verifyImage();
                isVerified.then((res) => {
                    if (!res) {
                        this.imageComponents2.clearImage();
                    }
                });
            };
        }
    }

    onCopyCanvas(id: number) {
        if (id === 1) {
            const data = this.imageComponents2.getSketchData();
            this.imageComponents1.copySketchData(data);
        } else {
            const data = this.imageComponents1.getSketchData();
            this.imageComponents2.copySketchData(data);
        }
    }

    changeCanvas() {
        const data1 = this.imageComponents1.getSketchData();
        const data2 = this.imageComponents2.getSketchData();
        this.imageComponents1.copySketchData(data2);
        this.imageComponents2.copySketchData(data1);
        this.drawingStack.push([data2, data1]);
        this.redoStack = [];
    }

    onNewState(): void {
        const data1 = this.imageComponents1.getSketchData();
        const data2 = this.imageComponents2.getSketchData();
        this.drawingStack.push([data1, data2]);
        this.redoStack = [];
    }

    undoLastDrawing(): void {
        if (this.drawingStack.length > 1) {
            this.redoStack.push(this.drawingStack.pop());
            const data = this.drawingStack[this.drawingStack.length - 1];
            this.imageComponents1.copySketchData(data[0]);
            this.imageComponents2.copySketchData(data[1]);
        }
    }
    // Méthode pour rétablir le dernier dessin annulé
    redoLastDrawing(): void {
        if (this.redoStack.length > 0) {
            const data = this.redoStack[this.redoStack.length - 1];
            this.imageComponents1.copySketchData(data[0]);
            this.imageComponents2.copySketchData(data[1]);
            this.drawingStack.push(this.redoStack.pop());
        }
    }

    onKeyDown(event: KeyboardEvent) {
        if (event.ctrlKey && event.key === 'z') {
            this.undoLastDrawing();
        }
        const keyCode = 90;
        if (event.ctrlKey && event.shiftKey && event.keyCode === keyCode) {
            this.redoLastDrawing();
        }
    }
}
