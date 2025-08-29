import * as vscode from 'vscode';
import { HoverProvider } from './providers/HoverProvider';
import { DocumentationPanel } from './panels/DocumentationPanel';
import { ConfigurationPanel } from './panels/ConfigurationPanel';
import { SettingsViewProvider } from './panels/SettingsViewProvider';
import { ConfigManager } from './services/ConfigManager';
import { DocumentService } from './services/DocumentService';

/**
 * 插件激活函数
 * @param context VSCode扩展上下文
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('组件智能文档提示插件已激活');

    // 初始化服务
    const configManager = new ConfigManager();
    const documentService = new DocumentService(configManager);

    // 注册悬停提示提供器
    const hoverProvider = new HoverProvider(documentService);
    const hoverDisposable = vscode.languages.registerHoverProvider(
        [
            { scheme: 'file', language: 'javascript' },
            { scheme: 'file', language: 'javascriptreact' },
            { scheme: 'file', language: 'typescript' },
            { scheme: 'file', language: 'typescriptreact' },
            { scheme: 'file', language: 'vue' }
        ],
        hoverProvider
    );

    // 注册侧边栏设置视图
    const settingsProvider = new SettingsViewProvider(context.extensionUri, configManager);
    const settingsViewDisposable = vscode.window.registerWebviewViewProvider(
        SettingsViewProvider.viewType,
        settingsProvider
    );

    // 注册显示文档命令
    const showDocCommand = vscode.commands.registerCommand(
        'componentDoc.showDocumentation',
        async (componentName: string) => {
            try {
                await DocumentationPanel.createOrShow(context.extensionUri, componentName, documentService);
            } catch (error) {
                vscode.window.showErrorMessage(`无法显示组件文档: ${error}`);
            }
        }
    );

    // 注册配置界面命令
    const openSettingsCommand = vscode.commands.registerCommand(
        'componentDoc.openSettings',
        () => {
            try {
                ConfigurationPanel.createOrShow(context.extensionUri, configManager);
            } catch (error) {
                vscode.window.showErrorMessage(`无法打开配置界面: ${error}`);
            }
        }
    );

    // 注册切换设置面板命令
    const toggleSettingsPanelCommand = vscode.commands.registerCommand(
        'componentDoc.toggleSettingsPanel',
        () => {
            vscode.commands.executeCommand('workbench.view.extension.componentDoc');
        }
    );

    // 注册刷新设置命令
    const refreshSettingsCommand = vscode.commands.registerCommand(
        'componentDoc.refreshSettings',
        () => {
            settingsProvider.refresh();
        }
    );

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
    context.subscriptions.push(
        hoverDisposable,
        settingsViewDisposable,
        showDocCommand,
        openSettingsCommand,
        toggleSettingsPanelCommand,
        refreshSettingsCommand,
        statusBarItem,
        configChangeDisposable
    );
}

/**
 * 插件停用函数
 */
export function deactivate() {
    console.log('组件智能文档提示插件已停用');
    DocumentationPanel.dispose();
}
