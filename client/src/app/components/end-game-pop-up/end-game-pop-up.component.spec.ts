import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EndGameComponent } from './end-game-pop-up.component';

describe('EndGameComponent', () => {
    let component: EndGameComponent;
    let fixture: ComponentFixture<EndGameComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let matDialogDataSpy: jasmine.SpyObj<MatDialogRef<EndGameComponent>>;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        matDialogDataSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        TestBed.configureTestingModule({
            providers: [
                { provide: MatDialogRef, useValue: matDialogDataSpy },
                { provide: MAT_DIALOG_DATA, useValue: MAT_DIALOG_DATA },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EndGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('redirectToSelection should redirect to selection page', () => {
        component.redirectToSelection();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/selection']);
        expect(component.dialogRef.close).toHaveBeenCalled();
    });
});
