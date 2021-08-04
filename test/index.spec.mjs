import { expect } from 'chai'
import { App } from 'koishi-test-utils'

describe('Demo', function () {
  /**
   * @param {number} one
   * @param {number} two
   * @return {number}
   */
  const sumOfTwoNum = (one, two) => one + two

  it('should return `1 + 1` val', async () => {
    expect(sumOfTwoNum(1, 1)).to.eq(2)
  })
})

describe('Demo App', function () {
  const app = new App({
    mockDatabase: true
  })

  before(async () => {
    await app.database.initUser('001', 4)
    await app.start()
  })

  const superSes = app.session('001')
})
