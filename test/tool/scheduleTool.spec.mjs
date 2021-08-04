import { expect } from 'chai'
import ScheduleTool from '../../src/tool/scheduleTool.mjs'
import fs from 'fs'

/** @typedef {{
  uid: string
}} JobDataItem */

after(() => {
  fs.readdirSync('.data').filter(p => p.includes('test'))
    .forEach(p => fs.rmSync(`.data/${p}`))
  process.exit()
})

describe('Basic', function () {
  this.timeout(5000)

  it('should run schedule when time arrive target.', (done) => {
    const jobItem = /** @type {JobDataItem} */ ({ uid: '1' })
    const hourAndMinute = `${new Date().getHours()}-${new Date().getMinutes()}`
    const second = new Date().getSeconds() + 1

    const st = new ScheduleTool('test0', (jobDataItems) => () => {
      expect(new Date().getSeconds()).to.be.eq(second)
      expect(jobDataItems).to.deep.include(jobItem)
      done()
    })
    st.createSchedule(hourAndMinute, jobItem, second)
  })

  it('should clear target jobs.', (done) => {
    const jobItem = /** @type {JobDataItem} */ ({ uid: '1' })
    const hourAndMinute = `${new Date().getHours()}-${new Date().getMinutes()}`
    const second0 = new Date().getSeconds() + 1
    const second1 = new Date().getSeconds() + 3

    const st = new ScheduleTool('test1', (jobDataItems) => () => {
      expect(new Date().getSeconds()).to.be.eq(second1)
      expect(jobDataItems).to.deep.include(jobItem)
      done()
    })
    st.createSchedule(hourAndMinute, jobItem, second0)
    st.createSchedule(hourAndMinute, jobItem, second1)
    st.clearSchedule((hourMinuteAndSecond) => hourMinuteAndSecond === `${hourAndMinute}-${second0}`)
  })

  it('should load default config and create job.', (done) => {
    const jobItem = /** @type {JobDataItem} */ ({ uid: '1', ctime: new Date() })
    const hourAndMinute = `${new Date().getHours()}-${new Date().getMinutes()}`
    const second0 = new Date().getSeconds() + 1
    fs.writeFileSync('.data/schedules-test2.json', JSON.stringify({
      [`${hourAndMinute}-${second0}`]: [jobItem]
    }))

    new ScheduleTool('test2', (jobDataItems) => () => {
      expect(new Date().getSeconds()).to.be.eq(second0)
      expect(jobDataItems).to.deep.include(jobItem)
      done()
    })
  })
})
