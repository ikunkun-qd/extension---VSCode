# 组件智能文档提示 - 详细使用指南

## 📖 目录

1. [快速开始](#快速开始)
2. [配置详解](#配置详解)
3. [使用场景](#使用场景)
4. [最佳实践](#最佳实践)
5. [常见问题](#常见问题)
6. [开发者指南](#开发者指南)

## 🚀 快速开始

### 第一步：安装扩展

1. 下载 `component-doc-helper-x.x.x.vsix` 文件
2. 在 VSCode 中按 `Ctrl+Shift+P`
3. 输入 "Extensions: Install from VSIX"
4. 选择下载的文件并安装

### 第二步：基础配置

1. **打开配置面板**
   - 点击左侧活动栏的"组件文档"图标 📖
   - 或使用命令面板：`Ctrl+Shift+P` → "组件文档: 切换设置面板"

2. **选择预设模板**
   - 点击 "OurYun" 模板（推荐）
   - 系统会自动填充配置

3. **设置文档路径**
   - 点击文件夹图标 📂
   - 选择您的组件文档目录

4. **保存配置**
   - 点击 "💾 保存" 按钮

### 第三步：测试功能

1. **运行配置测试**
   ```
   Ctrl+Shift+P → componentDoc.testConfig
   ```

2. **测试悬浮提示**
   - 打开包含组件的文件
   - 将鼠标悬浮在组件名上
   - 查看悬浮提示效果

## ⚙️ 配置详解

### 配置文件位置

扩展会按以下优先级读取配置：
1. 项目根目录的 `.vscode/settings.json`
2. 用户全局设置
3. 工作区设置

### 完整配置示例

```json
{
  "componentDoc.basePath": "D:/Front_end/前端项目/shixi/ouryun-design/docs/zh-CN/components/ouryun-plus",
  "componentDoc.mappingRule": {
    // === 常用组件 ===
    "Button": "常用组件/button.md",
    "Input": "常用组件/input.md",
    "Table": "常用组件/table.md",
    "Form": "常用组件/form.md",
    "Modal": "常用组件/modal.md",
    "Select": "常用组件/select.md",
    "DatePicker": "常用组件/datePicker.md",
    
    // === 业务组件 ===
    "SearchTable": "业务组件/searchTable.md",
    "ou-search-table": "业务组件/searchTable.md",
    "PageSelect": "业务组件/pageSelect.md",
    "ou-page-select": "业务组件/pageSelect.md",
    "JsonTree": "业务组件/jsonTree.md",
    "DragUpload": "业务组件/dragUpload.md",
    
    // === 正则表达式规则 ===
    "/(.*)Table$/": "业务组件/$1Table.md",
    "/(.*)Upload$/": "业务组件/$1Upload.md",
    "/^ou-(.*)$/": "常用组件/$1.md",
    "/(.*)/": "$1.md"
  },
  "componentDoc.cacheTimeout": 300000
}
```

### 映射规则优先级

1. **精确匹配** (最高优先级)
   ```json
   "Button": "常用组件/button.md"
   ```

2. **正则表达式匹配** (按定义顺序)
   ```json
   "/(.*)Table$/": "业务组件/$1Table.md"
   ```

3. **通用规则** (最低优先级)
   ```json
   "/(.*)/": "$1.md"
   ```

## 🎯 使用场景

### 场景一：React 项目

```jsx
import React from 'react';
import { Button, Input, Table } from 'antd';

function MyComponent() {
  return (
    <div>
      {/* 悬浮在这些组件名上查看文档 */}
      <Button type="primary">按钮</Button>
      <Input placeholder="输入框" />
      <Table dataSource={[]} columns={[]} />
    </div>
  );
}
```

### 场景二：Vue 项目

```vue
<template>
  <div>
    <!-- 悬浮在这些组件名上查看文档 -->
    <el-button type="primary">按钮</el-button>
    <el-input placeholder="输入框"></el-input>
    <el-table :data="[]" :columns="[]"></el-table>
  </div>
</template>
```

### 场景三：自定义组件

```jsx
import { SearchTable, PageSelect } from '@/components';

function BusinessPage() {
  return (
    <div>
      {/* 业务组件也支持悬浮提示 */}
      <SearchTable 
        data={tableData}
        columns={columns}
        onSearch={handleSearch}
      />
      <PageSelect 
        current={currentPage}
        total={total}
        onChange={handlePageChange}
      />
    </div>
  );
}
```

## 💡 最佳实践

### 1. 文档组织结构

推荐的文档目录结构：
```
docs/
├── 常用组件/
│   ├── button.md
│   ├── input.md
│   └── table.md
├── 业务组件/
│   ├── searchTable.md
│   ├── pageSelect.md
│   └── jsonTree.md
└── 布局组件/
    ├── header.md
    └── sidebar.md
```

### 2. 文档格式规范

```markdown
# 组件名称

组件的简短描述，这部分会显示在悬浮提示中。

## 使用示例

\`\`\`jsx
<Button type="primary">示例</Button>
\`\`\`

## Props

| 属性名 | 类型 | 描述 | 必填 | 默认值 |
|--------|------|------|------|--------|
| type | string | 按钮类型 | 否 | 'default' |
| size | string | 按钮尺寸 | 否 | 'medium' |
```

### 3. 配置管理技巧

#### 多环境配置
```json
// 开发环境
{
  "componentDoc.basePath": "./docs",
  "componentDoc.cacheTimeout": 60000
}

// 生产环境
{
  "componentDoc.basePath": "https://docs.company.com",
  "componentDoc.cacheTimeout": 300000
}
```

#### 团队共享配置
将配置放在项目的 `.vscode/settings.json` 中，这样团队成员都能使用相同的配置。

### 4. 性能优化

- 合理设置缓存时间：开发时设短一些，生产时设长一些
- 使用本地文档比远程文档响应更快
- 避免过于复杂的正则表达式

## ❓ 常见问题

### Q1: 悬浮提示不显示怎么办？

**A1: 按以下步骤排查**

1. **检查文件类型**
   - 确保文件是 `.js`, `.jsx`, `.ts`, `.tsx`, `.vue` 格式
   - 查看状态栏确认语言模式

2. **检查组件名格式**
   ```jsx
   // ✅ 支持的格式
   <Button>按钮</Button>
   <ou-search-table />
   import { Button } from 'library';
   
   // ❌ 不支持的格式
   <button>普通按钮</button>  // 小写开头
   ```

3. **查看调试信息**
   - 按 `F12` 打开开发者工具
   - 查看 Console 中的日志信息
   - 运行测试命令：`Ctrl+Shift+P` → `componentDoc.testConfig`

### Q2: 配置不生效怎么办？

**A2: 检查配置文件**

1. **确认配置文件位置**
   ```
   项目根目录/.vscode/settings.json
   ```

2. **检查 JSON 格式**
   - 确保没有语法错误
   - 使用 JSON 验证工具检查

3. **重启 VSCode**
   - 修改配置后重启 VSCode
   - 或重新加载窗口：`Ctrl+Shift+P` → "Developer: Reload Window"

### Q3: 中文路径显示乱码？

**A3: 编码问题解决**

1. **确保文件编码为 UTF-8**
   - 在 VSCode 右下角查看编码
   - 如果不是 UTF-8，点击切换

2. **重新保存配置文件**
   - 打开 `.vscode/settings.json`
   - 按 `Ctrl+S` 重新保存

### Q4: 远程文档访问失败？

**A4: 网络和权限检查**

1. **检查网络连接**
   - 确保能访问远程 URL
   - 检查防火墙设置

2. **检查文档格式**
   - 确保远程文档是纯文本或 Markdown 格式
   - 避免需要认证的 URL

## 🛠️ 开发者指南

### 扩展命令

| 命令 | 功能 | 快捷键 |
|------|------|--------|
| `componentDoc.showDocumentation` | 显示组件文档 | - |
| `componentDoc.openSettings` | 打开配置界面 | - |
| `componentDoc.toggleSettingsPanel` | 切换设置面板 | - |
| `componentDoc.testConfig` | 测试配置 | - |
| `componentDoc.forceReload` | 强制重新加载 | - |

### 调试技巧

1. **启用详细日志**
   ```javascript
   // 在开发者控制台中查看详细日志
   console.log('[HoverProvider] 悬停请求开始');
   ```

2. **测试正则表达式**
   ```javascript
   // 在控制台测试正则匹配
   const pattern = /(.*)Table$/;
   const result = 'SearchTable'.match(pattern);
   console.log(result); // ['SearchTable', 'Search']
   ```

3. **验证文档路径**
   ```bash
   # 检查文档文件是否存在
   ls "D:/path/to/docs/业务组件/searchTable.md"
   ```

### 扩展开发

如果您想修改或扩展功能：

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd component-doc-helper
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **开发调试**
   ```bash
   # 编译 TypeScript
   npm run compile
   
   # 监听文件变化
   npm run watch
   ```

4. **打包发布**
   ```bash
   # 打包扩展
   npm run package
   
   # 安装测试
   code --install-extension component-doc-helper-x.x.x.vsix
   ```

---

**希望这份指南能帮助您更好地使用组件智能文档提示扩展！** 🎉

如有其他问题，请查看 [README.md](README.md) 或提交 Issue。
