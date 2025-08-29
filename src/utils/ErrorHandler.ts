import * as vscode from 'vscode';

/**
 * 错误处理工具类
 */
export class ErrorHandler {
    private static readonly ERROR_PREFIX = '[组件文档助手]';

    /**
     * 显示错误消息
     * @param message 错误消息
     * @param error 错误对象
     */
    public static showError(message: string, error?: any): void {
        const fullMessage = `${this.ERROR_PREFIX} ${message}`;
        
        if (error) {
            console.error(fullMessage, error);
            vscode.window.showErrorMessage(`${fullMessage}: ${this.getErrorMessage(error)}`);
        } else {
            console.error(fullMessage);
            vscode.window.showErrorMessage(fullMessage);
        }
    }

    /**
     * 显示警告消息
     * @param message 警告消息
     */
    public static showWarning(message: string): void {
        const fullMessage = `${this.ERROR_PREFIX} ${message}`;
        console.warn(fullMessage);
        vscode.window.showWarningMessage(fullMessage);
    }

    /**
     * 显示信息消息
     * @param message 信息消息
     */
    public static showInfo(message: string): void {
        const fullMessage = `${this.ERROR_PREFIX} ${message}`;
        console.info(fullMessage);
        vscode.window.showInformationMessage(fullMessage);
    }

    /**
     * 记录调试信息
     * @param message 调试消息
     * @param data 附加数据
     */
    public static debug(message: string, data?: any): void {
        const fullMessage = `${this.ERROR_PREFIX} [DEBUG] ${message}`;
        if (data) {
            console.debug(fullMessage, data);
        } else {
            console.debug(fullMessage);
        }
    }

    /**
     * 处理异步操作错误
     * @param operation 操作名称
     * @param promise Promise对象
     * @returns 处理后的Promise
     */
    public static async handleAsync<T>(
        operation: string, 
        promise: Promise<T>
    ): Promise<T | null> {
        try {
            return await promise;
        } catch (error) {
            this.showError(`${operation}失败`, error);
            return null;
        }
    }

    /**
     * 验证配置
     * @param basePath 基础路径
     * @returns 验证结果
     */
    public static validateConfiguration(basePath: string): boolean {
        if (!basePath || basePath.trim() === '') {
            this.showWarning('请先配置组件文档的基础路径 (componentDoc.basePath)');
            return false;
        }

        // 验证本地路径是否存在
        if (!basePath.startsWith('http://') && !basePath.startsWith('https://')) {
            const fs = require('fs');
            let localPath = basePath;
            
            if (basePath.startsWith('file://')) {
                localPath = basePath.substring(7);
            }

            if (!fs.existsSync(localPath)) {
                this.showWarning(`配置的文档路径不存在: ${localPath}`);
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
    private static getErrorMessage(error: any): string {
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
    public static createUserFriendlyMessage(error: any, context: string): string {
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
