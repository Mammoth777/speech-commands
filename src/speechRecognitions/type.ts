export abstract class ISpeechRecognition<Err = SpeechRecognitionErrorEvent> {
  constructor() {}
  public abstract getInstance(): any;
  abstract onstart(): void;
  abstract onerror(event: Err): void;
  abstract onend(): void;
  // abstract onresult(event: Msg): void;
  abstract onmessage(event: string): void;
  abstract start(opt: any): void;
  abstract stop(): void;
  abstract isSupported(): boolean;
}