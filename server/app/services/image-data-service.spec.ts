import * as sinon from 'sinon';
import { assert } from 'chai';
import { ImageDataService } from './image-data.service';
import * as fs from 'fs';
import * as path from 'path';
import * as fsPromises from 'node:fs/promises';
describe('ImageDataService', () => {
    let imageDataService: ImageDataService;
    const directoryName = 'testDirectory';
    const fileName = 'testFile';
    const directoryPath = path.join('./assets/images', directoryName);
    const filePath: string = path.join(directoryPath, fileName + '.bmp');
    const fileContent = 'testImageContent';

    const deleteTestDirectory = async () => {
        await fsPromises.rm(directoryPath, { recursive: true, force: true });
    };

    const createTestDirectory = () => {
        fs.mkdirSync(directoryPath);
    };

    beforeEach(async () => {
        await deleteTestDirectory();
        imageDataService = new ImageDataService();
        createTestDirectory();
    });

    afterEach(async () => {
        await deleteTestDirectory();
    });

    it('should write a file at correct path', async () => {
        const spy = sinon.spy(fs, 'writeFile');
        await imageDataService.saveBase64Image(directoryName, fileName, fileContent);
        assert(spy.calledWith(filePath));
        spy.restore();
    });
    it('should not write a file on error', async () => {
        await deleteTestDirectory();
        await imageDataService.saveBase64Image(directoryName, fileName, fileContent).catch(() => {
            // pass
        });
        assert(!fs.existsSync(filePath));
    });

    it('should return image if exists', async () => {
        fs.writeFileSync(filePath, fileContent);
        const image = imageDataService.getBase64Image(directoryName, fileName);
        assert(image !== null);
    });
    it("should throw error if image doesn't exist", async () => {
        const spy = sinon.spy(imageDataService, 'getBase64Image');
        spy(directoryName, fileName)
            .then(() => {
                assert(false);
            })
            .catch(() => {
                assert(true);
            });
        spy.restore();
    });
    it('should call saveBase64Image twice', async () => {
        await imageDataService.saveImages(directoryName, fileContent, fileContent).then(() => {
            assert(fs.existsSync(directoryPath));
        });
    });
    it('should handle error if mkdir fails', async () => {
        const stub = sinon.stub(imageDataService, 'saveBase64Image');
        const existsStub = sinon.stub(fs, 'existsSync').returns(false);
        await imageDataService.saveImages(directoryName, fileContent, fileContent);
        assert(!stub.called);
        stub.restore();
        existsStub.restore();
    });

    it('should delete directory', async () => {
        await imageDataService.deleteImages(directoryName);
        assert(!fs.existsSync(directoryPath));
    });

    it('should handle error if delete fails', async () => {
        const stub = sinon.stub(fsPromises, 'rm').throws(new Error());
        imageDataService.deleteImages(directoryName);
        assert(fs.existsSync(directoryPath));
        stub.restore();
    });

    it('should call getBase64Image twice', async () => {
        const modifiedImagePath = path.join(directoryPath, 'modifiedImage');
        const originalImagePath = path.join(directoryPath, 'originalImage');
        const spy = sinon.spy(imageDataService, 'getBase64Image');

        fs.writeFileSync(modifiedImagePath, fileContent);
        fs.writeFileSync(originalImagePath, fileContent);
        await imageDataService.getImages(directoryName);
        assert(spy.calledTwice);
    });
});
