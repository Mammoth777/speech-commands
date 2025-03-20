import './style.css'
import { SpeechCommandsManager } from '../src/main'

const MatchWord = '小黑'
document.getElementById('matchWord')!.innerText = MatchWord

// const sc = new SpeechCommandsManager()
// const sc = new SpeechCommandsManager({ recognizer: 'xf' })
// const sc = new SpeechCommandsManager({ recognizer: 'vosk' })
const sc = new SpeechCommandsManager({ recognizer: 'vosk-browser' })
// const sc = new SpeechCommandsManager({ recognizer: 'whisper' })
const matchMsg = document.getElementById('matchMsg')!
sc.addCommand(MatchWord, () => {
  matchMsg.classList.add('highlight')
  setTimeout(() => {
    matchMsg.classList.remove('highlight')
  }, 1000);
})
sc.start()