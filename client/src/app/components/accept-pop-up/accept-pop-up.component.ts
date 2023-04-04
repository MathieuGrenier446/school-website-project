import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ACCEPTED, REFUSED } from '@app/const';
import { GameConnectionService } from '@app/services/game-connection.service';
@Component({
    selector: 'app-accept-pop-up',
    templateUrl: './accept-pop-up.component.html',
    styleUrls: ['./accept-pop-up.component.scss'],
})
export class AcceptComponent {
    playerInfo: { playerId: string; playerName: string };
    accepted: string = ACCEPTED;
    refused: string = REFUSED;

    constructor(
        public dialogRef: MatDialogRef<AcceptComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { playerId: string; playerName: string },
        private gameConnectionService: GameConnectionService,
    ) {
        this.playerInfo = data;
        dialogRef.disableClose = true;
    }

    async acceptPlayer() {
        await this.gameConnectionService
            .acceptPlayer(this.playerInfo.playerId)
            .then(() => {
                this.dialogRef.close('accepted');
            })
            .catch(() => {
                this.dialogRef.close('refused');
            });
    }
    refusePlayer() {
        this.gameConnectionService.refusePlayer(this.playerInfo.playerId);
        this.dialogRef.close('refused');
    }
}
