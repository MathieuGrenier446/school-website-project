import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainPageComponent } from './main-page.component';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle showTextBox', () => {
        component.showTextBox = false;
        component.toggleTextBox();
        expect(component.showTextBox).toBeTrue();
        component.toggleTextBox();
        expect(component.showTextBox).toBeFalse();
    });
});
