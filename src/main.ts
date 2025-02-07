import pinyin from 'pinyin';

/**
 * 语音识别命令匹配器
 * 
 * 1. 是否区分音调
 * 2. 是否区分前后鼻音 an/ang, en/eng, in/ing
 * 3. 声母 z/zh, c/ch, s/sh
 */
class Matcher {
  private map: Map<string, () => void> = new Map()
  private transfer(text: string) {
    return pinyin(text, {
      // style: pinyin.STYLE_TONE2
      style: pinyin.STYLE_NORMAL
    })
  }
  // 是否区分***
  options = {
    'an/ang': true,
    'en/eng': true,
    'in/ing': true,
    'z/zh': true,
    'c/ch': true,
    's/sh': true,
  }
  matchSingleCommand(command: string, transcript: string) {
    const t = this.transfer
    const p1 = t(command).join(' ')
    const p2 = t(transcript).join(' ')
    // todo 区分前后鼻音之类的
    return p2.includes(p1); // 完全匹配
  }
  match(transcript: string) {
    for (const command in this.map.keys()) {
      if (this.matchSingleCommand(command, transcript)) {
        return this.map.get(command)
      }
    }
  }
  addCommand(command: string, handle: () => void) {
    if (this.map.has(command)) {
      console.warn('command already exists, will be overwritten')
    }
    this.map.set(command, handle)
  }
  removeCommand(command: string) {
    this.map.delete(command)
  }
  getCommands() {
    return this.map.keys()
  }
}

export type SpeechCommandsManagerOptions = {
  rematchTime?: number
}

export class SpeechCommandsManager {
  static SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  private matcher = new Matcher()
  match(transcript: string) {
    return this.matcher.match(transcript)
  }
  private rematchTime = 2000;
  constructor(options?: SpeechCommandsManagerOptions) {
    if (!SpeechCommandsManager.SpeechRecognition) {
      console.error('Web Speech API is not supported in this browser.');
    }
    this.rematchTime = options?.rematchTime || 2000
  }

  private recognition: SpeechRecognition = new SpeechCommandsManager.SpeechRecognition();

  onstart() { }

  onerror(event: SpeechRecognitionErrorEvent) {
    console.error('无麦克风或无权限', event.error);
  }

  onend() { }

  private onresult(event: SpeechRecognitionEvent) {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const handle = this.match(interimTranscript)
    if (handle) {
      const ignore = this.debounce()
      if (ignore) {
        return
      }
      handle()
    }


    console.log('Interim Transcript: ', interimTranscript);
  }

  private lastMatchTime = 0

  private debounce() {
    const lastMatchTime = this.lastMatchTime
    console.log(lastMatchTime, 'lm')
    const matchTime = Date.now()
    if (matchTime - lastMatchTime < this.rematchTime) {
      console.log('multiple match')
      return true
    } else {
      console.log(matchTime - lastMatchTime, 'diff')
      this.lastMatchTime = matchTime
      return false
    }
  }

  /**
   * 是否支持语音识别
   */
  isSupported() {
    return !!SpeechCommandsManager.SpeechRecognition;
  }

  /**
   * 开始监听
   */
  start() {
    const recognition = this.recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
    recognition.onstart = this.onstart;
    recognition.onerror = this.onerror;
    recognition.onend = this.onend;
    recognition.onresult = this.onresult;
    recognition.start();
  }

  /**
   * 结束监听
   */
  stop() {
    this.recognition.stop();
  }

  addCommand(command: string, handle: () => void) {
    return this.matcher.addCommand(command, handle)
  }

  removeCommand(command: string) {
    return this.matcher.removeCommand(command)
  }

  getCommands() {
    return this.matcher.getCommands()
  }

}