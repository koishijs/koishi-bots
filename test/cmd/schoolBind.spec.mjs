import fs from 'fs'
import { expect } from 'chai'
import { App } from 'koishi-test-utils'
import { bindSchoolBindCmd } from '../../src/commands/schoolBind.mjs'

after(() => {
  fs.readdirSync('.data').filter(p => p.includes('test'))
    .forEach(p => fs.rmSync(`.data/${p}`))
  process.exit()
})

describe('Demo App', function () {
  this.timeout(5000)

  const app = new App({
    mockDatabase: true
  })
  const st = bindSchoolBindCmd(app)
  const superSes = app.session('001')

  before(async () => {
    await app.database.initUser('001', 4)
    await app.start()
  })

  it('should limit bind the last two.', async () => {
    await superSes.shouldReply('school-bind 201803120130 188757 -o 1-49', '绑定成功')
    await superSes.shouldReply('school-bind 201803120130 188757 -o 1-50', '绑定成功')
    await superSes.shouldReply('school-bind 201803120130 188757 -o 1-51', '绑定成功')
    expect(st.jobItemsMap['1-49-0']).to.be.eq(undefined)
    expect(st.jobItemsMap['1-50-0']).to.be.exist
    expect(st.jobItemsMap['1-51-0']).to.be.exist
  })
})
