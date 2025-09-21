# HTTPS 配置说明

## SSL 证书生成

### 自签名证书生成命令
```bash
# 在 certs 目录下执行
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=localhost'
```

**参数说明：**
- `-x509`: 生成自签名证书
- `-newkey rsa:4096`: 创建新的 RSA 密钥，长度 4096 位
- `-keyout key.pem`: 私钥输出文件
- `-out cert.pem`: 证书输出文件
- `-days 365`: 证书有效期 365 天
- `-nodes`: 不加密私钥（无需密码）
- `-subj '/CN=localhost'`: 证书主题，CN 为通用名称

### 生成的文件
- `cert.pem`: SSL 证书文件
- `key.pem`: 私钥文件（请保密，不要提交到代码仓库）

## 获取本机网络地址

### macOS/Linux
```bash
# 查看所有网络接口 IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# 获取特定接口（如 en0）的 IP
ifconfig en0 | grep inet | awk '$1=="inet" {print $2}'
```

### Windows
```bash
# PowerShell
ipconfig | findstr IPv4

# 或使用
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne "127.0.0.1"}
```

### Node.js 代码获取
```javascript
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

console.log('Local IP:', getLocalIP());
```

## 访问方式

服务启动后，可通过以下方式访问：

- **HTTP**: `http://[本机IP]:3000`
- **HTTPS**: `https://[本机IP]:3443`

例如：
- `http://192.168.1.3:3000`
- `https://192.168.1.3:3443`

## 注意事项

1. **自签名证书警告**：浏览器会显示安全警告，需要手动接受证书
2. **防火墙设置**：确保防火墙允许相应端口（3000, 3443）
3. **私钥安全**：`key.pem` 包含私钥，不要提交到公开仓库
