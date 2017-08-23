'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const path = require('path')
const Mandrill = require('../../src/Mail/MailDrivers/Mandrill')
const Messages = require('../../src/Mail/Message')

const Config = {
  get: (key) => {
    if (key === 'mandrill.wrong') {
      return {
        apiKey: 'blah'
      }
    }
    return {
      apiKey: process.env.MANDRILL_APIKEY
    }
  }
}

test.group('Mandrill driver', () => {
  test.skip('should be able to send messages using mandrill', async (assert) => {
    const message = new Messages()
    message.to('sent@test.mandrillapp.com')
    message.from('virk@bar.com')
    message.subject('mail with attachment')
    message.html('Hello world')
    const mandrill = new Mandrill(Config)
    const r = await mandrill.send(message.data)
    assert.exists(r.messageId)
    assert.isArray(r.accepted)
    // assert.(['sent', 'queued', 'scheduled'].indexOf(r.accepted[0].status)).to.be.at.least(0)
  }).timeout(0)

  test.skip('should be able to send attachments using mandrill', async (assert) => {
    const message = new Messages()
    message.to('sent@test.mandrillapp.com')
    message.from('virk@bar.com')
    message.subject('mail with attachment')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    message.html('Hello world')
    const mandrill = new Mandrill(Config)
    const r = await mandrill.send(message.data)
    assert.exists(r.messageId)
    assert.isArray(r.accepted)
    // assert.(['sent', 'queued', 'scheduled'].indexOf(r.accepted[0].status)).to.be.at.least(0)
  }).timeout(0)

  test.skip('should make use of new configuration when passing extra config key', async (assert) => {
    const message = new Messages()
    message.to('sent@test.mandrillapp.com')
    message.from('virk@bar.com')
    message.subject('mail with attachment')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    message.html('Hello world')
    const mandrill = new Mandrill(Config)
    try {
      await mandrill.send(message.data, 'mandrill.wrong')
      assert.equal(true, false)
    } catch (e) {
      assert.equal(e.message, 'Invalid API key')
    }
  }).timeout(0)

  test.skip('should not affect the actual instance transporter when sending different config option with send method', async (assert) => {
    const message = new Messages()
    message.to('sent@test.mandrillapp.com')
    message.from('virk@bar.com')
    message.subject('mail with attachment')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    message.html('Hello world')
    const mandrill = new Mandrill(Config)
    try {
      await mandrill.send(message.data, 'mandrill.wrong')
      assert.equal(true, false)
    } catch (e) {
      assert.equal(e.message, 'Invalid API key')
      const r = await mandrill.send(message.data)
      assert.exists(r.messageId)
      assert.isArray(r.accepted)
    }
  }).timeout(0)
})
