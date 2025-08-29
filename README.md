# 组件智能文档提示插件

一个为前端组件库提供智能文档提示和侧边栏文档视图的VSCode插件。

## 功能特性

### 🎯 智能悬停提示
- 当鼠标悬停在组件名称上时，自动显示组件的基本信息
- 提供快速访问完整文档的链接
- 支持JSX、Vue等多种前端框架

### 📖 侧边栏文档视图
- 点击悬停提示中的链接，在侧边栏打开完整的组件文档
- 完美渲染Markdown文档，支持代码高亮、表格等
- 智能解析组件属性(Props)表格
- 适配VSCode暗色/亮色主题

### ⚙️ 灵活配置
- 支持本地文档路径和远程URL
- 可自定义组件名与文档文件的映射规则
- 支持正则表达式映射规则
- 可配置缓存策略

## 安装

1. 在VSCode扩展市场搜索"组件智能文档提示"
2. 点击安装
3. 重启VSCode

## 配置

在VSCode设置中配置以下选项：

### 基础路径 (componentDoc.basePath)
组件库文档的根路径，支持本地路径和远程URL：

```json
{
  "componentDoc.basePath": "file:///path/to/your/docs"
}
```

或者：

```json
{
  "componentDoc.basePath": "https://your-component-library.com/docs"
}
```

### 映射规则 (componentDoc.mappingRule)
定义组件名与文档文件的映射关系：

```json
{
  "componentDoc.mappingRule": {
    "Button": "components/Button/Button.md",
    "Input": "components/Input/Input.md",
    "/(.*)/": "components/$1/$1.md"
  }
}
```

### 缓存超时 (componentDoc.cacheTimeout)
远程文档的缓存过期时间（毫秒）：

```json
{
  "componentDoc.cacheTimeout": 300000
}
```

## 使用方法

1. **配置插件**：在VSCode设置中配置组件库文档路径和映射规则
2. **悬停查看**：将鼠标悬停在组件名称上，查看基本信息
3. **查看详情**：点击"查看完整文档"链接，在侧边栏打开完整文档

## 支持的文件类型

- JavaScript (.js)
- JavaScript React (.jsx)
- TypeScript (.ts)
- TypeScript React (.tsx)
- Vue (.vue)

## 文档格式要求

组件文档应使用Markdown格式，建议包含以下部分：

```markdown
# 组件名称

组件的简短描述...

## 使用示例

\`\`\`jsx
<Button type="primary" size="large">
  点击我
</Button>
\`\`\`

## Props

| 属性名 | 类型 | 描述 | 必填 | 默认值 |
|--------|------|------|------|--------|
| type | string | 按钮类型 | 否 | default |
| size | string | 按钮大小 | 否 | medium |
```

## 开发

### 本地开发

1. 克隆项目：
```bash
git clone <repository-url>
cd component-doc-helper
```

2. 安装依赖：
```bash
npm install
```

3. 编译项目：
```bash
npm run compile
```

4. 在VSCode中按F5启动调试

### 构建

```bash
npm run compile
```

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
