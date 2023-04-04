import { TextVerification } from './text-verification.service';

describe('TextVerification', () => {
    let service: TextVerification;

    beforeEach(() => {
        service = new TextVerification();
    });

    it('text should return true for valid text', () => {
        const validText = 'Good Name';
        const maxSize = 20;
        const result = service.verifText(validText, maxSize);
        expect(result).toBeTruthy();
    });

    it('text should return false for a text to long', () => {
        const validText = 'Long Name';
        const maxSize = 5;
        const result = service.verifText(validText, maxSize);
        expect(result).toBeFalsy();
    });

    it('text should return false for a text starting with a space', () => {
        const validText = ' space';
        const maxSize = 20;
        const result = service.verifText(validText, maxSize);
        expect(result).toBeFalsy();
    });

    it('text should return false for an empty text', () => {
        const validText = '';
        const maxSize = 5;
        const result = service.verifText(validText, maxSize);
        expect(result).toBeFalsy();
    });
});
