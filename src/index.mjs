import fs from 'fs'
import { App, Tables } from 'koishi'

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
import * as ppt from 'koishi-plugin-puppeteer'
import * as mark from 'koishi-plugin-mark'

app.plugin(mongo, dotenv().database)
app
  .plugin(ppt)
  .plugin(mark)

import nodeSchedule from 'node-schedule'
import MarkTool from './tool/markTool.mjs'

Tables.extend('user', {
  school: {
    username: '',
    password: ''
  }
})

/** @type {Record<string, import('node-schedule').Job>} */
const jobs = {}

/** @typedef {{
  uid: string,
  bot: string
}} JobDataItem */

/**
 * @param {string} hourAndMinute
 * @param {JobDataItem} jobDataItem
 */
const createSchedule = (hourAndMinute, jobDataItem) => {
  const [hour, minute = 0] = hourAndMinute.split('-')
  let jobData = jobDatas[`${hour}-${minute}`]
  let count = 0
  for (const jobHourAndMinute in jobDatas) {
    const jobD = jobDatas[jobHourAndMinute]
    const index = jobD.findIndex(jobItem => jobItem.uid === jobDataItem.uid)
    if (index > -1) {
      if (count++ === 0) continue
      // only del the first data
      jobD.splice(index, 1)
      if (jobD.length === 0) {
        jobs[jobHourAndMinute].cancel()
      }
      break
    }
  }
  if (!jobData) {
    jobData = []
    jobDatas[`${hour}-${minute}`] = jobData
    const rule = new nodeSchedule.RecurrenceRule(null, null, null, null, hour, minute)
    jobs[`${hour}-${minute}`] = nodeSchedule.scheduleJob(rule, async () => {
      const users = await app.database.get('user', jobData.map(j => j.uid), ['school'])
      for (let i = 0; i < users.length; i++) {
        try {
          const mt = new MarkTool(users[i].school.username, users[i].school.password)
          await mt.login()
          await mt.mark()
        } catch (e) {
          const [platform, selfId] = bot.split(':')
          await app.getBot(platform, selfId).sendPrivateMessage(uid, `北京时间 ${new Date().toLocaleString()}：打卡失败请注意！\n${e.message}`)
        }
      }
    })
  }
  jobData.push(jobDataItem)
  fs.writeFileSync('.data/mark-schedules.json', JSON.stringify(jobDatas, null, 2))
}

const jobDatas = (() => {
  /** @type {Record<string, JobDataItem[]>} */
  let jobDatas = {
    '2-0': [], '12-0': []
  }
  if (!fs.existsSync('.data')) {
    fs.mkdirSync('.data')
  }
  if (!fs.existsSync('.data/mark-schedules.json')) {
    fs.writeFileSync('.data/mark-schedules.json', JSON.stringify(jobDatas))
  }
  jobDatas = JSON.parse(fs.readFileSync('.data/mark-schedules.json').toString())
  return jobDatas
})()
for (const hourAndMinute in jobDatas) {
  jobDatas[hourAndMinute].forEach(jobDataItem => createSchedule(hourAndMinute, jobDataItem))
}

app
  .select('gid', ...['onebot:872057998', 'onebot:779733740'])
  .command('school-bind <username:string> <password:string>', '绑定你的学校账号')
  .userFields(['school'])
  .option('oneTime', '-o <hour-minute> 参数为时分，已 "-" 分割，默认 2 点。', { type: String })
  .option('twoTime', '-t <hour-minute> 参数为时分，已 "-" 分割，默认 12 点。', { type: String })
  .check(({ options }) => {
    if (options.oneTime || options.twoTime) {
      if (options.oneTime === options.twoTime) return 'oneTime 的值不能等于 twoTime 的值。'
      const [hour1, minute1 = 0] = (options?.oneTime ??  '2').split('-')
      const [hour2, minute2 = 0] = (options?.twoTime ?? '12').split('-')
      if (
        !Number.isInteger(+hour1) || !Number.isInteger(+minute1) ||
        !Number.isInteger(+hour2) || !Number.isInteger(+minute2)
      ) return 'oneTime、twoTime 的 hour 与 minute 必须为数字。'
    }
  })
  .check(({}, username, password) => (!username || !password) ? '请填写用户名与密码' : undefined)
  .check(async ({ session }) => {
    const friends = await (/** @type {import('koishi').Bot} */ session.bot).getFriendList()
    return friends.filter(f => f.userId === session.userId).length === 0 ? '你还不是机器人的好友哦。' : undefined
  })
  .action(async ({ session, options }, username, password) => {
    try {
      const mt = new MarkTool(username, password)
      await mt.login()
      session.user.school = { username, password }
      await session.user._update()

      const bot = /** @type {import('koishi').Bot} */ session.bot
      createSchedule(options?.oneTime ?? '2', {
        bot: `${bot.platform}:${bot.selfId}`, uid: session.uid
      })
      options.twoTime && createSchedule(options.twoTime, {
        bot: `${bot.platform}:${bot.selfId}`, uid: session.uid
      })
      return '绑定成功'
    } catch (e) {
      return e.message
    }
  })

app.on('mark/user-mark', async (_, mark, data) => {
  return `打卡成功，已连续打卡 ${await data.users[mark.uid].all.continuous} 天。`
})

import { bindSchoolBindCmd } from './commands/schoolBind.mjs'
bindSchoolBindCmd(app.select('gid', ...['onebot:872057998', 'onebot:779733740']))

app.start().then(_ => {})
