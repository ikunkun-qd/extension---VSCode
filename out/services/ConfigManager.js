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
        const config = {
            basePath: workspaceConfig.get('basePath', ''),
            mappingRule: workspaceConfig.get('mappingRule', {}),
            cacheTimeout: workspaceConfig.get('cacheTimeout', 300000)
        };
        console.log('[ConfigManager] 加载配置:', config);
        return config;
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
        console.log(`[ConfigManager] ========== 获取文档路径开始 ==========`);
        console.log(`[ConfigManager] 组件名: "${componentName}"`);
        console.log(`[ConfigManager] basePath: "${basePath}"`);
        console.log(`[ConfigManager] mappingRule keys: [${Object.keys(mappingRule).join(', ')}]`);
        console.log(`[ConfigManager] mappingRule:`, mappingRule);
        if (!basePath) {
            console.log(`[ConfigManager] ❌ basePath 为空`);
            return null;
        }
        // 精确匹配
        console.log(`[ConfigManager] 🔍 尝试精确匹配...`);
        if (mappingRule[componentName]) {
            const docPath = this.joinPath(basePath, mappingRule[componentName]);
            console.log(`[ConfigManager] ✅ 精确匹配: ${componentName} -> ${mappingRule[componentName]} -> ${docPath}`);
            // 检查文件是否存在
            const fs = require('fs');
            const exists = fs.existsSync(docPath);
            console.log(`[ConfigManager] 文件存在性: ${exists}`);
            return docPath;
        }
        else {
            console.log(`[ConfigManager] ❌ 精确匹配失败，组件名 "${componentName}" 不在映射规则中`);
        }
        // 正则表达式匹配
        console.log(`[ConfigManager] 开始正则表达式匹配`);
        for (const [pattern, replacement] of Object.entries(mappingRule)) {
            if (pattern.startsWith('/') && pattern.endsWith('/')) {
                try {
                    const regex = new RegExp(pattern.slice(1, -1));
                    const match = componentName.match(regex);
                    console.log(`[ConfigManager] 测试正则: ${pattern} 对 ${componentName}, 匹配: ${!!match}`);
                    if (match) {
                        let docPath = replacement;
                        // 替换捕获组
                        match.forEach((group, index) => {
                            docPath = docPath.replace(new RegExp(`\\$${index}`, 'g'), group);
                        });
                        const fullPath = this.joinPath(basePath, docPath);
                        console.log(`[ConfigManager] 正则匹配: ${pattern} -> ${docPath} -> ${fullPath}`);
                        // 检查文件是否存在
                        const fs = require('fs');
                        const exists = fs.existsSync(fullPath);
                        console.log(`[ConfigManager] 正则匹配文件存在性: ${exists}`);
                        return fullPath;
                    }
                }
                catch (error) {
                    console.log(`[ConfigManager] 正则表达式错误: ${pattern} - ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
        // 递归搜索文档文件
        const foundPath = this.searchDocumentRecursively(basePath, componentName);
        if (foundPath) {
            return foundPath;
        }
        // 默认规则：组件名.md
        return this.joinPath(basePath, `${componentName}.md`);
    }
    /**
     * 递归搜索文档文件
     * @param basePath 基础路径
     * @param componentName 组件名
     * @returns 找到的文档路径或null
     */
    searchDocumentRecursively(basePath, componentName) {
        // 如果是远程URL，无法递归搜索
        if (basePath.startsWith('http://') || basePath.startsWith('https://')) {
            return null;
        }
        const fs = require('fs');
        const path = require('path');
        try {
            // 可能的文件名变体
            const possibleNames = [
                `${componentName}.md`,
                `${componentName.toLowerCase()}.md`,
                `${componentName.toUpperCase()}.md`,
                // 处理驼峰命名转换
                `${this.camelToKebab(componentName)}.md`,
                `${this.camelToSnake(componentName)}.md`
            ];
            // 递归搜索函数
            const searchInDirectory = (dirPath, maxDepth = 3) => {
                if (maxDepth <= 0 || !fs.existsSync(dirPath)) {
                    return null;
                }
                try {
                    const items = fs.readdirSync(dirPath);
                    // 首先在当前目录查找文件
                    for (const fileName of possibleNames) {
                        const filePath = path.join(dirPath, fileName);
                        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                            return filePath;
                        }
                    }
                    // 然后递归搜索子目录
                    for (const item of items) {
                        const itemPath = path.join(dirPath, item);
                        if (fs.statSync(itemPath).isDirectory()) {
                            const result = searchInDirectory(itemPath, maxDepth - 1);
                            if (result) {
                                return result;
                            }
                        }
                    }
                }
                catch (error) {
                    // 忽略权限错误等
                    console.debug(`搜索目录时出错: ${dirPath}`, error);
                }
                return null;
            };
            return searchInDirectory(basePath);
        }
        catch (error) {
            console.debug(`递归搜索文档时出错:`, error);
            return null;
        }
    }
    /**
     * 将驼峰命名转换为短横线命名
     * @param str 驼峰命名字符串
     * @returns 短横线命名字符串
     */
    camelToKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }
    /**
     * 将驼峰命名转换为下划线命名
     * @param str 驼峰命名字符串
     * @returns 下划线命名字符串
     */
    camelToSnake(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
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
        console.log(`[ConfigManager] normalizeLocalPath - basePath: ${basePath}, relativePath: ${relativePath}`);
        // 如果basePath是相对路径，需要相对于工作区根目录解析
        let resolvedBasePath = basePath;
        if (!path.isAbsolute(basePath)) {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (workspaceRoot) {
                resolvedBasePath = path.resolve(workspaceRoot, basePath);
                console.log(`[ConfigManager] 相对路径解析: ${basePath} -> ${resolvedBasePath}`);
            }
        }
        const finalPath = path.resolve(resolvedBasePath, relativePath);
        console.log(`[ConfigManager] 最终路径: ${finalPath}`);
        // 验证路径存在性
        const fs = require('fs');
        const exists = fs.existsSync(finalPath);
        console.log(`[ConfigManager] 路径存在性: ${exists}`);
        return finalPath;
    }
    /**
     * 验证配置是否有效
     * @returns 配置验证结果
     */
    validateConfig() {
        const errors = [];
        const warnings = [];
        // 验证基础路径
        if (!this.config.basePath) {
            errors.push('基础路径 (basePath) 未配置');
        }
        else {
            // 验证路径格式
            if (!this.config.basePath.startsWith('http://') &&
                !this.config.basePath.startsWith('https://') &&
                !this.config.basePath.startsWith('/') &&
                !this.config.basePath.match(/^[a-zA-Z]:/)) {
                warnings.push('基础路径格式可能不正确，建议使用绝对路径或完整URL');
            }
        }
        // 验证缓存超时时间
        if (this.config.cacheTimeout < 0) {
            errors.push('缓存超时时间不能为负数');
        }
        else if (this.config.cacheTimeout < 60000) {
            warnings.push('缓存超时时间过短（小于1分钟），可能影响性能');
        }
        else if (this.config.cacheTimeout > 3600000) {
            warnings.push('缓存超时时间过长（大于1小时），可能导致文档更新不及时');
        }
        // 验证映射规则
        if (!this.config.mappingRule || Object.keys(this.config.mappingRule).length === 0) {
            warnings.push('未配置任何映射规则，将使用默认规则（组件名.md）');
        }
        else {
            // 验证正则表达式
            for (const [pattern, replacement] of Object.entries(this.config.mappingRule)) {
                if (pattern.startsWith('/') && pattern.endsWith('/')) {
                    try {
                        new RegExp(pattern.slice(1, -1));
                    }
                    catch (error) {
                        errors.push(`正则表达式 "${pattern}" 格式错误: ${error}`);
                    }
                    // 检查替换字符串是否包含捕获组引用
                    if (!replacement.includes('$')) {
                        warnings.push(`正则表达式 "${pattern}" 的替换字符串 "${replacement}" 没有使用捕获组，可能不会按预期工作`);
                    }
                }
                // 检查文件扩展名
                if (!replacement.endsWith('.md') && !replacement.endsWith('.html') && !replacement.endsWith('.txt')) {
                    warnings.push(`映射规则 "${pattern}" -> "${replacement}" 的文件扩展名可能不正确`);
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    /**
     * 验证特定组件的映射路径
     * @param componentName 组件名
     * @returns 验证结果
     */
    validateComponentMapping(componentName) {
        const docPath = this.getDocumentPath(componentName);
        if (!docPath) {
            return {
                isValid: false,
                path: null,
                exists: false,
                message: '未找到对应的映射规则'
            };
        }
        // 检查文件是否存在（仅对本地文件）
        if (!docPath.startsWith('http://') && !docPath.startsWith('https://')) {
            const fs = require('fs');
            const exists = fs.existsSync(docPath);
            return {
                isValid: exists,
                path: docPath,
                exists: exists,
                message: exists ? '文档文件存在' : '文档文件不存在'
            };
        }
        // 远程URL，无法直接验证存在性
        return {
            isValid: true,
            path: docPath,
            exists: true,
            message: '远程文档URL（无法验证存在性）'
        };
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map