import axios from 'axios'
import * as qs from 'querystring'
import crypto from 'crypto'
import dayjs from 'dayjs'

import dotenv from '../dotenv.mjs'

/**
 * @param {string} str
 * @return {string}
 */
const md5 = (str) => {
  const hash = crypto.createHash('md5')
  hash.update(str)
  return hash.digest('hex')
}

/**
 * @param {string} pwd
 * @return {string}
 */
const strHandle = (pwd) => {
  if(pwd.length > 5){
    pwd = pwd.substring(0, 5) + 'a' + pwd.substring(5, pwd.length)
  }
  if(pwd.length > 10){
    pwd = pwd.substring(0, 10) + 'b' + pwd.substring(10, pwd.length)
  }
  pwd = pwd.substring(0, pwd.length - 2)
  return pwd
}

export default class MarkTool {
  /** @type {string} */ uid
  /** @type {string} */ username
  /** @type {string} */ password

  /** @type {Object} */ markData

  /** @type {import('axios').AxiosInstance} */ axios

  constructor (username, password) {
    this.username = username
    this.password = password
    this.axios = axios.create()
    this.axios.defaults.baseURL = (/** @type {{
      urls: { school: string }
    }} */ dotenv()).urls.school
  }

  async mark() {
    if (this.markData === undefined) {
      const message = await this.refreshMarkData()
      if (!message.success) return '无法获取最近打卡信息'
    }
    const lastMarkDate = dayjs(this.markData.createTime)
    const curDate      = dayjs()
    const lastMarkIsToDay = curDate.isSame(lastMarkDate)

    if (this.uid === undefined) {
      return 'uid未获取到，无法打卡 请检查密码是否有误'
    }
    const defaultDataObjs = {
      'twM': { dm: '01', mc: '[35.0~37.2]正常', alias: 'tw' },
      'yczk': { dm: '01', mc: '无症状', },
      'brStzk': { dm: '01', mc: '身体健康、无异常', },
      'brJccry': { dm: '01', mc: '未接触传染源', },
      'jrStzk': { dm: '01', mc: '身体健康、无异常', },
      'jrJccry': { dm: '01', mc: '未接触传染源', }
    }
    const dealDataObjs = {
    }
    const mergeData = {}
    const mergeKeys = [ 'sfzx', 'jzdDz', 'jzdDz2', 'lxdh', 'dkd', 'dkdz', ]
    for (const key in this.markData) {
      const item = this.markData[key]
      if (item instanceof Object) {
        dealDataObjs[`${key}.dm`] = item.dm ?? defaultDataObjs[key].dm
        dealDataObjs[`${
          defaultDataObjs[key]?.alias ?? key
        }1`] = item.mc ?? defaultDataObjs[key].mc
      }
      if (mergeKeys.indexOf(key) !== -1) {
        mergeData[key] = item ?? '0'
      }
    }
    for (const key in defaultDataObjs) {
      const item = this.markData[key]
      dealDataObjs[`${key}.dm`] = item?.dm ?? defaultDataObjs[key].dm
      dealDataObjs[`${
        defaultDataObjs[key]?.alias ?? key
      }1`]   = item?.mc ?? defaultDataObjs[key].mc
    }

    const formData = {
      '_t_s_':         new Date().getTime(),
      'sflx':          0,
      'dkly':          'baidu',
      'operationType': lastMarkIsToDay ? 'Update' : 'Create',

      'jzdValue':      [this.markData['jzdSheng']['dm'], this.markData['jzdShi'  ]['dm'], this.markData['jzdXian' ]['dm']].join(','),
      'bz':            '',
      'dm':            lastMarkIsToDay ? this.markData.dm : ''
      , ...dealDataObjs
      , ...mergeData
    }

    const resp = await this.axios.post(`/content/student/temp/zzdk?${qs.stringify(formData)}`, undefined, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    })
    if (resp.status === 200) {
      const errors = resp.data?.errorInfoList ?? []
      if (errors.length === 0) {
        return '打卡失败'
      }
      return errors.reduce((a, b) => a + `[${b.code}] ${b.message};\n`, '')
    }
    return resp.statusText || '服务器响应错误'
  }

  async refreshMarkData() {
    try {
      const resp = await this.axios.get('/content/student/temp/zzdk/lastone')
      if (resp.status === 200) {
        this.uid = resp.data['userid']
        this.markData = resp.data
        return resp.data
      }
    } catch (e) {
      const message = await this.getMark((await this.getMarks(1)).marks[0]['DM'])
      this.markData = message.data
      return message
    }
    return '服务器响应错误'
  }

  /**
   * @param {number} size
   * @return {Promise<string | Object>}
   */
  async getMarks(size) {
    try {
      const resp = await this.axios.get('/content/tabledata/student/temp/zzdk', {
        params: {
          'iSortingCols':   '1',
          'iDisplayStart':  '0',
          'iDisplayLength': size,
          'iSortCol_0':     '1',
          'sSortDir_0':     'desc',
          '_t_s_':          this.uid
        }
      })
      if (resp.status === 200) {
        return {
          'total': resp.data?.iTotalRecords ?? 0,
          'marks': resp.data?.aaData ?? []
        }
      }
      return resp.statusText || '服务器响应错误'
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * @param {string} markId
   * @return {Promise<string | Object>}
   */
  async getMark(markId) {
    const resp = await this.axios.get(`/content/student/temp/zzdk/${markId}?_t_s_=${+new Date()}`)
    if (resp.status === 200) {
      this.uid = resp.data['userid']
      return resp.data
    }
    return resp.statusText || '服务器响应错误'
  }

  async login() {
    const resp = await this.axios.post(`/website/login?username=${this.username}&password=${strHandle(md5(this.password))}`)
    if (resp.data.error === true) throw new Error(resp.data.msg)
    axios.defaults.headers.Cookie = resp.headers['set-cookie'][0].split(';')[0]
  }
}
