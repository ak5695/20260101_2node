# 登录策略设计文档

## 🎯 推荐策略：渐进式参与

### 核心理念
让用户先体验产品价值，在他们产生依赖后再要求登录，这样转化率更高。

---

## 📊 行业数据参考

- **立即要求登录**: 转化率 ~5-10%
- **体验后登录**: 转化率 ~20-30%
- **价值驱动登录**: 转化率 ~40-50%

---

## 🚀 实施方案

### 阶段 1: 访客体验（Guest Experience）

**允许的功能：**
- ✅ 创建聊天会话（最多 3 个）
- ✅ 发送消息（最多 10 条）
- ✅ 创建工作空间（最多 2 个）
- ✅ 创建节点（最多 20 个）
- ✅ 基本的画布操作
- ✅ 查看历史记录（当前会话）

**限制：**
- ⏰ 数据保留 24 小时
- 🚫 无法导出
- 🚫 无法分享
- 🚫 无法使用高级 AI 模型

---

### 阶段 2: 软性提示（Soft Prompts）

**触发时机：**

1. **使用频率触发**
   ```
   第 5 条消息后：
   "💡 登录以保存您的对话历史"
   
   第 10 条消息后：
   "🔒 登录以解锁无限对话"
   ```

2. **功能触发**
   ```
   创建第 2 个工作空间时：
   "✨ 登录以创建无限工作空间"
   
   尝试导出时：
   "📥 登录以导出您的画布"
   ```

3. **时间触发**
   ```
   使用 30 分钟后：
   "💾 登录以永久保存您的工作"
   
   24 小时后：
   "⚠️ 您的数据将在 1 小时后删除，立即登录保存"
   ```

**提示样式：**
- 非侵入式横幅
- 可关闭
- 带有明确的价值主张
- 一键登录按钮

---

### 阶段 3: 强制登录（Hard Gates）

**必须登录的功能：**

1. **数据持久化**
   - 超过 24 小时的数据保存
   - 跨设备同步

2. **高级功能**
   - GPT-4 或更高级模型
   - 文件上传
   - 图片生成
   - 代码执行

3. **协作功能**
   - 分享工作空间
   - 团队协作
   - 评论和反馈

4. **导出功能**
   - 导出对话
   - 导出画布
   - PDF 生成

5. **配额限制**
   - 超过免费额度
   - API 调用限制

---

## 💬 提示文案示例

### 1. 软性提示（可关闭）

```tsx
// 消息数量提示
<Banner type="info" dismissible>
  <Sparkles /> 您已发送 5 条消息！
  <Link>登录</Link>以解锁无限对话和永久保存。
</Banner>

// 工作空间提示
<Banner type="info" dismissible>
  <Workspace /> 喜欢这个工作空间？
  <Link>登录</Link>以创建更多并永久保存。
</Banner>

// 时间提示
<Banner type="warning" dismissible>
  <Clock /> 您的数据将在 1 小时后删除。
  <Link>立即登录</Link>以永久保存。
</Banner>
```

### 2. 功能门槛（模态框）

```tsx
// 导出功能
<Modal>
  <Icon>📥</Icon>
  <Title>导出画布</Title>
  <Description>
    登录以导出您的画布为 PNG 或 SVG 格式
  </Description>
  <Actions>
    <Button primary>使用 GitHub 登录</Button>
    <Button primary>使用 Google 登录</Button>
    <Button secondary>使用邮箱登录</Button>
  </Actions>
</Modal>

// 高级模型
<Modal>
  <Icon>✨</Icon>
  <Title>升级到 GPT-4</Title>
  <Description>
    登录以使用更强大的 AI 模型，获得更准确的回答
  </Description>
  <Actions>
    <Button primary>立即登录</Button>
  </Actions>
</Modal>
```

### 3. 价值主张（引导页）

```tsx
// 首次访问
<Welcome>
  <Title>欢迎使用 AI 思维画布</Title>
  <Features>
    ✅ 无限对话
    ✅ 永久保存
    ✅ 多设备同步
    ✅ 高级 AI 模型
    ✅ 导出分享
  </Features>
  <Actions>
    <Button primary>免费开始</Button>
    <Link>以访客身份体验</Link>
  </Actions>
</Welcome>
```

---

## 🎨 UI/UX 最佳实践

### 1. 非侵入式提示
```tsx
// 顶部横幅（可关闭）
<TopBanner>
  💡 登录以保存您的工作 
  <Button size="sm">立即登录</Button>
  <CloseButton />
</TopBanner>

// 侧边栏提示
<SidebarBanner>
  <Icon>🔒</Icon>
  <Text>登录解锁更多功能</Text>
  <Button>登录</Button>
</SidebarBanner>
```

### 2. 上下文相关
```tsx
// 在相关操作旁显示
<ExportButton disabled>
  导出画布
  <Tooltip>登录以使用此功能</Tooltip>
</ExportButton>

// 功能预览
<FeatureCard locked>
  <Badge>需要登录</Badge>
  <Title>GPT-4 模型</Title>
  <Description>更强大的 AI 能力</Description>
  <Button>登录解锁</Button>
</FeatureCard>
```

