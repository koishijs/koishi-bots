import { Tables } from 'koishi'

import MarkTool from '../tool/markTool.mjs'
import ScheduleTool from '../tool/scheduleTool.mjs'

/** @typedef {{
  uid: string,
  bot: string,
  ctime?: Date
}} JobDataItem */

Tables.extend('user', {
  school: {
    username: '',
    password: ''
  }
})

/**
 * @param {import('koishi').Context} ctx
 * @return {ScheduleTool}
 */
export const bindSchoolBindCmd = (ctx) => {
  const st = new ScheduleTool('mark' + (process.env.NODE_ENV === 'test' ? '-test' : ''), (jobData) => async () => {
    const query = {}
    jobData.map(j => j.uid.split(':')).forEach(([platform, id]) => {
      if (!query[platform]) { query[platform] = [] }
      query[platform].push(id)
    })
    const users = await ctx.database.get('user', query)

    for (let i = 0; i < users.length; i++) {
      try {
        const mt = new MarkTool(users[i].school.username, users[i].school.password)
        await mt.login()
        await mt.mark()
        ctx.logger('school-bind').info(`${users[i].id}, 打卡成功`)
      } catch (e) {
        ctx.logger('school-bind').error(e.message)
        const jobDataItem = jobData.filter(j => {
          const [platform, id] = j.uid.split(':')
          return users[i][platform] === id
        })[0]
        const [platform, selfId] = jobDataItem.bot.split(':')
        await ctx.getBot(platform, selfId).sendPrivateMessage(
          users[i][platform], `北京时间 ${new Date().toLocaleString()}：打卡失败请注意！\n${e.message}`
        )
      }
    }
  })

  ctx
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
      try {
        const friends = await (/** @type {import('koishi').Bot} */ session.bot).getFriendList()
        return friends.filter(f => f.userId === session.userId).length === 0 ? '你还不是机器人的好友哦。' : undefined
      } catch (e) { return undefined }
    })
    .action(async ({ session, options }, username, password) => {
      try {
        const mt = new MarkTool(username, password)
        await mt.login()
        session.user.school = { username, password }
        await session.user._update()

        const bot = /** @type {import('koishi').Bot} */ session.bot
        const item = {
          uid: session.uid, bot: `${bot.platform}:${bot.selfId}`
        }
        st.createSchedule(options.oneTime || '2', item)
        options.twoTime && st.createSchedule(options.twoTime, item)

        let count = 0
        const userJobIndexes = /** @type {Record<string, number[]>} */ {}
        for (const s in st.jobItemsMap) {
          const indexes = []
          st.jobItemsMap[s].forEach((j, index) => {
            if (j.uid === session.uid) indexes.push(index)
          })
          count += indexes.length
          userJobIndexes[s] = indexes
        }
        if (count > 2) {
          const waitRemoveItems = []
          Object.entries(userJobIndexes).forEach(([s, indexes]) => {
            indexes.forEach(index => {
              const cur = st.jobItemsMap[s][index]
              if (waitRemoveItems.length < count - 2) {
                waitRemoveItems.push([s, index, cur])
              } else {
                for (let i = 0; i < waitRemoveItems.length; i++) {
                  const [s0, index0, cur0] = waitRemoveItems[i]
                  if (cur.ctime < cur0.ctime) {
                    waitRemoveItems[i] = [s, index, cur]
                    break
                  }
                }
              }
            })
          })
          waitRemoveItems.forEach(([s, index]) => st.jobItemsMap[s].splice(index, 1))
          st.clearSchedule(s => st.jobItemsMap[s].length === 0)
        }
        return '绑定成功'
      } catch (e) {
        return e.message
      }
    })

  return st
}
