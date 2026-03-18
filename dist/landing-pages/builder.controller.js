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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuilderController = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const firebase_guard_1 = require("../auth/firebase.guard");
process.env.NODE_ENV = 'development';
const { handleEditor } = require('destack/build/server');
let BuilderController = class BuilderController {
    async handleBuilder(req, res) {
        const queryPath = req.query.path;
        const type = req.query.type;
        if (type === 'data' && typeof queryPath !== 'string') {
            throw new common_1.BadRequestException('Tham số path là bắt buộc để xử lý dữ liệu');
        }
        if (typeof queryPath === 'string') {
            const sanitizedPath = queryPath.replace(/\.\./g, '').replace(/[^\w\s\-\.\/]/gi, '').replace(/^\/+/, '');
            const userUid = req.user?.uid;
            if (!userUid) {
                throw new common_1.BadRequestException('Không xác định được danh tính người dùng');
            }
            const isolatedPath = path.join('users', userUid, sanitizedPath);
            req.query.path = isolatedPath;
            const dataDir = path.join(process.cwd(), 'data');
            const fullTargetPath = path.join(dataDir, isolatedPath);
            const targetDir = path.dirname(fullTargetPath);
            if (!fs.existsSync(targetDir)) {
                try {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                catch (err) {
                    console.error('Lỗi tạo thư mục:', err);
                }
            }
        }
        const originalSend = res.send;
        res.send = function (body) {
            if (body === "<div>Not found</div>") {
                return originalSend.call(this, "");
            }
            return originalSend.call(this, body);
        };
        try {
            await handleEditor(req, res);
        }
        catch (err) {
            console.error('Builder error - chi tiết:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Internal server error', details: err?.message || err });
            }
        }
    }
};
exports.BuilderController = BuilderController;
__decorate([
    (0, common_1.All)(),
    (0, common_1.UseGuards)(firebase_guard_1.FirebaseGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BuilderController.prototype, "handleBuilder", null);
exports.BuilderController = BuilderController = __decorate([
    (0, common_1.Controller)('builder/handle')
], BuilderController);
//# sourceMappingURL=builder.controller.js.map