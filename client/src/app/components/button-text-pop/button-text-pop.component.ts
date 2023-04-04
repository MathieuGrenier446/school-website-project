import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GAME_DELETED_VIEW, GAME_NOT_AVAILABLE_VIEW, REFUSAL_VIEW, WAITING_ROOM_VIEW } from '@app/const';

@Component({
    selector: 'app-button-text-pop',
    templateUrl: './button-text-pop.component.html',
    styleUrls: ['./button-text-pop.component.scss'],
})
export class ButtonTextPopComponent {
    waitingRoom: string;
    refusalView = REFUSAL_VIEW;
    waitingRoomView = WAITING_ROOM_VIEW;
    gameDeletedView = GAME_DELETED_VIEW;
    gameNotAvailable = GAME_NOT_AVAILABLE_VIEW;

    constructor(public dialogRef: MatDialogRef<ButtonTextPopComponent>, @Inject(MAT_DIALOG_DATA) public data: string) {
        this.waitingRoom = data;
        dialogRef.disableClose = true;
    }

    exit() {
        this.dialogRef.close('exit');
    }
}
