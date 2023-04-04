/* eslint-disable max-params */
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EndGameComponent } from '@app/components/end-game-pop-up/end-game-pop-up.component';
import { GameData } from '@app/interfaces/game-data';
import { Player } from '@app/interfaces/player';
import { Time } from '@app/interfaces/time';
import { GameService } from '@app/services/game.service';
import { TextVerification } from '@app/services/text-verification.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    @ViewChild('messageSection', { static: false }) messageSection: ElementRef;
    game: GameData;
    differencesFoundOpponent = 0;
    differencesFoundPlayer = 0;
    isMultiplayer: boolean | undefined;
    playerName: string;
    opponentName: string;
    time: string;
    roomMessages: string[] = [];
    message: string;

    private numDiffSubscription: Subscription;
    private gameStateSubscription: Subscription;
    private timeSubscription: Subscription;
    private messagesSubscription: Subscription;

    constructor(
        private router: Router,
        public gameService: GameService,
        private dialog: MatDialog,
        public textVerificationService: TextVerification,
    ) {}

    ngOnInit(): void {
        this.game = this.gameService.game;
        this.isMultiplayer = this.gameService.game.isMultiplayer;
        this.playerName = this.gameService.playerName;
        this.gameService.sendMessage('[Serveur] : ' + this.playerName + ' est connecté');

        this.timeSubscription = this.gameService.time.subscribe((time: object) => {
            this.time = `${(time as Time).min.toString().padStart(2, '0')}:${(time as Time).sec.toString().padStart(2, '0')}`;
        });

        this.messagesSubscription = this.gameService.roomMessageObs.subscribe((message: string) => {
            this.roomMessages.push(message);
            this.analyzeMessage(message);
        });

        this.numDiffSubscription = this.gameService.lastDifferenceFound.subscribe((difference) => {
            if (difference.length !== 0) {
                new Audio('../../assets/audio/correct.wav').play();
            } else {
                new Audio('../../assets/audio/wrong.wav').play();
            }
        });

        this.gameStateSubscription = this.gameService.gameState.subscribe((winner: Player) => {
            this.openCongrats(winner);
        });

        this.gameService.startGame();
        this.gameService.uploadImage(this.game.originalImage);
    }

    ngOnDestroy() {
        this.timeSubscription.unsubscribe();
        this.gameStateSubscription.unsubscribe();
        this.gameService.disconnect();
        this.numDiffSubscription.unsubscribe();
        this.messagesSubscription.unsubscribe();
    }

    analyzeMessage(message: string) {
        if (message.startsWith('[Serveur]') && message.includes('connecté') && message.split(' ')[2] !== this.playerName) {
            this.opponentName = message.split(' ')[2];
        }
        if (message.startsWith('[Serveur]') && message.includes('Différence')) {
            this.addDifference(message);
        }
        this.messageSection.nativeElement.scrollTo({
            top: this.messageSection.nativeElement.scrollHeight,
            behavior: 'smooth',
        });
    }

    quitPage() {
        if (confirm('Vous perdez votre partie en quittant, voulez vous vraiment quitter?')) {
            this.gameService.sendMessage('[Serveur] : ' + this.playerName + ' a abandonné la partie');
            this.router.navigate(['/selection']);
        }
    }

    openCongrats(winner: Player) {
        new Audio('../../assets/audio/endGame.wav').play();
        const dialogRef = this.dialog.open(EndGameComponent, {
            width: '500px',
        });

        dialogRef.componentInstance.winner = this.gameService.socket.id === winner.socketID;
        dialogRef.componentInstance.winnerName = winner.name;
    }

    formatAndSend(message: string) {
        const maxLength = 200;
        if (this.textVerificationService.verifText(message, maxLength) && this.isMultiplayer) {
            const formattedMessage = '[' + this.playerName + ']' + ' : ' + message;
            this.gameService.sendMessage(formattedMessage);
            this.message = '';
        }
    }

    addDifference(message: string) {
        const splitMessage = message.split(' ');
        const lengthMessageSinglePlayer = 4;
        if (splitMessage.length === lengthMessageSinglePlayer || splitMessage[5] === this.playerName) {
            this.differencesFoundPlayer++;
        } else {
            this.differencesFoundOpponent++;
        }
    }
}
