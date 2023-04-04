import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AcceptComponent } from './accept-pop-up.component';

describe('AcceptPopUpComponent', () => {
    let component: AcceptComponent;
    let fixture: ComponentFixture<AcceptComponent>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<AcceptComponent>>;

    beforeEach(() => {
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef<AcceptComponent>', ['close']);

        TestBed.configureTestingModule({
            declarations: [AcceptComponent],
            providers: [
                { provide: MatDialogRef, useValue: matDialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: 'test' },
            ],
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AcceptComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should set the waitingPlayer property', () => {
        expect(component.waitingPlayer).toEqual('test');
    });

    it('should disable the close button', () => {
        expect(matDialogRefSpy.disableClose).toBeTrue();
    });
});
