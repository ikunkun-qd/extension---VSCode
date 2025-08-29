# Card 卡片

卡片容器组件，用于展示相关信息的集合。

## 使用示例

### 基础用法

```jsx
import { Card } from '@/components';

function App() {
  return (
    <Card title="基础卡片">
      <p>这是卡片的内容区域</p>
    </Card>
  );
}
```

### 带操作按钮

```jsx
<Card 
  title="用户信息" 
  extra={<Button type="primary">编辑</Button>}
>
  <p>姓名：张三</p>
  <p>邮箱：zhangsan@example.com</p>
</Card>
```

### 无边框卡片

```jsx
<Card bordered={false} title="无边框卡片">
  <p>这是一个无边框的卡片</p>
</Card>
```

### 加载状态

```jsx
<Card loading title="加载中">
  <p>内容加载中...</p>
</Card>
```

## Props

| 属性名 | 类型 | 描述 | 必填 | 默认值 |
|--------|------|------|------|--------|
| title | `string \| ReactNode` | 卡片标题 | 否 | - |
| extra | `ReactNode` | 卡片右上角的操作区域 | 否 | - |
| bordered | `boolean` | 是否有边框 | 否 | `true` |
| loading | `boolean` | 当卡片内容还在加载中时，可以用 loading 展示一个占位 | 否 | `false` |
| size | `'default' \| 'small'` | 卡片的尺寸 | 否 | `'default'` |
| hoverable | `boolean` | 鼠标移过时可浮起 | 否 | `false` |
| children | `ReactNode` | 卡片内容 | 否 | - |
| className | `string` | 自定义样式类名 | 否 | - |
| style | `CSSProperties` | 自定义样式 | 否 | - |

## 样式变量

```css
--card-background: #ffffff;
--card-border-color: #f0f0f0;
--card-border-radius: 8px;
--card-padding: 24px;
--card-title-font-size: 16px;
--card-title-font-weight: 500;
--card-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
--card-hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
```

## 注意事项

- 卡片应该包含相关的信息，避免内容过于分散
- 标题应该简洁明了，能够概括卡片内容
- 操作按钮应该与卡片内容相关
- 避免在一个页面中使用过多的卡片
