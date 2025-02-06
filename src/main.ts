import './style.css';
import pinyin from 'pinyin';
import { showMatch } from './match'

const MatchWord = '你好小英'
document.getElementById('matchWord')!.innerText = MatchWord
const ReMatchTime = 2000

function transfer(text: string) {
  return pinyin(text, {
    // style: pinyin.STYLE_TONE2
    style: pinyin.STYLE_NORMAL
  }).join(' ')
}

let lastMatchTime = 0
function handle() {
  console.log(lastMatchTime, 'lm')
  const matchTime = Date.now()
  if (matchTime - lastMatchTime < ReMatchTime) {
    console.log('multiple match')
  } else {
    console.log(matchTime - lastMatchTime, 'diff')
    lastMatchTime = matchTime
    // alert('meet')
    showMatch(true)
  }
}

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function match(command: string, transcript: string) {
  const p1 = transfer(command)
  const p2 = transfer(transcript)
  return p2.indexOf(p1) > -1;
}

if (!window.SpeechRecognition) {
  console.error('Web Speech API is not supported in this browser.');
} else {
  const recognition = new window.SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-CN';

  recognition.onstart = () => {
    // console.log('Speech recognition started.');
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';

    // console.log(event)

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (match(MatchWord, interimTranscript)) {
      handle()
    }
    

    console.log('Interim Transcript: ', interimTranscript);
    // console.log('Final Transcript: ', finalTranscript);
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.error('Speech recognition error', event.error);
  };

  recognition.onend = () => {
    console.log('Speech recognition ended.');
    // recognition.start();
  };

  // Start the speech recognition
  recognition.start();
}