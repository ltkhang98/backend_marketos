"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MediaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
let MediaService = MediaService_1 = class MediaService {
    logger = new common_1.Logger(MediaService_1.name);
    baseUploadPath = path.join(process.cwd(), 'uploads');
    constructor() {
        this.ensureDirectoryExists(this.baseUploadPath);
    }
    ensureDirectoryExists(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    async saveFile(file, folder = '') {
        try {
            if (!file) {
                throw new Error('No file provided in the request.');
            }
            if (!file.buffer) {
                throw new Error('File buffer is empty. Multer might be misconfigured.');
            }
            this.logger.log(`Saving file ${file.originalname} to folder ${folder}`);
            const uploadPath = path.join(this.baseUploadPath, folder);
            this.ensureDirectoryExists(uploadPath);
            const fileExt = path.extname(file.originalname);
            const fileName = `${(0, uuid_1.v4)()}${fileExt}`;
            const filePath = path.join(uploadPath, fileName);
            await fs.promises.writeFile(filePath, file.buffer);
            this.logger.log(`File saved success: ${filePath}`);
            return `/uploads/${folder ? folder + '/' : ''}${fileName}`;
        }
        catch (error) {
            this.logger.error(`Error saving file: ${error.message}`);
            throw error;
        }
    }
    async saveBuffer(buffer, originalName, folder = '') {
        const uploadPath = path.join(this.baseUploadPath, folder);
        this.ensureDirectoryExists(uploadPath);
        const fileExt = path.extname(originalName) || '.jpg';
        const fileName = `${(0, uuid_1.v4)()}${fileExt}`;
        const filePath = path.join(uploadPath, fileName);
        await fs.promises.writeFile(filePath, buffer);
        return `/uploads/${folder ? folder + '/' : ''}${fileName}`;
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = MediaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MediaService);
//# sourceMappingURL=media.service.js.map