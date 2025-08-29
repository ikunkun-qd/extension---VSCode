# 使用指南

## 快速开始

### 1. 安装插件

#### 方法一：从 VSIX 文件安装（推荐）

1. 下载扩展包 `component-doc-helper-0.0.1.vsix`
2. 打开终端，运行以下命令：
   ```bash
   code --install-extension component-doc-helper-0.0.1.vsix
   ```
3. 或者在 VSCode 中按 `Ctrl+Shift+P` 打开命令面板
4. 输入 "Extensions: Install from VSIX..."
5. 选择下载的 `.vsix` 文件进行安装

**验证安装：**

```bash
code --list-extensions | findstr component-doc
```

应该显示：`component-doc-team.component-doc-helper`

#### 方法二：从扩展市场安装

1. 打开 VSCode
2. 按 `Ctrl+Shift+X` 打开扩展面板
3. 搜索"组件智能文档提示"
4. 点击安装

### 2. 配置插件

在 VSCode 设置中配置以下选项：

#### 方法一：通过设置界面

1. 按 `Ctrl+,` 打开设置
2. 搜索 "componentDoc"
3. 配置相关选项

#### 方法二：通过 settings.json

按 `Ctrl+Shift+P`，输入 "Preferences: Open Settings (JSON)"，添加以下配置：

```json
{
  "componentDoc.basePath": "D:/your-project-path/example-docs",
  "componentDoc.mappingRule": {
    "Button": "Button.md",
    "Input": "Input.md",
    "Card": "Card.md",
    "/(.*)/": "$1.md"
  },
  "componentDoc.cacheTimeout": 300000
}
```

**⚠️ 重要提示：**

- `basePath` 必须是**绝对路径**或正确的相对路径
- 文件名映射要注意**大小写**（如 `Button.md` 而不是 `button.md`）
- 确保文档文件确实存在于指定路径

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

- `300000` = 5 分钟
- `600000` = 10 分钟
- `0` = 不缓存

## 文档格式规范

### 推荐的 Markdown 结构

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

| 属性名 | 类型    | 描述     | 必填 | 默认值 |
| ------ | ------- | -------- | ---- | ------ |
| prop1  | string  | 属性描述 | 是   | -      |
| prop2  | boolean | 属性描述 | 否   | false  |
```

### 重要提示

1. **第一段文字**会被用作悬停提示的描述
2. **Props 表格**会被自动解析并在文档中突出显示
3. **代码块**支持语法高亮
4. **图片**和**链接**都会正常渲染

## 故障排除

### 悬停提示不显示

**常见原因和解决方案：**

1. **扩展未安装或未激活**

   ```bash
   # 检查扩展是否安装
   code --list-extensions | findstr component-doc
   ```

   如果没有显示结果，请重新安装扩展

2. **配置路径错误**

   - 检查 `basePath` 是否指向正确的目录
   - 确保路径存在且可访问
   - 使用绝对路径避免相对路径问题

3. **文件名映射错误**

   - 检查映射规则中的文件名大小写
   - 确保文档文件确实存在
   - 验证文件扩展名（.md）

4. **文件类型不支持**

   - 确认文件类型：.js, .jsx, .ts, .tsx, .vue
   - 检查 VSCode 是否正确识别文件语言模式

5. **组件名称不符合规范**
   - 组件名必须以大写字母开头
   - 支持驼峰命名（如 `MyButton`）

**调试步骤：**

1. 重启 VSCode
2. 按 `F12` 打开开发者控制台查看错误
3. 检查扩展是否在扩展面板中显示为已启用

### 文档无法加载

1. **检查文档文件是否存在**

   ```bash
   # Windows
   dir "D:\your-path\example-docs\Button.md"

   # 或在 VSCode 中直接打开文件验证
   ```

2. **验证映射规则是否正确**

   - 精确匹配：`"Button": "Button.md"`
   - 正则匹配：`"/(.*)/": "$1.md"`

3. **查看 VSCode 开发者控制台的错误信息**
   - 按 `F12` 打开控制台
   - 查找 `[组件文档助手]` 相关的错误信息

### 远程文档访问失败

1. 检查网络连接
2. 确认 URL 是否正确
3. 检查服务器是否支持 CORS
4. 验证远程服务器的可访问性

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

文档面板会自动适配 VSCode 主题，但你也可以在 Markdown 中使用 HTML 和 CSS：

```markdown
<div style="background: #f0f0f0; padding: 10px;">
  自定义样式的内容
</div>
```

## 常见问题

**Q: 支持哪些前端框架？**
A: 支持 React、Vue、Angular 等使用 JSX/TSX 语法的框架。

**Q: 可以配置多个文档源吗？**
A: 目前只支持一个 basePath，但可以通过映射规则指向不同的子目录。

**Q: 如何更新缓存？**
A: 重启 VSCode 或修改配置会自动清除缓存。

**Q: 支持私有仓库的文档吗？**
A: 支持，需要确保 VSCode 运行环境能够访问对应的 URL。

## 快速检查清单

如果悬浮提示不工作，请按以下顺序检查：

### ✅ 安装检查

- [ ] 扩展已安装：`code --list-extensions | findstr component-doc`
- [ ] 扩展已启用：在扩展面板中查看状态

### ✅ 配置检查

- [ ] `basePath` 路径正确且存在
- [ ] 映射规则文件名大小写正确
- [ ] 文档文件确实存在于指定位置

### ✅ 文件检查

- [ ] 文件类型支持：.js, .jsx, .ts, .tsx, .vue
- [ ] 组件名符合规范：大写字母开头
- [ ] VSCode 正确识别文件语言模式

### ✅ 测试步骤

1. 重启 VSCode
2. 打开 `test-component.jsx`
3. 悬浮鼠标到 `<Button>` 组件名上
4. 查看是否显示悬浮提示框
5. 点击"查看完整文档"链接测试

### 🔧 调试工具

- 开发者控制台：`F12`
- 查找错误信息：`[组件文档助手]`
- 扩展输出面板：查看详细日志
