import fs from 'fs'
import yaml from 'js-yaml'
import { resolve } from 'path'
import commander from 'commander'
import { merge } from 'koishi-utils'
import { spawn } from 'child_process'

const sResolve = resolve
/**
 * @param pathSegments {string}
 * @return {string}
 */
const r = (...pathSegments) => {
  return sResolve(process.cwd(), ...pathSegments)
}

const pkg = JSON.parse(fs.readFileSync(r('package.json')).toString())

const program = new commander.Command()
program.version(
  pkg.version
).option(
  '-s, --system <system>',
  'choose your system.',
  'windows-amd'
).option(
  '-n, --name <name>',
  'choose name of your bot.'
).option(
  '-e, --env <env>',
  'choose your environment.',
  'dev'
).parse(process.argv)

/** @type {{
  system?: string,
  name: string,
  env?: string
}} */
const options = program.opts()

const filePaths = {
  gocqExe: r(`go-cqhttp/${options.system}/go-cqhttp${/.*[w|W]indows.*/.test(options.system) ? '.exe' : ''}`),
  config: r(`config.yml`),
  botConfig: r(`.config/${options.name}.yml`),
  envConfig: r(`.env/${options.name}.${options.env}.yml`),
  envTempConfig: r(`.env/${options.name}.temp.yml`),
  work: r(`go-cqhttp/.temp/${options.name}`)
}

function mergeTempConfigYml() {
  if (!fs.existsSync(filePaths.config))
    throw new Error(`The "cwd" directory does not exist config.yml`)
  if (!fs.existsSync(filePaths.botConfig))
    throw new Error(`The "go-cqhttp/.config" directory does not exist ${options.name}.yml`)
  if (!fs.existsSync(filePaths.envConfig))
    throw new Error(`The "go-cqhttp/.env" directory does not exist ${options.name}.${options.env}.yml`)
  const rootYml = yaml.load(fs.readFileSync(filePaths.config).toString())
  const botYml = yaml.load(fs.readFileSync(filePaths.botConfig).toString())
  const envYml = yaml.load(fs.readFileSync(filePaths.envConfig).toString())
  fs.writeFileSync(filePaths.envTempConfig, yaml.dump(merge(merge(botYml, envYml), rootYml)))
}

;(async () => {
  const args = []
  mergeTempConfigYml()

  if (!fs.existsSync(filePaths.work))
    fs.mkdirSync(filePaths.work, { recursive: true })

  args.push('-c', filePaths.envTempConfig)
  console.log(`> ./go-cqhttp/${options.system}/go-cqhttp ${args.join(' ')}`)
  const execCmd = spawn(filePaths.gocqExe, args, { cwd: filePaths.work })
  process.stdin.pipe(execCmd.stdin)
  execCmd.stdout.pipe(process.stdout)
  execCmd.stderr.pipe(process.stderr)

  const clear = () => {
    if (fs.existsSync(filePaths.envTempConfig))
      fs.rmSync(filePaths.envTempConfig)
  }
  execCmd.on('exit', clear)
  execCmd.on('SIGINT', clear)
  process.on('exit', clear)
  process.on('SIGINT', clear)
})()
