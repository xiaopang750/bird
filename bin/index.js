#!/usr/bin/env node

const path = require('path')
const program = require('commander')
const shell = require('shelljs')
const fs = require('fs')
const home = path.resolve(__dirname, '../')
const fly = `${home}/node_modules/.bin/fly`
const flightplanFile = `${home}/lib/fly.js`
const nowWorkDir = process.cwd()
const ge = require('../lib/ge')
const chalk = require('chalk')
const log = console.log // eslint-disable-line

let packageInfo
let nowProjectName

try {
  packageInfo = fs.readFileSync(`${nowWorkDir}/package.json`, 'utf8')
  nowProjectName = packageInfo.match(/"name"\s?:\s?"(\w+)"/)[1]
} catch (e) {
  log(chalk.red('not found projectName please check your package.json has name field!'))
}

program
  .version('1.0.0')

program
  .command('deploy')
  .option('-p, --port [1234]', 'which port you wanto use')
  .description('deploy to machine')
  .action(({ port = 7788 }) => {
    shell.exec(`${fly} deploy:test --flightplan ${flightplanFile} ${port} ${nowWorkDir} ${nowProjectName}`)
  })

program
  .command('ge')
  .description('generate project nginx template')
  .action(() => {
    ge(nowProjectName)
  })

program.parse(process.argv)
