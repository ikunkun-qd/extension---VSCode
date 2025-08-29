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
exports.DocumentationPanel = void 0;
const vscode = __importStar(require("vscode"));
const markdown_it_1 = __importDefault(require("markdown-it"));
/**
 * 文档面板
 * 负责在侧边栏显示组件的完整文档
 */
class DocumentationPanel {
    static createOrShow(extensionUri, componentName, documentService) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // 如果已经有面板，则显示它
        if (DocumentationPanel.currentPanel) {
            DocumentationPanel.currentPanel._panel.reveal(column);
            return DocumentationPanel.currentPanel.updateContent(componentName);
        }
        // 否则，创建新面板
        const panel = vscode.window.createWebviewPanel('componentDocumentation', `${componentName} 文档`, column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'media'),
                vscode.Uri.joinPath(extensionUri, 'out', 'compiled')
            ]
        });
        DocumentationPanel.currentPanel = new DocumentationPanel(panel, extensionUri, documentService);
        return DocumentationPanel.currentPanel.updateContent(componentName);
    }
    static revive(panel, extensionUri, documentService) {
        DocumentationPanel.currentPanel = new DocumentationPanel(panel, extensionUri, documentService);
    }
    constructor(panel, extensionUri, documentService) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._documentService = documentService;
        this._markdownIt = new markdown_it_1.default({
            html: true,
            linkify: true,
            typographer: true
        });
        // 设置初始内容
        this._update();
        // 监听面板被释放
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // 处理来自webview的消息
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }
    async updateContent(componentName) {
        this._panel.title = `${componentName} 文档`;
        try {
            const docInfo = await this._documentService.getDocumentation(componentName);
            if (docInfo) {
                this._panel.webview.html = this._getHtmlForWebview(docInfo);
            }
            else {
                this._panel.webview.html = this._getErrorHtml(componentName);
            }
        }
        catch (error) {
            console.error('更新文档内容失败:', error);
            this._panel.webview.html = this._getErrorHtml(componentName, error);
        }
    }
    dispose() {
        DocumentationPanel.currentPanel = undefined;
        // 清理资源
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
    static dispose() {
        if (DocumentationPanel.currentPanel) {
            DocumentationPanel.currentPanel.dispose();
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getLoadingHtml();
    }
    _getHtmlForWebview(docInfo) {
        const webview = this._panel.webview;
        // 转换Markdown为HTML
        const htmlContent = this._markdownIt.render(docInfo.content);
        // 获取样式文件URI
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        // 使用nonce确保安全
        const nonce = this.getNonce();
        return `<!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${stylesResetUri}" rel="stylesheet">
                <link href="${stylesMainUri}" rel="stylesheet">
                <title>${docInfo.title}</title>
            </head>
            <body>
                <div class="container">
                    <header class="header">
                        <h1>${docInfo.title}</h1>
                        <button class="close-btn" onclick="closePanel()">×</button>
                    </header>
                    <main class="content">
                        ${htmlContent}
                    </main>
                </div>
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    
                    function closePanel() {
                        vscode.postMessage({
                            command: 'close'
                        });
                    }

                    // 处理锚点跳转
                    document.addEventListener('click', function(e) {
                        if (e.target.tagName === 'A' && e.target.href.startsWith('#')) {
                            e.preventDefault();
                            const targetId = e.target.href.split('#')[1];
                            const targetElement = document.getElementById(targetId);
                            if (targetElement) {
                                targetElement.scrollIntoView({ behavior: 'smooth' });
                            }
                        }
                    });
                </script>
            </body>
            </html>`;
    }
    _getLoadingHtml() {
        return `<!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>加载中...</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                    }
                    .loading {
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="loading">
                    <p>正在加载文档...</p>
                </div>
            </body>
            </html>`;
    }
    _getErrorHtml(componentName, error) {
        const errorMessage = error ? error.message || error.toString() : '未找到对应的文档文件';
        return `<!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>文档加载失败</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        margin: 0;
                    }
                    .error {
                        text-align: center;
                        color: var(--vscode-errorForeground);
                    }
                    .suggestion {
                        margin-top: 20px;
                        padding: 15px;
                        background-color: var(--vscode-textBlockQuote-background);
                        border-left: 4px solid var(--vscode-textBlockQuote-border);
                    }
                </style>
            </head>
            <body>
                <div class="error">
                    <h2>无法加载 "${componentName}" 的文档</h2>
                    <p>${errorMessage}</p>
                </div>
                <div class="suggestion">
                    <h3>建议：</h3>
                    <ul>
                        <li>检查插件配置中的 basePath 是否正确</li>
                        <li>确认组件名与文档文件的映射规则</li>
                        <li>验证文档文件是否存在且可访问</li>
                    </ul>
                </div>
            </body>
            </html>`;
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
exports.DocumentationPanel = DocumentationPanel;
//# sourceMappingURL=DocumentationPanel.js.map