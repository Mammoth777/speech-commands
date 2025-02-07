# Speech Commands Recognition

基于 Web SpeechRecognition 的触发词识别

## 快速开始

```bash
const manager = new SpeechCommandsManager({ lang: 'zh-CN' }); // default lang is 'zh-CN'

manager.addCommand('你好', () => {
  console.log('你好 👋');
});

manager.start();
manager.stop();
```

## 功能

- [ ] 动态设置触发词
- [ ] 识别触发词
- [ ] 基于读音(拼音)的触发词识别
- [ ] 模糊匹配(内容待补充)
- [ ] 识别触发词后的后续处理