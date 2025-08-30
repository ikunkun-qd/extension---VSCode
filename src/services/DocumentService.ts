import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { ConfigManager } from './ConfigManager';
import { ErrorHandler } from '../utils/ErrorHandler';

/**
 * 文档信息接口
 */
export interface DocumentInfo {
    title: string;
    description: string;
    content: string;
    props?: ComponentProp[];
}

/**
 * 组件属性接口
 */
export interface ComponentProp {
    name: string;
    type: string;
    description: string;
    required?: boolean;
    defaultValue?: string;
}

/**
 * 缓存项接口
 */
interface CacheItem {
    content: string;
    timestamp: number;
}

/**
 * 文档服务
 * 负责获取、解析和缓存组件文档
 */
export class DocumentService {
    private cache: Map<string, CacheItem> = new Map();
    private configManager: ConfigManager;

    constructor(configManager: ConfigManager) {
        this.configManager = configManager;
    }

    /**
     * 获取组件文档
     * @param componentName 组件名
     * @returns 文档信息
     */
    public async getDocumentation(componentName: string): Promise<DocumentInfo | null> {
        try {
            // 验证配置
            const basePath = this.configManager.getBasePath();
            ErrorHandler.debug(`获取组件文档: ${componentName}, basePath: ${basePath}`);

            if (!basePath || basePath.trim() === '') {
                ErrorHandler.debug(`basePath未配置，跳过组件: ${componentName}`);
                return null;
            }

            const docPath = this.configManager.getDocumentPath(componentName);
            if (!docPath) {
                ErrorHandler.debug(`未找到组件 ${componentName} 的文档路径配置`);
                return null;
            }

            ErrorHandler.debug(`获取组件文档: ${componentName}`, { docPath });

            // 检查缓存
            const cached = this.getFromCache(docPath);
            if (cached) {
                ErrorHandler.debug(`从缓存获取文档: ${componentName}`);
                return this.parseMarkdown(cached, componentName);
            }

            // 获取文档内容
            const content = await this.fetchDocument(docPath);
            if (!content) {
                ErrorHandler.debug(`文档内容为空: ${componentName}, 路径: ${docPath}`);
                return null;
            }

            // 缓存内容
            this.setCache(docPath, content);
            ErrorHandler.debug(`文档已缓存: ${componentName}`);

            return this.parseMarkdown(content, componentName);
        } catch (error) {
            console.error(`获取组件 ${componentName} 的文档失败:`, error);
            return null;
        }
    }

    /**
     * 获取组件简短描述（用于悬停提示）
     * @param componentName 组件名
     * @returns 简短描述
     */
    public async getShortDescription(componentName: string): Promise<string | null> {
        try {
            console.log(`[DocumentService] 📖 获取组件简短描述: ${componentName}`);
            const docInfo = await this.getDocumentation(componentName);
            if (docInfo?.description) {
                console.log(`[DocumentService] ✅ 获取到描述: ${docInfo.description.substring(0, 50)}...`);
                return docInfo.description;
            } else {
                console.log(`[DocumentService] ❌ 未获取到描述: ${componentName}`);
                return null;
            }
        } catch (error) {
            console.error(`[DocumentService] ❌ 获取组件描述失败: ${componentName}`, error);
            return null;
        }
    }

    /**
     * 从缓存获取内容
     * @param key 缓存键
     * @returns 缓存内容
     */
    private getFromCache(key: string): string | null {
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
    private setCache(key: string, content: string): void {
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
    private async fetchDocument(docPath: string): Promise<string | null> {
        try {
            // 远程URL
            if (docPath.startsWith('http://') || docPath.startsWith('https://')) {
                const response = await axios.get(docPath, {
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
                console.log(`[DocumentService] 📖 开始读取文件: ${localPath}`);
                const content = fs.readFileSync(localPath, 'utf-8');
                console.log(`[DocumentService] ✅ 文件读取成功，内容长度: ${content.length}`);
                console.log(`[DocumentService] 📝 文件前100字符: "${content.substring(0, 100)}..."`);
                return content;
            } else {
                console.log(`[DocumentService] ❌ 文件不存在: ${localPath}`);
            }

            return null;
        } catch (error) {
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
    private parseMarkdown(content: string, componentName: string): DocumentInfo {
        console.log(`[DocumentService] 🔍 开始解析Markdown: ${componentName}`);
        console.log(`[DocumentService] 📄 内容长度: ${content.length}`);
        console.log(`[DocumentService] 📝 内容前100字符: "${content.substring(0, 100)}..."`);

        const lines = content.split('\n');
        let title = componentName;
        let description = '';
        let props: ComponentProp[] = [];

        console.log(`[DocumentService] 📋 总行数: ${lines.length}`);

        // 解析标题
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
            title = titleMatch[1];
            console.log(`[DocumentService] 📝 提取到标题: "${title}"`);
        } else {
            console.log(`[DocumentService] ❌ 未找到标题，使用默认: "${title}"`);
        }

        // 解析描述（第一个段落）
        let descriptionStarted = false;
        let descriptionLines: string[] = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            // 跳过标题行
            if (trimmed.startsWith('#')) {
                if (descriptionStarted) break;
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
        console.log(`[DocumentService] 📝 提取到描述: "${description}"`);

        // 解析Props表格
        props = this.parsePropsTable(content);
        console.log(`[DocumentService] 📊 解析到Props数量: ${props.length}`);

        const result = {
            title,
            description,
            content,
            props
        };

        console.log(`[DocumentService] ✅ 解析完成:`, { title, description: description.substring(0, 50) + '...', propsCount: props.length });
        return result;
    }

    /**
     * 解析Props表格
     * @param content Markdown内容
     * @returns 组件属性数组
     */
    private parsePropsTable(content: string): ComponentProp[] {
        const props: ComponentProp[] = [];
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
            if (!inPropsSection) continue;
            
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
            } else if (tableStarted && !line) {
                // 表格结束
                break;
            }
        }
        
        return props;
    }

    /**
     * 清除缓存
     */
    public clearCache(): void {
        this.cache.clear();
    }
}
