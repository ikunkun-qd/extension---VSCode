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
exports.SettingsViewProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * 侧边栏设置面板提供器
 * 提供一个可切换显示/隐藏的设置面板
 */
class SettingsViewProvider {
    constructor(_extensionUri, configManager) {
        this._extensionUri = _extensionUri;
        this._configManager = configManager;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media')
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // 处理来自webview的消息
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'saveConfig':
                    this._saveConfiguration(message.config).catch(error => {
                        console.error('[SettingsViewProvider] 保存配置异常:', error);
                    });
                    return;
                case 'loadConfig':
                    this._reloadConfiguration();
                    return;
                case 'validatePath':
                    this._validatePath(message.path);
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
            }
        });
        // 初始加载配置
        this._loadConfiguration();
    }
    async _saveConfiguration(config) {
        try {
            console.log('[SettingsViewProvider] 开始保存配置:', config);
            console.log('[SettingsViewProvider] 保存前的当前配置:', {
                basePath: vscode.workspace.getConfiguration('componentDoc').get('basePath'),
                mappingRule: vscode.workspace.getConfiguration('componentDoc').get('mappingRule')
            });
            // 更新VSCode配置
            const workspaceConfig = vscode.workspace.getConfiguration('componentDoc');
            // 确定配置保存目标
            let configTarget = this.determineConfigTarget(config);
            console.log('[SettingsViewProvider] 配置保存目标:', configTarget === vscode.ConfigurationTarget.Global ? 'Global' : 'Workspace');
            await workspaceConfig.update('basePath', config.basePath, configTarget);
            await workspaceConfig.update('mappingRule', config.mappingRule, configTarget);
            await workspaceConfig.update('cacheTimeout', config.cacheTimeout, configTarget);
            console.log('[SettingsViewProvider] 配置已更新到VSCode设置');
            // 重新加载配置管理器
            this._configManager.reload();
            console.log('[SettingsViewProvider] 配置管理器已重新加载');
            // 验证配置是否真的保存了
            const savedConfig = vscode.workspace.getConfiguration('componentDoc');
            const verifyBasePath = savedConfig.get('basePath');
            const verifyMappingRule = savedConfig.get('mappingRule');
            console.log('[SettingsViewProvider] 验证保存的配置:', {
                basePath: verifyBasePath,
                mappingRule: verifyMappingRule
            });
            // 检查配置是否真的更新了（Windows路径不区分大小写）
            const normalizedExpected = this.normalizePath(config.basePath);
            const normalizedActual = this.normalizePath(verifyBasePath);
            if (normalizedExpected !== normalizedActual) {
                console.error('[SettingsViewProvider] 配置保存失败！期望:', normalizedExpected, '实际:', normalizedActual);
                throw new Error(`配置保存失败：期望 ${config.basePath}，但实际保存的是 ${verifyBasePath}`);
            }
            console.log('[SettingsViewProvider] 配置验证通过 - 期望:', normalizedExpected, '实际:', normalizedActual);
            // 发送成功消息到webview
            this._view?.webview.postMessage({
                command: 'configSaved',
                success: true,
                message: '配置保存成功！'
            });
            vscode.window.showInformationMessage('组件文档配置已保存');
        }
        catch (error) {
            console.error('[SettingsViewProvider] 保存配置失败:', error);
            // 发送错误消息到webview
            this._view?.webview.postMessage({
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
            this._view?.webview.postMessage({
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
                isValid = true;
                message = '远程URL格式正确';
            }
            else {
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
            this._view?.webview.postMessage({
                command: 'pathValidated',
                path: pathToValidate,
                isValid: isValid,
                message: message
            });
        }
        catch (error) {
            this._view?.webview.postMessage({
                command: 'pathValidated',
                path: pathToValidate,
                isValid: false,
                message: `验证失败: ${error}`
            });
        }
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
                this._view?.webview.postMessage({
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
                this._view?.webview.postMessage({
                    command: 'previewResult',
                    componentName: componentName,
                    success: false,
                    message: '未找到对应的文档路径配置'
                });
                return;
            }
            const fs = require('fs');
            let exists = false;
            let content = '';
            if (docPath.startsWith('http://') || docPath.startsWith('https://')) {
                exists = true;
                content = `远程文档: ${docPath}`;
            }
            else {
                if (fs.existsSync(docPath)) {
                    exists = true;
                    try {
                        const fileContent = fs.readFileSync(docPath, 'utf-8');
                        content = fileContent.substring(0, 150) + (fileContent.length > 150 ? '...' : '');
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
            this._view?.webview.postMessage({
                command: 'previewResult',
                componentName: componentName,
                success: exists,
                path: docPath,
                content: content,
                message: exists ? '文档预览' : '文档文件不存在'
            });
        }
        catch (error) {
            this._view?.webview.postMessage({
                command: 'previewResult',
                componentName: componentName,
                success: false,
                message: `预览失败: ${error}`
            });
        }
    }
    _loadTemplate(templateName) {
        const templates = {
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
            'ouryun': {
                basePath: 'D:\\Front_end\\前端项目\\shixi\\ouryun-design\\docs\\zh-CN\\components\\ouryun-plus',
                mappingRule: {
                    // 业务组件精确映射（这些组件名和文档名完全匹配）
                    'SearchTable': '业务组件/searchTable.md',
                    'ou-search-table': '业务组件/searchTable.md',
                    'PageSelect': '业务组件/pageSelect.md',
                    'ou-page-select': '业务组件/pageSelect.md',
                    'JsonTree': '业务组件/jsonTree.md',
                    // 注意：常用组件不再需要精确映射，将使用智能模糊匹配
                    // 例如：Button 会自动匹配到 常用组件/button.md
                    //      Input 会自动匹配到 常用组件/input.md
                    //      Form 会自动匹配到 常用组件/form.md
                    // 其他业务组件也将使用智能模糊匹配
                    // 例如：DragUpload 会自动匹配到 业务组件/dragUpload.md
                    //      Progress 会自动匹配到 业务组件/progress.md
                    // 通用正则规则（递归搜索会自动处理）
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
                    // 支持递归搜索的通用规则
                    '/(.*)/': '$1.md'
                },
                cacheTimeout: 300000
            }
        };
        const template = templates[templateName];
        if (template) {
            this._view?.webview.postMessage({
                command: 'templateLoaded',
                template: template,
                templateName: templateName
            });
        }
    }
    refresh() {
        this._reloadConfiguration();
    }
    _reloadConfiguration() {
        try {
            // 强制重新加载配置管理器
            this._configManager.reload();
            // 然后加载配置
            this._loadConfiguration();
            // 发送重置成功消息
            this._view?.webview.postMessage({
                command: 'configReset',
                success: true,
                message: '配置已重置'
            });
        }
        catch (error) {
            this._view?.webview.postMessage({
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
        const stylesConfigUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.css'));
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
    <title>组件文档设置</title>
</head>
<body>
    <div class="sidebar-container">
        <div class="header">
            <h2>⚙️ 配置设置</h2>
        </div>
        
        <!-- 快速模板 -->
        <div class="section">
            <h3>📋 快速模板</h3>
            <div class="template-grid">
                <button class="template-btn" data-template="ouryun">OurYun</button>
                <button class="template-btn" data-template="antd">Ant Design</button>
                <button class="template-btn" data-template="element">Element UI</button>
                <button class="template-btn" data-template="custom">自定义</button>
            </div>
        </div>

        <!-- 基础路径 -->
        <div class="section">
            <h3>📁 文档路径</h3>
            <div class="input-group">
                <input type="text" id="basePath" placeholder="选择文档目录...">
                <button id="selectFolderBtn" class="icon-btn">📂</button>
            </div>
            <div id="basePathValidation" class="validation-msg"></div>
        </div>

        <!-- 映射规则 -->
        <div class="section">
            <h3>🗂️ 映射规则</h3>
            <div id="mappingList" class="mapping-list">
                <!-- 动态生成 -->
            </div>
            <div class="add-mapping">
                <input type="text" id="newComponentName" placeholder="组件名">
                <input type="text" id="newFilePath" placeholder="文件路径">
                <button id="addMappingBtn" class="add-btn">➕</button>
            </div>
        </div>

        <!-- 预览测试 -->
        <div class="section">
            <h3>🔍 预览测试</h3>
            <div class="input-group">
                <input type="text" id="previewComponentName" placeholder="输入组件名测试">
                <button id="previewBtn" class="icon-btn">👁️</button>
            </div>
            <div id="previewResult" class="preview-result"></div>
        </div>

        <!-- 缓存设置 -->
        <div class="section">
            <h3>⏱️ 缓存设置</h3>
            <input type="number" id="cacheTimeout" min="0" value="300000" placeholder="缓存时间(毫秒)">
        </div>

        <!-- 保存选项 -->
        <div class="save-options">
            <div class="checkbox-group">
                <label>
                    <input type="checkbox" id="saveToGlobal">
                    <span class="checkmark"></span>
                    保存为全局配置（对所有项目生效）
                </label>
                <div class="help-text">
                    勾选此选项将配置保存到用户全局设置，未配置的项目将自动使用此配置
                </div>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
            <button id="saveBtn" class="primary-btn">💾 保存配置</button>
            <button id="copyConfigBtn" class="secondary-btn">📋 复制配置到剪贴板</button>
            <button id="resetBtn" class="secondary-btn">🔄 重置</button>
        </div>

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
            const vscode = acquireVsCodeApi();

            let currentConfig = {
                basePath: '',
                mappingRule: {},
                cacheTimeout: 300000
            };

            document.addEventListener('DOMContentLoaded', function() {
                vscode.postMessage({ command: 'loadConfig' });
                bindEvents();
            });

            function bindEvents() {
                // 保存按钮
                document.getElementById('saveBtn').addEventListener('click', saveConfiguration);

                // 复制配置按钮
                document.getElementById('copyConfigBtn').addEventListener('click', copyConfiguration);

                // 重置按钮
                document.getElementById('resetBtn').addEventListener('click', resetConfiguration);

                // 选择文件夹
                document.getElementById('selectFolderBtn').addEventListener('click', selectFolder);

                // 添加映射
                document.getElementById('addMappingBtn').addEventListener('click', addMapping);

                // 预览按钮
                document.getElementById('previewBtn').addEventListener('click', previewMapping);

                // 模板按钮
                document.querySelectorAll('.template-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const template = this.getAttribute('data-template');
                        loadTemplate(template);
                    });
                });

                // 路径验证
                document.getElementById('basePath').addEventListener('blur', validateBasePath);

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
                const config = {
                    basePath: document.getElementById('basePath').value.trim(),
                    cacheTimeout: parseInt(document.getElementById('cacheTimeout').value) || 300000,
                    mappingRule: currentConfig.mappingRule,
                    saveToGlobal: document.getElementById('saveToGlobal').checked
                };

                console.log('保存配置:', config);

                vscode.postMessage({
                    command: 'saveConfig',
                    config: config
                });
            }

            function copyConfiguration() {
                const config = {
                    basePath: document.getElementById('basePath').value.trim(),
                    cacheTimeout: parseInt(document.getElementById('cacheTimeout').value) || 300000,
                    mappingRule: currentConfig.mappingRule
                };

                const configText = JSON.stringify({
                    "componentDoc.basePath": config.basePath,
                    "componentDoc.mappingRule": config.mappingRule,
                    "componentDoc.cacheTimeout": config.cacheTimeout
                }, null, 2);

                navigator.clipboard.writeText(configText).then(() => {
                    showMessage('配置已复制到剪贴板！可以粘贴到其他项目的 .vscode/settings.json 文件中', 'success');
                }).catch(err => {
                    showMessage('复制失败: ' + err, 'error');
                });
            }

            function resetConfiguration() {
                showMessage('正在重置配置...', 'info');
                vscode.postMessage({ command: 'loadConfig' });
            }

            function selectFolder() {
                vscode.postMessage({ command: 'selectFolder' });
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

                document.getElementById('newComponentName').value = '';
                document.getElementById('newFilePath').value = '';
            }

            function removeMapping(componentName) {
                delete currentConfig.mappingRule[componentName];
                renderMappingList();
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
                    const item = document.createElement('div');
                    item.className = 'mapping-item';

                    const isRegex = componentName.startsWith('/') && componentName.endsWith('/');
                    const displayName = isRegex ? '🔄 ' + componentName : '📦 ' + componentName;

                    item.innerHTML = \`
                        <div class="mapping-info">
                            <div class="component-name">\${displayName}</div>
                            <div class="file-path">\${filePath}</div>
                        </div>
                        <button class="remove-btn" onclick="removeMapping('\${componentName}')">🗑️</button>
                    \`;
                    container.appendChild(item);
                }

                if (Object.keys(currentConfig.mappingRule).length === 0) {
                    container.innerHTML = '<div class="empty-state">暂无映射规则</div>';
                }
            }

            function showMessage(message, type = 'info') {
                const container = document.getElementById('messageContainer');
                const messageDiv = document.createElement('div');
                messageDiv.className = \`message \${type}\`;
                messageDiv.textContent = message;

                container.appendChild(messageDiv);

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
                    validationMsg.className = 'validation-msg';
                }
            }

            function showPathValidation(path, isValid, message) {
                const validationDiv = document.getElementById('basePathValidation');
                validationDiv.textContent = message;
                validationDiv.className = \`validation-msg \${isValid ? 'valid' : 'invalid'}\`;
            }

            function showPreviewResult(result) {
                const container = document.getElementById('previewResult');

                if (result.success) {
                    container.innerHTML = \`
                        <div class="preview-success">
                            <div class="preview-title">✅ \${result.componentName}</div>
                            <div class="preview-path">\${result.path}</div>
                            <div class="preview-content">\${result.content}</div>
                        </div>
                    \`;
                } else {
                    container.innerHTML = \`
                        <div class="preview-error">
                            <div class="preview-title">❌ \${result.componentName}</div>
                            <div class="preview-message">\${result.message}</div>
                        </div>
                    \`;
                }
            }

            function loadTemplateData(template, templateName) {
                currentConfig = { ...template };
                updateForm();
                showMessage(\`已加载 \${templateName} 模板\`, 'success');

                // 高亮选中的模板按钮
                document.querySelectorAll('.template-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector(\`[data-template="\${templateName}"]\`).classList.add('active');
            }
        `;
    }
    /**
     * 确定配置保存目标
     */
    determineConfigTarget(config) {
        // 检查是否有工作区
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            console.log('[SettingsViewProvider] 没有工作区，使用全局配置');
            return vscode.ConfigurationTarget.Global;
        }
        // 如果配置中包含saveToGlobal标志，则保存到全局
        if (config.saveToGlobal === true) {
            console.log('[SettingsViewProvider] 用户选择保存到全局配置');
            return vscode.ConfigurationTarget.Global;
        }
        // 默认保存到工作区
        console.log('[SettingsViewProvider] 保存到当前工作区配置');
        return vscode.ConfigurationTarget.Workspace;
    }
    /**
     * 标准化路径（处理Windows路径大小写不敏感问题）
     */
    normalizePath(path) {
        if (!path)
            return '';
        // Windows路径标准化：转换为小写并统一分隔符
        if (process.platform === 'win32') {
            return path.toLowerCase().replace(/\\/g, '/');
        }
        // 其他系统保持原样
        return path.replace(/\\/g, '/');
    }
}
exports.SettingsViewProvider = SettingsViewProvider;
SettingsViewProvider.viewType = 'componentDocSettings';
//# sourceMappingURL=SettingsViewProvider.js.map