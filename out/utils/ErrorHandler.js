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
exports.ErrorHandler = void 0;
const vscode = __importStar(require("vscode"));
/**
 * 错误处理工具类
 */
class ErrorHandler {
    /**
     * 显示错误消息
     * @param message 错误消息
     * @param error 错误对象
     */
    static showError(message, error) {
        const fullMessage = `${this.ERROR_PREFIX} ${message}`;
        if (error) {
            console.error(fullMessage, error);
            vscode.window.showErrorMessage(`${fullMessage}: ${this.getErrorMessage(error)}`);
        }
        else {
            console.error(fullMessage);
            vscode.window.showErrorMessage(fullMessage);
        }
    }
    /**
     * 显示警告消息
     * @param message 警告消息
     */
    static showWarning(message) {
        const fullMessage = `${this.ERROR_PREFIX} ${message}`;
        console.warn(fullMessage);
        vscode.window.showWarningMessage(fullMessage);
    }
    /**
     * 显示信息消息
     * @param message 信息消息
     */
    static showInfo(message) {
        const fullMessage = `${this.ERROR_PREFIX} ${message}`;
        console.info(fullMessage);
        vscode.window.showInformationMessage(fullMessage);
    }
    /**
     * 记录调试信息
     * @param message 调试消息
     * @param data 附加数据
     */
    static debug(message, data) {
        const fullMessage = `${this.ERROR_PREFIX} [DEBUG] ${message}`;
        if (data) {
            console.debug(fullMessage, data);
        }
        else {
            console.debug(fullMessage);
        }
    }
    /**
     * 处理异步操作错误
     * @param operation 操作名称
     * @param promise Promise对象
     * @returns 处理后的Promise
     */
    static async handleAsync(operation, promise) {
        try {
            return await promise;
        }
        catch (error) {
            this.showError(`${operation}失败`, error);
            return null;
        }
    }
    /**
     * 验证配置
     * @param basePath 基础路径
     * @returns 验证结果
     */
    static validateConfiguration(basePath) {
        if (!basePath || basePath.trim() === '') {
            this.debug('基础路径未配置，跳过悬浮提示');
            return false;
        }
        // 验证本地路径是否存在
        if (!basePath.startsWith('http://') && !basePath.startsWith('https://')) {
            const fs = require('fs');
            const path = require('path');
            const vscode = require('vscode');
            let localPath = basePath;
            if (basePath.startsWith('file://')) {
                localPath = basePath.substring(7);
            }
            // 如果是相对路径，需要相对于工作区根目录解析
            if (!path.isAbsolute(localPath)) {
                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                if (workspaceRoot) {
                    localPath = path.resolve(workspaceRoot, localPath);
                    this.debug(`解析相对路径: ${basePath} -> ${localPath}`);
                }
            }
            if (!fs.existsSync(localPath)) {
                this.debug(`配置的文档路径不存在: ${localPath}`);
                return false;
            }
        }
        return true;
    }
    /**
     * 获取错误消息
     * @param error 错误对象
     * @returns 错误消息字符串
     */
    static getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        if (error && typeof error === 'object') {
            return error.message || error.toString() || '未知错误';
        }
        return '未知错误';
    }
    /**
     * 创建用户友好的错误消息
     * @param error 错误对象
     * @param context 错误上下文
     * @returns 用户友好的错误消息
     */
    static createUserFriendlyMessage(error, context) {
        const errorMsg = this.getErrorMessage(error);
        // 网络错误
        if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('ECONNREFUSED')) {
            return `无法连接到文档服务器，请检查网络连接或文档URL配置`;
        }
        // 文件不存在错误
        if (errorMsg.includes('ENOENT') || errorMsg.includes('404')) {
            return `找不到对应的文档文件，请检查文档路径配置`;
        }
        // 权限错误
        if (errorMsg.includes('EACCES') || errorMsg.includes('403')) {
            return `没有权限访问文档文件，请检查文件权限`;
        }
        // 超时错误
        if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
            return `请求超时，请检查网络连接或稍后重试`;
        }
        return `${context}时发生错误: ${errorMsg}`;
    }
}
exports.ErrorHandler = ErrorHandler;
ErrorHandler.ERROR_PREFIX = '[组件文档助手]';
//# sourceMappingURL=ErrorHandler.js.map