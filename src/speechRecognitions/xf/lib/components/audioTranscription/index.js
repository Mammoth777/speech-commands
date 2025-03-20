import CryptoJS from "crypto-js";
import { APPID, API_KEY, API_SECRET } from "./config"

function toBase64(buffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
* 获取websocket url
* 该接口需要后端提供，这里为了方便前端处理
*/
function getWebSocketUrl() {
  // 请求地址根据语种不同变化
  var url = "wss://iat-api.xfyun.cn/v2/iat";
  var host = "iat-api.xfyun.cn";
  var apiKey = API_KEY;
  var apiSecret = API_SECRET;
  var date = new Date().toGMTString();
  var algorithm = "hmac-sha256";
  var headers = "host date request-line";
  var signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`;
  var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
  var signature = CryptoJS.enc.Base64.stringify(signatureSha);
  var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
  var authorization = btoa(authorizationOrigin);
  url = `${url}?authorization=${authorization}&date=${date}&host=${host}`;
  return url;
}

const supportEvents = [
  'message', // recorder message
  'start', // recorder start
  'end', // 解析结束
  'wsError',
  'wsClose',
  'wsStatusChange'
]

export default class AudioTranscription {
  constructor(RecorderManager) {
    this.recorder = new RecorderManager('/public/iat');
    this.recorder.onStart = () => {
      this.emit('start')
    }
    this.recorder.onFrameRecorded = ({ isLastFrame, frameBuffer }) => {
      this.onRecorderFrameRecorded({ isLastFrame, frameBuffer });
    };
    this.recorder.onStop = () => {
      this.recorderStopHandle();
    };
    this.iatWS = null;
    this.resultText = "";
    this.resultTextTemp = "";
    this.countdownInterval = null;
    // 事件处理
    this.handlers = {}
  }

  /**
   * 
   * @param {string} event 可选值： 'message', 'start', 'end', 'wsError', 'wsClose', 'wsStatusChange'
   * @param {Function} callback
   */
  on(event, callback) {
    if (!supportEvents.includes(event)) {
      throw new Error('event not supported, 当前只支持' + supportEvents.join(', '))
    }
    // 先不考虑多次注册吧， 多了就覆盖
    this.handlers[event] = callback
  }

  emit(event, ...args) {
    const fn = this.handlers[event]
    if (fn) {
      fn(...args)
    } else {
      console.log(`event ${event} not register`)
    }
  }
  onWsStatusChange(status) {
    console.log('ws status:', status)
    this.emit('wsStatusChange', status)
  }
  onRecorderFrameRecorded({ isLastFrame, frameBuffer }) {
    const iatWS = this.iatWS
    if (iatWS.readyState === iatWS.OPEN) {
      iatWS.send(
        JSON.stringify({
          data: {
            status: isLastFrame ? 2 : 1,
            format: "audio/L16;rate=16000",
            encoding: "raw",
            audio: toBase64(frameBuffer),
          },
        })
      );
      if (isLastFrame) {
        this.onWsStatusChange("CLOSING");
      }
    }
  }
  recorderStopHandle() {
    clearInterval(this.countdownInterval);
  }

  start() {
    this.connectWebSocket();
  }
  stop() {
    this.recorder.stop();
  }

  connectWebSocket() {
    const websocketUrl = getWebSocketUrl();
    const recorder = this.recorder;
    let iatWS
    if ("WebSocket" in window) {
      iatWS = new WebSocket(websocketUrl);
    } else if ("MozWebSocket" in window) {
      iatWS = new MozWebSocket(websocketUrl);
    } else {
      alert("浏览器不支持WebSocket");
      return;
    }
    this.onWsStatusChange("CONNECTING");
    iatWS.onopen = (e) => {
      // 开始录音
      recorder.start({
        sampleRate: 16000,
        frameSize: 1280,
      });
      var params = {
        common: {
          app_id: APPID,
        },
        business: {
          language: "zh_cn",
          domain: "iat",
          accent: "mandarin",
          vad_eos: 5000,
          dwa: "wpgs",
        },
        data: {
          status: 0,
          format: "audio/L16;rate=16000",
          encoding: "raw",
        },
      };
      iatWS.send(JSON.stringify(params));
    };
    iatWS.onmessage = (e) => {
      this.renderResult(e.data);
    };
    iatWS.onerror = (e) => {
      console.error(e);
      this.emit('wsError', e)
      recorder.stop();
      this.onWsStatusChange("CLOSED");
    };
    iatWS.onclose = (e) => {
      this.emit('wsClose', e)
      recorder.stop();
      this.onWsStatusChange("CLOSED");
    };
    this.iatWS = iatWS;
  }

  renderResult(resultData) {
    // 识别结束
    let jsonData = JSON.parse(resultData);
    if (jsonData.data && jsonData.data.result) {
      let data = jsonData.data.result;
      let str = "";
      let ws = data.ws;
      for (let i = 0; i < ws.length; i++) {
        str = str + ws[i].cw[0].w;
      }
      // 开启wpgs会有此字段(前提：在控制台开通动态修正功能)
      // 取值为 "apd"时表示该片结果是追加到前面的最终结果；取值为"rpl" 时表示替换前面的部分结果，替换范围为rg字段
      if (data.pgs) {
        if (data.pgs === "apd") {
          // 将resultTextTemp同步给resultText
          this.resultText = this.resultTextTemp;
        }
        // 将结果存储在resultTextTemp中
        this.resultTextTemp = this.resultText + str;
      } else {
        this.resultText = this.resultText + str;
      }
      const text = this.resultTextTemp || this.resultText || "";
      console.log(text, 'text')
      // document.getElementById("result").innerText = text
      this.emit('message', text)
    }
    if (jsonData.code === 0 && jsonData.data.status === 2) {
      this.emit('end')
      this.iatWS.close();
    }
    if (jsonData.code !== 0) {
      this.iatWS.close();
      console.error(jsonData);
    }
  }
}

