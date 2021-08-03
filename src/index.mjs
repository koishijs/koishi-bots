import { App } from 'koishi'

import 'koishi-adapter-onebot'

import getCqBots from './getCqBots.mjs'

const app = new App({
  port: 8080,
  bots: getCqBots(['second-jie']).concat(/** @type { (import('koishi').BotOptions)[] } */ ([
    // 添加除了 onebot 协议以外的 bot 配置
  ]))
})

app.start().then(_ => {})
