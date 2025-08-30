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
            console.log(`[HoverProvider] ========== 悬停请求开始 ==========`);
            console.log(`[HoverProvider] 文件: ${document.fileName}`);
            console.log(`[HoverProvider] 位置: ${position.line}:${position.character}`);
            console.log(`[HoverProvider] 文档语言: ${document.languageId}`);
            // 获取当前行内容
            const line = document.lineAt(position.line);
            console.log(`[HoverProvider] 当前行内容: "${line.text}"`);
            console.log(`[HoverProvider] 光标字符: "${line.text[position.character] || 'EOF'}"`);
            // 检查文件类型是否支持
            const supportedLanguages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'vue'];
            if (!supportedLanguages.includes(document.languageId)) {
                console.log(`[HoverProvider] ❌ 不支持的文件类型: ${document.languageId}`);
                return null;
            }
            // 解析组件名
            console.log(`[HoverProvider] 🔍 开始提取组件名...`);
            const componentName = this.extractComponentName(document, position);
            if (!componentName) {
                console.log(`[HoverProvider] ❌ 未提取到组件名`);
                return null;
            }
            console.log(`[HoverProvider] ✅ 提取到组件名: "${componentName}"`);
            // 检查取消令牌
            if (token.isCancellationRequested) {
                console.log(`[HoverProvider] ❌ 请求已取消`);
                return null;
            }
            // 获取组件描述
            console.log(`[HoverProvider] 📖 开始获取组件描述: ${componentName}`);
            const description = await this.documentService.getShortDescription(componentName);
            if (!description) {
                console.log(`[HoverProvider] ❌ 未获取到组件描述: ${componentName}`);
                return null;
            }
            console.log(`[HoverProvider] ✅ 获取到组件描述: ${componentName} - ${description.substring(0, 50)}...`);
            // 构建悬停内容
            const hoverContent = this.buildHoverContent(componentName, description);
            // 获取组件名的范围
            const range = this.getComponentNameRange(document, position, componentName);
            console.log(`[HoverProvider] ✅ 成功创建悬停提示: ${componentName}`);
            console.log(`[HoverProvider] ========== 悬停请求结束 ==========`);
            return new vscode.Hover(hoverContent, range);
        }
        catch (error) {
            console.error('[HoverProvider] ❌ 提供悬停提示时出错:', error);
            console.log(`[HoverProvider] ========== 悬停请求异常结束 ==========`);
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
        console.log(`[HoverProvider] 🔍 提取组件名开始`);
        console.log(`[HoverProvider] 行内容: "${text}"`);
        console.log(`[HoverProvider] 光标位置: ${offset}`);
        console.log(`[HoverProvider] 光标前后字符: "${text.substring(Math.max(0, offset - 5), offset + 5)}"`);
        // 获取光标位置的单词
        const wordRange = document.getWordRangeAtPosition(position);
        if (wordRange) {
            const word = document.getText(wordRange);
            console.log(`[HoverProvider] 📝 光标位置的单词: "${word}"`);
            // 检查是否是组件名（首字母大写或包含连字符）
            if (/^[A-Z][a-zA-Z0-9]*$/.test(word)) {
                console.log(`[HoverProvider] ✅ 识别为大写组件名: ${word}`);
                return word;
            }
            if (/^[a-z]+-[a-z-]+$/.test(word)) {
                console.log(`[HoverProvider] ✅ 识别为连字符组件名: ${word}`);
                return word;
            }
            console.log(`[HoverProvider] ❌ 单词不符合组件名规则: ${word}`);
        }
        else {
            console.log(`[HoverProvider] ❌ 光标位置没有单词`);
        }
        // 扩展的组件名匹配模式 - 包括自闭合标签
        console.log(`[HoverProvider] 🔍 尝试正则表达式匹配...`);
        const componentPattern = /<\/?([A-Z][a-zA-Z0-9]*|[a-z]+-[a-z-]+)(?:\s|\/?>|$)/g;
        let match;
        componentPattern.lastIndex = 0; // 重置正则表达式状态
        while ((match = componentPattern.exec(text)) !== null) {
            const componentName = match[1];
            const startPos = match.index + 1; // 跳过 '<' 或 '</' 字符
            const endPos = startPos + componentName.length;
            console.log(`[HoverProvider] 🎯 找到组件: "${componentName}", 位置: ${startPos}-${endPos}, 光标: ${offset}`);
            // 检查光标是否在组件名范围内（增加容错范围）
            if (offset >= startPos - 1 && offset <= endPos + 1) {
                console.log(`[HoverProvider] ✅ 匹配到组件名: ${componentName}`);
                return componentName;
            }
        }
        // 尝试匹配导入语句中的组件名
        console.log(`[HoverProvider] 🔍 尝试导入语句匹配...`);
        const importMatch = text.match(/import\s+.*\{([^}]+)\}/);
        if (importMatch) {
            console.log(`[HoverProvider] 📦 找到导入语句: ${importMatch[0]}`);
            const imports = importMatch[1].split(',').map(s => s.trim());
            for (const imp of imports) {
                const componentName = imp.replace(/\s+as\s+\w+/, '').trim();
                const startIndex = text.indexOf(componentName);
                const endIndex = startIndex + componentName.length;
                console.log(`[HoverProvider] 📦 检查导入组件: "${componentName}", 位置: ${startIndex}-${endIndex}`);
                if (offset >= startIndex && offset <= endIndex && startIndex !== -1) {
                    console.log(`[HoverProvider] ✅ 从导入语句匹配到组件名: ${componentName}`);
                    return componentName;
                }
            }
        }
        console.log(`[HoverProvider] ❌ 未找到任何组件名`);
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