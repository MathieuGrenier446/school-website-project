import { HEIGHT_IMAGE, WIDTH_IMAGE, TEST_IMAGE_1, TEST_IMAGE_2, TEST_IMAGE_1_BASE_64, TEST_IMAGE_2_BASE_64 } from '@app/const';
import { expect } from 'chai';
import * as Jimp from 'jimp';
import * as sinon from 'sinon';
import { createSandbox, SinonSandbox, SinonStub } from 'sinon';
import { DifferenceDetect } from './difference-detect.service';

describe('DifferenceDetect', () => {
    let sandbox: SinonSandbox;
    let differenceDetect: DifferenceDetect;
    let jimpReadStub: SinonStub;

    beforeEach(() => {
        sandbox = createSandbox();
        differenceDetect = new DifferenceDetect();
        jimpReadStub = sandbox.stub(Jimp, 'read');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('findPixelDifferences', () => {
        it('should find all pixel differences', async () => {
            const width = 2;
            const height = 2;
            const color = 255;

            const image1 = new Jimp(width, height);
            image1.setPixelColor(Jimp.rgbaToInt(0, 0, 0, color), 0, 0);
            image1.setPixelColor(Jimp.rgbaToInt(0, 0, 0, color), 0, 1);
            image1.setPixelColor(Jimp.rgbaToInt(0, 0, 0, color), 1, 0);
            image1.setPixelColor(Jimp.rgbaToInt(color, color, color, color), 1, 1);

            const image2 = new Jimp(width, height);
            image2.setPixelColor(Jimp.rgbaToInt(0, 0, 0, color), 0, 0);
            image2.setPixelColor(Jimp.rgbaToInt(0, 0, 0, color), 0, 1);
            image2.setPixelColor(Jimp.rgbaToInt(color, color, color, color), 1, 0);
            image2.setPixelColor(Jimp.rgbaToInt(0, 0, 0, color), 1, 1);

            jimpReadStub.withArgs(TEST_IMAGE_1).resolves(image1);
            jimpReadStub.withArgs(TEST_IMAGE_2).resolves(image2);

            const result = await differenceDetect.findPixelDifferences(TEST_IMAGE_1, TEST_IMAGE_2);

            expect(result).to.deep.equal([
                { x: 1, y: 0 },
                { x: 1, y: 1 },
            ]);
        });
    });

    describe('createImage', () => {
        it('should create and return a base64-encoded image', async () => {
            // Create some example pixel data
            const pixels = [
                { x: 0, y: 0 },
                { x: 10, y: 20 },
                { x: 100, y: 200 },
            ];

            // Call the createImage method with the pixel data
            const result = await differenceDetect.createImage(pixels);

            // Expect that the result is a non-empty string
            expect(result).to.be.a('string');
            expect(result.length).to.be.greaterThan(0);
        });
    });

    describe('calculateDifficulty', () => {
        it('should return "Facile" if the percentage of differences is less than 15', async () => {
            const image1 = 'data:image/png;base64,iVBORw0KGg...'; // base64-encoded image string
            const image2 = 'data:image/png;base64,iVBORw0KGg...'; // base64-encoded image string

            const findPixelDifferencesStub = sinon.stub(differenceDetect, 'findPixelDifferences').resolves([{ x: 0, y: 0 }]);

            const result = await differenceDetect.calculateDifficulty(image1, image2);

            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(findPixelDifferencesStub.calledOnce).to.be.true;
            expect(result).to.equal('Facile');
        });
        it('should return "Difficile" if the percentage of differences is greater than or equal to 15', async () => {
            const image1 = 'data:image/png;base64,iVBORw0KG...';
            const image2 = 'data:image/png;base64,iVBORw0KG...';

            const pixels: { x: number; y: number }[] = [];

            for (let y = 0; y < HEIGHT_IMAGE; y++) {
                for (let x = 0; x < WIDTH_IMAGE; x++) {
                    pixels.push({ x, y });
                }
            }
            const findPixelDifferencesStub = sinon.stub(differenceDetect, 'findPixelDifferences').resolves(pixels);

            const result = await differenceDetect.calculateDifficulty(image1, image2);

            expect(result).to.equal('Difficile');
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(findPixelDifferencesStub.calledOnce).to.be.true;
        });
    });

    describe('pixelRadiusEnlargement', () => {
        it('should return an array of new pixels', async () => {
            // Arrange
            const pixels = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
                { x: 2, y: 2 },
            ];
            const radius = 1;

            // Stub the Jimp read function
            const expectedPixels = [
                { x: -1, y: 0 },
                { x: 0, y: -1 },
                { x: 0, y: 0 },
                { x: 0, y: 1 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
                { x: 1, y: 2 },
                { x: 2, y: 1 },
                { x: 2, y: 2 },
                { x: 2, y: 3 },
                { x: 3, y: 2 },
            ];

            // Act
            const newPixels = await differenceDetect.pixelRadiusEnlargement(pixels, radius);

            // Assert
            expect(newPixels).to.deep.equal(expectedPixels);
        });
    });
    describe('processImage', () => {
        it('should call the functions to process the image', async () => {
            const radius = 0;

            const findPixelDifferencesStub = sinon.stub(differenceDetect, 'findPixelDifferences').resolves([{ x: 0, y: 0 }]);
            const pixelRadiusEnlargementStub = sinon.stub(differenceDetect, 'pixelRadiusEnlargement').resolves([{ x: 0, y: 0 }]);
            const createImageStub = sinon.stub(differenceDetect, 'createImage').resolves('image');

            const result = await differenceDetect.processImage(TEST_IMAGE_1_BASE_64, TEST_IMAGE_2_BASE_64, radius);

            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(findPixelDifferencesStub.calledOnce).to.be.true;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(pixelRadiusEnlargementStub.calledOnce).to.be.true;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(createImageStub.calledOnce).to.be.true;
            expect(result).to.equal('image');
        });
    });
    describe('getPixelDiff', () => {
        it('should call the functions to process the image', async () => {
            const radius = 0;

            const findPixelDifferencesStub = sinon.stub(differenceDetect, 'findPixelDifferences').resolves([{ x: 0, y: 0 }]);
            const pixelRadiusEnlargementStub = sinon.stub(differenceDetect, 'pixelRadiusEnlargement').resolves([{ x: 0, y: 0 }]);
            const findNumberDifferencesStub = sinon.stub(differenceDetect, 'findNumberDifferences').resolves([]);

            const result = await differenceDetect.getPixelDiff(TEST_IMAGE_1_BASE_64, TEST_IMAGE_2_BASE_64, radius);

            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(findPixelDifferencesStub.calledOnce).to.be.true;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(pixelRadiusEnlargementStub.calledOnce).to.be.true;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
            expect(findNumberDifferencesStub.calledOnce).to.be.true;
            expect(result).to.be.an('array');
        });
    });
    describe('findNumberDifferences', () => {
        it('should group pixels into arrays based on proximity', async () => {
            const pixels = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
                { x: 2, y: 2 },
                { x: 5, y: 5 },
            ];

            const groups = differenceDetect.findNumberDifferences(pixels);
            expect(groups).to.deep.equal([
                [
                    { x: 1, y: 0 },
                    { x: 1, y: 1 },
                    { x: 2, y: 2 },
                ],
                [],
            ]);
        });
        it('should return an empty array when pixels is an empty array', () => {
            const pixels: { x: number; y: number }[] = [];
            const result = differenceDetect.findNumberDifferences(pixels);
            expect(result).to.deep.equal([]);
        });
    });
});
