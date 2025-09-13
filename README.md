# 同声传译演示项目

基于腾讯云TRTC的实时语音翻译服务演示项目。

## 功能特点

- 🎤 实时语音识别转录
- 🌐 多语言同声传译
- 📱 Web端界面支持
- ⚡ 低延迟实时通信

## 核心API接口

### 1. 生成用户凭证
```
POST /credentials
```
生成TRTC房间用户凭证，包含用户ID、房间ID和UserSig等信息。

### 2. 启动同声传译
```
POST /interpretation
```
启动实时同声传译服务。

**请求参数：**
- `SdkAppId`: TRTC应用ID
- `RoomId`: 房间ID
- `TranscriptionParams`: 转录参数配置

### 3. 停止同声传译
```  
DELETE /interpretation
```
停止正在运行的同声传译任务。

**请求参数：**
- `TaskId`: 任务ID

## 环境要求

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0

## 环境配置

1. 复制环境变量配置文件：
```bash
cp env.example .env
```

2. 配置必要的环境变量：
- `TENCENT_SECRET_ID`: 腾讯云SecretId
- `TENCENT_SECRET_KEY`: 腾讯云SecretKey  
- `TRTC_SDK_APP_ID`: TRTC应用ID
- `TRTC_SECRET_KEY`: TRTC应用的SecretKey 

## 快速开始

1. 安装依赖：
```bash
npm install
```

2. 启动服务：
```bash
npm start
```

3. 开发模式：
```bash
npm run dev
```

服务启动后访问：http://127.0.0.1:3000

## 项目结构

```
sim-demo/
├── server.js          # 主服务文件
├── package.json       # 项目配置
├── .gitignore         # Git忽略文件
├── env.example        # 环境变量模板
├── README.md          # 项目文档
└── public/           # 静态文件
    ├── interpreter_v2.html
    └── interpreter_v2_debug.html
```

## 获取配置信息

### 腾讯云API密钥
1. 访问 [腾讯云控制台](https://console.cloud.tencent.com/cam/capi)
2. 创建或查看API密钥
3. 获取SecretId和SecretKey

### TRTC应用配置
1. 访问 [TRTC控制台](https://console.cloud.tencent.com/trtc/app)
2. 创建或选择应用
3. 获取SDKAppID和SecretKey

## 技术栈

- **后端**: Node.js + Express
- **实时通信**: 腾讯云TRTC
- **依赖管理**: npm

## 注意事项

- 确保网络环境能够访问腾讯云服务
- 建议在生产环境中使用HTTPS
- 请妥善保管API密钥，不要提交到代码仓库

## License

MIT
