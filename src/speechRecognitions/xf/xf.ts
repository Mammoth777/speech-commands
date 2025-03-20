import { ISpeechRecognition } from '../type.js';
// @ts-ignore
import AudioTranscription from './lib/components/audioTranscription/index.js';
// @ts-ignore
import RecorderManager from './lib/components/iat/index.esm';

// // 初始化， 获取实例
// const chatbot = Chatbot.init();
// // 显示界面
// chatbot.show()
// // 开始录音
// chatbot.start()
// // 手动结束
// chatbot.stop()

// chatbot.on('message', (msg: string) => {
//   console.log(msg)
// })

export class XfSpeechRecognition extends ISpeechRecognition<any> {
  private recognition: any;
  constructor() {
    super()
    const at = new AudioTranscription(RecorderManager)

    at.on('message', (msg: string) => {
      console.log('message: ', msg)
    })

    at.on('end', (_: any) => {
      console.log('end: ')
    })
    this.recognition = at
  }

  getInstance() {
    return this.recognition
  }

  start(opt: any): void {
    const {onstart, onerror, onend, onmessage} = opt;
    const recognition = this.recognition;
    recognition.onstart = onstart || this.onstart;
    recognition.onerror = onerror || this.onerror;
    recognition.onend = onend || this.onend;
    this.onmessage = onmessage;
    this.recognition.on('message', (msg: string) => {
      this.onmessage(msg)
    })
    this.recognition.start()
  }

  onmessage(event: string): void {
    console.log('message', event)
  }

  stop(): void {
    this.recognition.stop()
  }

  onstart() {
    console.log('start')
  }

  onerror(event: SpeechRecognitionErrorEvent) {
    console.log('error', event)
  }

  onend() {
    console.log('end')
  }

  isSupported(): boolean {
    return true
  }
}