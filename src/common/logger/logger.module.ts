import { Module, Global } from '@nestjs/common';
import { FirestoreLogger } from './firestore-logger.service';

@Global()
@Module({
    providers: [FirestoreLogger],
    exports: [FirestoreLogger],
})
export class LoggerModule { }
