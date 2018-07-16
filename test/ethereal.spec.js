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
const { ethereal: EtherealDriver } = require('../src/Mail/Drivers')

test.group('EtherealDriver driver', (group) => {
  test('newup ethereal driver', (assert) => {
    const driver = new EtherealDriver()
    driver.setConfig({})
    assert.instanceOf(driver, EtherealDriver)
    assert.isDefined(driver.transporter)
  })

  test('create test account and send email', async (assert) => {
    const ethereal = new EtherealDriver()
    let messageUrl = null

    ethereal.setConfig({
      log (url) {
        messageUrl = url
      }
    })

    const message = await ethereal.send({
      from: process.env.SMTP_FROM_EMAIL,
      to: process.env.SMTP_TO_EMAIL,
      subject: 'Plain email',
      html: '<h2> Hello </h2>'
    })

    assert.isDefined(message.messageId)
    assert.isDefined(messageUrl)
  }).timeout(0)
})
