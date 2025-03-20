import { createApp, h } from "vue"
import Main from './components/Main.vue'
import { bus } from './components/eventEmitter'
export class Chatbot {
  static init() {
    return new Chatbot()
  }
  #dom = null
  #instance = null

  #initDom() {
    this.#dom = document.createElement('div')
    document.body.appendChild(this.#dom)
  }

  #render() {
    if (!this.#dom) {
      throw new Error('DOM 初始化失败')
    }
    const app = createApp(Main)
    app.provide('bus', bus)
    app.mount(this.#dom)
    this.#instance = app
  }

  constructor() {
    this.#initDom()
    bus.on('action', payload => {
      console.log('action', payload)
    })
  }

  show() {
    this.#render()
    console.log(this.#instance)
  }
}

