import * as env from '@app/env';
import { Db, MongoClient } from 'mongodb';
import { Service } from 'typedi';

@Service()
export class DatabaseService {
    private db: Db;
    private client: MongoClient;

    get database(): Db {
        return this.db;
    }

    async start(url: string = env.DATABASE_URL): Promise<void> {
        const dbName = this.getDbName();
        try {
            this.client = new MongoClient(url);
            await this.client.connect();
            this.db = this.client.db(dbName);
        } catch {
            throw new Error('Database connection error');
        }
    }

    async closeConnection(): Promise<void> {
        return this.client.close();
    }

    getDbName() {
        const dbName = env.DATABASE_NAME;
        return dbName;
    }
}
