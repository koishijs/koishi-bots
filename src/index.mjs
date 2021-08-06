import { App } from 'koishi'

import 'koishi-adapter-onebot'

import getCqBots from './getCqBots.mjs'

const app = new App({
  port: 8080,
  bots: getCqBots(['second-jie']).concat(/** @type { (import('koishi').BotOptions)[] } */ ([
  ]))
})

app.start().then(_ => {})
