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
        const workspaceConfig = vscode.workspace.getConfiguration('componentDoc');
        
        return {
            basePath: workspaceConfig.get<string>('basePath', ''),
            mappingRule: workspaceConfig.get<ComponentMappingRule>('mappingRule', {}),
            cacheTimeout: workspaceConfig.get<number>('cacheTimeout', 300000)
        };
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
        return path.resolve(basePath, relativePath);
    }

    /**
     * 验证配置是否有效
     * @returns 配置验证结果
     */
    public validateConfig(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

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
