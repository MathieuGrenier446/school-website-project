/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GAME_NOT_AVAILABLE_VIEW, WAITING_ROOM_VIEW } from '@app/const';
import { GameData } from '@app/interfaces/game-data';
import { GameConnectionService } from '@app/services/game-connection.service';
import { RequestHandler } from '@app/services/request-handler.service';
import { Subject, Subscription } from 'rxjs';
import { DialogService } from '@app/components/dialog-component/dialog-component.component';

@Component({
    selector: 'app-game-sheet',
    templateUrl: './game-sheet.component.html',
    styleUrls: ['./game-sheet.component.scss'],
    providers: [DialogService],
})
export class GameSheetComponent implements OnInit, OnDestroy {
    @Input() game: GameData;
    @Input() isSelected: boolean;
    joinable: Subject<boolean> = new Subject();
    joinableSubscription: Subscription;

    constructor(
        public router: Router,
        public gameConnectionService: GameConnectionService,
        public requestHandler: RequestHandler,
        public dialogComponent: DialogService,
    ) {}

    ngOnInit(): void {
        this.joinableSubscription = this.gameConnectionService.joinableChangeObject.subscribe((parameters: any) => {
            if (this.game.id.toString() === parameters.id.toString()) {
                this.game.joinable = parameters.value;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.joinableSubscription) {
            this.joinableSubscription.unsubscribe();
        }
    }
    async solo() {
        this.dialogComponent.openNameDialog().then((name: string) => {
            this.gameConnectionService.createSingleplayerGame(name, this.game.id.toString()).catch(() => {
                this.dialogComponent.openMainDialog(GAME_NOT_AVAILABLE_VIEW);
            });
        });
    }

    async join() {
        this.dialogComponent.openNameDialog().then((name: string) => {
            this.gameConnectionService
                .joinQueue(name, this.game.id.toString())
                .then(() => {
                    this.dialogComponent.openMainDialog(WAITING_ROOM_VIEW);
                })
                .catch(() => {
                    this.dialogComponent.openMainDialog(GAME_NOT_AVAILABLE_VIEW);
                });
        });
    }

    async create() {
        this.dialogComponent.openNameDialog().then((name: string) => {
            this.gameConnectionService
                .createMultiplayerGame(name, this.game.id.toString())
                .then(() => {
                    this.dialogComponent.openMainDialog(WAITING_ROOM_VIEW);
                })
                .catch(() => {
                    this.dialogComponent.openMainDialog(GAME_NOT_AVAILABLE_VIEW);
                });
        });
    }

    getTime(i: number, type: string) {
        if (type === 'solo') {
            return this.game.topSoloTimes[i];
        } else if (type === 'versus') {
            return this.game.topVersusTimes[i];
        } else {
            return 'Spécifier si solo ou versus';
        }
    }

    async deleteGame() {
        this.requestHandler.deleteGame(this.game.id.toString()).subscribe(() => {
            // pass
        });
    }
}
