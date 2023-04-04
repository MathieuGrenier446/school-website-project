import { HttpClient, HttpHandler } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { RequestHandler } from '@app/services/request-handler.service';

describe('RequestHandler', () => {
    let service: RequestHandler;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: HttpClient }, { provide: HttpHandler }],
        });
        service = TestBed.inject(RequestHandler);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getData should return an Observable', () => {
        expect(service.getData()).toBeTruthy();
    });

    it('postImage should return an Observable', () => {
        const pixels = 10;
        expect(service.postImage('url1', 'url2', pixels)).toBeTruthy();
    });

    it('postGame should return an Observable', () => {
        const game = {
            name: 'test',
            pixelRadius: 10,
            difficulty: 'test',
            image1: 'test',
            image2: 'test',
            topSolo: ['test', 'test', 'test'],
            topVersus: ['test', 'test', 'test'],
            tempsSolo: ['test', 'test', 'test'],
            tempsVersus: ['test', 'test', 'test'],
            pixelsDiff: ['test', 'test', 'test'],
        };
        expect(service.postGame(game)).toBeTruthy();
    });

    it('postGame should return an Observable', () => {
        const id = '1';
        expect(service.deleteGame(id)).toBeTruthy();
    });
});
