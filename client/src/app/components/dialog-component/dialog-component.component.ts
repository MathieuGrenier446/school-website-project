import { Injectable, OnDestroy } from '@angular/core';
import { GameConnectionService } from '@app/services/game-connection.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ButtonTextPopComponent } from '@app/components/button-text-pop/button-text-pop.component';
import { PlayerNameDialogComponent } from '@app/components/player-name-dialog/player-name-dialog.component';
import { firstValueFrom, Subscription } from 'rxjs';
import { AcceptComponent } from '@app/components/accept-pop-up/accept-pop-up.component';
import { GAME_DELETED_VIEW, REFUSAL_VIEW } from '@app/const';

@Injectable({
    providedIn: 'root',
})
export class DialogService implements OnDestroy {
    private nameDialogRef: MatDialogRef<PlayerNameDialogComponent>;
    private mainDialogRef: MatDialogRef<ButtonTextPopComponent>;
    private requestDialogRef: MatDialogRef<AcceptComponent>;
    private playerRequests: { playerId: string; playerName: string }[] = [];
    private subscriptions: Subscription[] = [];

    constructor(private gameConnectionService: GameConnectionService, public dialog: MatDialog) {
        this.subscriptions.push(
            this.gameConnectionService.playerJoinRequest.subscribe((playerInfo: { playerId: string; playerName: string }) => {
                this.openRequestDialog(playerInfo);
            }),
            this.gameConnectionService.isConnectionAccepted.subscribe((isAccepted: boolean) => {
                if (!isAccepted) {
                    this.mainDialogRef.componentInstance.data = REFUSAL_VIEW;
                }
            }),
            this.gameConnectionService.playerJoinRequestCanceled.subscribe(({ playerId }) => {
                const index = this.playerRequests.findIndex((playerInfo: { playerId: string; playerName: string }) => {
                    return playerInfo.playerId === playerId;
                });
                this.playerRequests.splice(index, 1);
            }),
            this.gameConnectionService.deletedGames.subscribe(() => {
                this.mainDialogRef.componentInstance.data = GAME_DELETED_VIEW;
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription: Subscription) => {
            subscription.unsubscribe();
        });
        this.subscriptions = [];
        this.dialog.closeAll();
    }

    openMainDialog(dialogType: string) {
        this.mainDialogRef = this.dialog.open(ButtonTextPopComponent, {
            width: '250px',
            data: dialogType,
        });
        this.mainDialogRef.afterClosed().subscribe((reason: string) => {
            if (reason === 'exit') {
                this.gameConnectionService.leaveQueue();
            }
        });
    }

    async openNameDialog() {
        this.nameDialogRef = this.dialog.open(PlayerNameDialogComponent, {
            width: '250px',
            data: { playerName: '' },
        });
        const name = await firstValueFrom(this.nameDialogRef.afterClosed());
        return new Promise<string>((resolve, reject) => {
            if (name) {
                resolve(name);
            } else {
                reject();
            }
        });
    }

    private openRequestDialog(playerInfo: { playerId: string; playerName: string }) {
        if (!this.requestDialogRef) {
            this.requestDialogRef = this.dialog.open(AcceptComponent, {
                width: '250px',
                data: playerInfo,
            });
            this.requestDialogRef.afterClosed().subscribe((verdict: string) => {
                if (verdict === 'refused') {
                    const nextPlayerInfo = this.playerRequests.shift();
                    if (nextPlayerInfo) {
                        this.openRequestDialog(nextPlayerInfo);
                    }
                }
            });
        } else {
            this.playerRequests.push(playerInfo);
        }
    }
}
