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
exports.HoverProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * 悬停提示提供器
 * 负责在用户悬停组件名时显示智能提示
 */
class HoverProvider {
    constructor(documentService) {
        this.documentService = documentService;
    }
    /**
     * 提供悬停提示
     * @param document 文档
     * @param position 光标位置
     * @param token 取消令牌
     * @returns 悬停提示内容
     */
    async provideHover(document, position, token) {
        try {
            // 解析组件名
            const componentName = this.extractComponentName(document, position);
            if (!componentName) {
                return null;
            }
            // 检查取消令牌
            if (token.isCancellationRequested) {
                return null;
            }
            // 获取组件描述
            const description = await this.documentService.getShortDescription(componentName);
            if (!description) {
                return null;
            }
            // 构建悬停内容
            const hoverContent = this.buildHoverContent(componentName, description);
            // 获取组件名的范围
            const range = this.getComponentNameRange(document, position, componentName);
            return new vscode.Hover(hoverContent, range);
        }
        catch (error) {
            console.error('提供悬停提示时出错:', error);
            return null;
        }
    }
    /**
     * 从文档中提取组件名
     * @param document 文档
     * @param position 光标位置
     * @returns 组件名
     */
    extractComponentName(document, position) {
        const line = document.lineAt(position.line);
        const text = line.text;
        const offset = position.character;
        // 匹配JSX/Vue组件标签
        const patterns = [
            // JSX组件: <ComponentName>, </ComponentName>
            /<\/?([A-Z][a-zA-Z0-9]*)/g,
            // Vue组件: <component-name>, <ComponentName>
            /<\/?([a-z][a-z0-9-]*[a-z0-9]|[A-Z][a-zA-Z0-9]*)/g,
            // 自闭合标签: <ComponentName />
            /<([A-Z][a-zA-Z0-9]*)\s*\/>/g
        ];
        for (const pattern of patterns) {
            let match;
            pattern.lastIndex = 0; // 重置正则表达式状态
            while ((match = pattern.exec(text)) !== null) {
                const startPos = match.index + 1; // 跳过 '<' 字符
                const endPos = startPos + match[1].length;
                // 检查光标是否在组件名范围内
                if (offset >= startPos && offset <= endPos) {
                    return match[1];
                }
            }
        }
        // 尝试匹配导入语句中的组件名
        const importMatch = text.match(/import\s+.*\{([^}]+)\}/);
        if (importMatch) {
            const imports = importMatch[1].split(',').map(s => s.trim());
            for (const imp of imports) {
                const componentName = imp.replace(/\s+as\s+\w+/, '').trim();
                const startIndex = text.indexOf(componentName);
                const endIndex = startIndex + componentName.length;
                if (offset >= startIndex && offset <= endIndex) {
                    return componentName;
                }
            }
        }
        return null;
    }
    /**
     * 获取组件名在文档中的范围
     * @param document 文档
     * @param position 光标位置
     * @param componentName 组件名
     * @returns 文本范围
     */
    getComponentNameRange(document, position, componentName) {
        const line = document.lineAt(position.line);
        const text = line.text;
        const offset = position.character;
        // 在当前行中查找组件名的确切位置
        let startIndex = -1;
        let endIndex = -1;
        // 从光标位置向前和向后搜索
        for (let i = Math.max(0, offset - componentName.length); i <= text.length - componentName.length; i++) {
            if (text.substring(i, i + componentName.length) === componentName) {
                // 确保这是一个完整的单词边界
                const beforeChar = i > 0 ? text[i - 1] : '';
                const afterChar = i + componentName.length < text.length ? text[i + componentName.length] : '';
                if (this.isWordBoundary(beforeChar) && this.isWordBoundary(afterChar)) {
                    if (offset >= i && offset <= i + componentName.length) {
                        startIndex = i;
                        endIndex = i + componentName.length;
                        break;
                    }
                }
            }
        }
        if (startIndex === -1) {
            // 如果找不到确切位置，使用光标周围的范围
            startIndex = Math.max(0, offset - Math.floor(componentName.length / 2));
            endIndex = Math.min(text.length, startIndex + componentName.length);
        }
        return new vscode.Range(new vscode.Position(position.line, startIndex), new vscode.Position(position.line, endIndex));
    }
    /**
     * 检查字符是否为单词边界
     * @param char 字符
     * @returns 是否为单词边界
     */
    isWordBoundary(char) {
        return !char || /[^a-zA-Z0-9_]/.test(char);
    }
    /**
     * 构建悬停提示内容
     * @param componentName 组件名
     * @param description 组件描述
     * @returns Markdown字符串
     */
    buildHoverContent(componentName, description) {
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.supportHtml = true;
        // 组件标题
        markdown.appendMarkdown(`**${componentName}**\n\n`);
        // 组件描述
        if (description) {
            markdown.appendMarkdown(`${description}\n\n`);
        }
        // 查看完整文档链接
        const commandUri = vscode.Uri.parse(`command:componentDoc.showDocumentation?${encodeURIComponent(JSON.stringify([componentName]))}`);
        markdown.appendMarkdown(`[查看完整文档](${commandUri})`);
        return markdown;
    }
}
exports.HoverProvider = HoverProvider;
//# sourceMappingURL=HoverProvider.js.map