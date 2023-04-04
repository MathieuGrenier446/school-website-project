/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
import { Game } from '@app/classes/game';
import { Player } from '@app/classes/player';
import { DatabaseService } from '@app/services/database.service';
import { DifferenceDetect } from '@app/services/difference-detect.service';
import { GameDataService } from '@app/services/game-data.service';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { SinonStub, stub } from 'sinon';

describe('Game', () => {
    let game: Game;
    let differenceDetect: DifferenceDetect;
    let databaseService: DatabaseService;
    let gameDataService: GameDataService;
    let getGameByIdStub: SinonStub;

    const expectedClientGameData = {
        id: 'testGameId',
        name: 'testGameName',
        pixelRadius: 'testPixelRadius',
        difficulty: 'testDifficulty',
        originalImage: 'testOriginalImage',
        modifiedImage: 'testModifiedImage',
        topSoloPlayers: ['testPlayer1', 'testPlayer2'],
        topVersusPlayers: ['testPlayer3', 'testPlayer4'],
        topSoloTimes: ['testTime1', 'testTime2'],
        topVersusTimes: ['testTime3', 'testTime4'],
        numberOfDifferences: 5,
        joinable: true,
    };

    beforeEach(() => {
        gameDataService = new GameDataService(differenceDetect, databaseService);
        game = new Game(
            'testGameId',
            () => {
                return;
            },
            'singleplayer',
            gameDataService,
        );
    });

    afterEach(() => {
        getGameByIdStub.restore();
    });

    it('should fetch game data from GameDataService', async () => {
        const expectedGameData = { id: 'testGameId', numberOfDifferences: 5, differences: [] };
        getGameByIdStub = stub(gameDataService, 'getGameById');
        getGameByIdStub.resolves(expectedGameData);

        await game.init();

        // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
        expect(getGameByIdStub.calledOnceWithExactly('testGameId')).to.be.true;
        expect(game.gameData).to.deep.equal(expectedGameData);
    });

    it('should return game data without differences', async () => {
        game.gameData = {
            ...expectedClientGameData,
            differences: [
                [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ],
                [
                    { x: 5, y: 6 },
                    { x: 7, y: 8 },
                ],
            ],
        };

        const result = game.getClientGameData();

        expect(result).to.deep.equal(expectedClientGameData);
    });

    it('should add the player to the players array', () => {
        const player = new Player('1234', 'TestPlayer');
        game.connectPlayer(player);

        expect(game.players.length).to.equal(1);
        expect(game.players[0]).to.equal(player);
    });

    it('should disconnect player if his SocketId matches with socket received in parameters', () => {
        const player = new Player('socketID', 'playerName');
        game.connectPlayer(player);
        expect(game.players.length).to.equal(1);
        game.disconnectPlayer('socketID');
        expect(game.players.length).to.equal(0);
    });

    it('should update the game state and emit a differenceFound event', () => {
        const socket = 'someSocketID';
        const coords = { x: 10, y: 20 };
        const player = {
            socketID: socket,
            differencesFound: 0,
            name: 'somePlayerName',
        };
        const gameData = {
            differences: [[{ x: 10, y: 20 }]],
        };
        const verifyGameStateStub = sinon.stub();
        const emitToRoomSpy = sinon.spy();
        const players = [player];
        const context = {
            gameData,
            players,
            verifyGameState: verifyGameStateStub,
            emitToRoom: emitToRoomSpy,
        };
        const expectedDifference = [{ x: 10, y: 20 }];

        game.checkCoordinate.call(context, socket, coords);

        expect(verifyGameStateStub.calledOnce).to.be.true;
        expect(emitToRoomSpy.calledOnce).to.be.true;
        expect(emitToRoomSpy.firstCall.args[0]).to.equal('differenceFound');
        expect(emitToRoomSpy.firstCall.args[1]).to.deep.equal({
            difference: expectedDifference,
            playerName: player.name,
        });
        expect(player.differencesFound).to.equal(1);
        expect(gameData.differences.length).to.equal(0);
    });

    it('should end the game when the win condition is met (Multiplayer Mode)', () => {
        const player1 = new Player('1', 'Player 1');
        const player2 = new Player('2', 'Player 2');
        game.gamemode = 'multiplayer';
        game.players = [player1, player2];
        game.gameData = {
            ...expectedClientGameData,
            numberOfDifferences: 4,
            differences: [],
        };

        const endGameStub = sinon.stub(game, 'endGame');

        // One player has enough differences found to win
        player1.differencesFound = 2;
        player2.differencesFound = 1;
        game.verifyGameState();
        expect(endGameStub.calledOnceWithExactly(player1)).to.be.true;

        // No player has enough differences found to win
        player1.differencesFound = 1;
        player2.differencesFound = 0;
        game.verifyGameState();
        expect(endGameStub.calledTwice).to.be.false;
    });

    it('should end the game when the win condition is met (SinglePlayer Mode)', () => {
        const player1 = new Player('1', 'Player 1');
        game.gamemode = 'singleplayer';
        game.players = [player1];
        game.gameData = {
            ...expectedClientGameData,
            numberOfDifferences: 4,
            differences: [],
        };

        const endGameStub = sinon.stub(game, 'endGame');

        // Player1 has found all differences
        player1.differencesFound = 4;
        game.verifyGameState();
        expect(endGameStub.calledOnce).to.be.true;
    });
});
