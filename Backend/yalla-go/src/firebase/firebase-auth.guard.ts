import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

// authorization guard to verify incoming requests is from authenticated Firebase user
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // ✅ Dev bypass
        const isDev = process.env.NODE_ENV === 'development';
        const bypass = request.headers['x-dev-bypass'] === 'true';

        if (isDev && bypass) {
            console.log('⚠️  Dev bypass active — user set to dev-test-user');
            request.user = { uid: 'dev-test-user' }; // simulate Firebase UID
            return true;
        }

        const authHeader = request.headers.authorization();

        // send exception if HTTP header is wrong (unauthorized)
        if (!authHeader?.startsWith('Bearer')) {
            throw new UnauthorizedException('Missing or malformed Authorization header');
        }

        // split the idToken from the request sent by frontend
        const idToken = authHeader.split('Bearer ')[1];

        try { // verify token
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            request.user = decodedToken; // attach the Firebase user info
            return true;
        } catch (error) { // send UnauthorizedException if token failed to verify
            throw new UnauthorizedException('Invalid or expired token')
        }
    }
}