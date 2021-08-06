import { merge } from 'koishi-utils'
import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

/** @typedef {{
  cqBotNames: string[],
  database: {
    type: 'mongodb' | 'mysql' | string,
    host: string,
    port: number,
    username: string,
    password: string,
    name: string
  }
}} EnvConfig */

/**
 * 获取当前环境配置数据
 *
 * @param {string} [env=process.env.NODE_ENV] - 当前运行环境，默认使用环境变量中的 NODE_ENV 变量，变量不存在时使用 'dev'
 * @return {EnvConfig}
 */
export default (env) => {
  !env && (env = process.env.NODE_ENV || 'dev')
  return /** @type {EnvConfig} */ merge(
    yaml.load(fs.readFileSync(path.resolve(process.cwd(), `.env/.${env}.yml`))),
    yaml.load(fs.readFileSync(path.resolve(process.cwd(), `.env/.common.yml`))),
  )
}
