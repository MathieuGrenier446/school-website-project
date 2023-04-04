/* eslint-disable @typescript-eslint/no-explicit-any */
import { GameDataService } from '@app/services/game-data.service';
import { Message } from '@common/message';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class DataController {
    router: Router;

    constructor(private readonly gameDataService: GameDataService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();
        // /api/data
        this.router.get('/', (req: Request, res: Response) => {
            // Send the request to the service and send the response
            this.gameDataService
                .getGames()
                .then((games) => {
                    res.json(games);
                })
                .catch((reason: any) => {
                    const errorMessage: Message = {
                        title: 'Error',
                        body: reason as string,
                    };
                    res.json(errorMessage);
                });
        });

        this.router.post('/', async (req: Request, res: Response) => {
            await this.gameDataService.addGame(req.body);
            res.sendStatus(StatusCodes.OK);
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            await this.gameDataService.deleteGame(req.params.id);
            res.sendStatus(StatusCodes.OK);
        });
    }
}
