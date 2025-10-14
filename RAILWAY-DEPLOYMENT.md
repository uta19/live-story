# 🚂 Railway 部署指南 - USE分支

## 📋 准备工作

### 1. 确认项目状态
- ✅ use分支已配置
- ✅ 后端代码在 `server/` 目录
- ✅ 环境变量已准备
- ✅ `railway.json` 已创建
- ✅ `package.json` 已更新

### 2. 需要的API Keys
```
GEMINI_API_KEY=你的Gemini密钥
SEEDREAM_API_KEY=你的Seedream密钥
SEEDREAM_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/images/generations
OPENROUTER_API_KEY=你的OpenRouter密钥
OPENROUTER_REFERER=你的Railway域名
OPENROUTER_TITLE=Aiko Mobile
PORT=5176
```

---

## 🚀 部署步骤

### 步骤1：推送代码到GitHub

```bash
cd /Users/Uta/live-story-use

# 确认在use分支
git branch

# 查看状态
git status

# 添加所有修改
git add .

# 提交修改
git commit -m "准备Railway部署：添加railway.json和更新配置"

# 推送到远程use分支
git push origin use
```

---

### 步骤2：创建Railway项目

#### 方式A：通过Railway CLI（推荐）

1. **安装Railway CLI**
```bash
# macOS
brew install railway

# 或使用npm
npm install -g @railway/cli
```

2. **登录Railway**
```bash
railway login
```

3. **初始化项目**
```bash
cd /Users/Uta/live-story-use
railway init
```

4. **选择或创建项目**
- 选择 "Create a new project"
- 输入项目名称：`aiko-live-story-use`

5. **链接到GitHub仓库**
```bash
railway link
```
选择你的GitHub仓库和use分支

---

#### 方式B：通过Railway网页（简单）

1. **访问Railway控制台**
```
https://railway.app/
```

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择 `lys164/live-story` 仓库
   - **重要**：选择 `use` 分支

3. **等待自动检测**
   - Railway会自动检测到 `railway.json`
   - 自动检测到 `server/package.json`

---

### 步骤3：配置环境变量

在Railway项目设置中添加以下环境变量：

#### 进入变量设置
1. 点击你的项目
2. 进入 "Variables" 标签
3. 点击 "Raw Editor"

#### 粘贴以下配置
```env
GEMINI_API_KEY=AIzaSyBxiv4MtD-rxrXP6gAWJFmlX0Wxe-OVNRc
SEEDREAM_API_KEY=c1eecedc-50a6-4f75-8179-59c721b07a68
SEEDREAM_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/images/generations
OPENROUTER_API_KEY=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
OPENROUTER_REFERER=${{RAILWAY_PUBLIC_DOMAIN}}
OPENROUTER_TITLE=Aiko Mobile Railway
PORT=${{PORT}}
```

⚠️ **注意**：
- `OPENROUTER_REFERER` 使用 Railway 的内置变量
- `PORT` 会自动分配

---

### 步骤4：部署

#### 使用CLI
```bash
cd /Users/Uta/live-story-use
railway up
```

#### 使用网页
- Railway 会自动开始部署
- 等待构建完成（约2-3分钟）

---

### 步骤5：获取部署URL

#### 使用CLI
```bash
railway domain
```

#### 使用网页
1. 进入项目的 "Settings" 标签
2. 点击 "Networking" 部分
3. 点击 "Generate Domain"
4. 复制生成的域名（类似：`aiko-live-story-use-production.up.railway.app`）

---

### 步骤6：更新前端配置（重要！）

部署成功后，需要更新前端代码中的API地址：

#### 6.1 更新 `assets/firebase.js`
找到API base URL的配置，改为Railway域名：
```javascript
const API_BASE = 'https://你的railway域名.up.railway.app';
```

#### 6.2 更新相关文件
需要更新这些文件中的API地址：
- `assets/app.js`
- `pages/script/script.js`
- `pages/live/live.js`
- `pages/lobby/lobby.js`

