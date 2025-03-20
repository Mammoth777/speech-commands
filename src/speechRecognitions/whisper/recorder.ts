// 音频处理相关变量
let audioContext: AudioContext | null = null;
let analyser: any = null;
let audioChunks: any[] = [];
let isRecording = false;
let silenceTimeout: any = null;

// 音量阈值和静音时间设置
const VOLUME_THRESHOLD = 30;  // 音量阈值，可根据需要调整
const SILENCE_DURATION = 1000;  // 静音持续时间，单位毫秒. 超过这个时间没有声音则停止录音
const TARGET_SAMPLE_RATE = 16000;  // 目标采样率
const MAX_RECORDING_DURATION = 10000;  // 最大录音时长，单位毫秒

// 噪音抑制参数
const NOISE_SUPPRESSION_LEVEL = 0.5;  // 噪音抑制级别，0到1之间，值越大抑制越强

export class WhisperRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  // 初始化音频处理
  async init() {
    try {
      // 指定音频约束，包括采样率
      const constraints = {
        audio: {
            sampleRate: TARGET_SAMPLE_RATE,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
        }
    };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // 设置音频分析器
      audioContext = new AudioContext({
        sampleRate: TARGET_SAMPLE_RATE
      });
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 2048;

      // 噪音抑制
      const noiseSuppressionNode = audioContext.createBiquadFilter();
      noiseSuppressionNode.type = 'lowpass';
      noiseSuppressionNode.frequency.value = NOISE_SUPPRESSION_LEVEL * audioContext.sampleRate / 2;
      source.connect(noiseSuppressionNode);
      noiseSuppressionNode.connect(analyser);

      // 设置录音机
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: TARGET_SAMPLE_RATE * 16
      });
      this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this);
      this.mediaRecorder.onstop = this.handleRecordingStop.bind(this);

      // 开始检测音量
      this.checkVolume();

    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }

  // 处理音频数据
  handleDataAvailable(event: any) {
    console.log('audio data');
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  }

  // 处理录音停止
  handleRecordingStop() {
    if (audioChunks.length > 0) {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      this.sendAudioToServer(audioBlob);
      audioChunks = [];
    }
  }

  // 检测音量
  private checkVolume() {
    if (!analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // 计算平均音量
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

    if (average > VOLUME_THRESHOLD) {
      // 检测到声音
      if (!isRecording) {
        console.log('Detected sound');
        this.startRecording(); // 监测到声音就开始录音
      } else {
        console.log('No Sound detected');
      }
      // 重置静音计时器
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }
      silenceTimeout = setTimeout(this.stopRecording.bind(this), SILENCE_DURATION);
    }

    // 继续检测
    const check = this.checkVolume.bind(this);
    requestAnimationFrame(check);
  }

  private onmessage(msg: string) {
    console.log('message: ', msg);
  }

  start(onmessage: (message: any) => void) {
    this.onmessage = onmessage;
    this.startRecording()
  }

  stop() {
    this.stopRecording()
  }

  private stopRecording() {
    const mediaRecorder = this.mediaRecorder;
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      isRecording = false;
      console.log('Stopped recording');
    }
  }

  private startRecording() {
    const mediaRecorder = this.mediaRecorder;
    if (!isRecording && mediaRecorder) {
      mediaRecorder.start(500); // 每100ms生成一个音频片段
      isRecording = true;
      console.log('Started recording');
    }
    setTimeout(() => {
      this.stopRecording();
    }, MAX_RECORDING_DURATION);
  }

  // 发送音频到服务器
  private async sendAudioToServer(audioBlob: any) {
    console.log('Sending audio to server:', audioBlob);
    const onmessage = this.onmessage;
    try {
      const formData = new FormData();
      formData.append('audio_file', audioBlob);

      const params = new URLSearchParams()
      params.append('encode', 'true')
      params.append('task', 'transcribe')
      params.append('word_timestamps', 'false')
      params.append('output', 'txt')
      params.append('language', 'zh')
      // params.append('initial_prompt', '可能会提到"小黑"')

      fetch(`/whisper/asr?${params.toString()}`, {
        method: 'POST',
        body: formData
      })
        .then(async response => response.text())
        .then(data => {
          onmessage(data);
          // startRecording()
        });

    } catch (error) {
      console.error('Error sending audio to server:', error);
    }
  }
}