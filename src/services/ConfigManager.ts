import * as vscode from 'vscode';

/**
 * 组件映射规则接口
 */
export interface ComponentMappingRule {
    [componentName: string]: string;
}

/**
 * 插件配置接口
 */
export interface ComponentDocConfig {
    basePath: string;
    mappingRule: ComponentMappingRule;
    cacheTimeout: number;
}

/**
 * 配置管理器
 * 负责读取和管理插件配置
 */
export class ConfigManager {
    private config: ComponentDocConfig;

    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * 加载配置
     */
    private loadConfig(): ComponentDocConfig {
        console.log('[ConfigManager] ========== 开始加载配置 ==========');

        // 获取不同级别的配置
        const workspaceConfig = vscode.workspace.getConfiguration('componentDoc');

        // 尝试从不同来源获取配置，按优先级排序
        const config = this.mergeConfigurations(workspaceConfig);

        console.log('[ConfigManager] 最终配置:', config);
        console.log('[ConfigManager] ========== 配置加载完成 ==========');

        return config;
    }

    /**
     * 合并不同来源的配置
     */
    private mergeConfigurations(workspaceConfig: vscode.WorkspaceConfiguration): ComponentDocConfig {
        // 1. 默认配置
        const defaultConfig: ComponentDocConfig = {
            basePath: '',
            mappingRule: {},
            cacheTimeout: 300000
        };

        // 2. 全局用户配置
        const globalConfig = this.getGlobalConfig();

        // 3. 工作区配置
        const currentConfig = {
            basePath: workspaceConfig.get<string>('basePath', ''),
            mappingRule: workspaceConfig.get<ComponentMappingRule>('mappingRule', {}),
            cacheTimeout: workspaceConfig.get<number>('cacheTimeout', 300000)
        };

        console.log('[ConfigManager] 默认配置:', defaultConfig);
        console.log('[ConfigManager] 全局配置:', globalConfig);
        console.log('[ConfigManager] 当前工作区配置:', currentConfig);

        // 按优先级合并配置：当前工作区 > 全局配置 > 默认配置
        const mergedConfig: ComponentDocConfig = {
            basePath: currentConfig.basePath || globalConfig.basePath || defaultConfig.basePath,
            mappingRule: {
                ...defaultConfig.mappingRule,
                ...globalConfig.mappingRule,
                ...currentConfig.mappingRule
            },
            cacheTimeout: currentConfig.cacheTimeout || globalConfig.cacheTimeout || defaultConfig.cacheTimeout
        };

        console.log('[ConfigManager] 合并后配置:', mergedConfig);
        return mergedConfig;
    }

    /**
     * 获取全局配置
     */
    private getGlobalConfig(): ComponentDocConfig {
        try {
            // 从全局配置中读取
            const globalWorkspaceConfig = vscode.workspace.getConfiguration('componentDoc', null);

            const globalConfig = {
                basePath: globalWorkspaceConfig.inspect<string>('basePath')?.globalValue || '',
                mappingRule: globalWorkspaceConfig.inspect<ComponentMappingRule>('mappingRule')?.globalValue || {},
                cacheTimeout: globalWorkspaceConfig.inspect<number>('cacheTimeout')?.globalValue || 300000
            };

            console.log('[ConfigManager] 读取到的全局配置:', globalConfig);
            return globalConfig;
        } catch (error) {
            console.log('[ConfigManager] 读取全局配置失败:', error);
            return {
                basePath: '',
                mappingRule: {},
                cacheTimeout: 300000
            };
        }
    }

    /**
     * 重新加载配置
     */
    public reload(): void {
        this.config = this.loadConfig();
    }

    /**
     * 获取基础路径
     */
    public getBasePath(): string {
        return this.config.basePath;
    }

    /**
     * 获取映射规则
     */
    public getMappingRule(): ComponentMappingRule {
        return this.config.mappingRule;
    }

    /**
     * 获取缓存超时时间
     */
    public getCacheTimeout(): number {
        return this.config.cacheTimeout;
    }

    /**
     * 根据组件名获取文档路径
     * @param componentName 组件名
     * @returns 文档文件路径
     */
    public getDocumentPath(componentName: string): string | null {
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

        // 1. 精确匹配
        console.log(`[ConfigManager] 🔍 尝试精确匹配...`);
        if (mappingRule[componentName]) {
            const docPath = this.joinPath(basePath, mappingRule[componentName]);
            console.log(`[ConfigManager] ✅ 精确匹配: ${componentName} -> ${mappingRule[componentName]} -> ${docPath}`);

            // 检查文件是否存在
            const fs = require('fs');
            const exists = fs.existsSync(docPath);
            console.log(`[ConfigManager] 文件存在性: ${exists}`);

            if (exists) {
                return docPath;
            }
        }

        // 2. 智能模糊匹配
        console.log(`[ConfigManager] 🔍 尝试智能模糊匹配...`);
        const fuzzyMatch = this.findFuzzyMatch(componentName, basePath);
        if (fuzzyMatch) {
            console.log(`[ConfigManager] ✅ 模糊匹配成功: ${componentName} -> ${fuzzyMatch}`);
            return fuzzyMatch;
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
                } catch (error) {
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
    private searchDocumentRecursively(basePath: string, componentName: string): string | null {
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
            const searchInDirectory = (dirPath: string, maxDepth: number = 3): string | null => {
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
                } catch (error) {
                    // 忽略权限错误等
                    console.debug(`搜索目录时出错: ${dirPath}`, error);
                }

                return null;
            };

            return searchInDirectory(basePath);
        } catch (error) {
            console.debug(`递归搜索文档时出错:`, error);
            return null;
        }
    }

