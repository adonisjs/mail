'use strict'

/**
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/* global it, describe */
const chai = require('chai')
const expect = chai.expect
const path = require('path')
const MailGun = require('../../src/Mail/drivers/MailGun')
const Messages = require('../../src/Mail/MailManager/message')
require('co-mocha')

const Config = {
  get: function (key) {
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

describe('MailGun', function () {
  it('should be able to send messages using mailgun', function * () {
    this.timeout(0)
    const message = new Messages()
    message.to('sent@test.mailgun.com')
    message.from('virk@bar.com')
    message.subject('New email')
    message.html('Hello world')
    const mailgun = new MailGun(Config)
    const r = yield mailgun.send(message.data)
    expect(r.messageId).to.exist
    expect(r.accepted).to.be.an('array')
    expect(r.accepted.length).to.equal(1)
  })

  it('should be able to send attachments using mailgun', function * () {
    this.timeout(0)
    const message = new Messages()
    message.to('sent@test.mailgun.com')
    message.from('virk@bar.com')
    message.subject('mail with attachment')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    message.html('Hello world')
    const mailgun = new MailGun(Config)
    const r = yield mailgun.send(message.data)
    expect(r.messageId).to.exist
    expect(r.accepted).to.be.an('array')
    expect(r.accepted.length).to.equal(1)
  })

  it('should throw an erorr when using wrong api key', function * () {
    this.timeout(0)
    const message = new Messages()
    message.to('sent@test.mailgun.com')
    message.from('virk@bar.com')
    message.subject('mail with attachment')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    message.html('Hello world')
    const mailgun = new MailGun(Config)
    try {
      yield mailgun.send(message.data, 'mailgun.wrong')
      expect(true).to.equal(false)
    } catch (e) {
      expect(e).to.equal('Forbidden')
    }
  })
})
