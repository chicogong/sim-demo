require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const tencentcloud = require("tencentcloud-sdk-nodejs-trtc");
const TLSSigAPIv2 = require('tls-sig-api-v2');

const TrtcClient = tencentcloud.trtc.v20190722.Client;

// TRTC配置
const trtcConfig = {
  secretId: process.env.TENCENT_SECRET_ID,
  secretKey: process.env.TENCENT_SECRET_KEY,
  region: process.env.TENCENT_REGION || 'ap-guangzhou',
  endpoint: process.env.TENCENT_ENDPOINT || 'trtc.tencentcloudapi.com',
  sdkAppId: parseInt(process.env.TRTC_SDK_APP_ID || '0'),
  sdkSecretKey: process.env.TRTC_SECRET_KEY, // 用于生成UserSig
  expireTime: 86400
};

const app = express();
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'), { 
  maxAge: '1m', 
  etag: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

/**
 * Create a new TRTC client instance
 * @returns {Object} New TRTC client instance
 */
function createTrtcClient() {
  if (!trtcConfig.secretId || !trtcConfig.secretKey) {
    throw new Error('TRTC configuration missing. Please set environment variables.');
  }
  
  console.log('Creating new TRTC client');
  
  return new TrtcClient({
    credential: {
      secretId: trtcConfig.secretId,
      secretKey: trtcConfig.secretKey,
    },
    region: trtcConfig.region,
    profile: {
      httpProfile: {
        endpoint: trtcConfig.endpoint,
      },
    },
  });
}

/**
 * Generate user credentials for TRTC
 * POST /credentials
 */
app.post('/credentials', (req, res) => {
  try {
    const { sdkAppId, sdkSecretKey, expireTime } = trtcConfig;
    
    if (!sdkAppId || !sdkSecretKey) {
      return res.status(400).json({ 
        error: 'TRTC configuration missing. Please set environment variables: SDK_APP_ID, TENCENT_SECRET_KEY'
      });
    }
    
    const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
    const userId = `user_${randomNum}`;
    const robotId = `ai_${randomNum}`;
    const roomId = parseInt(randomNum);
    
    const api = new TLSSigAPIv2.Api(sdkAppId, sdkSecretKey);
    const userSig = api.genSig(userId, expireTime);
    const robotSig = api.genSig(robotId, expireTime);
    
    const credentials = { sdkAppId, userSig, robotSig, userId, robotId, roomId };
    
    res.json(credentials);
  } catch (error) {
    console.error('Failed to generate user information', error);
    return res.status(500).json({ error: error.message });
  }
});


/**
 * Get available voice list
 * GET /voices
 */
