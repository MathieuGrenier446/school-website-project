import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game.service';

@Component({
    selector: 'app-config-page',
    templateUrl: './config-page.component.html',
    styleUrls: ['./config-page.component.scss'],
})
export class ConfigPageComponent implements OnDestroy {
    constructor(private router: Router, private gameService: GameService) {
        this.gameService.connect();
        this.gameService.handleSockets();
    }

    quitPage() {
        this.gameService.disconnect();
        this.router.navigate(['/main-page']);
    }

    ngOnDestroy() {
        this.gameService.disconnect();
    }
}
