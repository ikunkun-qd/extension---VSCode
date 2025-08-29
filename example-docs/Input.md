# Input 输入框

基础输入框组件，用于接收用户输入。

## 使用示例

### 基础用法

```jsx
import { Input } from '@/components';

function App() {
  const [value, setValue] = useState('');
  
  return (
    <Input 
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="请输入内容"
    />
  );
}
```

### 不同类型

```jsx
<Input type="text" placeholder="文本输入" />
<Input type="password" placeholder="密码输入" />
<Input type="email" placeholder="邮箱输入" />
<Input type="number" placeholder="数字输入" />
```

### 带标签

```jsx
<Input label="用户名" placeholder="请输入用户名" />
<Input label="密码" type="password" placeholder="请输入密码" />
```

### 禁用和只读

```jsx
<Input disabled placeholder="禁用状态" />
<Input readOnly value="只读内容" />
```

## Props

| 属性名 | 类型 | 描述 | 必填 | 默认值 |
|--------|------|------|------|--------|
| type | `'text' \| 'password' \| 'email' \| 'number'` | 输入框类型 | 否 | `'text'` |
| value | `string` | 输入框的值 | 否 | - |
| defaultValue | `string` | 默认值 | 否 | - |
| placeholder | `string` | 占位符文本 | 否 | - |
| label | `string` | 标签文本 | 否 | - |
| disabled | `boolean` | 是否禁用 | 否 | `false` |
| readOnly | `boolean` | 是否只读 | 否 | `false` |
| maxLength | `number` | 最大输入长度 | 否 | - |
| onChange | `(event: ChangeEvent<HTMLInputElement>) => void` | 值变化回调 | 否 | - |
| onFocus | `(event: FocusEvent<HTMLInputElement>) => void` | 获得焦点回调 | 否 | - |
| onBlur | `(event: FocusEvent<HTMLInputElement>) => void` | 失去焦点回调 | 否 | - |

## 样式变量

```css
--input-border-color: #d9d9d9;
--input-border-hover-color: #40a9ff;
--input-border-focus-color: #1890ff;
--input-border-radius: 6px;
--input-padding: 8px 12px;
--input-font-size: 14px;
```

## 注意事项

- 输入框应提供清晰的标签或占位符
- 对于必填字段，建议添加视觉提示
- 密码输入框应提供显示/隐藏密码的功能