app.get('/voices', (req, res) => {
  try {
    const voices = {
      chinese: [
        { id: "English_Insightful_Speaker", name: "English_Insightful_Speaker", language: "zh" },
        { id: "chico_ex_rrun4xc1tqfcafot8n4ko", name: "中文-herui", language: "zh" },
        { id: "Chinese (Mandarin)_IntellectualGirl", name: "知性女声", language: "zh" },
        { id: "male-qn-qingse", name: "青年清澈男声", language: "zh" },
        { id: "female-tianmei", name: "甜美女声", language: "zh" },
        { id: "danya_xuejie", name: "淡雅学姐", language: "zh" },
        { id: "male-qn-daxuesheng-jingpin", name: "精品男声", language: "zh" },
        { id: "moss_audio_ce44fc67-7ce3-11f0-8de5-96e35d26fb85", name: "中文-现代女声", language: "zh" },
        { id: "moss_audio_aaa1346a-7ce7-11f0-8e61-2e6e3c7ee85d", name: "中文-现代男声", language: "zh" },
        { id: "Chinese (Mandarin)_Lyrical_Voice", name: "中文-抒情女声", language: "zh" },
        { id: "Chinese (Mandarin)_HK_Flight_Attendant", name: "中文-香港空乘", language: "zh" }
      ],
      english: [
        { id: "English_Graceful_Lady", name: "英文-优雅女士", language: "en" },
        { id: "English_Insightful_Speaker", name: "英文-洞察演讲者", language: "en" },
        { id: "English_radiant_girl", name: "英文-明亮女孩", language: "en" },
        { id: "English_Persuasive_Man", name: "英文-说服力男声", language: "en" },
        { id: "moss_audio_6dc281eb-713c-11f0-a447-9613c873494c", name: "英文-现代女声", language: "en" },
        { id: "moss_audio_570551b1-735c-11f0-b236-0adeeecad052", name: "英文-现代男声", language: "en" },
        { id: "moss_audio_ad5baf92-735f-11f0-8263-fe5a2fe98ec8", name: "英文-青年男声", language: "en" },
        { id: "English_Lucky_Robot", name: "英文-机器人", language: "en" }
      ],
      japanese: [
        { id: "Japanese_Whisper_Belle", name: "日文-温柔女声", language: "ja" },
        { id: "moss_audio_24875c4a-7be4-11f0-9359-4e72c55db738", name: "日文-女声1", language: "ja" },
        { id: "moss_audio_7f4ee608-78ea-11f0-bb73-1e2a4cfcd245", name: "日文-女声2", language: "ja" },
        { id: "moss_audio_c1a6a3ac-7be6-11f0-8e8e-36b92fbb4f95", name: "日文-女声3", language: "ja" }
      ]
    };

    res.json(voices);
  } catch (error) {
    console.error('Failed to get voice list:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start simultaneous interpretation using transcription API
 * POST /interpretation
 */
app.post('/interpretation', async (req, res) => {
  try {
    const { ...requestData } = req.body;
    
    // Validate required parameters
    if (!requestData.SdkAppId || !requestData.RoomId) {
      return res.status(400).json({ 
        error: 'Missing required parameters: SdkAppId, RoomId' 
      });
    }
    
    const client = createTrtcClient();
    
    console.log('🌐 Starting simultaneous interpretation:', JSON.stringify(requestData, null, 2));
    
    const result = await client.StartAITranscription(requestData);
    console.log('✅ Simultaneous interpretation started:', JSON.stringify(result, null, 2));
    
    res.json({
      TaskId: result.TaskId,
      userInfo: {
        sdkAppId: requestData.SdkAppId,
        roomId: requestData.RoomId,
        userId: requestData.TranscriptionParams?.UserId,
        userSig: requestData.TranscriptionParams?.UserSig,
        robotId: requestData.TranscriptionParams?.TargetUserId
      }
    });
  } catch (error) {
    console.error('❌ Error starting interpretation:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop simultaneous interpretation
 * DELETE /interpretation
 */
app.delete('/interpretation', async (req, res) => {
  try {
    const { TaskId } = req.body;
    
    if (!TaskId) {
      return res.status(400).json({ 
        error: 'Missing required field: TaskId'
      });
    }
    
    const client = createTrtcClient();
    
    console.log('🛑 Stopping interpretation:', { TaskId });
    
    const data = await client.StopAITranscription({ TaskId });
    
    console.log('✅ Interpretation stopped successfully');
    res.json(data);
  } catch (error) {
    console.error('❌ Interpretation stop failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});


const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const HOST = process.env.HOST || '0.0.0.0';

// HTTP Server
const httpServer = http.createServer(app);
httpServer.listen(PORT, HOST, () => {
  console.log(`HTTP Server running at http://${HOST}:${PORT}/`);
});

// HTTPS Server (if certificates exist)
const certPath = path.join(__dirname, 'certs', 'cert.pem');
const keyPath = path.join(__dirname, 'certs', 'key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  const httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(HTTPS_PORT, HOST, () => {
    console.log(`HTTPS Server running at https://${HOST}:${HTTPS_PORT}/`);
    console.log(`⚠️  For local network access, use: https://${require('os').networkInterfaces().en0?.find(i => i.family === 'IPv4')?.address || 'YOUR_LOCAL_IP'}:${HTTPS_PORT}/`);
  });
} else {
  console.log('⚠️  HTTPS certificates not found. Only HTTP server is running.');
  console.log('   To enable HTTPS, generate certificates in ./certs/ folder');
}