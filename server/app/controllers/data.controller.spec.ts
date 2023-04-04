/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Application } from '@app/app';
import { GameData } from '@app/interfaces/game-data';
import { GameDataService } from '@app/services/game-data.service';
import * as chai from 'chai';
import { StatusCodes } from 'http-status-codes';
import { WithId } from 'mongodb';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import * as supertest from 'supertest';
import { Container } from 'typedi';

const HTTP_STATUS_OK = StatusCodes.OK;

describe('DataController', () => {
    // Créer une instance stub du GameDataService
    let gameDataService: SinonStubbedInstance<GameDataService>;
    // Créer une instance de l'application Express
    let expressApp: Express.Application;

    // Exécuter avant chaque test
    beforeEach(async () => {
        gameDataService = createStubInstance(GameDataService);
        const app = Container.get(Application);

        // Remplacer le GameDataService par l'instance stub précédemment créée
        Object.defineProperty(app['dataController'], 'gameDataService', { value: gameDataService, writable: true });
        expressApp = app.app;
    });

    it('should call getGames from gameDataService ', async () => {
        gameDataService.getGames.resolves({} as unknown as WithId<GameData>[]);
        supertest(expressApp).get('/api/data');
        return supertest(expressApp)
            .get('/api/data')
            .expect(HTTP_STATUS_OK)
            .then(() => {
                chai.expect(gameDataService.getGames.called).to.be.true;
            });
    });

    it('should return an error as a message on service fail', async () => {
        gameDataService.getGames.rejects(new Error('service error'));

        return supertest(expressApp)
            .get('/api/data')
            .expect(HTTP_STATUS_OK)
            .then((response) => {
                chai.expect(response.body.title).to.equal('Error');
            });
    });

    it('should call addGame method from the gameDataService', async () => {
        return supertest(expressApp)
            .post('/api/data')
            .send({})
            .expect(HTTP_STATUS_OK)
            .then(() => {
                chai.expect(gameDataService.addGame.calledOnce).to.be.true;
            });
    });

    it('should call deleteGame method from the gameDataService', async () => {
        return supertest(expressApp)
            .delete('/api/data/1')
            .then(() => {
                chai.expect(gameDataService.deleteGame.called).to.be.true;
            });
    });
});
