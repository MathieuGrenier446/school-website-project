// WARNING : Make sure to always import 'reflect-metadata' and 'module-alias/register' first
import 'module-alias/register';
import 'reflect-metadata';
import { Server } from '@app/server';
import { DifferenceDetect } from '@app/services/difference-detect.service';
import { GameDataService } from '@app/services/game-data.service';
import { Container } from 'typedi';
import { DatabaseService } from './services/database.service';

const server: Server = Container.get(Server);
server.init();

const databaseService: DatabaseService = new DatabaseService();
Container.set(DatabaseService, databaseService);

const differenceDetect: DifferenceDetect = new DifferenceDetect();
Container.set(DifferenceDetect, differenceDetect);

const gameDataService: GameDataService = new GameDataService(differenceDetect, databaseService);
Container.set(GameDataService, gameDataService);
