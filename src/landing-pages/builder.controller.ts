import { Controller, All, Req, Res, UseGuards, BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { FirebaseGuard } from '../auth/firebase.guard';

// Set NODE_ENV to development before importing destack/build/server 
// so its internal development check evaluation is true
process.env.NODE_ENV = 'development';

// Import handleEditor from destack's server build
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handleEditor } = require('destack/build/server');

@Controller('builder/handle')
export class BuilderController {
    @All()
    @UseGuards(FirebaseGuard)
    async handleBuilder(@Req() req: Request & { user?: any }, @Res() res: Response) {
        const queryPath = req.query.path;
        const type = req.query.type;

        // Chỉ bắt buộc path nếu type là data (ưu tiên lưu trữ/truy xuất dữ liệu landing page)
        if (type === 'data' && typeof queryPath !== 'string') {
            throw new BadRequestException('Tham số path là bắt buộc để xử lý dữ liệu');
        }

        // Nếu có path, thực hiện sanitize và cô lập thư mục theo người dùng
        if (typeof queryPath === 'string') {
            const sanitizedPath = queryPath.replace(/\.\./g, '').replace(/[^\w\s\-\.\/]/gi, '').replace(/^\/+/, '');
            const userUid = req.user?.uid;

            if (!userUid) {
                throw new BadRequestException('Không xác định được danh tính người dùng');
            }

            const isolatedPath = path.join('users', userUid, sanitizedPath);
            req.query.path = isolatedPath;

            const dataDir = path.join(process.cwd(), 'data');
            const fullTargetPath = path.join(dataDir, isolatedPath);
            const targetDir = path.dirname(fullTargetPath);

            if (!fs.existsSync(targetDir)) {
                try {
                    fs.mkdirSync(targetDir, { recursive: true });
                } catch (err) {
                    console.error('Lỗi tạo thư mục:', err);
                }
            }
        }

        // Intercept res.send to prevent "<div>Not found</div>" in builder
        const originalSend = res.send;
        res.send = function (body) {
            if (body === "<div>Not found</div>") {
                // Return an empty div instead so the canvas is blank for new pages
                return originalSend.call(this, "");
            }
            return originalSend.call(this, body);
        };

        try {
            await handleEditor(req, res);
        } catch (err) {
            console.error('Builder error - chi tiết:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Internal server error', details: err?.message || err });
            }
        }
    }
}
