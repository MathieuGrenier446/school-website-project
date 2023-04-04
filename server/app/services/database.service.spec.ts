import { Db, MongoClient } from 'mongodb';
import { DatabaseService } from '@app/services/database.service';
import { assert, expect } from 'chai';
import * as sinon from 'sinon';

describe('DatabaseService', () => {
    let databaseService: DatabaseService;

    beforeEach(async () => {
        databaseService = new DatabaseService();
        sinon.stub(databaseService, 'getDbName').returns('games-of-differences-test');
    });

    afterEach(async () => {
        await databaseService.closeConnection();
    });

    it('should create a MongoClient instance and connect to the database', async () => {
        const connectSpy = sinon.spy(MongoClient.prototype, 'connect');
        await databaseService.start();
        connectSpy.restore();
        expect(databaseService.database).to.be.instanceOf(Db);
        expect(databaseService.database.databaseName).to.equal('games-of-differences-test');
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
        expect(connectSpy.calledOnce).to.be.true;
    });

    it('should throw an error when there is a database connection error', async () => {
        const error = new Error('Connection error');
        const stub = sinon.stub(MongoClient.prototype, 'connect').rejects(error);
        try {
            await databaseService.start();
            assert.fail('Expected error to be thrown');
        } catch (e) {
            expect(e.message).to.equal('Database connection error');
            stub.restore();
        }
        stub.restore();
    });
});