### 3. 进度指示
```tsx
// 显示使用进度
<UsageIndicator>
  <Progress value={5} max={10} />
  <Text>已使用 5/10 条免费消息</Text>
  <Link>登录获取无限额度</Link>
</UsageIndicator>
```

---

## 📈 转化优化技巧

### 1. 时机选择
- ✅ 用户完成一个有价值的操作后
- ✅ 用户表现出高参与度时
- ❌ 用户刚进入时立即弹窗
- ❌ 用户正在专注工作时打断

### 2. 价值主张
- ✅ 强调用户能获得什么
- ✅ 使用具体的数字和功能
- ❌ 只说"需要登录"
- ❌ 使用模糊的描述

### 3. 摩擦最小化
- ✅ 一键社交登录
- ✅ 记住用户选择
- ✅ 登录后自动继续之前的操作
- ❌ 复杂的注册流程
- ❌ 登录后需要重新开始

---

## 🔧 技术实现

### 1. 访客会话管理

```typescript
// lib/guest-session.ts
export class GuestSession {
  private messageCount = 0;
  private workspaceCount = 0;
  private createdAt = Date.now();
  
  shouldPromptLogin(): boolean {
    // 消息数量检查
    if (this.messageCount >= 5) return true;
    
    // 工作空间数量检查
    if (this.workspaceCount >= 2) return true;
    
    // 时间检查（24小时）
    if (Date.now() - this.createdAt > 24 * 60 * 60 * 1000) return true;
    
    return false;
  }
  
  shouldForceLogin(): boolean {
    // 强制登录条件
    if (this.messageCount >= 10) return true;
    if (this.workspaceCount >= 3) return true;
    
    return false;
  }
}
```

### 2. 登录提示组件

```typescript
// components/login-prompt.tsx
export function LoginPrompt({ trigger, onDismiss }: Props) {
  const messages = {
    messages: "登录以解锁无限对话",
    workspace: "登录以创建更多工作空间",
    export: "登录以导出您的画布",
    time: "登录以永久保存您的数据",
  };
  
  return (
    <Banner>
      <Icon />
      <Text>{messages[trigger]}</Text>
      <Button onClick={() => signIn()}>立即登录</Button>
      <CloseButton onClick={onDismiss} />
    </Banner>
  );
}
```

### 3. 功能门控

```typescript
// hooks/use-feature-gate.ts
export function useFeatureGate(feature: string) {
  const { data: session } = useSession();
  const guestSession = useGuestSession();
  
  const canUse = useMemo(() => {
    if (session) return true;
    
    switch (feature) {
      case 'export':
      case 'share':
      case 'advanced-model':
        return false;
      case 'chat':
        return guestSession.messageCount < 10;
      case 'workspace':
        return guestSession.workspaceCount < 3;
      default:
        return true;
    }
  }, [session, guestSession, feature]);
  
  return { canUse, promptLogin: !canUse };
}
```

---

## 📊 监控指标

### 关键指标
1. **访客转化率**: 访客 → 注册用户
2. **功能使用率**: 各功能的访客使用情况
3. **提示有效性**: 提示显示 → 登录转化
4. **流失点**: 用户在哪里离开

### 优化方向
- A/B 测试不同的提示文案
- 调整触发时机和频率
- 优化登录流程
- 改进价值主张

---

## 🎯 推荐配置

### 保守策略（更多访客体验）
```
- 消息限制: 20 条
- 工作空间: 5 个
- 节点数: 50 个
- 数据保留: 7 天
```

### 平衡策略（推荐）⭐
```
- 消息限制: 10 条
- 工作空间: 3 个
- 节点数: 30 个
- 数据保留: 24 小时
```

### 激进策略（快速转化）
```
- 消息限制: 5 条
- 工作空间: 1 个
- 节点数: 10 个
- 数据保留: 1 小时
```

---

## 🚀 实施优先级

### Phase 1: 基础（立即实施）
1. ✅ 访客模式已实现
2. 添加使用计数器
3. 实现软性提示横幅

### Phase 2: 优化（1-2周）
1. 添加功能门控
2. 实现登录提示模态框
3. 优化登录流程

### Phase 3: 高级（1个月）
1. A/B 测试不同策略
2. 数据分析和优化
3. 个性化提示

---

## 💡 成功案例学习

### ChatGPT 策略
- 允许访客使用
- 3 小时后要求登录
- 登录后解锁历史记录
- GPT-4 需要付费订阅

### Notion 策略
- 允许创建和编辑
- 保存时要求登录
- 协作功能需要账号
- 免费版有页面限制

### Figma 策略
- 允许查看和编辑
- 保存需要登录
- 协作需要账号
- 免费版有项目限制

---

**建议**: 从平衡策略开始，根据实际数据调整。重点是让用户先体验到产品价值，再自然地引导登录。
