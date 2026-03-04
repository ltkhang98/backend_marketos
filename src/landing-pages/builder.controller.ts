import { Controller, All, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Set NODE_ENV to development before importing destack/build/server 
// so its internal development check evaluation is true
process.env.NODE_ENV = 'development';

// Import handleEditor from destack's server build
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handleEditor } = require('destack/build/server');

@Controller('builder')
export class BuilderController {
    @All('handle')
    async handleBuilder(@Req() req: Request, @Res() res: Response) {
        // Tự động tạo thư mục con (ví dụ: data/landing-page) nếu cần lưu
        if (req.method === 'POST' && req.query.type === 'data' && typeof req.query.path === 'string') {
            const dataDir = path.join(process.cwd(), 'data');
            const targetPath = path.join(dataDir, req.query.path);
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
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
