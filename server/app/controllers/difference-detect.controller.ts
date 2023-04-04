import { DifferenceDetect } from '@app/services/difference-detect.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class DifferenceDetectController {
    router: Router;

    constructor(private readonly differenceDetect: DifferenceDetect) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();
        // /api/image
        this.router.post('/', async (req: Request, res: Response) => {
            // Send the request to the service and send the response

            const image1 = req.body.image1 as string;
            const image2 = req.body.image2 as string;
            const pixels = req.body.pixels as string;
            try {
                const processedImage = await this.differenceDetect.processImage(image1, image2, +pixels);
                const differences = await this.differenceDetect.getPixelDiff(image1, image2, +pixels);
                const numberOfDifferences = differences.length;
                res.send({ processedImage, numberOfDifferences });
            } catch (error) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error.message);
            }
        });
    }
}