#### 6.3 重新推送
```bash
git add .
git commit -m "更新API地址为Railway域名"
git push origin use
```

---

## ✅ 验证部署

### 测试API端点

```bash
# 替换为你的Railway域名
curl https://你的域名.up.railway.app/api/health

# 测试CORS
curl -X OPTIONS https://你的域名.up.railway.app/api/generate-story \
  -H "Origin: http://localhost:9000" \
  -H "Access-Control-Request-Method: POST"
```

---

## 📊 监控部署

### 查看日志

#### 使用CLI
```bash
railway logs
```

#### 使用网页
1. 进入项目
2. 点击 "Deployments" 标签
3. 点击最新的部署
4. 查看 "Build Logs" 和 "Deploy Logs"

---

## 🔧 常见问题

### 1. 构建失败

**检查**：
```bash
# 本地测试构建
cd /Users/Uta/live-story-use/server
npm install
npm start
```

**解决方案**：
- 确认 `package.json` 在 `server/` 目录
- 确认 `railway.json` 配置正确
- 检查 Railway 日志查看错误信息

---

### 2. 启动失败

**常见原因**：
- 端口配置错误
- 环境变量缺失
- 依赖安装失败

**检查环境变量**：
```bash
railway variables
```

**查看详细日志**：
```bash
railway logs --recent
```

---

### 3. CORS错误

**症状**：前端无法调用API

**解决方案**：
检查 `server/index.js` 中的CORS配置：
```javascript
app.use(cors({
  origin: '*', // 或指定前端域名
  credentials: true
}));
```

---

### 4. API Keys不生效

**检查**：
```bash
# 查看环境变量
railway variables list

# 重新部署
railway up --detach
```

---

## 🌐 前端部署（可选）

### 部署到Vercel

1. **安装Vercel CLI**
```bash
npm install -g vercel
```

2. **部署前端**
```bash
cd /Users/Uta/live-story-use
vercel
```

3. **配置**
- Root Directory: `./`
- Build Command: 留空
- Output Directory: `./`

---

## 📝 部署检查清单

```
后端部署（Railway）
□ 代码已推送到GitHub use分支
□ Railway项目已创建
□ 环境变量已配置（6个变量）
□ 域名已生成
□ API可以访问
□ CORS配置正确
□ 日志显示正常运行

前端配置
□ API地址已更新为Railway域名
□ 所有页面的API调用已更新
□ 本地测试通过
□ （可选）前端已部署到Vercel
```

---

## 🎯 部署后测试

### 1. 测试API健康检查
```bash
curl https://你的域名.up.railway.app/
```

### 2. 测试AI剧情生成
```bash
curl -X POST https://你的域名.up.railway.app/api/generate-story \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "测试剧情生成",
    "context": "测试场景"
  }'
```

### 3. 访问前端测试
- 本地：http://localhost:9000
- 生产：你的Vercel域名（如果部署了）

---

## 💰 Railway费用说明

### 免费计划
- $5 免费额度/月
- 自动休眠（无流量时）
- 512MB RAM
- 共享CPU

### 使用估算
- 后端API服务
- 低流量场景
- 应该在免费额度内

### 监控用量
```bash
railway status
```

或在 Railway Dashboard → Usage 查看

---

## 🔄 更新部署

### 方式1：自动部署（推荐）
只需推送代码到GitHub：
```bash
git push origin use
```
Railway会自动重新部署

### 方式2：手动部署
```bash
railway up
```

---

## 🆘 获取帮助

### Railway文档
```
https://docs.railway.app/
```

### 检查部署状态
```bash
railway status
railway logs
railway variables
```

### 问题排查
1. 查看 Railway Dashboard 的日志
2. 检查环境变量配置
3. 本地测试 server 目录
4. 查看 Railway 社区论坛

---

## 📞 需要帮助？

如果遇到问题：
1. 截图错误信息
2. 复制Railway日志
3. 告诉我具体步骤

我会立即帮你解决！

---

🚀 **准备好开始部署了吗？从步骤1开始吧！**

