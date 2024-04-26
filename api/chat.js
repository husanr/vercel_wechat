const sha1 = require('sha1');
const xml2js = require('xml2js');
const crypto = require('crypto')

module.exports = async (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  const token = 'hello123';

  // 验证消息是否合法，若不合法则返回错误信息
  if (!verifySignature(signature, timestamp, nonce, token)) {
    return 'Invalid signature';
  }

  // 如果是首次验证，则返回 echostr 给微信服务器
  if (echostr) {
    console.log('echostr', echostr);
    res.send(echostr);
  }
  let payload = ''
  // 解析 XML 数据
  if (req.method === 'POST') {
    let xmlData = '';
    req.on('data', chunk => {
      xmlData += chunk;
    });
    req.on('end', async () => {
      xml2js.parseString(xmlData, { trim: true }, (err, result) => {
        if (err) {
          res.status(400).send('Error parsing XML');
        } else {
          // 处理你的逻辑
          payload = result.xml
          console.log(result); // 这里是解析后的JSON对象
          res.status(200).send(toXML(payload, "ChatGPT功能暂时不可用，请等待后续通知！谢谢！"));
        }
      });
    });
  }
};

// 返回组装 xml
function toXML(payload, content) {
  const timestamp = Date.now();
  const { ToUserName: fromUserName, FromUserName: toUserName } = payload;
  return `
  <xml>
    <ToUserName><![CDATA[${toUserName}]]></ToUserName>
    <FromUserName><![CDATA[${fromUserName}]]></FromUserName>
    <CreateTime>${timestamp}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${content}]]></Content>
  </xml>
  `
}

// 校验微信服务器发送的消息是否合法
function verifySignature(signature, timestamp, nonce, token) {
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1');
  sha1.update(str);
  return sha1.digest('hex') === signature;
}

