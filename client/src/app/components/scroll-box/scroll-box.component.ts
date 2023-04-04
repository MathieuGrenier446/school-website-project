import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GameData } from '@app/interfaces/game-data';
import { GameService } from '@app/services/game.service';
import { RequestHandler } from '@app/services/request-handler.service';
import { firstValueFrom } from 'rxjs';

const pageItems = 4;

@Component({
    selector: 'app-scroll-box',
    templateUrl: './scroll-box.component.html',
    styleUrls: ['./scroll-box.component.scss'],
})
export class ScrollBoxComponent implements OnInit, OnDestroy {
    @Input() isSelected: boolean;
    games: GameData[];
    itemsPerPage = pageItems;
    currentPage = 0;
    nPage: number;

    constructor(private requestHandler: RequestHandler, public gameService: GameService) {}

    get displayedItems() {
        if (this.games) {
            return this.games.slice(this.currentPage * this.itemsPerPage, (this.currentPage + 1) * this.itemsPerPage);
        }
        return null;
    }

    async ngOnInit() {
        this.games = await firstValueFrom(this.requestHandler.getData());
        this.nPage = Math.ceil(this.games.length / this.itemsPerPage);

        this.gameService.socket.on('deletedGame', (gameId: string) => {
            this.games = this.games.filter((game) => game.id !== gameId);
            this.nPage = Math.ceil(this.games.length / this.itemsPerPage);
        });
    }

    ngOnDestroy() {
        this.gameService.socket.off('deletedGame');
    }

    nextPage() {
        if (this.currentPage < this.nPage - 1) {
            this.currentPage++;
        }
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
        }
    }
}
