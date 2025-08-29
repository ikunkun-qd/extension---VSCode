# 组件智能文档提示插件 - 设计文档

## 1. 概述

### 1.1 项目背景

前端团队在使用内部组件库进行开发时，经常需要频繁查阅组件的API文档和使用样例。传统的开发流程需要开发者手动离开编辑器，去打开浏览器查找文档网站，这严重破坏了编码的心流状态，降低了开发效率。

本插件旨在将组件库的文档无缝集成到VSCode编辑器中，当开发者将鼠标悬浮于组件标签上时，提供丰富的增强提示，并允许一键在侧边栏打开完整的文档，从而实现“文档触手可及”的沉浸式开发体验。

### 1.2 目标

开发一个VSCode插件，主要功能为：

1. 当光标悬停在组件名称（如 `<MyButton>`）上时，显示一个增强的提示框（Hover）。
2. 在该提示框中，提供指向完整文档的**蓝色可点击链接**。
3. 点击该链接后，在主编辑区旁打开一个侧边栏（Webview Panel）。
4. 该侧边栏能够渲染指定组件的Markdown文档，重点展示**使用样例**和 **API属性表格**。

## 2. 功能需求详述 (Functional Requirements)

### 2.1 核心功能：智能悬停提示 (Enhanced Hover)

- **触发器**：用户鼠标光标悬停在任意符合组件命名规则的标签上（如 `<ui-button>`, `<MyComponent>`）。
- **触发时机**：悬停持续一段时间（如500ms）后立即显示。
- **提示内容**：
  - **基础信息**：组件名称（如 `Button`）、来自组件库的简短描述（可从MD文件元数据或第一行获取）。
  - **可操作链接**：显示一个文本为 **“查看完整文档”** 的蓝色超链接。
  - **快速预览**：（可选）如果可以解析，显示前1-2个最重要Props的类型。

### 2.2 核心功能：侧边栏文档视图 (Documentation Sidebar)

- **打开方式**：点击悬停提示框中的 **“查看完整文档”** 链接。
- **视图位置**：在VSCode侧边栏区域（通常与文件管理器、搜索等同一区域）创建一个新的视图容器（View Container），或者作为一个独立的侧边栏面板（Webview Panel）。
- **内容呈现**：
  - 完整渲染该组件对应的Markdown（`.md`）文档。
  - **内容聚焦**：插件应能智能地突出显示文档中的 **“使用示例”** 和 **“API”** 部分。
  - **样式**：侧边栏内的文档样式应清晰可读，与VSCode暗色/亮色主题适配。
- **交互**：
  - 侧边栏应支持内部锚点跳转（如点击API目录中的一项，滚动到对应API详情）。
  - 侧边栏内应有一个“×”或“关闭”按钮，用于隐藏该面板。

### 2.3 配置功能

- **组件库文档路径映射**：用户必须能够配置其组件库文档的根路径。
  - **配置项示例**：`componentDoc.basePath`
  - **支持格式**：
    - **本地路径**：`file:///Users/me/projects/ui-library/docs`
    - **远程URL**：`https://your-component-library.com/docs` (需支持CORS)
- **组件名与文档文件的映射规则**：用户必须能够配置组件名如何映射到具体的MD文件。
  - **配置项示例**：`componentDoc.mappingRule`
  - **示例规则**：
    - `{ "Button": "src/Button/Button.md" }` (精确映射)
    - `{ "/(.*)/": "src/$1/$1.md" }` (正则表达式，`MyButton` -> `src/MyButton/MyButton.md`)

## 3. 用户界面 (UI) 与用户体验 (UX) 设计

### 3.1 悬停提示框设计

text

```
+-----------------------------------------------+
|            **Button**                         |
|                                               |
|   基础按钮组件，用于开始一个操作。            |
|                                               |
|   `size`: 'small' | 'medium' | 'large'        |
|                                               |
|   [查看完整文档]                              |
+-----------------------------------------------+
```

- **样式**：使用VSCode内置的Markdown渲染风格，与主题一致。
- **链接**：`[查看完整文档]` 文字显示为蓝色，鼠标悬停时变为手型且有下划线。

### 3.2 侧边栏设计

侧边栏应分为两个主要部分：

1. **标题栏**：显示当前查看的组件名称（如 `Button Documentation`）和一个关闭按钮。
2. **内容区**：一个完美渲染的Markdown视图，支持代码高亮、表格、列表等所有标准Markdown特性。

## 4. 技术方案与架构 (Technical Specification)

### 4.1 技术栈

- **语言**：TypeScript
- **框架**：VSCode Extension API
- **关键依赖**：
  - `markdown-it`：用于将MD文件内容转换为HTML。
  - `axios` or `node-fetch`：用于获取远程MD文档（如果配置了远程URL）。

