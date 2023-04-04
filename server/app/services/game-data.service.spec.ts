import * as sinon from 'sinon';
import { assert, expect } from 'chai';
import { GameDataService } from '@app/services/game-data.service';
import { DifferenceDetect } from '@app/services/difference-detect.service';
import { DatabaseService } from '@app/services/database.service';
import { GameData } from '@app/interfaces/game-data';
import { ImageDataService } from '@app/services/image-data.service';

let gamesStub: GameData[];
describe('GameDataService', () => {
    let gameDataService: GameDataService;
    let differenceDetect: DifferenceDetect;
    let databaseService: DatabaseService;

    const populateDb = async () => {
        await gameDataService.collection.insertMany(gamesStub);
    };

    const clearDb = async () => {
        await gameDataService.collection.deleteMany({});
    };

    beforeEach(async () => {
        gamesStub = [
            {
                id: '1',
                name: 'Game 1',
                pixelRadius: '10',
                difficulty: 'Easy',
                originalImage: 'https://example.com/image1.jpg',
                modifiedImage: 'https://example.com/image1_modified.jpg',
                topSoloPlayers: [],
                topVersusPlayers: [],
                topSoloTimes: [],
                topVersusTimes: [],
                numberOfDifferences: 2,
                differences: [
                    [
                        { x: 10, y: 20 },
                        { x: 30, y: 40 },
                    ],
                    [
                        { x: 50, y: 60 },
                        { x: 70, y: 80 },
                    ],
                ],
            },
            {
                id: '2',
                name: 'Game 2',
                pixelRadius: '15',
                difficulty: 'Medium',
                originalImage: 'https://example.com/image2.jpg',
                modifiedImage: 'https://example.com/image2_modified.jpg',
                topSoloPlayers: [],
                topVersusPlayers: [],
                topSoloTimes: [],
                topVersusTimes: [],
                numberOfDifferences: 3,
                differences: [
                    [
                        { x: 10, y: 20 },
                        { x: 30, y: 40 },
                    ],
                    [
                        { x: 50, y: 60 },
                        { x: 70, y: 80 },
                    ],
                    [
                        { x: 90, y: 100 },
                        { x: 110, y: 120 },
                    ],
                ],
            },
            {
                id: '3',
                name: 'Game 3',
                pixelRadius: '20',
                difficulty: 'Hard',
                originalImage: 'https://example.com/image3.jpg',
                modifiedImage: 'https://example.com/image3_modified.jpg',
                topSoloPlayers: [],
                topVersusPlayers: [],
                topSoloTimes: [],
                topVersusTimes: [],
                numberOfDifferences: 4,
                differences: [
                    [
                        { x: 10, y: 20 },
                        { x: 30, y: 40 },
                    ],
                    [
                        { x: 50, y: 60 },
                        { x: 70, y: 80 },
                    ],
                    [
                        { x: 90, y: 100 },
                        { x: 110, y: 120 },
                    ],
                    [
                        { x: 130, y: 140 },
                        { x: 150, y: 160 },
                    ],
                ],
            },
        ];
        databaseService = new DatabaseService();
        sinon.stub(databaseService, 'getDbName').returns('games-of-differences-test');
        await databaseService.start();
        differenceDetect = sinon.createStubInstance(DifferenceDetect);
        gameDataService = new GameDataService(differenceDetect, databaseService);
    });

    afterEach(async () => {
        await clearDb();
        await databaseService.closeConnection();
    });

    describe('addGame()', () => {
        it('should add a new game to the database', async () => {
            const gameStub = gamesStub[0];
            await gameDataService.addGame(gameStub);
            const addedGame = await gameDataService.collection.findOne({});
            assert(addedGame !== null);
            expect(addedGame.name).to.equal(gameStub.name);
            await gameDataService.deleteGame(addedGame.id);
        });
    });

    describe('getGames()', () => {
        it('should return an array of games', async () => {
            await populateDb();
            const games = await gameDataService.getGames();
            expect(games.length).to.equal(3);
        });

        it('should make game joinable', async () => {
            await populateDb();
            gameDataService.multiplayerGameIds = ['1'];
            const games = await gameDataService.getGames();
            let joinableGame;
            games.forEach((game) => {
                if (game.id === '1') {
                    joinableGame = game;
                }
            });
            assert((joinableGame as unknown as GameData).joinable === true);
        });

        it('should use the server saved images if possible', async () => {
            const originalImage = 'serverOriginalImage';
            const modifiedImage = 'serverModifiedImage';
            const stub = sinon.stub(ImageDataService.prototype, 'getImages').resolves({ originalImage, modifiedImage });
            await populateDb();
            const result = await gameDataService.getGames();
            assert(result[0].originalImage === originalImage && result[0].modifiedImage === modifiedImage);
            stub.restore();
        });
    });

    describe('getGameById', () => {
        it('should return a game object with the specified id', async () => {
            const game = gamesStub[0];
            await gameDataService.collection.insertOne(game);
            const result = await gameDataService.getGameById('1');
            expect(result.id).to.deep.equal(game.id);
        });

        it('should return null if no game with the specified id is found', async () => {
            await populateDb();
            const result = await gameDataService.getGameById('invalid-id');
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(result).to.be.null;
        });

        it('should use the server saved images if possible', async () => {
            const originalImage = 'serverOriginalImage';
            const modifiedImage = 'serverModifiedImage';
            const stub = sinon.stub(ImageDataService.prototype, 'getImages').resolves({ originalImage, modifiedImage });
            await populateDb();
            const result = await gameDataService.getGameById('1');
            assert(result.originalImage === originalImage && result.modifiedImage === modifiedImage);
            stub.restore();
        });
    });

    describe('deleteGame', () => {
        it('should delete a game with the specified id from the database', async () => {
            await populateDb();
            await gameDataService.deleteGame('1');
            const result = await gameDataService.getGameById('1');
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(result).to.be.null;
        });

        it('should emit the id of the deleted game through the lastDeletedGameId subject', async () => {
            const spy = sinon.spy(gameDataService.lastDeletedGameId, 'next');
            await gameDataService.deleteGame('id');
            assert(spy.calledOnceWithExactly('id'));
        });
    });

    describe('gameIsJoinable', () => {
        it('should add a game id to the multiplayerGameIds array', () => {
            gameDataService.gameIsJoinable('test-id');
            expect(gameDataService.multiplayerGameIds).to.include('test-id');
        });
    });

    describe('gameIsNotJoinable', () => {
        it('should remove a game id from the multiplayerGameIds array', () => {
            gameDataService.multiplayerGameIds = ['test-id'];
            gameDataService.gameIsNotJoinable('test-id');
            expect(gameDataService.multiplayerGameIds).to.not.include('test-id');
        });
    });
});
