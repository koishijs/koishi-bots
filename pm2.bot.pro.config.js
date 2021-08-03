const env = 'pro'

module.exports = {
  apps: [{
    name: `gocq:second-jie:${env}`,
    script: 'yarn',
    args: `go-cqhttp -n second-jie -e ${env} -s linux-amd64`.split(' '),
    out_file: '.log/gocq:second-jie.log',
    error_file: '.log/gocq:second-jie.error.log'
  }, {
    name: `second-jie:${env}`,
    script: 'yarn',
    args: [`start:${env}`],
    out_file: '.log/second-jie.log',
    error_file: '.log/second-jie.error.log'
  }]
}
