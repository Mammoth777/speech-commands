import { ISpeechRecognition } from "../type";

export class WebApiSpeechRecognition extends ISpeechRecognition {
  private recognition!: SpeechRecognition;

  constructor() {
    super()
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.error('Web Speech API is not supported in this browser.');
    } else {
      this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    }
  }
  getInstance(): any {
    return this.recognition;
  }
  start(opt: any): void {
    console.log('webapi start')
    const {onstart, onerror, onend, onmessage} = opt;
    const recognition = this.recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
    recognition.onstart = onstart || this.onstart;
    recognition.onerror = onerror || this.onerror;
    recognition.onend = onend || this.onend;
    recognition.onresult = this.onresult.bind(this)
    this.onmessage = onmessage;
    recognition.start();
  }

  stop(): void {
    this.recognition.stop();
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

  onmessage(event: string): void {
    console.log('message', event)
  }

  onresult(event: SpeechRecognitionEvent) {
    console.log(event, 'event')
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    this.onmessage(interimTranscript)
  }

  isSupported(): boolean {
    return !!window.SpeechRecognition || !!window.webkitSpeechRecognition;
  }
}