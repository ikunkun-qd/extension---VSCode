# 使用指南

## 快速开始

### 1. 安装插件

1. 打开VSCode
2. 按 `Ctrl+Shift+X` 打开扩展面板
3. 搜索"组件智能文档提示"
4. 点击安装

### 2. 配置插件

在VSCode设置中配置以下选项：

#### 方法一：通过设置界面
1. 按 `Ctrl+,` 打开设置
2. 搜索 "componentDoc"
3. 配置相关选项

#### 方法二：通过settings.json
按 `Ctrl+Shift+P`，输入 "Preferences: Open Settings (JSON)"，添加以下配置：

```json
{
  "componentDoc.basePath": "./docs",
  "componentDoc.mappingRule": {
    "Button": "Button.md",
    "Input": "Input.md",
    "/(.*)/": "$1.md"
  },
  "componentDoc.cacheTimeout": 300000
}
```

### 3. 测试功能

1. 打开包含组件的文件（如 `test-component.jsx`）
2. 将鼠标悬停在组件名称上（如 `<Button>`）
3. 查看悬停提示框
4. 点击"查看完整文档"链接

## 配置详解

### basePath（基础路径）

支持以下格式：

- **相对路径**：`"./docs"` 或 `"docs"`
- **绝对路径**：`"/path/to/docs"`
- **file:// 协议**：`"file:///path/to/docs"`
- **HTTP URL**：`"https://your-site.com/docs"`

### mappingRule（映射规则）

支持两种映射方式：

#### 精确映射
```json
{
  "Button": "components/Button.md",
  "Input": "components/Input.md"
}
```

#### 正则表达式映射
```json
{
  "/(.*)/": "components/$1/$1.md"
}
```

这会将 `MyButton` 映射到 `components/MyButton/MyButton.md`

### cacheTimeout（缓存超时）

远程文档的缓存时间，单位为毫秒：
- `300000` = 5分钟
- `600000` = 10分钟
- `0` = 不缓存

## 文档格式规范

### 推荐的Markdown结构

```markdown
# 组件名称

组件的简短描述（会显示在悬停提示中）

## 使用示例

\`\`\`jsx
<ComponentName prop="value">
  内容
</ComponentName>
\`\`\`

## Props

| 属性名 | 类型 | 描述 | 必填 | 默认值 |
|--------|------|------|------|--------|
| prop1 | string | 属性描述 | 是 | - |
| prop2 | boolean | 属性描述 | 否 | false |
```

### 重要提示

1. **第一段文字**会被用作悬停提示的描述
2. **Props表格**会被自动解析并在文档中突出显示
3. **代码块**支持语法高亮
4. **图片**和**链接**都会正常渲染

## 故障排除

### 悬停提示不显示

1. 检查文件类型是否支持（.js, .jsx, .ts, .tsx, .vue）
2. 确认组件名称符合命名规范（大写字母开头）
3. 检查 `basePath` 配置是否正确

### 文档无法加载

1. 检查文档文件是否存在
2. 验证映射规则是否正确
3. 查看VSCode开发者控制台的错误信息

### 远程文档访问失败

1. 检查网络连接
2. 确认URL是否正确
3. 检查服务器是否支持CORS

## 高级用法

### 多项目配置

可以在工作区设置中为不同项目配置不同的文档路径：

```json
{
  "folders": [
    {
      "name": "项目A",
      "path": "./project-a"
    },
    {
      "name": "项目B", 
      "path": "./project-b"
    }
  ],
  "settings": {
    "componentDoc.basePath": "./shared-docs"
  }
}
```

### 自定义样式

文档面板会自动适配VSCode主题，但你也可以在Markdown中使用HTML和CSS：

```markdown
<div style="background: #f0f0f0; padding: 10px;">
  自定义样式的内容
</div>
```

## 常见问题

**Q: 支持哪些前端框架？**
A: 支持React、Vue、Angular等使用JSX/TSX语法的框架。

**Q: 可以配置多个文档源吗？**
A: 目前只支持一个basePath，但可以通过映射规则指向不同的子目录。

**Q: 如何更新缓存？**
A: 重启VSCode或修改配置会自动清除缓存。

**Q: 支持私有仓库的文档吗？**
A: 支持，需要确保VSCode运行环境能够访问对应的URL。
