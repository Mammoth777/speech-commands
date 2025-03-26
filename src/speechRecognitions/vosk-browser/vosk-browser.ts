import { ISpeechRecognition } from "../type";

declare const Vosk: any;


export class VoskBrowserSpeechRecognition extends ISpeechRecognition {
  private recognition!: any;
  // private mediaRecorder!: MediaRecorder;
  private source!: MediaStreamAudioSourceNode;
  private recognizerProcessor!: AudioWorkletNode;
  private audioContext!: AudioContext;
  private mediaStream!: MediaStream;

  constructor() {
    super();
    this.recognition = null;
  }

  getInstance(): any {
    return this.recognition;
  }

  private async init() {
    console.log('init')
    const channel = new MessageChannel();
    const model = await Vosk.createModel('/models/vosk-model-small.tar.gz');
    // const model = await Vosk.createModel('/models/vosk-model.tar.gz');
    model.registerPort(channel.port1);

    const sampleRate = 48000;

    const recognizer = new model.KaldiRecognizer(sampleRate);
    // recognizer.setWords(true);

    let fullResult = "";
    const emit = (message: string) => {
      message = message.replace(/\s/g, '')
      if (message) {
        this.onmessage(message);
      } 
    }

    recognizer.on("result", (message: any) => {
      const result = message.result;
      // console.log(JSON.stringify(result, null, 2));

      fullResult += result.text + " ";
      console.log('result')
      emit(fullResult);
    });
    recognizer.on("partialresult", (message: any) => {
      const partial = message.result.partial;
      fullResult = partial;
      // console.log('partial')
      emit(fullResult);
    });

    fullResult = "Ready";

    const mediaStream = this.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        channelCount: 1,
        sampleRate
      },
    });

    const audioContext = this.audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule('recognizer-processor.js')
    const recognizerProcessor = this.recognizerProcessor = new AudioWorkletNode(audioContext, 'recognizer-processor', { channelCount: 1, numberOfInputs: 1, numberOfOutputs: 1 });
    recognizerProcessor.port.postMessage({ action: 'init', recognizerId: recognizer.id }, [channel.port2])
    recognizerProcessor.connect(audioContext.destination);

    const source = this.source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(recognizerProcessor);

  }

  start(opt: any): void {
    const { onstart, onerror, onend, onmessage } = opt;
    console.log('start')
    this.onstart = onstart;
    this.onerror = onerror;
    this.onend = onend;
    this.onmessage = onmessage;
    this.init()
  }

  stop(): void {
    // 1. 断开音频处理管道
    if (this.source) {
      this.source.disconnect();
    }
    
    if (this.recognizerProcessor) {
      this.recognizerProcessor.disconnect();
    }
    
    // 2. 停止所有媒体轨道
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    // 3. 关闭音频上下文
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(err => {
        console.error('关闭音频上下文时出错:', err);
      });
    }
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