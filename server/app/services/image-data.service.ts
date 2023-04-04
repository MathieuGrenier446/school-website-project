/* eslint-disable prettier/prettier */
import { Service } from 'typedi';
import * as fs from 'fs';
import * as path from 'path';
import * as fsPromises from 'node:fs/promises';
@Service()
export class ImageDataService {
    async saveBase64Image(directoryName: string, fileName: string, base64String: string) {
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const directoryPath = path.join('./assets/images', directoryName);
        const filePath = path.join(directoryPath, fileName + '.bmp');
        fs.writeFile(filePath, buffer, (err) => {
            if (err) {
                // pass
            } else {
                // pass
            }
        });
    }

    async getBase64Image(directoryName: string, fileName: string): Promise<string> {
        const directoryPath = path.join('./assets/images', directoryName);
        const filePath = path.join(directoryPath, fileName + '.bmp');
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    console.log(err);
                    reject();
                } else {
                    const image = Buffer.from(data).toString('base64');
                    resolve(image);
                }
            });
        });
    }

    async saveImages(gameId: string, originalImage: string, modifiedImage: string) {
        const directoryPath = path.join('./assets/images', gameId);
        if (!fs.existsSync(directoryPath)) {
            fs.mkdir(directoryPath, async (err) => {
                if (err) {
                    // pass
                } else {
                    await this.saveBase64Image(gameId, 'originalImage', originalImage);
                    await this.saveBase64Image(gameId, 'modifiedImage', modifiedImage);
                }
            });
        }
    }

    async deleteImages(gameId: string) {
        const directoryPath = path.join('./assets/images', gameId);
        await fsPromises.rm(directoryPath, { recursive: true, force: true });
    }

    async getImages(gameId: string): Promise<{ originalImage: string; modifiedImage: string }> {
        return this.getBase64Image(gameId, 'originalImage')
            .then(async (originalImage: string) => {
                return this.getBase64Image(gameId, 'modifiedImage')
            .then(async (modifiedImage: string) => {
                console.log('y6');
                return new Promise<{ originalImage: string; modifiedImage: string }>((resolve) => {
                    resolve({ originalImage, modifiedImage });
                });
            })
            .catch(async ()=>{
                console.log('e6');
                return new Promise((resolve, reject) => {
                    reject();
                });
            });
        });
    }
}
