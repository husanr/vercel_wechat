const axios = require('axios');

axios.defaults.headers.post['Content-Type'] = 'text/xml';

module.exports = async (req, res) => {
  const er = req.query.echostr
  // 将用户消息发送到现有的后端接口
  try {
    // const response = await axios.post('https://tqs3ft.laf.dev/test', req );
    const response = await axios({
      url: "https://cpq9b7mect.hk.aircode.run/kefu",
      method: req.method,
      params: req.query,
      data: req
    })
    // console.log('res data',response.data);
    // console.log('echostr',er);
    // 处理后端接口的响应，并将其返回给前端
    if(er) {
      res.status(200).end(er);
    } else {
      res.status(200).end(response.data);
    }
  } catch (error) {
    // 处理转发请求失败的情况
    // console.error(error);
    res.status(500).json({ error: '转发请求失败' });
  }
};

