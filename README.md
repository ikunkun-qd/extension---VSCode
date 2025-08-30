# 组件智能文档提示 (Component Doc Helper)

一个为前端组件库提供智能文档悬浮提示的 VSCode 扩展。当您将鼠标悬浮在组件名称上时，自动显示组件的文档说明，提高开发效率。

![扩展图标](media/icon.png)

## ✨ 主要功能

- 🎯 **智能悬浮提示**: 鼠标悬浮在组件名上即可查看文档
- 📁 **灵活配置**: 支持本地文档和远程文档URL
- 🔧 **可视化配置**: 提供图形化配置界面，操作简单
- 📋 **多种映射规则**: 支持精确匹配、正则表达式匹配
- 🚀 **高性能缓存**: 智能缓存机制，提升响应速度
- 🎨 **多语言支持**: 支持 JavaScript、TypeScript、React、Vue 等
- 📖 **完整文档查看**: 点击链接查看组件的完整文档

## 🎬 使用演示

1. **悬浮提示效果**
   ```jsx
   // 将鼠标悬浮在组件名上
   <Button type="primary">点击我</Button>
   <ou-search-table data={[]} columns={[]} />
   ```

2. **显示效果**
   ```
   ┌─────────────────────────────────────┐
   │ **Button**                          │
   │                                     │
   │ 基础按钮组件，用于触发操作。        │
   │                                     │
   │ [查看完整文档]                      │
   └─────────────────────────────────────┘
   ```

## 📦 安装方式

### 方法一：从 VSIX 文件安装
1. 下载 `component-doc-helper-x.x.x.vsix` 文件
2. 在 VSCode 中按 `Ctrl+Shift+P`
3. 输入 "Extensions: Install from VSIX"
4. 选择下载的 VSIX 文件

### 方法二：从源码构建
```bash
# 克隆项目
git clone <repository-url>
cd component-doc-helper

# 安装依赖
npm install

# 编译项目
npm run compile

# 打包扩展
npm run package

# 安装扩展
code --install-extension component-doc-helper-x.x.x.vsix
```

## ⚙️ 配置指南

### 快速配置

1. **打开配置面板**
   - 点击 VSCode 左侧活动栏的"组件文档"图标
   - 或按 `Ctrl+Shift+P` 输入 "组件文档: 切换设置面板"

2. **选择预设模板**
   - **OurYun**: 适用于 OurYun 组件库
   - **Ant Design**: 适用于 Ant Design 组件库
   - **Element UI**: 适用于 Element UI 组件库
   - **自定义**: 自定义配置

3. **设置文档路径**
   - 点击文件夹图标选择本地文档目录
   - 或直接输入远程文档 URL

4. **保存配置**
   - 点击"保存"按钮完成配置

### 手动配置

在项目的 `.vscode/settings.json` 中添加以下配置：

```json
{
  "componentDoc.basePath": "D:/path/to/your/docs",
  "componentDoc.mappingRule": {
    "Button": "常用组件/button.md",
    "Input": "常用组件/input.md",
    "ou-search-table": "业务组件/searchTable.md",
    "/(.*)Table$/": "业务组件/$1Table.md",
    "/(.*)/": "$1.md"
  },
  "componentDoc.cacheTimeout": 300000
}
```

## 📋 配置说明

### 基础配置

| 配置项 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `basePath` | string | 文档根路径 | `"D:/docs"` 或 `"https://docs.example.com"` |
| `mappingRule` | object | 组件映射规则 | 见下方详细说明 |
| `cacheTimeout` | number | 缓存过期时间(毫秒) | `300000` (5分钟) |

### 映射规则详解

#### 1. 精确匹配
```json
{
  "Button": "button.md",
  "Input": "input.md"
}
```

#### 2. 正则表达式匹配
```json
{
  "/(.*)Table$/": "tables/$1Table.md",
  "/^ou-(.*)$/": "ouryun/$1.md",
  "/(.*)/": "$1.md"
}
```

#### 3. 混合配置示例
```json
{
  "componentDoc.basePath": "D:/ouryun-design/docs",
  "componentDoc.mappingRule": {
    // 精确匹配 - 优先级最高
    "Button": "常用组件/button.md",
    "ou-search-table": "业务组件/searchTable.md",
    
    // 正则匹配 - 按顺序匹配
    "/(.*)Table$/": "业务组件/$1Table.md",
    "/^ou-(.*)$/": "常用组件/$1.md",
    
    // 通用规则 - 最后匹配
    "/(.*)/": "$1.md"
  }
}
```

## 🔧 使用技巧

### 1. 测试配置
- 按 `Ctrl+Shift+P` 输入 "componentDoc.testConfig"
- 运行测试命令查看配置是否正确

### 2. 预览功能
- 在配置面板的"预览测试"区域输入组件名
- 点击预览按钮查看映射结果

### 3. 调试模式
- 打开 VSCode 开发者工具 (`Ctrl+Shift+I`)
- 查看 Console 中的详细日志信息

### 4. 支持的组件名格式
- 大写开头: `Button`, `SearchTable`
- 连字符: `ou-search-table`, `el-button`
- 导入语句: `import { Button } from 'library'`

## 🚀 高级功能

### 1. 远程文档支持
```json
{
  "componentDoc.basePath": "https://ant.design/components",
  "componentDoc.mappingRule": {
    "Button": "button-cn/",
    "Input": "input-cn/"
  }
}
```

### 2. 多项目配置
不同项目可以有不同的配置文件，扩展会自动读取当前工作区的配置。

### 3. 缓存管理
- 远程文档会被缓存以提高性能
- 可通过 `cacheTimeout` 配置缓存时间
- 重启 VSCode 会清空缓存

## 🐛 故障排除

### 1. 悬浮提示不显示
- 检查文件类型是否支持 (js, jsx, ts, tsx, vue)
- 确认组件名格式正确
- 查看开发者控制台的错误信息

### 2. 文档路径错误
- 确认 `basePath` 路径存在
- 检查映射规则是否正确
- 使用预览功能测试路径

### 3. 中文路径问题
- 确保配置文件使用 UTF-8 编码
- 避免路径中包含特殊字符

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至开发团队

---

**享受智能文档提示带来的高效开发体验！** 🎉
