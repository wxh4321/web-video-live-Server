// wss.js
 
const fs = require('fs');
const url = require('url');
const httpServ = require('https');
const WebSocket = require('ws');
const WebSocketServer = require('ws').Server; // 引用Server类
 
const clients = new Map();
const CameraList = [];

Array.prototype.remove = function(val) { 
    var index = this.indexOf(val); 
    if (index > -1) { 
        this.splice(index, 1); 
    } 
};

// 一些配置信息
const cfg = {
    port: 8008,
    ssl_key: './cert/privatekey.pem',
    ssl_cert: './cert/certificate.pem',
};
 
// 创建request请求监听器
const processRequest = (req, res) => {
    res.writeHead(200);
    res.end('WebSockets Server\n');
};
 
const app = httpServ.createServer({
    // 向server传递key和cert参数
    key: fs.readFileSync(cfg.ssl_key),
    cert: fs.readFileSync(cfg.ssl_cert)
}, processRequest).listen(cfg.port);
 
// 实例化WebSocket服务器
const wss = new WebSocketServer({
    server: app
});

// 如果有WebSocket请求接入，wss对象可以响应connection事件来处理
wss.on('connection', (ws,request) => {
    const arr = url.parse(request.url).pathname.split('/');
    const userId = arr[arr.length-1];
    clients.set(userId, ws);
    if(userId.indexOf('camera')>-1){
        CameraList.push(userId);
    }
    console.log(userId+" connected ...");

    ws.on('message', (message) => {
        // console.log(`服务器接收到：${typeof(message)}`);
        if(clients.size>1){
            clients.forEach((client,key) => {
                if (client&&key.indexOf("camera")<=-1&&client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                      ObjectName:userId,
                      ObjectList:CameraList,
                      ObjectData:message
                  }));
                }
              });
        }
       
    });
    ws.on('close', () => {
        console.log(userId+" closed ...");
        clients.delete(userId);
        CameraList.remove(userId);
        if(CameraList.length<1){
            if(clients.size>1){
                clients.forEach((client) => {
                    if (client&&client !== ws && client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                          ObjectName:"noid",
                          ObjectList:[],
                          ObjectData:"noid"
                      }));
                    }
                  });
            }
        }
      });
});
