import type { Request, Response } from 'express';
export declare class BuilderController {
    handleBuilder(req: Request & {
        user?: any;
    }, res: Response): Promise<void>;
}
