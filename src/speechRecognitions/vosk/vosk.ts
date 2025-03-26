import { ISpeechRecognition } from "../type";

declare global {
  interface Window {
    AudioContext: any;
    webkitAudioContext: any;
    ScriptProcessorNode: any;
    
  }
}

// 全局变量
let ws: WebSocket;                  // WebSocket 对象
let audioContext: AudioContext;        // AudioContext 对象
let processor: ScriptProcessorNode;           // ScriptProcessorNode 对象
let input: any;               // 麦克风输入源
let stream: any;              // 媒体流

const targetSampleRate = 16000;  // Vosk 要求的采样率

// 开始录音函数
function startRecording(callback: (m: string) => void) {
  // 初始化 WebSocket，连接到 Vosk server
  ws = new WebSocket('ws://localhost:2700');
  ws.binaryType = 'arraybuffer';

  ws.onopen = () => {
    console.log("WebSocket 连接已打开");
    // 发送初始化配置信息，通知服务器使用 16kHz 采样率
    ws.send(JSON.stringify({ config: { sample_rate: targetSampleRate } }));
  };

  ws.onmessage = (message) => {
    // 接收服务器返回的 JSON 数据并解析识别结果
    try {
      const data = JSON.parse(message.data);
      if (data.text) {
        callback(data.text);
      }
    } catch (e) {
      console.error("解析服务器返回数据错误：", e);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket 错误：", error);
  };

  // 获取麦克风权限，并设置音频处理
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(s) {
      stream = s;
      // 创建 AudioContext
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // 创建媒体流输入节点
      input = audioContext.createMediaStreamSource(s);

      // 创建 ScriptProcessorNode
      // bufferSize 可以根据需要调整，一般取 1024 ~ 4096
      processor = audioContext.createScriptProcessor(4096, 1, 1);
      input.connect(processor);
      // processor.connect(destination) 为防止垃圾回收，此处将其连接到 AudioContext.destination
      processor.connect(audioContext.destination);

      // 处理音频数据
      processor.onaudioprocess = function(e) {
        // 获取第一个声道的 Float32Array 数据
        const channelData = e.inputBuffer.getChannelData(0);
        // 将数据降采样并转换为 16-bit PCM 数据（二进制 ArrayBuffer）
        const downsampledBuffer = downsampleBuffer(channelData, audioContext.sampleRate, targetSampleRate);
        if (downsampledBuffer && ws.readyState === WebSocket.OPEN) {
          ws.send(downsampledBuffer);
        }
      };
    })
    .catch(function(err) {
      console.error('获取麦克风失败：', err);
    });

}

// 停止录音函数
function stopRecording() {
  if (processor) {
    processor.disconnect();
    processor.onaudioprocess = null;
  }
  if (input) {
    input.disconnect();
  }
  if (audioContext) {
    audioContext.close();
  }
  if (stream) {
    stream.getTracks().forEach((track: any) => track.stop());
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    // 通知服务器音频结束
    ws.send(JSON.stringify({ eof: 1 }));
    ws.close();
  }
  // document.getElementById('startBtn').disabled = false;
  // document.getElementById('stopBtn').disabled = true;
  console.log("录音已停止");
}

/**
 * 将 Float32Array 格式的音频数据从原始采样率转换为目标采样率，并转换为 16-bit PCM 格式
 * @param {Float32Array} buffer 原始音频数据
 * @param {number} sampleRate 原始采样率
 * @param {number} targetSampleRate 目标采样率（Vosk 默认 16000）
 * @returns {ArrayBuffer} 转换后的 16-bit PCM 数据
 */
function downsampleBuffer(buffer: any, sampleRate: any, targetSampleRate: any) {
  if (targetSampleRate === sampleRate) {
    // 采样率相同，直接转换数据格式
    return floatTo16BitPCM(buffer);
  }
  if (targetSampleRate > sampleRate) {
    console.error("目标采样率必须小于原始采样率");
    return null;
  }
  const sampleRateRatio = sampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    // 对这一段采样数据求平均值
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    const sample = accum / count;
    // 将 Float32 数值 [-1, 1] 转换为 16-bit 整数
    result[offsetResult] = Math.max(-32768, Math.min(32767, sample * 32767));
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result.buffer;
}

/**
 * 将 Float32Array 数据转换为 16-bit PCM 数据（ArrayBuffer）
 * @param {Float32Array} buffer 原始音频数据
 * @returns {ArrayBuffer} 16-bit PCM 数据
 */
function floatTo16BitPCM(buffer: any) {
  const len = buffer.length;
  const result = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    result[i] = s < 0 ? s * 32768 : s * 32767;
  }
  return result.buffer;
}

export class VoskSpeechRecognition extends ISpeechRecognition {
  private recognition!: any;

  constructor() {
    super();
    this.recognition = null;
  }

  getInstance(): any {
    return this.recognition;
  }

  start(opt: any): void {
    const {onstart, onerror, onend, onmessage} = opt;
    this.onstart = onstart;
    this.onerror = onerror;
    this.onend = onend;
    this.onmessage = onmessage;
    startRecording(this.onmessage);
  }

  stop(): void {
    stopRecording();
  }

  onstart(): void {
    
  }
  onerror(event: SpeechRecognitionErrorEvent): void {
    console.log(event);
  }
  onend(): void {
    
  }
  isSupported(): boolean {
    return true;
  }
  onmessage(event: string): void {
    console.log(event);
  }
}