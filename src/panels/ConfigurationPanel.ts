import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigManager } from '../services/ConfigManager';

/**
 * 配置面板
 * 提供可视化的配置管理界面
 */
export class ConfigurationPanel {
    public static currentPanel: ConfigurationPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _configManager: ConfigManager;

    public static createOrShow(
        extensionUri: vscode.Uri,
        configManager: ConfigManager
    ): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // 如果已经有面板，则显示它
        if (ConfigurationPanel.currentPanel) {
            ConfigurationPanel.currentPanel._panel.reveal(column);
            return;
        }

        // 否则，创建新面板
        const panel = vscode.window.createWebviewPanel(
            'componentDocConfiguration',
            '组件文档配置',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out', 'compiled')
                ]
            }
        );

        ConfigurationPanel.currentPanel = new ConfigurationPanel(
            panel,
            extensionUri,
            configManager
        );
    }

    public static revive(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        configManager: ConfigManager
    ): void {
        ConfigurationPanel.currentPanel = new ConfigurationPanel(
            panel,
            extensionUri,
            configManager
        );
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        configManager: ConfigManager
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._configManager = configManager;

        // 设置初始内容
        this._update();

        // 监听面板被关闭
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // 处理来自webview的消息
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'saveConfig':
                        this._saveConfiguration(message.config);
                        return;
                    case 'loadConfig':
                        this._loadConfiguration();
                        return;
                    case 'validatePath':
                        this._validatePath(message.path);
                        return;
                    case 'addMapping':
                        this._addMapping(message.componentName, message.filePath);
                        return;
                    case 'removeMapping':
                        this._removeMapping(message.componentName);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose(): void {
        ConfigurationPanel.currentPanel = undefined;

        // 清理资源
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    public static dispose(): void {
        if (ConfigurationPanel.currentPanel) {
            ConfigurationPanel.currentPanel.dispose();
        }
    }

    private _update(): void {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _saveConfiguration(config: any): void {
        try {
            // 更新VSCode配置
            const workspaceConfig = vscode.workspace.getConfiguration('componentDoc');
            workspaceConfig.update('basePath', config.basePath, vscode.ConfigurationTarget.Workspace);
            workspaceConfig.update('mappingRule', config.mappingRule, vscode.ConfigurationTarget.Workspace);
            workspaceConfig.update('cacheTimeout', config.cacheTimeout, vscode.ConfigurationTarget.Workspace);

            // 重新加载配置管理器
            this._configManager.reload();

            // 发送成功消息到webview
            this._panel.webview.postMessage({
                command: 'configSaved',
                success: true,
                message: '配置保存成功！'
            });

            vscode.window.showInformationMessage('组件文档配置已保存');
        } catch (error) {
            // 发送错误消息到webview
            this._panel.webview.postMessage({
                command: 'configSaved',
                success: false,
                message: `保存配置失败: ${error}`
            });

            vscode.window.showErrorMessage(`保存配置失败: ${error}`);
        }
    }

    private _loadConfiguration(): void {
        try {
            const config = {
                basePath: this._configManager.getBasePath(),
                mappingRule: this._configManager.getMappingRule(),
                cacheTimeout: this._configManager.getCacheTimeout()
            };

            this._panel.webview.postMessage({
                command: 'configLoaded',
                config: config
            });
        } catch (error) {
            vscode.window.showErrorMessage(`加载配置失败: ${error}`);
        }
    }

    private async _validatePath(pathToValidate: string): Promise<void> {
        try {
            let isValid = false;
            let message = '';

            if (pathToValidate.startsWith('http://') || pathToValidate.startsWith('https://')) {
                // 验证远程URL
                isValid = true;
                message = '远程URL格式正确';
            } else {
                // 验证本地路径
                const fs = require('fs').promises;
                try {
                    await fs.access(pathToValidate);
                    isValid = true;
                    message = '本地路径存在';
                } catch {
                    isValid = false;
                    message = '本地路径不存在';
                }
            }

            this._panel.webview.postMessage({
                command: 'pathValidated',
                path: pathToValidate,
                isValid: isValid,
                message: message
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'pathValidated',
                path: pathToValidate,
                isValid: false,
                message: `验证失败: ${error}`
            });
        }
    }

    private _addMapping(componentName: string, filePath: string): void {
        // 这里可以添加映射验证逻辑
        this._panel.webview.postMessage({
            command: 'mappingAdded',
            componentName: componentName,
            filePath: filePath
        });
    }

    private _removeMapping(componentName: string): void {
        this._panel.webview.postMessage({
            command: 'mappingRemoved',
            componentName: componentName
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        // 获取样式文件URI
        const stylesResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
        );
        const stylesMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        );
        const stylesConfigUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'config.css')
        );

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
    <link href="${stylesConfigUri}" rel="stylesheet">
    <title>组件文档配置</title>
</head>
<body>
    <div class="container">
        <h1>组件文档配置</h1>
        
        <form id="configForm">
            <div class="form-group">
                <label for="basePath">基础路径 (Base Path)</label>
                <input type="text" id="basePath" name="basePath" placeholder="例如: /path/to/docs 或 https://docs.example.com">
                <small class="help-text">组件库文档的根路径（本地路径或远程URL）</small>
                <div class="validation-message" id="basePathValidation"></div>
            </div>

            <div class="form-group">
                <label for="cacheTimeout">缓存超时时间 (毫秒)</label>
                <input type="number" id="cacheTimeout" name="cacheTimeout" min="0" value="300000">
                <small class="help-text">远程文档缓存过期时间</small>
            </div>

            <div class="form-group">
                <label>组件映射规则 (Mapping Rules)</label>
                <div class="mapping-container">
                    <div class="mapping-header">
                        <span>组件名称</span>
                        <span>文档文件路径</span>
                        <span>操作</span>
                    </div>
                    <div id="mappingList" class="mapping-list">
                        <!-- 映射规则将在这里动态生成 -->
                    </div>
                    <div class="mapping-add">
                        <input type="text" id="newComponentName" placeholder="组件名称">
                        <input type="text" id="newFilePath" placeholder="文档文件路径">
                        <button type="button" id="addMappingBtn">添加映射</button>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" id="saveBtn" class="primary">保存配置</button>
                <button type="button" id="resetBtn">重置</button>
            </div>
        </form>

        <div id="messageContainer" class="message-container"></div>
    </div>

    <script nonce="${nonce}">
        ${this._getWebviewScript()}
    </script>
</body>
</html>`;
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private _getWebviewScript(): string {
        return `
            // 获取VS Code API
            const vscode = acquireVsCodeApi();
            
            // 当前配置数据
            let currentConfig = {
                basePath: '',
                mappingRule: {},
                cacheTimeout: 300000
            };

            // 初始化
            document.addEventListener('DOMContentLoaded', function() {
                // 加载当前配置
                vscode.postMessage({ command: 'loadConfig' });
                
                // 绑定事件
                bindEvents();
            });

            function bindEvents() {
                // 保存按钮
                document.getElementById('saveBtn').addEventListener('click', saveConfiguration);
                
                // 重置按钮
                document.getElementById('resetBtn').addEventListener('click', resetConfiguration);
                
                // 添加映射按钮
                document.getElementById('addMappingBtn').addEventListener('click', addMapping);
                
                // 基础路径验证
                document.getElementById('basePath').addEventListener('blur', validateBasePath);
            }

            function saveConfiguration() {
                const form = document.getElementById('configForm');
                const formData = new FormData(form);
                
                const config = {
                    basePath: formData.get('basePath'),
                    cacheTimeout: parseInt(formData.get('cacheTimeout')),
                    mappingRule: currentConfig.mappingRule
                };
                
                vscode.postMessage({
                    command: 'saveConfig',
                    config: config
                });
            }

            function resetConfiguration() {
                vscode.postMessage({ command: 'loadConfig' });
            }

            function addMapping() {
                const componentName = document.getElementById('newComponentName').value.trim();
                const filePath = document.getElementById('newFilePath').value.trim();
                
                if (!componentName || !filePath) {
                    showMessage('请填写组件名称和文档文件路径', 'error');
                    return;
                }
                
                currentConfig.mappingRule[componentName] = filePath;
                renderMappingList();
                
                // 清空输入框
                document.getElementById('newComponentName').value = '';
                document.getElementById('newFilePath').value = '';
            }

            function removeMapping(componentName) {
                delete currentConfig.mappingRule[componentName];
                renderMappingList();
            }

            function validateBasePath() {
                const basePath = document.getElementById('basePath').value.trim();
                if (basePath) {
                    vscode.postMessage({
                        command: 'validatePath',
                        path: basePath
                    });
                }
            }

            function renderMappingList() {
                const container = document.getElementById('mappingList');
                container.innerHTML = '';
                
                for (const [componentName, filePath] of Object.entries(currentConfig.mappingRule)) {
                    const row = document.createElement('div');
                    row.className = 'mapping-row';
                    row.innerHTML = \`
                        <span class="component-name">\${componentName}</span>
                        <span class="file-path">\${filePath}</span>
                        <button type="button" class="remove-btn" onclick="removeMapping('\${componentName}')">删除</button>
                    \`;
                    container.appendChild(row);
                }
            }

            function showMessage(message, type = 'info') {
                const container = document.getElementById('messageContainer');
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${type}\`;
                messageDiv.textContent = message;
                
                container.appendChild(messageDiv);
                
                // 3秒后自动移除消息
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 3000);
            }

            // 监听来自扩展的消息
            window.addEventListener('message', event => {
                const message = event.data;
                
                switch (message.command) {
                    case 'configLoaded':
                        currentConfig = message.config;
                        updateForm();
                        break;
                    case 'configSaved':
                        if (message.success) {
                            showMessage(message.message, 'success');
                        } else {
                            showMessage(message.message, 'error');
                        }
                        break;
                    case 'pathValidated':
                        showPathValidation(message.path, message.isValid, message.message);
                        break;
                }
            });

            function updateForm() {
                document.getElementById('basePath').value = currentConfig.basePath || '';
                document.getElementById('cacheTimeout').value = currentConfig.cacheTimeout || 300000;
                renderMappingList();
            }

            function showPathValidation(path, isValid, message) {
                const validationDiv = document.getElementById('basePathValidation');
                validationDiv.textContent = message;
                validationDiv.className = \`validation-message \${isValid ? 'valid' : 'invalid'}\`;
            }
        `;
    }
}