### 4.2 核心实现流程

1. **激活 (Activation)**：
   - 插件在VSCode启动时被激活。
   - 监听VSCode的`onDidChangeConfiguration`事件，读取用户配置。
2. **注册悬停提供器 (Register Hover Provider)**：
   - 使用 `vscode.languages.registerHoverProvider` 为 `[javascript, javascriptreact, typescript, typescriptreact, vue]` 等语言注册悬停提示。
   - 在提供器的 `provideHover` 方法中实现核心逻辑。
3. **解析组件名 (Parse Component Name)**：
   - 在 `provideHover` 中，通过分析光标位置的文档（`document.getText()`）和光标位置（`position`），使用正则表达式尝试匹配出最近的组件标签名。
4. **查找文档 (Find Documentation)**：
   - 根据用户配置的映射规则，将解析出的组件名转换为一个具体的MD文件路径（本地或远程URL）。
5. **构建悬停内容 (Construct Hover Content)**：
   - 读取该MD文件的**前几行**（或解析Front Matter元数据）来获取简短描述。
   - 使用 `new vscode.MarkdownString` 构建提示内容，并嵌入可点击的链接。
   - **关键**：该链接需要是一个执行命令的链接，格式为 `command:extension.showComponentDoc?["${componentName}"]`。
6. **注册命令并打开侧边栏 (Register Command & Open Sidebar)**：
   - 使用 `vscode.commands.registerCommand` 注册一个名为 `extension.showComponentDoc` 的命令。
   - 当用户点击链接时，触发此命令。命令的处理函数会：
     - 根据传入的组件名，再次根据映射规则找到完整的MD文件路径。
     - 使用 `vscode.window.createWebviewPanel` 创建一个新的Webview面板。
     - 将读取或获取到的MD文件内容，用 `markdown-it` 转换为HTML。
     - 将HTML内容设置到Webview中，并注入一些基础CSS以确保样式兼容VSCode主题。

### 4.3 数据结构

- **插件配置 (Extension Configuration)**：

  json

  ​

  ```
  {
    "componentDoc.basePath": "file:///projects/ui-library/docs",
    "componentDoc.mappingRule": {
      "Button": "src/Button/Button.md",
      "Input": "src/Input/Input.md"
    }
  }
  ```

## 5. 异常处理与边界情况

- **文档未找到**：如果根据组件名找不到对应的MD文件，在悬停提示和点击后都应显示友好的错误信息，如“未找到 'MyComponent' 的文档”。
- **网络错误**：如果配置的是远程URL且请求失败，应提示“无法连接至文档服务器”。
- **缓存策略**：对于远程文档，可以考虑实现一个简单的内存缓存，以避免频繁的网络请求，同时提供配置项让用户设置缓存过期时间。

## 

1. 支持在侧边栏内直接搜索组件文档。
2. 支持从 `package.json` 的依赖项中自动探测流行的第三方组件库（如 Ant Design, Material-UI）并为其提供文档链接。
3. 集成项目代码静态分析，在文档侧边栏中不仅显示官方文档，还显示“使用示例”。
4. **组件自动导入 (Auto Import)**
   - **功能**：当用户输入一个未导入的组件名后，悬停提示或轻量级提示（Lightbulb）会建议自动导入该组件。用户确认后，插件自动在文件顶部添加正确的 import 语句。
   - **价值**：省去手动查找和编写导入语句的麻烦，极大提升编码流畅度。
   - **实现**：利用 VSCode 的 `CodeActionProvider` 和 `CompletionItemProvider` API。
5. **代码片段生成 (Snippet Generation)**
   - **功能**：在侧边栏文档中，每个示例代码旁都有一个“插入代码”的按钮。点击后，直接将示例代码插入到编辑器的光标处。
   - **价值**：快速创建组件模板，避免抄写错误，保证使用方式的最佳实践。
   - **实现**：使用 VSCode 的 `SnippetString` 和编辑器 API 进行内容插入。
   - **Props 自动补全与文档提示 (IntelliSense for Props)**
     - **功能**：在编写组件的 Props 时，不仅提供标准的代码补全列表，还在每个补全项旁边显示该 Prop 的简短描述和类型（来自该组件的文档说明）。
     - **价值**：无需查阅文档即可正确填写组件属性，降低出错概率。
     - **实现**：增强 `CompletionItemProvider`，为返回的 `CompletionItem` 添加 `detail` 和 `documentation` 属性。

**思考：组件项目与实际项目如何连接起来？通过手动导入组件说明文档或者使用yalc的link方案？**