    /**
     * 将驼峰命名转换为短横线命名
     * @param str 驼峰命名字符串
     * @returns 短横线命名字符串
     */
    private camelToKebab(str: string): string {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    }

    /**
     * 将驼峰命名转换为下划线命名
     * @param str 驼峰命名字符串
     * @returns 下划线命名字符串
     */
    private camelToSnake(str: string): string {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    }

    /**
     * 拼接路径
     * @param basePath 基础路径
     * @param relativePath 相对路径
     * @returns 完整路径
     */
    private joinPath(basePath: string, relativePath: string): string {
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
    private normalizeLocalPath(basePath: string, relativePath: string): string {
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
    public validateConfig(): { isValid: boolean; errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 验证基础路径
        if (!this.config.basePath) {
            errors.push('基础路径 (basePath) 未配置');
        } else {
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
        } else if (this.config.cacheTimeout < 60000) {
            warnings.push('缓存超时时间过短（小于1分钟），可能影响性能');
        } else if (this.config.cacheTimeout > 3600000) {
            warnings.push('缓存超时时间过长（大于1小时），可能导致文档更新不及时');
        }

        // 验证映射规则
        if (!this.config.mappingRule || Object.keys(this.config.mappingRule).length === 0) {
            warnings.push('未配置任何映射规则，将使用默认规则（组件名.md）');
        } else {
            // 验证正则表达式
            for (const [pattern, replacement] of Object.entries(this.config.mappingRule)) {
                if (pattern.startsWith('/') && pattern.endsWith('/')) {
                    try {
                        new RegExp(pattern.slice(1, -1));
                    } catch (error) {
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
    public validateComponentMapping(componentName: string): {
        isValid: boolean;
        path: string | null;
        exists: boolean;
        message: string
    } {
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
            exists: true, // 假设存在
            message: '远程文档URL（无法验证存在性）'
        };
    }

    /**
     * 智能模糊匹配
     * @param componentName 组件名
     * @param basePath 基础路径
     * @returns 匹配的文档路径
     */
    private findFuzzyMatch(componentName: string, basePath: string): string | null {
        const fs = require('fs');
        const path = require('path');

        console.log(`[ConfigManager] 🔍 开始模糊匹配: ${componentName}`);

        // 生成可能的匹配模式
        const patterns = this.generateMatchPatterns(componentName);
        console.log(`[ConfigManager] 📋 生成的匹配模式:`, patterns);

        // 搜索目录
        const searchDirs = ['常用组件', '业务组件'];

        for (const dir of searchDirs) {
            const dirPath = path.join(basePath, dir);
            if (!fs.existsSync(dirPath)) {
                console.log(`[ConfigManager] ❌ 目录不存在: ${dirPath}`);
                continue;
            }

            console.log(`[ConfigManager] 🔍 搜索目录: ${dir}`);
            const files = fs.readdirSync(dirPath);

            for (const pattern of patterns) {
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        const fileName = file.replace('.md', '');
                        if (this.isMatch(pattern, fileName)) {
                            const fullPath = path.join(dirPath, file);
                            console.log(`[ConfigManager] ✅ 找到匹配: ${pattern} -> ${fileName} (${file})`);
                            return fullPath.replace(/\\/g, '/');
                        }
                    }
                }
            }
        }

        console.log(`[ConfigManager] ❌ 模糊匹配失败: ${componentName}`);
        return null;
    }

    /**
     * 生成匹配模式
     * @param componentName 组件名
     * @returns 匹配模式数组
     */
    private generateMatchPatterns(componentName: string): string[] {
        const patterns: string[] = [];
        const lowerName = componentName.toLowerCase();

        // 1. 原始名称（不区分大小写）
        patterns.push(lowerName);

        // 2. 添加 ou- 前缀
        patterns.push(`ou-${lowerName}`);

        // 3. 移除可能的前缀
        if (lowerName.startsWith('ou-')) {
            patterns.push(lowerName.substring(3));
        }

        // 4. 驼峰转连字符
        const kebabCase = lowerName.replace(/([A-Z])/g, '-$1').toLowerCase();
        if (kebabCase !== lowerName) {
            patterns.push(kebabCase);
            patterns.push(`ou-${kebabCase}`);
        }

        // 5. 连字符转驼峰
        const camelCase = lowerName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        if (camelCase !== lowerName) {
            patterns.push(camelCase);
        }

        // 去重
        return [...new Set(patterns)];
    }

    /**
     * 检查是否匹配
     * @param pattern 匹配模式
     * @param fileName 文件名
     * @returns 是否匹配
     */
    private isMatch(pattern: string, fileName: string): boolean {
        const lowerPattern = pattern.toLowerCase();
        const lowerFileName = fileName.toLowerCase();

        // 完全匹配
        if (lowerPattern === lowerFileName) {
            return true;
        }

        // 包含匹配
        if (lowerFileName.includes(lowerPattern) || lowerPattern.includes(lowerFileName)) {
            return true;
        }

        return false;
    }
}
