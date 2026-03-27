"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const ai_controller_1 = require("./ai.controller");
const ai_service_1 = require("./ai.service");
const ai_base_service_1 = require("./services/ai-base.service");
const ai_facebook_service_1 = require("./services/ai-facebook.service");
const ai_tiktok_service_1 = require("./services/ai-tiktok.service");
const ai_media_service_1 = require("./services/ai-media.service");
const ai_automation_service_1 = require("./services/ai-automation.service");
const ai_video_processor_service_1 = require("./services/ai-video-processor.service");
const ai_processor_1 = require("./ai.processor");
const ai_facebook_controller_1 = require("./controllers/ai-facebook.controller");
const ai_tiktok_controller_1 = require("./controllers/ai-tiktok.controller");
const ai_media_controller_1 = require("./controllers/ai-media.controller");
const ai_automation_controller_1 = require("./controllers/ai-automation.controller");
const ai_video_processor_controller_1 = require("./controllers/ai-video-processor.controller");
const media_module_1 = require("../media/media.module");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            ai_controller_1.AiController,
            ai_facebook_controller_1.AiFacebookController,
            ai_tiktok_controller_1.AiTikTokController,
            ai_media_controller_1.AiMediaController,
            ai_automation_controller_1.AiAutomationController,
            ai_video_processor_controller_1.AiVideoProcessorController,
        ],
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'video-processing',
            }),
            media_module_1.MediaModule,
        ],
        providers: [
            ai_service_1.AiService,
            ai_base_service_1.AiBaseService,
            ai_facebook_service_1.AiFacebookService,
            ai_tiktok_service_1.AiTikTokService,
            ai_media_service_1.AiMediaService,
            ai_automation_service_1.AiAutomationService,
            ai_video_processor_service_1.AiVideoProcessorService,
            ai_processor_1.AiProcessor,
        ],
        exports: [
            ai_service_1.AiService,
            ai_base_service_1.AiBaseService,
            ai_facebook_service_1.AiFacebookService,
            ai_tiktok_service_1.AiTikTokService,
            ai_media_service_1.AiMediaService,
            ai_automation_service_1.AiAutomationService,
            ai_video_processor_service_1.AiVideoProcessorService,
        ],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map