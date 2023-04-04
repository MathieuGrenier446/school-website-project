import { HEIGHT_IMAGE, WIDTH_IMAGE } from '@app/const';
import * as Jimp from 'jimp';
import { Service } from 'typedi';

@Service()
export class DifferenceDetect {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async findPixelDifferences(img1: any, img2: any): Promise<{ x: number; y: number }[]> {
        const image1 = await Jimp.read(img1);
        const image2 = await Jimp.read(img2);
        const { width, height } = image1.bitmap;
        const diff = new Jimp(width, height);
        const pixelDifferences = [];

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const pixel1 = Jimp.intToRGBA(image1.getPixelColor(x, y));
                const pixel2 = Jimp.intToRGBA(image2.getPixelColor(x, y));
                if (pixel1.r !== pixel2.r || pixel1.g !== pixel2.g || pixel1.b !== pixel2.b) {
                    pixelDifferences.push({ x, y });
                    const red = 255;
                    const blue = 0;
                    const green = 0;
                    const alpha = 255;
                    diff.setPixelColor(Jimp.rgbaToInt(red, blue, green, alpha), x, y);
                }
            }
        }
        // console.log(pixelDifferences);
        return pixelDifferences;
    }

    async createImage(pixels: { x: number; y: number }[]): Promise<string> {
        const whiteColour = 0xffffffff;
        const blackColour = 0x000000ff;
        const image = await new Jimp(WIDTH_IMAGE, HEIGHT_IMAGE, whiteColour);
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < pixels.length; i++) {
            const x = pixels[i].x;
            const y = pixels[i].y;
            image.setPixelColor(blackColour, x, y);
        }

        let base64 = '';
        image.getBase64(Jimp.MIME_BMP, (err, res) => {
            base64 = res;
        });
        return base64;
    }

    async calculateDifficulty(img1: string, img2: string): Promise<string> {
        const image1 = await Jimp.read(Buffer.from(img1.split(',')[1], 'base64'));
        const image2 = await Jimp.read(Buffer.from(img2.split(',')[1], 'base64'));
        const differences = await this.findPixelDifferences(image1, image2);
        const size = WIDTH_IMAGE * HEIGHT_IMAGE;
        const oneHundredPercent = 100;
        const percentage = (differences.length / size) * oneHundredPercent;
        const percentageThreshold = 15;
        if (percentage < percentageThreshold) {
            return 'Facile';
        } else {
            return 'Difficile';
        }
    }

    async pixelRadiusEnlargement(pixels: { x: number; y: number }[], radius: number): Promise<{ x: number; y: number }[]> {
        const newPixels = new Map<string, { x: number; y: number }>();
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < pixels.length; i++) {
            const centerX = pixels[i].x;
            const centerY = pixels[i].y;
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                for (let y = centerY - radius; y <= centerY + radius; y++) {
                    const distance = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
                    if (distance <= radius) {
                        const key = `${x},${y}`;
                        newPixels.set(key, { x, y });
                    }
                }
            }
        }
        return Array.from(newPixels.values());
    }

    async processImage(img1Base64: string, img2Base64: string, radius: number): Promise<string> {
        const image1 = await Jimp.read(Buffer.from(img1Base64.split(',')[1], 'base64'));
        const image2 = await Jimp.read(Buffer.from(img2Base64.split(',')[1], 'base64'));

        const differences = await this.findPixelDifferences(image1, image2);
        const newPixels = await this.pixelRadiusEnlargement(differences, radius);
        const imagefinal = await this.createImage(newPixels);
        return imagefinal;
    }

    async getPixelDiff(img1Base64: string, img2Base64: string, radius: number): Promise<{ x: number; y: number }[][]> {
        const image1 = await Jimp.read(Buffer.from(img1Base64.split(',')[1], 'base64'));
        const image2 = await Jimp.read(Buffer.from(img2Base64.split(',')[1], 'base64'));
        const differences = await this.findPixelDifferences(image1, image2);
        const newPixels = await this.pixelRadiusEnlargement(differences, radius);
        const result = this.findNumberDifferences(newPixels);
        return result;
    }

    findNumberDifferences(pixels: { x: number; y: number }[]): { x: number; y: number }[][] {
        const groups: { x: number; y: number }[][] = [];
        let count = 0;
        const visited = new Set();

        for (let i = 0; i < pixels.length; i++) {
            if (!visited.has(i)) {
                count++;
                const queue = [i];
                visited.add(i);
                groups[count - 1] = [];
                while (queue.length) {
                    const index = queue.shift();
                    if (index === undefined) {
                        break;
                    }
                    for (let j = 0; j < pixels.length; j++) {
                        if (!visited.has(j) && Math.abs(pixels[index].x - pixels[j].x) <= 1 && Math.abs(pixels[index].y - pixels[j].y) <= 1) {
                            queue.push(j);
                            visited.add(j);
                            groups[count - 1].push(pixels[j]);
                        }
                    }
                }
            }
        }
        return groups;
    }
}
