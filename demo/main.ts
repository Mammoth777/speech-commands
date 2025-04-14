import './style.css'
import { SpeechCommandsManager } from '../src/main'

const MatchWord = '小黑'
document.getElementById('matchWord')!.innerText = MatchWord

// const sc = new SpeechCommandsManager()
// const sc = new SpeechCommandsManager({ recognizer: 'xf' })
// const sc = new SpeechCommandsManager({ recognizer: 'vosk' })
// const sc = new SpeechCommandsManager({ recognizer: 'vosk-browser' })
// const sc = new SpeechCommandsManager({ recognizer: 'whisper' })
let sc: SpeechCommandsManager
function run(type: 'xf' | 'vosk' | 'vosk-browser' | 'whisper') {
  sc = new SpeechCommandsManager({ recognizer: type })
  const matchMsg = document.getElementById('matchMsg')!
  sc.addCommand(MatchWord, () => {
    matchMsg.classList.add('highlight')
    setTimeout(() => {
      matchMsg.classList.remove('highlight')
    }, 1000);
  })
  sc.start()
}

document.getElementById('stop')?.addEventListener('click', () => {
  console.log('stop')
  sc.stop()
})

document.getElementById('startXf')?.addEventListener('click', () => {
  console.log('start xf')
  run('xf')
})

document.getElementById('startVb')?.addEventListener('click', () => {
  console.log('start vosk browser')
  run('vosk-browser')
})

document.getElementById('startVosk')?.addEventListener('click', () => {
  console.log('start vosk')
  run('vosk')
})

