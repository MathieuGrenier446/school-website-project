import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ButtonTextPopComponent } from './button-text-pop.component';

describe('AcceptPopUpComponent', () => {
    let component: ButtonTextPopComponent;
    let fixture: ComponentFixture<ButtonTextPopComponent>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<ButtonTextPopComponent>>;

    beforeEach(() => {
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef<AcceptComponent>', ['close']);

        TestBed.configureTestingModule({
            declarations: [ButtonTextPopComponent],
            providers: [
                { provide: MatDialogRef, useValue: matDialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: true },
            ],
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ButtonTextPopComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(fixture.componentInstance).toBeTruthy();
    });

    it('should disable the close button', () => {
        expect(matDialogRefSpy.disableClose).toBeTrue();
    });

    it('should call close method', () => {
        component.exit();
        expect(matDialogRefSpy.close).toHaveBeenCalledWith('exit');
    });
});
