const fs = require('fs')
const os = require('os')
const mkdirp = require('mkdirp')
let userHomeDir = os.homedir()
let nginxTemplateFile = `${userHomeDir}/.bird/template.conf`
let defaultNginxTemplateFile = `${__dirname}/nginxDefault.tmp`
let existsTemplateFile = fs.existsSync(nginxTemplateFile)
let nginxConf

if (existsTemplateFile) {
  nginxConf = fs.readFileSync(nginxTemplateFile, 'utf8')
} else {
  nginxConf = fs.readFileSync(defaultNginxTemplateFile, 'utf8')
}

module.exports = projectName => {
  let destFileLocation = `${userHomeDir}/.bird/${projectName}.conf`

  mkdirp.sync(`${userHomeDir}/.bird`)
  fs.writeFileSync(destFileLocation, nginxConf)
}
