import { Component, Inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LENGTH_NAME } from '@app/const';
import { TextVerification } from '@app/services/text-verification.service';

@Component({
    selector: 'app-player-name-dialog',
    templateUrl: './player-name-dialog.component.html',
    styleUrls: ['./player-name-dialog.component.scss'],
})
export class PlayerNameDialogComponent {
    @Input() playerName: string;

    constructor(
        public dialogRef: MatDialogRef<PlayerNameDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: unknown,
        private verificationService: TextVerification,
    ) {
        dialogRef.disableClose = true;
    }

    submitName() {
        if (this.verificationService.verifText(this.playerName, LENGTH_NAME)) {
            this.dialogRef.close(this.playerName);
        } else {
            window.alert('Nom invalide');
        }
    }

    exit() {
        this.dialogRef.close('');
    }
}
