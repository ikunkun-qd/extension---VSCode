import React, { useState } from 'react';
import { Button, Input, Card } from '@/components';

/**
 * 测试组件 - 用于测试插件的悬停提示功能
 * 
 * 使用方法：
 * 1. 将鼠标悬停在组件名称上（如 Button、Input、Card）
 * 2. 查看悬停提示框
 * 3. 点击"查看完整文档"链接
 */
function TestComponent() {
  const [inputValue, setInputValue] = useState('');
  const [count, setCount] = useState(0);

  const handleButtonClick = () => {
    setCount(count + 1);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="test-container">
      <h1>组件测试页面</h1>
      
      {/* 测试 Button 组件 */}
      <section>
        <h2>Button 组件测试</h2>
        <div className="button-group">
          <Button type="primary" onClick={handleButtonClick}>
            主要按钮 (点击次数: {count})
          </Button>
          <Button type="secondary">
            次要按钮
          </Button>
          <Button disabled>
            禁用按钮
          </Button>
        </div>
      </section>

      {/* 测试 Input 组件 */}
      <section>
        <h2>Input 组件测试</h2>
        <div className="input-group">
          <Input
            label="用户名"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="请输入用户名"
          />
          <Input
            type="password"
            label="密码"
            placeholder="请输入密码"
          />
          <Input
            type="email"
            label="邮箱"
            placeholder="请输入邮箱地址"
          />
        </div>
      </section>

      {/* 测试 Card 组件 */}
      <section>
        <h2>Card 组件测试</h2>
        <Card title="用户信息">
          <p>用户名: {inputValue || '未输入'}</p>
          <p>按钮点击次数: {count}</p>
          <Button type="primary" size="small">
            编辑
          </Button>
        </Card>
      </section>

      {/* 测试自闭合标签 */}
      <section>
        <h2>自闭合标签测试</h2>
        <Input placeholder="自闭合输入框" />
        <Button type="primary" />
      </section>
    </div>
  );
}

export default TestComponent;
