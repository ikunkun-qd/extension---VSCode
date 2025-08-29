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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const HoverProvider_1 = require("./providers/HoverProvider");
const DocumentationPanel_1 = require("./panels/DocumentationPanel");
const ConfigurationPanel_1 = require("./panels/ConfigurationPanel");
const SettingsViewProvider_1 = require("./panels/SettingsViewProvider");
const ConfigManager_1 = require("./services/ConfigManager");
const DocumentService_1 = require("./services/DocumentService");
/**
 * 插件激活函数
 * @param context VSCode扩展上下文
 */
function activate(context) {
    console.log('组件智能文档提示插件已激活');
    // 初始化服务
    const configManager = new ConfigManager_1.ConfigManager();
    const documentService = new DocumentService_1.DocumentService(configManager);
    // 注册悬停提示提供器
    const hoverProvider = new HoverProvider_1.HoverProvider(documentService);
    const hoverDisposable = vscode.languages.registerHoverProvider([
        { scheme: 'file', language: 'javascript' },
        { scheme: 'file', language: 'javascriptreact' },
        { scheme: 'file', language: 'typescript' },
        { scheme: 'file', language: 'typescriptreact' },
        { scheme: 'file', language: 'vue' }
    ], hoverProvider);
    // 注册侧边栏设置视图
    const settingsProvider = new SettingsViewProvider_1.SettingsViewProvider(context.extensionUri, configManager);
    const settingsViewDisposable = vscode.window.registerWebviewViewProvider(SettingsViewProvider_1.SettingsViewProvider.viewType, settingsProvider);
    // 注册显示文档命令
    const showDocCommand = vscode.commands.registerCommand('componentDoc.showDocumentation', async (componentName) => {
        try {
            await DocumentationPanel_1.DocumentationPanel.createOrShow(context.extensionUri, componentName, documentService);
        }
        catch (error) {
            vscode.window.showErrorMessage(`无法显示组件文档: ${error}`);
        }
    });
    // 注册配置界面命令
    const openSettingsCommand = vscode.commands.registerCommand('componentDoc.openSettings', () => {
        try {
            ConfigurationPanel_1.ConfigurationPanel.createOrShow(context.extensionUri, configManager);
        }
        catch (error) {
            vscode.window.showErrorMessage(`无法打开配置界面: ${error}`);
        }
    });
    // 注册切换设置面板命令
    const toggleSettingsPanelCommand = vscode.commands.registerCommand('componentDoc.toggleSettingsPanel', () => {
        vscode.commands.executeCommand('workbench.view.extension.componentDoc');
    });
    // 注册刷新设置命令
    const refreshSettingsCommand = vscode.commands.registerCommand('componentDoc.refreshSettings', () => {
        settingsProvider.refresh();
    });
    // 创建状态栏按钮
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(gear) 组件文档设置";
    statusBarItem.tooltip = "打开组件文档设置面板";
    statusBarItem.command = 'componentDoc.toggleSettingsPanel';
    statusBarItem.show();
    // 监听配置变化
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('componentDoc')) {
            configManager.reload();
            vscode.window.showInformationMessage('组件文档配置已更新');
        }
    });
    // 添加到上下文订阅
    context.subscriptions.push(hoverDisposable, settingsViewDisposable, showDocCommand, openSettingsCommand, toggleSettingsPanelCommand, refreshSettingsCommand, statusBarItem, configChangeDisposable);
}
exports.activate = activate;
/**
 * 插件停用函数
 */
function deactivate() {
    console.log('组件智能文档提示插件已停用');
    DocumentationPanel_1.DocumentationPanel.dispose();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map