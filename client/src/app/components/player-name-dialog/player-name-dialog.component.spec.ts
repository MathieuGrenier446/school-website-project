import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlayerNameDialogComponent } from './player-name-dialog.component';

describe('PlayerNameDialogComponent', () => {
    let component: PlayerNameDialogComponent;
    let fixture: ComponentFixture<PlayerNameDialogComponent>;
    let dialogRef: MatDialogRef<PlayerNameDialogComponent>;

    beforeEach(() => {
        dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

        TestBed.configureTestingModule({
            declarations: [PlayerNameDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRef },
                { provide: MAT_DIALOG_DATA, useValue: {} },
            ],
        });

        fixture = TestBed.createComponent(PlayerNameDialogComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close dialog and changePlayerName on submit', () => {
        component.playerName = 'TestPlayer';
        component.submitName();

        expect(dialogRef.close).toHaveBeenCalledWith('TestPlayer');
    });

    it('should close dialog on exit', () => {
        component.exit();
        expect(dialogRef.close);
    });

    it('should show an alert when player name is not valid', () => {
        spyOn(window, 'alert');

        component.playerName = '';
        component.submitName();

        expect(window.alert).toHaveBeenCalledWith('Nom invalide');
        expect(dialogRef.close).not.toHaveBeenCalled();
    });
});
