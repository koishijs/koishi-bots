import fs from 'fs'
import nodeSchedule from 'node-schedule'

/** @typedef {{
  ctime?: Date
}} JobDataItem */
/** @typedef {(jobDataItems: JobDataItem[]) => () => void} ScheduleFun */
/** @typedef {(hourMinuteAndSecond: string) => boolean} CheckJob */

export class ScheduleTool {
  /** @type {string} */ type
  /** @type {Record<string, import('node-schedule').Job>} */
  jobs = {}
  /** @type {Record<string, JobDataItem[]>} */
  jobItemsMap = {
    '2-0-0': [], '12-0-0': []
  }
  /** @type {ScheduleFun} */
  scheduleFun

  get dataP () {
    return `.data/schedules-${this.type}.json`
  }

  /**
   * @param {string} type
   * @param {ScheduleFun} scheduleFun
   */
  constructor(type, scheduleFun) {
    this.type = type
    this.scheduleFun = scheduleFun

    if (!fs.existsSync('.data')) {
      fs.mkdirSync('.data')
    }
    if (!fs.existsSync(this.dataP)) {
      fs.writeFileSync(this.dataP, JSON.stringify(this.jobItemsMap))
    }
    this.jobItemsMap = JSON.parse(fs.readFileSync(this.dataP).toString())
  }

  /**
   * @param {string} hourAndMinute
   * @param {JobDataItem} jobDataItem
   * @param {number} [second=0]
   */
  createSchedule(hourAndMinute, jobDataItem, second = 0) {
    const [hour, minute = 0] = hourAndMinute.split('-')
    const key = `${hour}-${minute}-${second}`

    let jobDataItems = this.jobItemsMap[key]
    if (!jobDataItems) {
      this.jobItemsMap[key] = jobDataItems = []
      this.jobs[key] = nodeSchedule.scheduleJob(new nodeSchedule.RecurrenceRule(
        null, null, null, null, hour, minute, second
      ), this.scheduleFun(jobDataItems))
    }
    jobDataItem.ctime = new Date()
    jobDataItems.push(jobDataItem)
    fs.writeFileSync(this.dataP, JSON.stringify(this.jobItemsMap, null, 2))
  }

  /**
   * @param {CheckJob} check
   */
  clearSchedule(check) {
    for (const hourMinuteAndSecond in this.jobs) {
      const job = this.jobs[hourMinuteAndSecond]
      if (check(hourMinuteAndSecond)) {
        job.cancel()
        delete this.jobItemsMap[hourMinuteAndSecond]
        delete this.jobs[hourMinuteAndSecond]
      }
    }
    fs.writeFileSync(this.dataP, JSON.stringify(this.jobItemsMap, null, 2))
  }
}
