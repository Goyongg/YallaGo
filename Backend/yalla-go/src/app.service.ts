import { Injectable } from '@nestjs/common';
import { FirebaseService } from './firebase/firebase.service';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
