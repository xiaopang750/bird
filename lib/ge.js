const fs = require('fs')
const os = require('os')
let userHomeDir = os.homedir()
let nginxTemplateFile = `${userHomeDir}/.fly/template.conf`
let defaultNginxTemplateFile = `${__dirname}/nginxDefault.tmp`
let existsTemplateFile = fs.existsSync(nginxTemplateFile)
let nginxConf

if (existsTemplateFile) {
  nginxConf = fs.readFileSync(nginxTemplateFile, 'utf8')
} else {
  nginxConf = fs.readFileSync(defaultNginxTemplateFile, 'utf8')
}

module.exports = projectName => {
  let destFileLocation = `${userHomeDir}/.fly/${projectName}.conf`

  fs.writeFileSync(destFileLocation, nginxConf)
}
