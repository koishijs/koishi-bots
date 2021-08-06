import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'

/**
 * @typedef {{
  servers: Record<string, {
    host: string,
    port: number,
    middlewares: {
      'access-token'?: string
    }
  }>[]
}} BotEnvConfig
 */

/**
 * 获取机器人配置数据
 *
 * @param {string[]} [botNames]  - bot 名字列表，会去搜索 bot 的配置自动加载
 * @param {string}   [env=process.env.NODE_ENV] - 当前运行环境，默认使用环境变量中的 NODE_ENV 变量，变量不存在时使用 'dev'
 * @return {import('koishi').BotOptions[]}
 */
export default (botNames, env) => {
  !env && (env = process.env.NODE_ENV || 'dev')

  return botNames.map(botNameAndSchema => {
    const [botName, schema = 'ws'] = botNameAndSchema.split(':')

    const botConfig = /** @type {{
      account: { uin: string }
    }} */ yaml.load(fs.readFileSync(path.resolve(process.cwd(), `.config/${botName}.yml`)))
    const envConfig = /** @type {BotEnvConfig} */ yaml.load(fs.readFileSync(path.resolve(process.cwd(), `.env/${botName}.${env}.yml`)))

    const serverConfig = envConfig.servers.filter(server => !!server[schema])[0][schema]

    const config = /** @type {import('koishi').BotOptions} */ ({
      type: 'onebot',
      server: `${schema}://${serverConfig.host}:${serverConfig.port}`,
      selfId: botConfig.account.uin
    })
    try { config.token = serverConfig.middlewares['access-token'] } catch (e) {}
    return config
  })
}
