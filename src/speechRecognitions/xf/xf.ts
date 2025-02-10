import { ISpeechRecognition } from '../type.js';
// @ts-ignore
import { Chatbot } from './dist/chatbotsdk.js';

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
  private recognition = Chatbot.init();
  constructor() {
    super()
  }

  getInstance() {
    return this.recognition
  }

  start(): void {
    this.recognition.start()
    this.recognition.on('message', (msg: string) => {
      this.onmessage(msg)
    })
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