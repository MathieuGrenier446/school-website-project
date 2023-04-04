import { Component, Inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
    selector: 'app-end-game-pop-up',
    templateUrl: './end-game-pop-up.component.html',
    styleUrls: ['./end-game-pop-up.component.scss'],
})
export class EndGameComponent {
    @Input() winner: boolean;
    @Input() winnerName: string;
    constructor(public dialogRef: MatDialogRef<EndGameComponent>, public router: Router, @Inject(MAT_DIALOG_DATA) public data: unknown) {
        dialogRef.disableClose = true;
    }

    redirectToSelection() {
        this.dialogRef.close();
        this.router.navigate(['/selection']);
    }
}
