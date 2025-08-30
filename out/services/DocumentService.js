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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const fs = __importStar(require("fs"));
const axios_1 = __importDefault(require("axios"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
/**
 * 文档服务
 * 负责获取、解析和缓存组件文档
 */
class DocumentService {
    constructor(configManager) {
        this.cache = new Map();
        this.configManager = configManager;
    }
    /**
     * 获取组件文档
     * @param componentName 组件名
     * @returns 文档信息
     */
    async getDocumentation(componentName) {
        try {
            // 验证配置
            const basePath = this.configManager.getBasePath();
            ErrorHandler_1.ErrorHandler.debug(`获取组件文档: ${componentName}, basePath: ${basePath}`);
            if (!basePath || basePath.trim() === '') {
                ErrorHandler_1.ErrorHandler.debug(`basePath未配置，跳过组件: ${componentName}`);
                return null;
            }
            const docPath = this.configManager.getDocumentPath(componentName);
            if (!docPath) {
                ErrorHandler_1.ErrorHandler.debug(`未找到组件 ${componentName} 的文档路径配置`);
                return null;
            }
            ErrorHandler_1.ErrorHandler.debug(`获取组件文档: ${componentName}`, { docPath });
            // 检查缓存
            const cached = this.getFromCache(docPath);
            if (cached) {
                ErrorHandler_1.ErrorHandler.debug(`从缓存获取文档: ${componentName}`);
                return this.parseMarkdown(cached, componentName);
            }
            // 获取文档内容
            const content = await this.fetchDocument(docPath);
            if (!content) {
                ErrorHandler_1.ErrorHandler.debug(`文档内容为空: ${componentName}, 路径: ${docPath}`);
                return null;
            }
            // 缓存内容
            this.setCache(docPath, content);
            ErrorHandler_1.ErrorHandler.debug(`文档已缓存: ${componentName}`);
            return this.parseMarkdown(content, componentName);
        }
        catch (error) {
            console.error(`获取组件 ${componentName} 的文档失败:`, error);
            return null;
        }
    }
    /**
     * 获取组件简短描述（用于悬停提示）
     * @param componentName 组件名
     * @returns 简短描述
     */
    async getShortDescription(componentName) {
        try {
            console.log(`[DocumentService] 📖 获取组件简短描述: ${componentName}`);
            const docInfo = await this.getDocumentation(componentName);
            if (docInfo?.description) {
                console.log(`[DocumentService] ✅ 获取到描述: ${docInfo.description.substring(0, 50)}...`);
                return docInfo.description;
            }
            else {
                console.log(`[DocumentService] ❌ 未获取到描述: ${componentName}`);
                return null;
            }
        }
        catch (error) {
            console.error(`[DocumentService] ❌ 获取组件描述失败: ${componentName}`, error);
            return null;
        }
    }
    /**
     * 从缓存获取内容
     * @param key 缓存键
     * @returns 缓存内容
     */
    getFromCache(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        const now = Date.now();
        const cacheTimeout = this.configManager.getCacheTimeout();
        if (now - item.timestamp > cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        return item.content;
    }
    /**
     * 设置缓存
     * @param key 缓存键
     * @param content 内容
     */
    setCache(key, content) {
        this.cache.set(key, {
            content,
            timestamp: Date.now()
        });
    }
    /**
     * 获取文档内容
     * @param docPath 文档路径
     * @returns 文档内容
     */
    async fetchDocument(docPath) {
        try {
            // 远程URL
            if (docPath.startsWith('http://') || docPath.startsWith('https://')) {
                const response = await axios_1.default.get(docPath, {
                    timeout: 10000,
                    headers: {
                        'Accept': 'text/markdown, text/plain, */*'
                    }
                });
                return response.data;
            }
            // 本地文件
            let localPath = docPath;
            if (docPath.startsWith('file://')) {
                localPath = docPath.substring(7);
            }
            if (fs.existsSync(localPath)) {
                return fs.readFileSync(localPath, 'utf-8');
            }
            return null;
        }
        catch (error) {
            console.error(`获取文档失败: ${docPath}`, error);
            return null;
        }
    }
    /**
     * 解析Markdown文档
     * @param content Markdown内容
     * @param componentName 组件名
     * @returns 解析后的文档信息
     */
    parseMarkdown(content, componentName) {
        const lines = content.split('\n');
        let title = componentName;
        let description = '';
        let props = [];
        // 解析标题
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
            title = titleMatch[1];
        }
        // 解析描述（第一个段落）
        let descriptionStarted = false;
        let descriptionLines = [];
        for (const line of lines) {
            const trimmed = line.trim();
            // 跳过标题行
            if (trimmed.startsWith('#')) {
                if (descriptionStarted)
                    break;
                continue;
            }
            // 开始收集描述
            if (!descriptionStarted && trimmed) {
                descriptionStarted = true;
            }
            if (descriptionStarted) {
                if (!trimmed) {
                    break; // 遇到空行，描述结束
                }
                descriptionLines.push(trimmed);
            }
        }
        description = descriptionLines.join(' ').substring(0, 200);
        // 解析Props表格
        props = this.parsePropsTable(content);
        return {
            title,
            description,
            content,
            props
        };
    }
    /**
     * 解析Props表格
     * @param content Markdown内容
     * @returns 组件属性数组
     */
    parsePropsTable(content) {
        const props = [];
        const lines = content.split('\n');
        let inPropsSection = false;
        let tableStarted = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // 检测Props部分
            if (line.match(/^#+\s*(Props|属性|API)/i)) {
                inPropsSection = true;
                continue;
            }
            // 如果不在Props部分，跳过
            if (!inPropsSection)
                continue;
            // 检测表格开始
            if (line.includes('|') && !tableStarted) {
                tableStarted = true;
                // 跳过表头分隔行
                if (i + 1 < lines.length && lines[i + 1].includes('---')) {
                    i++; // 跳过分隔行
                }
                continue;
            }
            // 解析表格行
            if (tableStarted && line.includes('|')) {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                if (cells.length >= 3) {
                    props.push({
                        name: cells[0] || '',
                        type: cells[1] || '',
                        description: cells[2] || '',
                        required: cells[3]?.toLowerCase().includes('是') || cells[3]?.toLowerCase().includes('true'),
                        defaultValue: cells[4] || undefined
                    });
                }
            }
            else if (tableStarted && !line) {
                // 表格结束
                break;
            }
        }
        return props;
    }
    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
    }
}
exports.DocumentService = DocumentService;
//# sourceMappingURL=DocumentService.js.map