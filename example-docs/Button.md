# Button 按钮

基础按钮组件，用于触发操作。

## 使用示例

### 基础用法

```jsx
import { Button } from '@/components';

function App() {
  return (
    <div>
      <Button>默认按钮</Button>
      <Button type="primary">主要按钮</Button>
      <Button type="secondary">次要按钮</Button>
    </div>
  );
}
```

### 不同尺寸

```jsx
<Button size="small">小按钮</Button>
<Button size="medium">中等按钮</Button>
<Button size="large">大按钮</Button>
```

### 禁用状态

```jsx
<Button disabled>禁用按钮</Button>
<Button type="primary" disabled>禁用主要按钮</Button>
```

## Props

| 属性名 | 类型 | 描述 | 必填 | 默认值 |
|--------|------|------|------|--------|
| type | `'default' \| 'primary' \| 'secondary' \| 'danger'` | 按钮类型 | 否 | `'default'` |
| size | `'small' \| 'medium' \| 'large'` | 按钮尺寸 | 否 | `'medium'` |
| disabled | `boolean` | 是否禁用 | 否 | `false` |
| loading | `boolean` | 是否显示加载状态 | 否 | `false` |
| onClick | `(event: MouseEvent) => void` | 点击事件处理函数 | 否 | - |
| children | `ReactNode` | 按钮内容 | 是 | - |

## 样式变量

```css
--button-primary-bg: #1890ff;
--button-primary-hover-bg: #40a9ff;
--button-border-radius: 6px;
--button-padding: 8px 16px;
```

## 注意事项

- 按钮文字应简洁明了，避免过长
- 主要按钮在一个页面中不宜过多
- 危险操作建议使用 `danger` 类型
