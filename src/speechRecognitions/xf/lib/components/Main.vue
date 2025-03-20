<script setup>
import { ref, inject } from 'vue'
import Popup from './popup.vue'
import AudioTranscription from './audioTranscription'
import RecorderManager from './iat/index.esm';
import { fetchIntent } from '../service/intentApi'


const bus = inject('bus')
const at = new AudioTranscription(RecorderManager)
function start() {
  at.start()
}
function stop() {
  at.stop()
}

const message = ref('')

at.on('message', msg => {
  message.value = msg
  console.log('message: ', msg)
})

at.on('end', _ => {
  console.log('end: ')
  console.log(message.value, 'end')
  getIntent(message.value)
})

/**
 * 向服务端发消息，解析意图
 * @param {string} msg
 */
async function getIntent(msg) {
  const intent = await fetchIntent(msg)
  bus.emit('action', {
    type: 'openMenu', // 打开热力站， 打开菜单， 关闭chatbot[这个应该不用返出去吧]
    payload: msg
  })
}
// todo 测试，晚点删
// setTimeout(() => {
//   getIntent('打开热档位')
// }, 1000);
</script>

<template>
  <div>
    <!-- <Popup></Popup> -->
     <button @click="start">start</button>
     <button @click="stop">stop</button>
     <p>
        {{ message }}
     </p>
  </div>
</template>

<style scoped>

</style>
