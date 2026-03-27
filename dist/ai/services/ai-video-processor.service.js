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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiVideoProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiVideoProcessorService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const axios_1 = __importDefault(require("axios"));
const ai_base_service_1 = require("./ai-base.service");
const ai_media_service_1 = require("./ai-media.service");
const ai_constants_1 = require("../ai.constants");
const ffmpeg = require('fluent-ffmpeg');
let AiVideoProcessorService = AiVideoProcessorService_1 = class AiVideoProcessorService {
    base;
    media;
    videoQueue;
    logger = new common_1.Logger(AiVideoProcessorService_1.name);
    UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'autosub');
    ensureUploadsDir() {
        if (!fs.existsSync(this.UPLOADS_DIR)) {
            fs.mkdirSync(this.UPLOADS_DIR, { recursive: true });
        }
    }
    constructor(base, media, videoQueue) {
        this.base = base;
        this.media = media;
        this.videoQueue = videoQueue;
    }
    async processAutoSubJob(job) {
        this.logger.log(`Processing AutoSub Job ${job.id}`);
        return { success: true };
    }
    async processDubbingJob(job) {
        const { userId, videoPath, fileName, targetVoice, targetLang, bgVolume, dubVolume, showSubtitles, subStyle, tempDir } = job.data;
        this.logger.log(`[ProcessDubbing] Job: ${job.id}, User: ${userId}`);
        const sessionDir = tempDir || fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-dub-work-'));
        const audioPath = path.join(sessionDir, 'original_audio.mp3');
        const srtPath = path.join(sessionDir, 'sub.srt');
        const outputPath = path.join(sessionDir, 'output.mp4');
        try {
            await job.updateProgress(10);
            this.logger.log(`[ProcessDubbing] Extracting audio...`);
            await this.extractAudio(videoPath, audioPath);
            await job.updateProgress(25);
            this.logger.log(`[ProcessDubbing] Transcribing with Gemini...`);
            const srtContent = await this.transcribeWithGemini(audioPath, 'auto', targetLang);
            fs.writeFileSync(srtPath, srtContent, 'utf-8');
            const entries = this.parseSrt(srtContent);
            if (entries.length === 0)
                throw new Error('Không tìm thấy nội dung để lồng tiếng.');
            await job.updateProgress(40);
            this.logger.log(`[ProcessDubbing] Generating TTS for ${entries.length} segments...`);
            const ttsSegments = [];
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                try {
                    await new Promise(r => setTimeout(r, 1500));
                    const ttsResult = await this.media.generateSpeech({ text: entry.text, voice: targetVoice }, userId);
                    const ttsFilePath = path.join(sessionDir, `tts_${i}.mp3`);
                    let downloaded = false;
                    for (let retry = 0; retry < 5; retry++) {
                        try {
                            const response = await axios_1.default.get(ttsResult.url, {
                                responseType: 'arraybuffer',
                                headers: { 'User-Agent': 'Mozilla/5.0' }
                            });
                            fs.writeFileSync(ttsFilePath, response.data);
                            downloaded = true;
                            break;
                        }
                        catch (err) {
                            if (err.response?.status === 404 && retry < 4) {
                                this.logger.log(`[ProcessDubbing] TTS file ${i} not ready, retrying in 1.5s...`);
                                await new Promise(r => setTimeout(r, 1500));
                            }
                            else
                                throw err;
                        }
                    }
                    if (downloaded) {
                        ttsSegments.push({ path: ttsFilePath, start: entry.start });
                        this.logger.log(`[ProcessDubbing] TTS segment ${i} success (Download ok).`);
                    }
                }
                catch (ttsErr) {
                    this.logger.warn(`[ProcessDubbing] TTS segment ${i} failed final: ${ttsErr.message}`);
                }
            }
            await job.updateProgress(80);
            this.logger.log(`[ProcessDubbing] Merging with FFmpeg (valid segments: ${ttsSegments.length})...`);
            let audioFilter = '';
            let amixInputs = [];
            if (ttsSegments.length > 0) {
                audioFilter = `[0:a]volume=${bgVolume || 0.3}[bg];`;
                amixInputs = ['bg'];
                ttsSegments.forEach((seg, i) => {
                    const startTimeMs = Math.round(seg.start * 1000);
                    audioFilter += `[${i + 1}:a]adelay=${startTimeMs}|${startTimeMs},volume=${dubVolume || 1.5}[a${i}];`;
                    amixInputs.push(`a${i}`);
                });
                audioFilter += `${amixInputs.map(id => `[${id}]`).join('')}amix=inputs=${amixInputs.length}:duration=first[aout]`;
            }
            const command = ffmpeg(videoPath);
            ttsSegments.forEach(seg => command.input(seg.path));
            await new Promise((resolve, reject) => {
                const filterStrings = [];
                let currentV = '0:v';
                if (showSubtitles && entries.length > 0) {
                    const fontSize = subStyle?.fontSize || 24;
                    const yPos = subStyle?.verticalPos || 80;
                    const hexToFfmpeg = (hex) => {
                        if (!hex || !hex.startsWith('#'))
                            return hex;
                        return '0x' + hex.substring(1);
                    };
                    const fc = hexToFfmpeg(subStyle?.color || '#FFFFFF');
                    const bc = hexToFfmpeg(subStyle?.bgColor || '#000000');
                    const fontFile = 'C\\:/Windows/Fonts/arial.ttf';
                    entries.forEach((e, idx) => {
                        const txtContent = e.text.replace(/'/g, "").replace(/:/g, " ");
                        const txtFile = path.join(sessionDir, `s${idx}.txt`);
                        fs.writeFileSync(txtFile, txtContent, 'utf8');
                        const ffTxt = txtFile.replace(/\\/g, '/').replace(/:/g, '\\:');
                        const ffFont = fontFile.replace(/\\/g, '/').replace(/:/g, '\\:');
                        let yExpr = (yPos < 35) ? `h*${(yPos / 100).toFixed(2)}` : (yPos < 65) ? `(h-th)/2` : `h-th-${Math.round((100 - yPos) * 3 + 20)}`;
                        const filterStr = `[${currentV}]drawtext=fontfile='${ffFont}':textfile='${ffTxt}':fontsize=${fontSize}:fontcolor=${fc}:box=1:boxcolor=${bc}@0.6:boxborderw=10:borderw=2:bordercolor=black:x=(w-text_w)/2:y=${yExpr}:enable='between(t,${e.start.toFixed(3)},${e.end.toFixed(3)})'[v${idx}]`;
                        filterStrings.push(filterStr);
                        currentV = `v${idx}`;
                    });
                }
                if (audioFilter) {
                    filterStrings.push(audioFilter);
                }
                let ffmpegCmd = command;
                if (filterStrings.length > 0) {
                    ffmpegCmd = ffmpegCmd.complexFilter(filterStrings);
                    ffmpegCmd = ffmpegCmd.map(currentV);
                    if (audioFilter)
                        ffmpegCmd = ffmpegCmd.map('[aout]');
                    else
                        ffmpegCmd = ffmpegCmd.map('0:a');
                }
                else {
                    ffmpegCmd = ffmpegCmd.map('0:v').map('0:a');
                }
                ffmpegCmd
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .addOption('-crf', '23')
                    .addOption('-preset', 'fast')
                    .on('end', () => resolve())
                    .on('error', (err) => {
                    this.logger.error(`FFmpeg Error: ${err.message}`);
                    reject(err);
                });
                ffmpegCmd.save(outputPath);
            });
            await job.updateProgress(95);
            const docRef = admin.firestore().collection('ai_dubbing').doc(job.id);
            const videoId = job.id;
            const dubbingBaseDir = path.join(path.dirname(this.UPLOADS_DIR), 'dubbing');
            if (!fs.existsSync(dubbingBaseDir))
                fs.mkdirSync(dubbingBaseDir, { recursive: true });
            const jobDir = path.join(dubbingBaseDir, videoId);
            if (!fs.existsSync(jobDir))
                fs.mkdirSync(jobDir, { recursive: true });
            fs.copyFileSync(videoPath, path.join(jobDir, `${videoId}_original.mp4`));
            fs.copyFileSync(outputPath, path.join(jobDir, `${videoId}.mp4`));
            fs.writeFileSync(path.join(jobDir, `${videoId}.srt`), srtContent, 'utf-8');
            const configData = {
                videoId, userId, targetLang, targetVoice,
                createdAt: new Date().toISOString(),
                burnSuccess: true
            };
            fs.writeFileSync(path.join(jobDir, `${videoId}_config.json`), JSON.stringify(configData, null, 2));
            await docRef.set({
                userId,
                fileName,
                targetLang,
                targetVoice,
                status: 'ready',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                jobPath: jobDir
            });
            this.logger.log(`[ProcessDubbing] Done! Result saved to ${jobDir}`);
            try {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            }
            catch (_) { }
            await job.updateProgress(100);
            return { success: true, videoId };
        }
        catch (error) {
            this.logger.error(`[ProcessDubbing] Error: ${error.message}`);
            await admin.firestore().collection('ai_dubbing').doc(job.id).set({
                userId, status: 'failed', error: error.message, updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            throw error;
        }
    }
    async processKolVideoJob(job) {
        this.logger.log(`Processing KolVideo Job ${job.id}`);
        return { success: true };
    }
    async processReburnJob(job) {
        this.logger.log(`Processing Reburn Job ${job.id}`);
        return { success: true };
    }
    extractAudio(videoPath, audioPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .setStartTime(0)
                .noVideo()
                .audioChannels(1)
                .audioFrequency(16000)
                .toFormat('mp3')
                .audioBitrate('64k')
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .save(audioPath);
        });
    }
    getVideoDuration(videoPath) {
        return new Promise((resolve) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err)
                    resolve(0);
                else
                    resolve(metadata.format.duration || 0);
            });
        });
    }
    async transcribeWithGemini(audioPath, srcLang, targetLang) {
        if (!this.base.genAI)
            throw new common_1.BadRequestException('Gemini API Key chưa được cấu hình.');
        const modelId = ai_constants_1.DEFAULT_AI_MODELS.AUTO_SUB_MODEL || 'gemini-1.5-flash-latest';
        const model = this.base.genAI.getGenerativeModel({ model: modelId });
        const audioBuffer = fs.readFileSync(audioPath);
        const audioBase64 = audioBuffer.toString('base64');
        const langMap = {
            auto: 'ngôn ngữ đang nói trong file', vi: 'Tiếng Việt', en: 'Tiếng Anh', zh: 'Tiếng Trung'
        };
        const srcLangLabel = langMap[srcLang] || srcLang;
        const needTranslate = targetLang && targetLang !== 'none' && targetLang !== srcLang;
        const targetLangLabel = langMap[targetLang] || targetLang;
        const prompt = `Bạn là hệ thống tạo phụ đề chuyên nghiệp. Hãy thực hiện đúng quy trình 3 bước sau:

BƯỚC 1: PHÁT HIỆN NGÔN NGỮ
- Lắng nghe âm thanh và xác định chính xác ngôn ngữ đang được nói trong file (Ngôn ngữ nguồn: ${srcLangLabel}).

BƯỚC 2: DỊCH NGÔN NGỮ
- ${needTranslate ? `Dịch toàn bộ nội dung lời nói đã phát hiện ở Bước 1 sang ${targetLangLabel}.` : 'Giữ nguyên nội dung lời nói ở ngôn ngữ gốc.'}

BƯỚC 3: TRẢ VỀ KẾT QUẢ SRT
- Xuất ra tệp định dạng SRT CHUẨN.
- NGÔN NGỮ TRONG SRT: Phải là DUY NHẤT ngôn ngữ ${needTranslate ? targetLangLabel : 'gốc đã phát hiện'}. 
- TUYỆT ĐỐI KHÔNG ghi kèm hai ngôn ngữ, KHÔNG ghi chú, KHÔNG markdown.

QUY TẮC SRT BẮT BUỘC:
- Định dạng mốc thời gian: [HH:MM:SS.mmm --> HH:MM:SS.mmm] (Bắt buộc có đủ Giờ:Phút:Giây).
- Bắt đầu từ [00:00:00.000].
- Mỗi đoạn phụ đề tối đa 2 dòng, mỗi dòng tối đa 35 ký tự.

VÍ DỤ KẾT QUẢ DUY NHẤT ${needTranslate ? targetLangLabel : 'NGÔN NGỮ GỐC'}:
1
00:00:01.000 --> 00:00:03.500
${needTranslate ? 'This is the expected single-language translation output.' : 'Đây là duy nhất dòng phụ đề ngôn ngữ gốc.'}
`;
        const result = await model.generateContent([
            { text: prompt },
            { inlineData: { mimeType: 'audio/mp3', data: audioBase64 } }
        ]);
        const srt = result.response.text().trim();
        const match = srt.match(/\d+\n\d{2}:\d{2}:\d{2},\d{3}[\s\S]*/);
        return match ? match[0].trim() : srt;
    }
    parseSrt(srtContent) {
        const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
        const timeToSec = (t) => {
            const cleanT = t.trim().replace(',', '.');
            const parts = cleanT.split(':');
            const secondsAndMs = parts[parts.length - 1].split('.');
            const ms = parseInt(secondsAndMs[1] || '0') / 1000;
            const s = parseInt(secondsAndMs[0] || '0');
            const m = parseInt(parts[parts.length - 2] || '0');
            const h = parseInt(parts[parts.length - 3] || '0');
            return h * 3600 + m * 60 + s + ms;
        };
        const timeRegex = /(\d{1,2}(?::\d{1,2}){1,2}[,.]\d{1,3})\s*-->\s*(\d{1,2}(?::\d{1,2}){1,2}[,.]\d{1,3})/g;
        const timestampMatches = [];
        let match;
        while ((match = timeRegex.exec(normalized)) !== null) {
            timestampMatches.push({
                startStr: match[1],
                endStr: match[2],
                index: match.index,
                length: match[0].length
            });
        }
        const entries = [];
        for (let i = 0; i < timestampMatches.length; i++) {
            const current = timestampMatches[i];
            const next = timestampMatches[i + 1];
            let rawText = normalized.substring(current.index + current.length, next ? next.index : normalized.length).trim();
            rawText = rawText.split('\n').filter(line => !/^\d+$/.test(line.trim())).join(' ').trim();
            if (rawText) {
                entries.push({
                    start: timeToSec(current.startStr),
                    end: timeToSec(current.endStr),
                    text: rawText,
                });
            }
        }
        this.logger.log(`[SRT Parser] entries=${entries.length}`);
        if (entries.length > 0 && entries[0].start > 60) {
            const offset = entries[0].start;
            this.logger.warn(`[SRT Parser] Phát hiện lệch thời gian lớn (${offset}s). Đang tự động bù trừ...`);
            entries.forEach(e => {
                e.start = Math.max(0, e.start - offset);
                e.end = Math.max(0, e.end - offset);
            });
        }
        const wrapText = (txt, maxChars = 35) => {
            const words = txt.split(' ');
            let line = '';
            let result = '';
            words.forEach(word => {
                if ((line + word).length > maxChars) {
                    result += line.trim() + '\n';
                    line = word + ' ';
                }
                else {
                    line += word + ' ';
                }
            });
            return result + line.trim();
        };
        for (let i = 0; i < entries.length; i++) {
            entries[i].text = wrapText(entries[i].text);
            if (i > 0 && entries[i].start < entries[i - 1].end) {
                entries[i - 1].end = entries[i].start - 0.1;
                if (entries[i - 1].end < entries[i - 1].start)
                    entries[i - 1].end = entries[i - 1].start + 0.1;
            }
        }
        if (entries.length === 0 && srtContent.length > 0) {
            this.logger.warn(`[SRT Parser] Parse thất bại. Nội dung SRT thô:\n${srtContent.slice(0, 500)}...`);
        }
        return entries;
    }
    burnSubtitles(videoPath, srtPath, outputPath, fontSize, yPos, subColor, subBgColor, style, subBgOpacity = 60) {
        return new Promise((resolve, reject) => {
            const srtContent = fs.readFileSync(srtPath, 'utf-8');
            const entries = this.parseSrt(srtContent);
            if (entries.length === 0) {
                reject(new Error('Không có phụ đề nào hợp lệ trong file SRT.'));
                return;
            }
            let yExpr;
            if (yPos < 35)
                yExpr = `h*${(yPos / 100).toFixed(2)}`;
            else if (yPos < 65)
                yExpr = `(h-th)/2`;
            else
                yExpr = `h-th-${Math.round((100 - yPos) * 3 + 20)}`;
            const fc = (subColor && subColor.startsWith('#')) ? subColor : 'yellow';
            const alpha = (subBgOpacity / 100).toFixed(1);
            const bc = (subBgColor && subBgColor.startsWith('#')) ? `${subBgColor}@${alpha}` : `black@${alpha}`;
            const tempDir = path.dirname(srtPath);
            const fontFile = 'C\\:/Windows/Fonts/arial.ttf';
            const filterParts = entries.map((e, idx) => {
                const txtFile = path.join(tempDir, `s${idx}.txt`);
                fs.writeFileSync(txtFile, e.text, 'utf8');
                const ffTxt = txtFile.replace(/\\/g, '/').replace(/:/g, '\\:');
                return [
                    `drawtext=fontfile='${fontFile}'`,
                    `textfile='${ffTxt}'`,
                    `fontsize=${fontSize}`,
                    `fontcolor='${fc}'`,
                    `box=1`,
                    `boxcolor='${bc}'`,
                    `boxborderw=10`,
                    `borderw=2`,
                    `bordercolor=black`,
                    `x=(w-text_w)/2`,
                    `y=${yExpr}`,
                    `enable='between(t,${e.start.toFixed(3)},${e.end.toFixed(3)})'`,
                ].join(':');
            }).join(',');
            this.logger.log(`[Burn] entries=${entries.length} yExpr=${yExpr} font=${fontFile}`);
            this.logger.log(`[Burn] entry[0]: ${entries[0]?.start.toFixed(1)}s-${entries[0]?.end.toFixed(1)}s "${entries[0]?.text?.slice(0, 40)}"`);
            if (entries[0] && entries[0].start > 30) {
                this.logger.warn(`[Burn] CẢNH BÁO: Phụ đề đầu tiên bắt đầu lúc ${entries[0].start}s. Có thể video ngắn hơn thời gian này nên không thấy phụ đề.`);
            }
            ffmpeg(videoPath)
                .videoFilters(filterParts)
                .addOption('-c:v', 'libx264')
                .addOption('-crf', '23')
                .addOption('-preset', 'fast')
                .addOption('-c:a', 'copy')
                .on('end', () => resolve())
                .on('error', (err) => {
                this.logger.error(`ffmpeg burn error: ${err.message}`);
                reject(err);
            })
                .save(outputPath);
        });
    }
    async generateAutoSubtitles(file, srcLang, targetLang, style, fontSize, yPos, userId, subColor, subBgColor, subBgOpacity) {
        let tempDir = '';
        try {
            this.logger.log(`[AutoSub] Start for user: ${userId}, file: ${file.originalname}`);
            if (!this.base.genAI)
                throw new common_1.BadRequestException('Gemini API Key chưa được cấu hình.');
            const cost = this.base.CREDIT_COSTS.AUTO_SUB || 1000;
            await this.base.deductCredits(userId, cost, 'Tạo phụ đề video (Gemini)', 'AUTO_SUB');
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-sub-'));
            const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
            const videoPath = path.join(tempDir, `input_${safeFileName}`);
            const audioPath = path.join(tempDir, 'audio.mp3');
            const srtPath = path.join(tempDir, 'sub.srt');
            const outputPath = path.join(tempDir, 'output.mp4');
            fs.writeFileSync(videoPath, file.buffer);
            this.logger.log(`[AutoSub] Extracting audio...`);
            await this.extractAudio(videoPath, audioPath);
            this.logger.log(`[AutoSub] Sending audio to Gemini for transcription...`);
            const srtContent = await this.transcribeWithGemini(audioPath, srcLang, targetLang);
            this.logger.log(`[AutoSub] SRT generated (${srtContent.length} characters)`);
            fs.writeFileSync(srtPath, srtContent, 'utf-8');
            this.logger.log(`[AutoSub] Burning subtitles into video...`);
            let videoToUpload = videoPath;
            let burnSuccess = false;
            try {
                await this.burnSubtitles(videoPath, srtPath, outputPath, Number(fontSize) || 24, Number(yPos) || 80, subColor || '#FFFF00', subBgColor || '#000000', style || 'tiktok', Number(subBgOpacity) || 60);
                videoToUpload = outputPath;
                burnSuccess = true;
                this.logger.log(`[AutoSub] Burn subtitle succeeded.`);
            }
            catch (burnErr) {
                this.logger.warn(`[AutoSub] Burn failed (${burnErr.message}), falling back to original video + SRT only.`);
            }
            this.logger.log(`[AutoSub] Saving data to local storage (burned: ${burnSuccess})...`);
            const docRef = admin.firestore().collection('ai_subtitles').doc();
            const videoId = docRef.id;
            const jobDir = path.join(this.UPLOADS_DIR, videoId);
            if (!fs.existsSync(jobDir))
                fs.mkdirSync(jobDir, { recursive: true });
            fs.copyFileSync(videoPath, path.join(jobDir, `${videoId}.mp4`));
            if (fs.existsSync(audioPath)) {
                fs.copyFileSync(audioPath, path.join(jobDir, `${videoId}.mp3`));
            }
            fs.writeFileSync(path.join(jobDir, `${videoId}.srt`), srtContent, 'utf-8');
            if (burnSuccess) {
                fs.copyFileSync(outputPath, path.join(jobDir, `${videoId}_burned.mp4`));
            }
            const configData = {
                videoId, userId, srcLang, targetLang, style, fontSize, yPos, subColor, subBgColor,
                burnSuccess, createdAt: new Date().toISOString()
            };
            fs.writeFileSync(path.join(jobDir, `${videoId}_config.json`), JSON.stringify(configData, null, 2));
            this.logger.log(`[AutoSub] Saved job data to: ${jobDir}`);
            await docRef.set({
                userId, srtContent,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                fileName: file.originalname,
                status: burnSuccess ? 'ready' : 'srt_only',
                jobPath: jobDir
            });
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            catch (_) { }
            this.logger.log(`[AutoSub] Done! videoId: ${videoId}, burned: ${burnSuccess}`);
            return {
                success: true, videoId, srtContent, burnSuccess,
                message: burnSuccess
                    ? 'Đã tạo và ghi phụ đề vào video thành công!'
                    : 'Đã tạo phụ đề thành công! (Video chưa được burn sub - xem SRT bên dưới)'
            };
        }
        catch (error) {
            this.logger.error(`[AutoSub] Error: ${error.message}`);
            if (tempDir)
                try {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
                catch (_) { }
            if (error.message?.includes('429') || error.message?.includes('exhausted')) {
                throw new common_1.InternalServerErrorException('Hệ thống AI đang quá tải (Limit 429). Vui lòng đợi 1-2 phút và thử lại.');
            }
            if (error instanceof common_1.BadRequestException)
                throw error;
            throw new common_1.InternalServerErrorException('Lỗi khi xử lý video: ' + error.message);
        }
    }
    async videoDubbing(file, targetVoice, targetLang, userId, bgVolume, dubVolume, showSubtitles, subStyle) {
        this.logger.log(`[VideoDubbing] Request start for user: ${userId}`);
        const cost = this.base.CREDIT_COSTS.VIDEO_DUBBING || 1500;
        await this.base.deductCredits(userId, cost, 'Lồng tiếng video AI', 'VIDEO_DUBBING');
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-dub-init-'));
        const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        const videoPath = path.join(tempDir, safeFileName);
        fs.writeFileSync(videoPath, file.buffer);
        const job = await this.videoQueue.add('video-dubbing', {
            type: 'video-dubbing',
            userId,
            videoPath,
            fileName: file.originalname,
            targetVoice,
            targetLang,
            bgVolume,
            dubVolume,
            showSubtitles,
            subStyle,
            tempDir
        });
        return { jobId: job.id, message: 'Đã đưa yêu cầu lồng tiếng vào hàng đợi thành công.' };
    }
    async renderAutomationVideo(resultId, userId, workflowId) {
        return { success: true, videoUrl: '...' };
    }
    async generateKolVideo(imageUrl, videoUrl, userId) {
        if (!this.base.replicate)
            throw new common_1.BadRequestException('Tính năng này chưa được cấu hình API Key.');
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.KOL_VIDEO, 'Video KOL (DreamActor)', 'KOL_VIDEO');
        return { jobId: 'kol_123', message: 'Đã đưa yêu cầu tạo video vào hàng đợi thành công.' };
    }
    async generateVideoConcept(body, userId) {
        if (!this.base.model)
            throw new common_1.BadRequestException('Gemini API Key is not configured');
        await this.base.deductCredits(userId, this.base.CREDIT_COSTS.SOCIAL_CONTENT, 'Tạo Video Concept AI', 'VIDEO_CONCEPT');
        const prompt = `Bạn là một chuyên gia sáng tạo video quảng cáo ngắn (TikTok, Reels, Shorts).
        Hãy lên ý tưởng kịch bản video cho sản phẩm sau:
        - Tên: ${body.productName}
        - Thương hiệu: ${body.brand || '---'}
        - Mô tả: ${body.description}
        - Vibe: ${body.vibe || 'energetic'}
        - Thời lượng dự kiến: ${body.duration || 15} giây

        YÊU CẦU TRẢ VỀ JSON CHUẨN:
        {
          "title": "Tiêu đề hấp dẫn",
          "scenes": [
            { "time": "0s", "visual": "Mô tả hình ảnh cảnh 1", "text": "Câu thoại/Phụ đề cảnh 1", "duration": 3.75 }
          ],
          "marketing_hooks": ["Hook 1", "Hook 2"]
        }
        Lưu ý: Chia thành khoảng 4-5 cảnh để phù hợp với thời lượng.`;
        try {
            const result = await this.base.model.generateContent(prompt);
            const responseText = result.response.text();
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            return JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
        }
        catch (error) {
            this.logger.error(`Error generating video concept: ${error.message}`);
            throw new common_1.InternalServerErrorException('Không thể tạo kịch bản video lúc này.');
        }
    }
    async streamVideo(videoId, type, res, download = false) {
        try {
            const idOnly = videoId.replace('.mp4', '');
            let fileName = videoId.includes('.') ? videoId : `${videoId}.mp4`;
            const baseDir = type === 'video_dub'
                ? path.join(path.dirname(this.UPLOADS_DIR), 'dubbing')
                : this.UPLOADS_DIR;
            let filePath;
            if (type === 'video_dub') {
                filePath = path.join(baseDir, idOnly, `${idOnly}.mp4`);
            }
            else {
                filePath = path.join(baseDir, idOnly, `${idOnly}_burned.mp4`);
                if (fs.existsSync(filePath)) {
                    fileName = `${idOnly}_burned.mp4`;
                }
                else {
                    filePath = path.join(baseDir, idOnly, `${idOnly}.mp4`);
                    if (!fs.existsSync(filePath)) {
                        filePath = path.join(baseDir, fileName);
                    }
                }
            }
            if (!fs.existsSync(filePath)) {
                this.logger.error(`[Stream] File not found: ${filePath}`);
                return res.status(404).send('Video not found');
            }
            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Content-Type', 'video/mp4');
            if (download) {
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Length', fileSize);
                fs.createReadStream(filePath).pipe(res);
                return;
            }
            const range = res.req?.headers?.range;
            if (range) {
                const parts = range.replace(/bytes=/, '').split('-');
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': end - start + 1,
                    'Content-Type': 'video/mp4',
                });
                fs.createReadStream(filePath, { start, end }).pipe(res);
            }
            else {
                res.setHeader('Content-Length', fileSize);
                res.setHeader('Accept-Ranges', 'bytes');
                fs.createReadStream(filePath).pipe(res);
            }
        }
        catch (error) {
            this.logger.error(`Error streaming video: ${error.message}`);
            res.status(500).send('Error streaming video');
        }
    }
    async updateSubtitle(body, userId) {
        const { videoId, srtContent, style, fontSize, yPos, subColor, subBgColor, subBgOpacity } = body;
        this.logger.log(`[UpdateSub] video: ${videoId}, user: ${userId}`);
        let tempDir = '';
        try {
            await admin.firestore().collection('ai_subtitles').doc(videoId).update({
                srtContent,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            this.ensureUploadsDir();
            const jobDir = path.join(this.UPLOADS_DIR, videoId);
            const srcPath = path.join(jobDir, `${videoId}.mp4`);
            if (!fs.existsSync(srcPath)) {
                const oldPath = path.join(this.UPLOADS_DIR, `${videoId}.mp4`);
                if (!fs.existsSync(oldPath))
                    throw new common_1.BadRequestException(`Không tìm thấy file video: ${videoId}`);
                if (!fs.existsSync(jobDir))
                    fs.mkdirSync(jobDir, { recursive: true });
                fs.copyFileSync(oldPath, srcPath);
            }
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-reburn-'));
            const videoPath = path.join(tempDir, 'input.mp4');
            const srtPath = path.join(tempDir, 'sub.srt');
            const outputPath = path.join(tempDir, 'output.mp4');
            fs.copyFileSync(srcPath, videoPath);
            fs.writeFileSync(srtPath, srtContent, 'utf-8');
            fs.writeFileSync(path.join(jobDir, `${videoId}.srt`), srtContent, 'utf-8');
            this.logger.log(`[UpdateSub] Re-burning video...`);
            await this.burnSubtitles(videoPath, srtPath, outputPath, Number(fontSize) || 24, Number(yPos) || 80, subColor || '#FFFF00', subBgColor || '#000000', style || 'tiktok', Number(subBgOpacity) || 60);
            const burnedPath = path.join(jobDir, `${videoId}_burned.mp4`);
            fs.copyFileSync(outputPath, burnedPath);
            const configPath = path.join(jobDir, `${videoId}_config.json`);
            const configData = {
                videoId, updatedAt: new Date().toISOString(),
                style, fontSize, yPos, subColor, subBgColor, burnSuccess: true
            };
            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            catch (_) { }
            return { success: true, videoId, message: 'Đã cập nhật phụ đề và ghi lại vào video!' };
        }
        catch (error) {
            this.logger.error(`[UpdateSub] Error: ${error.message}`);
            if (tempDir)
                try {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
                catch (_) { }
            throw new common_1.InternalServerErrorException('Lỗi khi cập nhật phụ đề: ' + error.message);
        }
    }
    async reburnVideo(body, userId) {
        return this.updateSubtitle(body, userId);
    }
    async getJobStatus(jobId) {
        const job = await this.videoQueue.getJob(jobId);
        if (!job) {
            const doc = await admin.firestore().collection('ai_dubbing').doc(jobId).get();
            if (doc.exists) {
                const data = doc.data();
                return {
                    id: jobId,
                    state: data.status === 'ready' ? 'completed' : data.status === 'failed' ? 'failed' : 'unknown',
                    progress: 100,
                    result: { videoId: jobId, ...data }
                };
            }
            return { id: jobId, state: 'not_found' };
        }
        const state = await job.getState();
        const progress = job.progress;
        const result = job.returnvalue;
        const reason = job.failedReason;
        return { id: jobId, state, progress, result, reason };
    }
};
exports.AiVideoProcessorService = AiVideoProcessorService;
exports.AiVideoProcessorService = AiVideoProcessorService = AiVideoProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('video-processing')),
    __metadata("design:paramtypes", [ai_base_service_1.AiBaseService,
        ai_media_service_1.AiMediaService,
        bullmq_2.Queue])
], AiVideoProcessorService);
//# sourceMappingURL=ai-video-processor.service.js.map