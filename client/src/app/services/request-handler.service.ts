/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class RequestHandler {
    constructor(private http: HttpClient) {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getData(): Observable<any> {
        return this.http.get(environment.serverUrl + 'api/data');
    }

    postImage(image1: string, image2: string, pixels: number): Observable<any> {
        return this.http.post(environment.serverUrl + 'api/image', { image1, image2, pixels }, { responseType: 'json' });
    }

    postGame(game: object): Observable<any> {
        return this.http.post(environment.serverUrl + 'api/data', game, { responseType: 'text' });
    }

    deleteGame(id: string): Observable<any> {
        return this.http.delete(`${environment.serverUrl}api/data/${id}`, { responseType: 'text' });
    }
}
