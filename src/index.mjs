import { App } from 'koishi'

import 'koishi-adapter-onebot'

import dotenv from './dotenv.mjs'
import getCqBots from './getCqBots.mjs'

(async () => {
  const bots = getCqBots(dotenv().cqBotNames || [])
  try {
    bots.push(...(await import('./.bots.mjs')).default)
  } catch (e) {}
  const app = new App({
    bots, ...dotenv().server
  })

  try {
    const events = await import('./.events.mjs')
    events.beforeStart && events.beforeStart(app)
  } catch (e) {}
  await app.start()
})()
