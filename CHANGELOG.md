# 更新日志

## [0.0.1] - 2024-08-29

### 新增功能
- ✨ 智能悬停提示功能
  - 支持在组件名称上悬停显示基本信息
  - 提供快速访问完整文档的链接
  - 支持JSX、TSX、Vue等多种文件类型

- 📖 侧边栏文档视图
  - 完整的Markdown文档渲染
  - 支持代码高亮、表格、列表等
  - 自动解析组件Props表格
  - 适配VSCode暗色/亮色主题

- ⚙️ 灵活的配置系统
  - 支持本地文档路径和远程URL
  - 可自定义组件名与文档文件的映射规则
  - 支持正则表达式映射
  - 可配置缓存策略

- 🛡️ 完善的错误处理
  - 友好的错误提示信息
  - 配置验证和警告
  - 网络错误处理
  - 调试信息输出

### 技术特性
- 使用TypeScript开发，提供完整的类型支持
- 模块化架构设计，易于维护和扩展
- 内存缓存机制，提升性能
- 支持多种文档源（本地文件、远程URL）

### 支持的文件类型
- JavaScript (.js)
- JavaScript React (.jsx)
- TypeScript (.ts)
- TypeScript React (.tsx)
- Vue (.vue)

### 配置选项
- `componentDoc.basePath`: 组件库文档的根路径
- `componentDoc.mappingRule`: 组件名与文档文件的映射规则
- `componentDoc.cacheTimeout`: 远程文档缓存过期时间

### 示例配置
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

### 已知限制
- 目前只支持单一文档源配置
- 组件名解析基于简单的正则表达式匹配
- 远程文档需要支持CORS

### 下一版本计划
- [ ] 支持多文档源配置
- [ ] 增强组件名解析算法
- [ ] 添加组件自动导入功能
- [ ] 支持代码片段插入
- [ ] 添加Props智能补全
- [ ] 支持更多前端框架
