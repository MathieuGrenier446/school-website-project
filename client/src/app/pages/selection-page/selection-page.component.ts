import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
    selector: 'app-selection-page',
    templateUrl: './selection-page.component.html',
    styleUrls: ['./selection-page.component.scss'],
})
export class SelectionPageComponent {
    constructor(private router: Router) {}
    quitPage() {
        this.router.navigate(['/main-page']);
    }
}
