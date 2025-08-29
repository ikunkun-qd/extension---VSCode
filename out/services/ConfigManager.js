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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const vscode = __importStar(require("vscode"));
/**
 * 配置管理器
 * 负责读取和管理插件配置
 */
class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }
    /**
     * 加载配置
     */
    loadConfig() {
        const workspaceConfig = vscode.workspace.getConfiguration('componentDoc');
        return {
            basePath: workspaceConfig.get('basePath', ''),
            mappingRule: workspaceConfig.get('mappingRule', {}),
            cacheTimeout: workspaceConfig.get('cacheTimeout', 300000)
        };
    }
    /**
     * 重新加载配置
     */
    reload() {
        this.config = this.loadConfig();
    }
    /**
     * 获取基础路径
     */
    getBasePath() {
        return this.config.basePath;
    }
    /**
     * 获取映射规则
     */
    getMappingRule() {
        return this.config.mappingRule;
    }
    /**
     * 获取缓存超时时间
     */
    getCacheTimeout() {
        return this.config.cacheTimeout;
    }
    /**
     * 根据组件名获取文档路径
     * @param componentName 组件名
     * @returns 文档文件路径
     */
    getDocumentPath(componentName) {
        const mappingRule = this.config.mappingRule;
        const basePath = this.config.basePath;
        if (!basePath) {
            return null;
        }
        // 精确匹配
        if (mappingRule[componentName]) {
            return this.joinPath(basePath, mappingRule[componentName]);
        }
        // 正则表达式匹配
        for (const [pattern, replacement] of Object.entries(mappingRule)) {
            if (pattern.startsWith('/') && pattern.endsWith('/')) {
                const regex = new RegExp(pattern.slice(1, -1));
                const match = componentName.match(regex);
                if (match) {
                    let docPath = replacement;
                    // 替换捕获组
                    match.forEach((group, index) => {
                        docPath = docPath.replace(new RegExp(`\\$${index}`, 'g'), group);
                    });
                    return this.joinPath(basePath, docPath);
                }
            }
        }
        // 默认规则：组件名.md
        return this.joinPath(basePath, `${componentName}.md`);
    }
    /**
     * 拼接路径
     * @param basePath 基础路径
     * @param relativePath 相对路径
     * @returns 完整路径
     */
    joinPath(basePath, relativePath) {
        // 处理URL路径
        if (basePath.startsWith('http://') || basePath.startsWith('https://')) {
            return basePath.endsWith('/')
                ? basePath + relativePath
                : basePath + '/' + relativePath;
        }
        // 处理本地文件路径
        if (basePath.startsWith('file://')) {
            const localPath = basePath.substring(7);
            return 'file://' + this.normalizeLocalPath(localPath, relativePath);
        }
        // 普通本地路径
        return this.normalizeLocalPath(basePath, relativePath);
    }
    /**
     * 标准化本地路径
     * @param basePath 基础路径
     * @param relativePath 相对路径
     * @returns 标准化后的路径
     */
    normalizeLocalPath(basePath, relativePath) {
        const path = require('path');
        return path.resolve(basePath, relativePath);
    }
    /**
     * 验证配置是否有效
     * @returns 配置验证结果
     */
    validateConfig() {
        const errors = [];
        if (!this.config.basePath) {
            errors.push('基础路径 (basePath) 未配置');
        }
        if (this.config.cacheTimeout < 0) {
            errors.push('缓存超时时间不能为负数');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map