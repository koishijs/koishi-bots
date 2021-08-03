import { App } from 'koishi'

import 'koishi-adapter-onebot'

import dotenv from './dotenv.mjs'
import getCqBots from './getCqBots.mjs'

const app = new App({
  port: 8080,
  bots: getCqBots(['second-jie']).concat(/** @type { (import('koishi').BotOptions)[] } */ ([
    // 添加除了 onebot 协议以外的 bot 配置
  ]))
})

import * as mongo from 'koishi-plugin-mongo'
import * as mark from 'koishi-plugin-mark'

app.plugin(mongo, dotenv().database)
app.plugin(mark)

app.start().then(_ => {})
