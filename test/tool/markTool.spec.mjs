import MarkTool from '../../src/tool/markTool.mjs'

describe('Basic', function () {
  this.timeout(5000)

  it.skip('should mark.', async () => {
    const mt = new MarkTool('xxxx', 'xxxx')
    await mt.login()
    await mt.mark()
  })
})
