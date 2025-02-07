import './style.css'
import { SpeechCommandsManager } from '../src/main'

const MatchWord = '你好小黑'
document.getElementById('matchWord')!.innerText = MatchWord

const sc = new SpeechCommandsManager()
sc.addCommand(MatchWord, () => {
  alert('match: ' + MatchWord)
})
// sc.start()