'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

require('dotenv').load()
const test = require('japa')
const { ses: Ses } = require('../src/Mail/Drivers')

test.group('Ses', () => {
  test('send email', async (assert) => {
    const config = {
      apiVersion: '2010-12-01',
      accessKeyId: process.env.SES_KEY,
      secretAccessKey: process.env.SES_SECRET,
      region: 'us-west-2'
    }

    const ses = new Ses()
    ses.setConfig(config)

    const response = await ses.send({
      from: [process.env.SMTP_TO_EMAIL],
      to: [{ name: 'virk', address: process.env.SMTP_TO_EMAIL }],
      subject: 'Plain email',
      html: '<h2> Hello </h2>',
      attachments: [{
        filename: 'sample.txt',
        content: 'Hello world'
      }]
    })

    assert.isDefined(response.messageId)
  }).timeout(0)
})
