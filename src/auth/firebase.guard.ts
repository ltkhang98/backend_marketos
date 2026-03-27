import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.headers.authorization?.split('Bearer ')[1] || (request.query.token as string);

        if (!token) {
            throw new UnauthorizedException('Không tìm thấy Token xác thực (Header hoặc Query)');
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            request.user = decodedToken;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }
    }
}
