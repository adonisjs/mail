'use strict'

/*
 * adonis-auth
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')

async function makeConfigFile (cli) {
  const driver = await cli.command.choice('Which mail driver you would like to use', [
    {
      name: 'SMTP',
      value: 'smtp'
    },
    {
      name: 'Mandrill',
      value: 'mandrill'
    },
    {
      name: 'Mailgun',
      value: 'mailgun'
    },
    {
      name: 'SES',
      value: 'ses'
    },
    {
      name: 'log',
      value: 'log'
    }
  ])

  try {
    await cli.makeConfig('mail.js', path.join(__dirname, './templates/mail.mustache'), {
      driver
    })

    cli.command.completed('create', 'config/mail.js')
  } catch (error) {
    console.log(error)
  }
}

module.exports = async (cli) => {
  await makeConfigFile(cli)
}
