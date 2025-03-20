// Import necessary modules

import { ISpeechRecognition } from "../type";
import { WhisperRecorder } from "./recorder";

// Call the function to start recording


export class WhisperSpeechRecognition extends ISpeechRecognition<any> {
  private recognition: any;
  constructor() {
    super()
    this.recognition = new WhisperRecorder()
    this.recognition.init()
  }

  getInstance() {
    return this.recognition
  }

  start(opt: any): void {
    console.log('start', opt)
    this.recognition.start(this.onmessage.bind(this));
  }

  onmessage(event: string): void {
    console.log('message', event)
  }

  stop(): void {
    console.log('stop')
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