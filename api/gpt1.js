const axios = require('axios')
const xml2js = require('xml2js');
const utils = require('../utils/index')
const { kv } = require('@vercel/kv');

const WAIT_MESSAGE = '处理中 ... \n\n请稍等几秒后发送 1 查看回复`'

module.exports = async (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  const token = 'hello123';

  // 验证消息是否合法，若不合法则返回错误信息
  if (!utils.verifySignature(signature, timestamp, nonce, token)) {
    return res.status(400).send('Invalid signature');
  }

  // 如果是首次验证，则返回 echostr 给微信服务器
  if (echostr) {
    // console.log('echostr', echostr);
    return res.send(echostr);
  }
  let payload = ''
  // 解析 XML 数据
  if (req.method === 'POST') {
    let xmlData = '';
    req.on('data', chunk => {
      xmlData += chunk;
    });
    req.on('end', async () => {
      xml2js.parseString(xmlData, { trim: true }, async (err, result) => {
        if (err) {
          return res.status(400).send('Error parsing XML');
        } else {
          // 处理你的逻辑
          payload = result.xml
          console.log(result); // 这里是解析后的JSON对象

          const userMessage = payload.Content[0];
          if (userMessage === '1') {
            // 检索之前存储的答案
            const cachedAnswer = await kv.get(`reply:${payload.FromUserName[0]}`);
            if (cachedAnswer) {
              return res.status(200).send(utils.toXML(payload, cachedAnswer));
            }
          }
          const messages = [
            {
              "role": "system",
              "content": "You are a helpful assistant."
            },
            {
              "role": "user",
              "content": userMessage
            }
          ]
      
          // const { error, answer } = await utils.getOpenAIReply(messages)
          // console.log('err',error);
          // console.log('answer', answer);
          // 修复请求响应超时问题：如果 5 秒内 AI 没有回复，则返回等待消息
          const { error, answer } = await Promise.race([
            utils.getOpenAIReply(messages),
            utils.sleep(4500.0).then(() => ({ answer: WAIT_MESSAGE})),
          ]);
          if (answer !== WAIT_MESSAGE) {
            // 存储回答到KV数据库
            await kv.set(`reply:${payload.FromUserName[0]}`, answer);
          }
  
          console.log('err',error);
          console.log('answer', answer);
          res.status(200).send(utils.toXML(payload, answer));
        }
      });
    });
  }
};

