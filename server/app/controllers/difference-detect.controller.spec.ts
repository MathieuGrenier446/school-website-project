import { Application } from '@app/app';
import { DifferenceDetect } from '@app/services/difference-detect.service';
import * as chai from 'chai';
import { StatusCodes } from 'http-status-codes';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

const HTTP_STATUS_ERROR = StatusCodes.INTERNAL_SERVER_ERROR;

describe('DifferenceDetectController', () => {
    // Créer une instance stub du DifferenceDetect
    let differenceDetect: SinonStubbedInstance<DifferenceDetect>;
    // Créer une instance de l'application Express
    let expressApp: Express.Application;

    // Exécuter avant chaque test
    beforeEach(async () => {
        differenceDetect = createStubInstance(DifferenceDetect);
        const app = Container.get(Application);

        // Remplacer le DifferenceDetect par l'instance stub précédemment créée
        Object.defineProperty(app['differenceDetectController'], 'differenceDetect', { value: differenceDetect, writable: true });
        expressApp = app.app;
    });

    it('should return the image and the list of differences ', async () => {
        differenceDetect.processImage.resolves('image');
        differenceDetect.getPixelDiff.resolves([]);
        const expectResponse = { numberOfDifferences: 0, processedImage: 'image' };

        return supertest(expressApp)
            .post('/api/image')
            .send({ image1: 'img1', image2: 'img2', pixels: 0 })
            .then((response) => {
                chai.expect(response.body).to.deep.equal(expectResponse);
            });
    });

    it('should return an error as a message on service fail', async () => {
        differenceDetect.getPixelDiff.rejects(new Error('service error'));

        return supertest(expressApp).post('/api/image').expect(HTTP_STATUS_ERROR);
    });
});
