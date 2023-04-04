import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class TextVerification {
    verifText(text: string, maxSize: number) {
        if (text.length > 0 && text.length <= maxSize && !text.startsWith(' ') && text) {
            return true;
        } else {
            return false;
        }
    }
}
