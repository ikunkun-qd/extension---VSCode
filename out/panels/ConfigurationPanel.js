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
exports.ConfigurationPanel = void 0;
const vscode = __importStar(require("vscode"));
/**
 * 配置面板
 * 提供可视化的配置管理界面
 */
class ConfigurationPanel {
    static createOrShow(extensionUri, configManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // 如果已经有面板，则显示它
        if (ConfigurationPanel.currentPanel) {
            ConfigurationPanel.currentPanel._panel.reveal(column);
            return;
        }
        // 否则，创建新面板
        const panel = vscode.window.createWebviewPanel('componentDocConfiguration', '组件文档配置', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionUri, 'media'),
                vscode.Uri.joinPath(extensionUri, 'out', 'compiled')
            ]
        });
        ConfigurationPanel.currentPanel = new ConfigurationPanel(panel, extensionUri, configManager);
    }
    static revive(panel, extensionUri, configManager) {
        ConfigurationPanel.currentPanel = new ConfigurationPanel(panel, extensionUri, configManager);
    }
    constructor(panel, extensionUri, configManager) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._configManager = configManager;
        // 设置初始内容
        this._update();
        // 监听面板被关闭
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // 处理来自webview的消息
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'saveConfig':
                    this._saveConfiguration(message.config).catch(error => {
                        console.error('[ConfigurationPanel] 保存配置异常:', error);
                    });
                    return;
                case 'loadConfig':
                    this._reloadConfiguration();
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
                case 'selectFolder':
                    this._selectFolder();
                    return;
                case 'previewMapping':
                    this._previewMapping(message.componentName);
                    return;
                case 'loadTemplate':
                    this._loadTemplate(message.templateName);
                    return;
                case 'validateConfig':
                    this._validateConfiguration();
                    return;
            }
        }, null, this._disposables);
    }
    dispose() {
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
    static dispose() {
        if (ConfigurationPanel.currentPanel) {
            ConfigurationPanel.currentPanel.dispose();
        }
    }
    _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }
    async _saveConfiguration(config) {
        try {
            console.log('[ConfigurationPanel] 开始保存配置:', config);
            // 更新VSCode配置
            const workspaceConfig = vscode.workspace.getConfiguration('componentDoc');
            // 使用await确保配置更新完成
            await workspaceConfig.update('basePath', config.basePath, vscode.ConfigurationTarget.Workspace);
            await workspaceConfig.update('mappingRule', config.mappingRule, vscode.ConfigurationTarget.Workspace);
            await workspaceConfig.update('cacheTimeout', config.cacheTimeout, vscode.ConfigurationTarget.Workspace);
            console.log('[ConfigurationPanel] VSCode配置已更新');
            // 重新加载配置管理器
            this._configManager.reload();
            console.log('[ConfigurationPanel] 配置管理器已重新加载');
            // 发送成功消息到webview
            this._panel.webview.postMessage({
                command: 'configSaved',
                success: true,
                message: '配置保存成功！'
            });
            vscode.window.showInformationMessage('组件文档配置已保存');
        }
        catch (error) {
            // 发送错误消息到webview
            this._panel.webview.postMessage({
                command: 'configSaved',
                success: false,
                message: `保存配置失败: ${error}`
            });
            vscode.window.showErrorMessage(`保存配置失败: ${error}`);
        }
    }
    _loadConfiguration() {
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`加载配置失败: ${error}`);
        }
    }
    async _validatePath(pathToValidate) {
        try {
            let isValid = false;
            let message = '';
            if (pathToValidate.startsWith('http://') || pathToValidate.startsWith('https://')) {
                // 验证远程URL
                isValid = true;
                message = '远程URL格式正确';
            }
            else {
                // 验证本地路径
                const fs = require('fs').promises;
                try {
                    await fs.access(pathToValidate);
                    isValid = true;
                    message = '本地路径存在';
                }
                catch {
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
        }
        catch (error) {
            this._panel.webview.postMessage({
                command: 'pathValidated',
                path: pathToValidate,
                isValid: false,
                message: `验证失败: ${error}`
            });
        }
    }
    _addMapping(componentName, filePath) {
        // 这里可以添加映射验证逻辑
        this._panel.webview.postMessage({
            command: 'mappingAdded',
            componentName: componentName,
            filePath: filePath
        });
    }
    _removeMapping(componentName) {
        this._panel.webview.postMessage({
            command: 'mappingRemoved',
            componentName: componentName
        });
    }
    async _selectFolder() {
        try {
            const options = {
                canSelectMany: false,
                canSelectFiles: false,
                canSelectFolders: true,
                openLabel: '选择文档目录'
            };
            const folderUri = await vscode.window.showOpenDialog(options);
            if (folderUri && folderUri[0]) {
                this._panel.webview.postMessage({
                    command: 'folderSelected',
                    path: folderUri[0].fsPath
                });
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`选择文件夹失败: ${error}`);
        }
    }
    async _previewMapping(componentName) {
        try {
            const docPath = this._configManager.getDocumentPath(componentName);
            if (!docPath) {
                this._panel.webview.postMessage({
                    command: 'previewResult',
                    componentName: componentName,
                    success: false,
                    message: '未找到对应的文档路径配置'
                });
                return;
            }
            // 检查文件是否存在
            const fs = require('fs');
            let exists = false;
            let content = '';
            if (docPath.startsWith('http://') || docPath.startsWith('https://')) {
                // 远程文件，只返回URL
                exists = true;
                content = `远程文档: ${docPath}`;
            }
            else {
                // 本地文件
                if (fs.existsSync(docPath)) {
                    exists = true;
                    try {
                        const fileContent = fs.readFileSync(docPath, 'utf-8');
                        // 提取前200个字符作为预览
                        content = fileContent.substring(0, 200) + (fileContent.length > 200 ? '...' : '');
                    }
                    catch (error) {
                        content = `无法读取文件内容: ${error}`;
                    }
                }
                else {
                    exists = false;
                    content = '文件不存在';
                }
            }
            this._panel.webview.postMessage({
                command: 'previewResult',
                componentName: componentName,
                success: exists,
                path: docPath,
                content: content,
                message: exists ? '文档预览' : '文档文件不存在'
            });
        }
        catch (error) {
            this._panel.webview.postMessage({
                command: 'previewResult',
                componentName: componentName,
                success: false,
                message: `预览失败: ${error}`
            });
        }
    }
    _loadTemplate(templateName) {
        const templates = {
            'ouryun': {
                basePath: '',
                mappingRule: {
                    // 常用组件
                    'Button': '常用组件/button.md',
                    'Input': '常用组件/input.md',
                    'Table': '常用组件/table.md',
                    'Form': '常用组件/form.md',
                    'Modal': '常用组件/modal.md',
                    'Select': '常用组件/select.md',
                    'DatePicker': '常用组件/datePicker.md',
                    'Upload': '常用组件/upload.md',
                    'Tree': '常用组件/tree.md',
                    // 业务组件
                    'SearchTable': '业务组件/searchTable.md',
                    'PageSelect': '业务组件/pageSelect.md',
                    'JsonTree': '业务组件/jsonTree.md',
                    'DragUpload': '业务组件/dragUpload.md',
                    'AutocompleteInput': '业务组件/autocompleteInput.md',
                    // 通用规则（支持递归搜索）
                    '/(.*)/': '$1.md'
                },
                cacheTimeout: 300000
            },
            'antd': {
                basePath: '',
                mappingRule: {
                    'Button': 'button/index.zh-CN.md',
                    'Input': 'input/index.zh-CN.md',
                    'Card': 'card/index.zh-CN.md',
                    'Table': 'table/index.zh-CN.md',
                    'Form': 'form/index.zh-CN.md',
                    '/(.*)/': '$1/index.zh-CN.md'
                },
                cacheTimeout: 300000
            },
            'element': {
                basePath: '',
                mappingRule: {
                    'Button': 'button.md',
                    'Input': 'input.md',
                    'Card': 'card.md',
                    'Table': 'table.md',
                    'Form': 'form.md',
                    '/(.*)/': '$1.md'
                },
                cacheTimeout: 300000
            },
            'custom': {
                basePath: '',
                mappingRule: {
                    'Button': 'button.md',
                    'Input': 'input.md',
                    'Card': 'card.md',
                    '/(.*)/': '$1.md'
                },
                cacheTimeout: 300000
            }
        };
        const template = templates[templateName];
        if (template) {
            this._panel.webview.postMessage({
                command: 'templateLoaded',
                template: template,
                templateName: templateName
            });
        }
    }
    _validateConfiguration() {
        try {
            const validation = this._configManager.validateConfig();
            this._panel.webview.postMessage({
                command: 'configValidated',
                validation: validation
            });
        }
        catch (error) {
            this._panel.webview.postMessage({
                command: 'configValidated',
                validation: {
                    isValid: false,
                    errors: [`验证配置时出错: ${error}`],
                    warnings: []
                }
            });
        }
    }
    _reloadConfiguration() {
        try {
            // 强制重新加载配置管理器
            this._configManager.reload();
            // 然后加载配置
            this._loadConfiguration();
            // 发送重置成功消息
            this._panel.webview.postMessage({
                command: 'configReset',
                success: true,
                message: '配置已重置'
            });
        }
        catch (error) {
            this._panel.webview.postMessage({
                command: 'configReset',
                success: false,
                message: `重置配置失败: ${error}`
            });
        }
    }
    _getHtmlForWebview(webview) {
        // 获取样式文件URI
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const stylesConfigUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'config.css'));
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
        <h1>🔧 组件文档配置</h1>

        <!-- 配置模板选择 -->
        <div class="template-section">
            <h3>📋 快速配置模板</h3>
            <div class="template-buttons">
                <button type="button" class="template-btn" data-template="ouryun">OurYun 组件库</button>
                <button type="button" class="template-btn" data-template="antd">Ant Design</button>
                <button type="button" class="template-btn" data-template="element">Element UI</button>
                <button type="button" class="template-btn" data-template="custom">自定义模板</button>
            </div>
            <small class="help-text">选择一个模板快速开始配置</small>
        </div>

        <form id="configForm">
            <div class="form-group">
                <label for="basePath">📁 基础路径 (Base Path)</label>
                <div class="path-input-group">
                    <input type="text" id="basePath" name="basePath" placeholder="例如: /path/to/docs 或 https://docs.example.com">
                    <button type="button" id="selectFolderBtn" class="folder-btn">📂 选择文件夹</button>
                </div>
                <small class="help-text">组件库文档的根路径（本地路径或远程URL）</small>
                <div class="validation-message" id="basePathValidation"></div>
            </div>

            <div class="form-group">
                <label for="cacheTimeout">⏱️ 缓存超时时间 (毫秒)</label>
                <input type="number" id="cacheTimeout" name="cacheTimeout" min="0" value="300000">
                <small class="help-text">远程文档缓存过期时间（默认5分钟）</small>
            </div>

            <div class="form-group">
                <label>🗂️ 组件映射规则 (Mapping Rules)</label>
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
                        <input type="text" id="newComponentName" placeholder="组件名称 (如: Button)">
                        <input type="text" id="newFilePath" placeholder="文档文件路径 (如: button.md)">
                        <button type="button" id="addMappingBtn">➕ 添加映射</button>
                    </div>
                </div>
                <small class="help-text">
                    💡 支持正则表达式：使用 <code>/(.*)/</code> 作为组件名，<code>$1.md</code> 作为路径可匹配所有组件
                </small>
            </div>

            <!-- 预览区域 -->
            <div class="form-group">
                <label>🔍 配置预览</label>
                <div class="preview-container">
                    <div class="preview-input">
                        <input type="text" id="previewComponentName" placeholder="输入组件名测试映射 (如: Button)">
                        <button type="button" id="previewBtn">🔍 预览</button>
                    </div>
                    <div id="previewResult" class="preview-result"></div>
                </div>
            </div>

            <!-- 配置验证区域 -->
            <div class="form-group">
                <label>🔍 配置验证</label>
                <div class="validation-container">
                    <button type="button" id="validateBtn" class="validate-btn">🔍 验证当前配置</button>
                    <div id="validationResult" class="validation-result"></div>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" id="saveBtn" class="primary">💾 保存配置</button>
                <button type="button" id="resetBtn">🔄 重置</button>
                <button type="button" id="validateBtn2" class="validate-btn">🔍 验证配置</button>
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
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    _getWebviewScript() {
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

                // 选择文件夹按钮
                document.getElementById('selectFolderBtn').addEventListener('click', selectFolder);

                // 预览按钮
                document.getElementById('previewBtn').addEventListener('click', previewMapping);

                // 验证按钮
                document.getElementById('validateBtn').addEventListener('click', validateConfiguration);
                document.getElementById('validateBtn2').addEventListener('click', validateConfiguration);

                // 模板按钮
                document.querySelectorAll('.template-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const template = this.getAttribute('data-template');
                        loadTemplate(template);
                    });
                });

                // 回车键支持
                document.getElementById('newComponentName').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('newFilePath').focus();
                    }
                });

                document.getElementById('newFilePath').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addMapping();
                    }
                });

                document.getElementById('previewComponentName').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        previewMapping();
                    }
                });
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
                showMessage('正在重置配置...', 'info');
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

            function selectFolder() {
                vscode.postMessage({ command: 'selectFolder' });
            }

            function previewMapping() {
                const componentName = document.getElementById('previewComponentName').value.trim();
                if (!componentName) {
                    showMessage('请输入组件名称', 'error');
                    return;
                }

                vscode.postMessage({
                    command: 'previewMapping',
                    componentName: componentName
                });
            }

            function loadTemplate(templateName) {
                vscode.postMessage({
                    command: 'loadTemplate',
                    templateName: templateName
                });
            }

            function validateConfiguration() {
                // 先更新当前配置
                const form = document.getElementById('configForm');
                const formData = new FormData(form);

                currentConfig.basePath = formData.get('basePath');
                currentConfig.cacheTimeout = parseInt(formData.get('cacheTimeout'));

                vscode.postMessage({ command: 'validateConfig' });
            }

            function renderMappingList() {
                const container = document.getElementById('mappingList');
                container.innerHTML = '';

                for (const [componentName, filePath] of Object.entries(currentConfig.mappingRule)) {
                    const row = document.createElement('div');
                    row.className = 'mapping-row';

                    // 判断是否为正则表达式
                    const isRegex = componentName.startsWith('/') && componentName.endsWith('/');
                    const displayName = isRegex ? \`🔄 \${componentName}\` : \`📦 \${componentName}\`;

                    row.innerHTML = \`
                        <span class="component-name">\${displayName}</span>
                        <span class="file-path">\${filePath}</span>
                        <div class="mapping-actions">
                            <button type="button" class="preview-btn" onclick="previewSpecificMapping('\${componentName}')">👁️</button>
                            <button type="button" class="remove-btn" onclick="removeMapping('\${componentName}')">🗑️</button>
                        </div>
                    \`;
                    container.appendChild(row);
                }

                if (Object.keys(currentConfig.mappingRule).length === 0) {
                    container.innerHTML = '<div class="empty-state">暂无映射规则，请添加组件映射</div>';
                }
            }

            function previewSpecificMapping(componentName) {
                // 如果是正则表达式，提示用户输入具体组件名
                if (componentName.startsWith('/') && componentName.endsWith('/')) {
                    const testName = prompt('请输入要测试的组件名称（用于测试正则表达式）:', 'Button');
                    if (testName) {
                        document.getElementById('previewComponentName').value = testName;
                        previewMapping();
                    }
                } else {
                    document.getElementById('previewComponentName').value = componentName;
                    previewMapping();
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
                    case 'configReset':
                        if (message.success) {
                            showMessage(message.message, 'success');
                        } else {
                            showMessage(message.message, 'error');
                        }
                        break;
                    case 'pathValidated':
                        showPathValidation(message.path, message.isValid, message.message);
                        break;
                    case 'folderSelected':
                        document.getElementById('basePath').value = message.path;
                        validateBasePath();
                        break;
                    case 'previewResult':
                        showPreviewResult(message);
                        break;
                    case 'templateLoaded':
                        loadTemplateData(message.template, message.templateName);
                        break;
                    case 'configValidated':
                        showValidationResult(message.validation);
                        break;
                }
            });

            function updateForm() {
                document.getElementById('basePath').value = currentConfig.basePath || '';
                document.getElementById('cacheTimeout').value = currentConfig.cacheTimeout || 300000;
                renderMappingList();

                // 清除所有模板按钮的激活状态
                document.querySelectorAll('.template-btn').forEach(btn => {
                    btn.classList.remove('active');
                });

                // 清除预览结果
                const previewResult = document.getElementById('previewResult');
                if (previewResult) {
                    previewResult.innerHTML = '';
                }

                // 清除验证消息
                const validationMsg = document.getElementById('basePathValidation');
                if (validationMsg) {
                    validationMsg.textContent = '';
                    validationMsg.className = 'validation-message';
                }

                // 清除验证结果
                const validationResult = document.getElementById('validationResult');
                if (validationResult) {
                    validationResult.innerHTML = '';
                }
            }

            function showPathValidation(path, isValid, message) {
                const validationDiv = document.getElementById('basePathValidation');
                validationDiv.textContent = message;
                validationDiv.className = \`validation-message \${isValid ? 'valid' : 'invalid'}\`;
            }

            function showPreviewResult(result) {
                const container = document.getElementById('previewResult');

                if (result.success) {
                    container.innerHTML = \`
                        <div class="preview-success">
                            <h4>✅ \${result.componentName} 组件文档</h4>
                            <p><strong>路径:</strong> \${result.path}</p>
                            <div class="preview-content">
                                <strong>内容预览:</strong>
                                <pre>\${result.content}</pre>
                            </div>
                        </div>
                    \`;
                } else {
                    container.innerHTML = \`
                        <div class="preview-error">
                            <h4>❌ \${result.componentName} 组件文档</h4>
                            <p><strong>错误:</strong> \${result.message}</p>
                            \${result.path ? \`<p><strong>尝试的路径:</strong> \${result.path}</p>\` : ''}
                        </div>
                    \`;
                }
            }

            function loadTemplateData(template, templateName) {
                currentConfig = { ...template };
                updateForm();
                showMessage(\`已加载 \${templateName} 模板配置\`, 'success');

                // 高亮选中的模板按钮
                document.querySelectorAll('.template-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector(\`[data-template="\${templateName}"]\`).classList.add('active');
            }

            function showValidationResult(validation) {
                const container = document.getElementById('validationResult');

                let html = '';

                if (validation.isValid) {
                    html += '<div class="validation-success"><h4>✅ 配置验证通过</h4>';
                } else {
                    html += '<div class="validation-error"><h4>❌ 配置验证失败</h4>';
                }

                // 显示错误
                if (validation.errors && validation.errors.length > 0) {
                    html += '<div class="validation-errors"><strong>错误:</strong><ul>';
                    validation.errors.forEach(error => {
                        html += \`<li>\${error}</li>\`;
                    });
                    html += '</ul></div>';
                }

                // 显示警告
                if (validation.warnings && validation.warnings.length > 0) {
                    html += '<div class="validation-warnings"><strong>警告:</strong><ul>';
                    validation.warnings.forEach(warning => {
                        html += \`<li>\${warning}</li>\`;
                    });
                    html += '</ul></div>';
                }

                html += '</div>';
                container.innerHTML = html;

                // 显示消息提示
                if (validation.isValid) {
                    showMessage('配置验证通过！', 'success');
                } else {
                    showMessage('配置验证失败，请检查错误信息', 'error');
                }
            }
        `;
    }
}
exports.ConfigurationPanel = ConfigurationPanel;
//# sourceMappingURL=ConfigurationPanel.js.map