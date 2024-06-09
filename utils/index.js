const crypto = require("crypto");
const { OpenAI } = require("openai");
const { kv } = require('@vercel/kv');


// 删除
const OPENAI_MODEL = "gpt-3.5-turbo-0613";

// 返回组装 xml
exports.toXML = function (payload, content) {
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
    `;
};

// 校验微信服务器发送的消息是否合法
exports.verifySignature = function (signature, timestamp, nonce, token) {
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join("");
  const sha1 = crypto.createHash("sha1");
  sha1.update(str);
  return sha1.digest("hex") === signature;
};

// 获取 OpenAI API 的回复
exports.getOpenAIReply = async function (prompt, payload) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
    baseURL: "https://gateway.ai.cloudflare.com/v1/613fca6f55866ca45901c14dbf914281/sanr/openai"
  });
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: prompt,
      max_tokens: 1000,
    });

    const response = chatCompletion.choices[0].message;

    console.debug(`[OpenAI response] ${response.data}`);
    if (response.status === 429) {
      return {
        error: "问题太多了，我有点眩晕，请稍后再试",
      };
    }
    // 去除多余的换行
    const answer = response.content.replace("\n\n", "")
    await kv.set(`reply:${payload.FromUserName[0]}`, answer);
    return {
      answer
    };
  } catch (e) {
    console.error(e.response.data);
    return {
      error: "问题太难了 出错了. (uДu〃).",
    };
  }
};

exports.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
