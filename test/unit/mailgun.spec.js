'use strict'

/**
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const path = require('path')
const MailGun = require('../../src/Mail/MailDrivers/index').mailgun
const Messages = require('../../src/Mail/Message')

const Config = {
  get: (key) => {
    if (key === 'mailgun.wrong') {
      return {
        domain: process.env.MAILGUN_DOMAIN,
        apiKey: 'blah'
      }
    }
    return {
      apiKey: process.env.MAILGUN_APIKEY,
      domain: process.env.MAILGUN_DOMAIN
    }
  }
}

test.group('MailGun', () => {
  test('should be able to send messages using mailgun', async (assert) => {
    const message = new Messages()
    message.to('virk@adonisjs.com')
    message.from('virk@bar.com')
    message.subject('New email')
    message.html('Hello world')
    const mailgun = new MailGun(Config)
    const r = await mailgun.send(message.data)
    assert.exists(r.messageId)
    assert.isArray(r.accepted)
    assert.equal(r.accepted.length, 1)
  }).timeout(0)

  test('should be able to send attachments using mailgun', async (assert) => {
    const message = new Messages()
    message.to('virk@adonisjs.com')
    message.from('virk@bar.com')
    message.subject('mail with attachment')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    message.html('Hello world')
    const mailgun = new MailGun(Config)
    const r = await mailgun.send(message.data)
    assert.exists(r.messageId)
    assert.isArray(r.accepted)
    assert.equal(r.accepted.length, 1)
  }).timeout(0)

  test('should throw an erorr when using wrong api key', async (assert) => {
    const message = new Messages()
    message.to('virk@adonisjs.com')
    message.from('virk@bar.com')
    message.subject('mail with attachment')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    message.html('Hello world')
    const mailgun = new MailGun(Config)
    try {
      await mailgun.send(message.data, 'mailgun.wrong')
      assert.equal(true, false)
    } catch (e) {
      assert.equal(e, 'Forbidden')
    }
  }).timeout(0)
})
