import { GameData } from '@app/interfaces/game-data';
import { DatabaseService } from '@app/services/database.service';
import { DifferenceDetect } from '@app/services/difference-detect.service';
import { randomUUID } from 'crypto';
import { Collection, WithId } from 'mongodb';
import { Subject } from 'rxjs';
import { ImageDataService } from '@app/services/image-data.service';
import { Service } from 'typedi';
const DATABASE_COLLECTION = 'games';
@Service()
export class GameDataService {
    multiplayerGameIds: string[] = [];
    lastDeletedGameId: Subject<string> = new Subject<string>();
    imageDataService = new ImageDataService();
    constructor(public differenceDetect: DifferenceDetect, public databaseService: DatabaseService) {}

    get collection(): Collection<GameData> {
        return this.databaseService.database.collection(DATABASE_COLLECTION);
    }

    async getGames() {
        const games = await this.collection.find({}, { projection: { modifiedImage: 0, originalImage: 0 } }).toArray();
        for (const game of games) {
            const gameId = game.id;
            let images;
            if (this.multiplayerGameIds.includes(game.id)) {
                game.joinable = true;
            }
            await this.imageDataService
                .getImages(gameId)
                .then((serverImages) => {
                    images = serverImages;
                })
                .catch(async () => {
                    images = await this.collection.findOne({ id: gameId }, { projection: { modifiedImage: 1, originalImage: 1 } });
                });
            images = images as {
                originalImage: string;
                modifiedImage: string;
            };
            game.originalImage = images.originalImage;
            game.modifiedImage = images.modifiedImage;
        }
        return games;
    }

    async getGameIds() {
        const gameIds = await this.collection.find({}, { projection: { id: 1 } }).toArray();
        return gameIds as unknown as string[];
    }

    async getGamesByIds(gameIds: string[]) {
        const games = await this.collection.find({ id: { $in: gameIds } }).toArray();
        return games;
    }

    async getGameById(index: string) {
        return this.imageDataService
            .getImages(index)
            .then(async (images) => {
                console.log(this.collection);

                console.log('y5');
                return this.collection
                    .findOne({ id: index }, { projection: { modifiedImage: 0, originalImage: 0 } })
                    .then((game: WithId<GameData>) => {
                        game.modifiedImage = images.modifiedImage;
                        game.originalImage = images.originalImage;
                        return game;
                    });
            })
            .catch(async (e) => {
                console.log('e5:' + e);
                return this.collection
                    .findOne({ id: index })
                    .then(async (game: WithId<GameData>) => {
                        console.log('then5');
                        return game;
                    })
                    .catch(async (game: WithId<GameData>) => {
                        console.log('ee5');
                        return game;
                    });
            });
    }

    async addGame(game: GameData) {
        game.id = randomUUID();
        await this.imageDataService.saveImages(game.id, game.originalImage, game.modifiedImage);
        game.difficulty = await this.differenceDetect.calculateDifficulty(game.originalImage, game.modifiedImage);
        game.differences = await this.differenceDetect.getPixelDiff(game.originalImage, game.modifiedImage, +game.pixelRadius);
        game.joinable = false;
        await this.collection.insertOne(game);
        return game;
    }

    gameIsJoinable(id: string) {
        this.multiplayerGameIds.push(id);
    }

    gameIsNotJoinable(id: string) {
        this.multiplayerGameIds.forEach((value, index) => {
            if (value === id) {
                this.multiplayerGameIds.splice(index, 1);
            }
        });
    }

    async deleteGame(gameId: string) {
        this.lastDeletedGameId.next(gameId);
        await this.collection.deleteOne({ id: gameId });
        await this.imageDataService.deleteImages(gameId);
    }
}
