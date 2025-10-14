# 🚂 Railway 快速部署指南

## ⚠️ 当前情况

你没有 `lys164/live-story` 仓库的push权限，所以我们需要：
1. Fork仓库到你自己的GitHub账号，或
2. 创建新的GitHub仓库

---

## 🎯 推荐方案：创建新仓库

### 步骤1：创建GitHub仓库

1. 访问 https://github.com/new
2. 仓库名称：`aiko-live-story`
3. 设为 **Public** 或 **Private**
4. **不要**初始化README、gitignore
5. 点击 "Create repository"

---

### 步骤2：推送代码到新仓库

```bash
cd /Users/Uta/live-story-use

# 移除原来的远程仓库
git remote remove origin

# 添加你的新仓库（替换YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/aiko-live-story.git

# 推送代码
git push -u origin use
```

---

### 步骤3：Railway部署（网页方式 - 最简单）

#### 3.1 访问Railway
```
https://railway.app/
```

#### 3.2 使用GitHub登录
- 点击 "Login with GitHub"
- 授权Railway访问你的GitHub

#### 3.3 创建新项目
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择 `aiko-live-story` 仓库
4. 选择 `use` 分支
5. 点击 "Deploy Now"

#### 3.4 配置环境变量
部署开始后，立即配置环境变量：

1. 点击项目
2. 点击 "Variables" 标签
3. 点击 "Raw Editor"
4. 粘贴以下内容：

```env
GEMINI_API_KEY=AIzaSyBxiv4MtD-rxrXP6gAWJFmlX0Wxe-OVNRc
SEEDREAM_API_KEY=c1eecedc-50a6-4f75-8179-59c721b07a68
SEEDREAM_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/images/generations
OPENROUTER_API_KEY=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
OPENROUTER_REFERER=${{RAILWAY_PUBLIC_DOMAIN}}
OPENROUTER_TITLE=Aiko Mobile Railway
```

5. 点击 "Save"
6. Railway会自动重新部署

---

### 步骤4：生成公开域名

1. 进入项目 "Settings"
2. 找到 "Networking" 部分
3. 点击 "Generate Domain"
4. 记下生成的域名（类似：`aiko-live-story-production.up.railway.app`）

---

### 步骤5：测试部署

```bash
# 替换为你的Railway域名
curl https://你的域名.up.railway.app/
```

应该看到类似：
```
Cannot GET /
```
这是正常的，因为没有根路由。

测试API：
```bash
curl https://你的域名.up.railway.app/api/gemini \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"input":"测试"}'
```

---

## 🎉 部署完成！

你的后端API现在运行在：
```
https://你的域名.up.railway.app
```

---

## 📝 接下来要做的

### 更新前端API地址

在本地前端代码中，找到API配置并更新为Railway域名：

#### 需要更新的文件：
```
/Users/Uta/live-story-use/assets/app.js
/Users/Uta/live-story-use/assets/firebase.js  
/Users/Uta/live-story-use/pages/script/script.js
/Users/Uta/live-story-use/pages/live/live.js
/Users/Uta/live-story-use/pages/lobby/lobby.js
```

#### 查找并替换：
```javascript
// 旧的（本地）
const API_BASE = 'http://localhost:5176';

// 新的（Railway）
const API_BASE = 'https://你的railway域名.up.railway.app';
```

---

## 🌐 方案B：部署前端到Vercel（可选）

### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

### 2. 登录
```bash
vercel login
```

### 3. 部署
```bash
cd /Users/Uta/live-story-use
vercel
```

按照提示操作：
- Project name: `aiko-live-story`
- Build Command: 留空
- Output Directory: `./`

### 4. 获取域名
部署成功后会得到一个Vercel域名，例如：
```
https://aiko-live-story.vercel.app
```

---

## 📊 检查部署状态

### Railway Dashboard
```
https://railway.app/dashboard
```

### 查看日志
在Railway项目页面：
1. 点击 "Deployments"
2. 点击最新的部署
3. 查看 "Deploy Logs"

---

## 🐛 常见问题

### Q: 推送代码失败
**A**: 确认你使用的是自己的GitHub仓库，不是fork的

### Q: Railway构建失败
**A**: 
1. 检查 `railway.json` 配置
2. 确认 `server/package.json` 有 `start` 脚本
3. 查看Railway的构建日志

### Q: API返回500错误
**A**:
1. 检查环境变量是否配置正确
2. 查看Railway的运行日志
3. 确认API keys有效

---

## 🔄 更新部署

每次修改代码后：

```bash
cd /Users/Uta/live-story-use
git add .
git commit -m "更新描述"
git push origin use
```

Railway会自动重新部署！

---

## 💡 完整命令参考

```bash
# 1. 创建新仓库后推送
cd /Users/Uta/live-story-use
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/aiko-live-story.git
git push -u origin use

# 2. 后续更新
git add .
git commit -m "更新内容"
git push origin use

# 3. 测试部署
curl https://你的域名.up.railway.app/

# 4. 查看Railway日志（需要安装CLI）
brew install railway
railway login
railway logs
```

---

## 🎯 总结

**必需步骤：**
1. ✅ 创建自己的GitHub仓库
2. ✅ 推送代码到仓库
3. ✅ Railway连接仓库并部署
4. ✅ 配置环境变量
5. ✅ 生成域名

**可选步骤：**
- 部署前端到Vercel
- 配置自定义域名
- 设置自动部署

---

准备好了吗？从创建GitHub仓库开始吧！🚀

