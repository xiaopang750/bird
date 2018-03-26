const _ = require('lodash')
const plan = require('flightplan')
const os = require('os')
const fs = require('fs')
const args = process.argv.slice(2)
const [port, cwd, projectName] = args.splice(3)
const mkdirp = require('mkdirp')
let userHomeDir = os.homedir()
let defaultConfig = require('./config')
let usersetConfigFileLocation = `${userHomeDir}/.bird/config.json`
let existsUsersetConfigFile = fs.existsSync(usersetConfigFileLocation)

const generateConfigFile = () => {
  mkdirp.sync(`${userHomeDir}/.bird`)
  fs.writeFileSync(usersetConfigFileLocation, JSON.stringify(defaultConfig, null, 4))
}

if (existsUsersetConfigFile) {
  let usersetConfig = fs.readFileSync(usersetConfigFileLocation, 'utf8')

  defaultConfig = JSON.parse(usersetConfig)
} else {
  generateConfigFile()
}

let {
  username,
  host,
  distDirName,
  entryHtmlName,
  remoteDir,
  remoteNginxDir,
} = defaultConfig

const getEntryAndNewEntryHtmlname = (cwd, port, distDirName, entryHtmlName) => {
  let entryHtml = `${cwd}/${distDirName}/${entryHtmlName}`
  let orgEntryHtmlName = entryHtml
  let lastIndexDot = entryHtml.lastIndexOf('.')
  let tmps = entryHtml.split('')

  tmps.splice(lastIndexDot, 0, `.${port}`)

  let renamedEntryHtml = tmps.join('')

  return {
    orgEntryHtmlName,
    renamedEntryHtml,
  }
}

const judgeAvaliablePort = (remoteNginxList, port) => {
  let result = true
  let portList = _.map(remoteNginxList, nginxConfName => nginxConfName.match(/\d+/)[0])
  let nowPortIndexInPortList = _.indexOf(portList, port)
  let nowConfName = `${projectName}.${port}.conf`

  if (nowPortIndexInPortList !== -1) {
    let inUseConfName = remoteNginxList[nowPortIndexInPortList]

    if (inUseConfName !== nowConfName) {
      result = false
    }
  }
  return result
}

plan.target('test', {
  username,
  host,
  agent: process.env.SSH_AUTH_SOCK
})

plan.local('deploy', local => {
  local.exec('ssh-add ~/.ssh/id_rsa')
})
plan.local('deploy', () => {
  let nginxConf = `${userHomeDir}/.bird/${projectName}.conf`
  let hasNignxConf = fs.existsSync(nginxConf)

  if (!hasNignxConf) {
    throw new Error('缺少nginx配置，请在~/.bird目录下配置${projectName}.conf文件 执行bird ge可自动生成')
  }
})
plan.remote('deploy', remote => {
  let portAvailable
  let remoteNginxList = remote.exec(`ls ${remoteNginxDir}`, { failsafe: true, silent: true }).stdout

  remoteNginxList = _.compact(remoteNginxList.split(/\n/))
  remoteNginxList = _.filter(remoteNginxList, nginxConfName => /.\d+./.test(nginxConfName))
  portAvailable = judgeAvaliablePort(remoteNginxList, port)

  if (!portAvailable) {
    throw new Error('该port被其他项目占用，试试其他port吧。')
  }
})
plan.local('deploy', local => {
  let { orgEntryHtmlName, renamedEntryHtml } = getEntryAndNewEntryHtmlname(cwd, port, distDirName, entryHtmlName)

  local.exec(`mv ${orgEntryHtmlName} ${renamedEntryHtml}`, {
    failsafe: true,
    silent: true,
  })
  local.exec(`rsync -r ${cwd}/${distDirName} --progress ${username}@${host}:${remoteDir}/${projectName}`, {
    silent: true,
  })
})
plan.remote('deploy', remote => {
  let nginxConfTemplate = fs.readFileSync(`${userHomeDir}/.bird/${projectName}.conf`, 'utf8')
  let nginxConf = _.template(nginxConfTemplate)({ port, projectName })

  remote.sudo(`sudo echo '${nginxConf}' > ${remoteNginxDir}/${projectName}.${port}.conf`, { silent: true })
  remote.sudo(`nginx -t`, { silent: true })
  remote.sudo(`nginx -s reload`, { silent: true })
  console.log(`deploy success the access url is http://${host}:${port}`) // eslint-disable-line
})
