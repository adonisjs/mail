'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const chai = require('chai')
const expect = chai.expect
const path = require('path')
const Mandrill = require('../../src/Mail/drivers/Mandrill')
const Messages = require('../../src/Mail/MailManager/message')
const got = require('got')
require('dotenv').config({path: path.join(__dirname, '../../.env')})

const Config = {
  get: function () {
    return {
      key: process.env.MANDRILL_APIKEY
    }
  }
}

const baseUri = 'https://mandrillapp.com/api/1.0/messages/info.json'

require('co-mocha')

describe('Mandrill driver', function() {

  it('should be able to send messages using mandrill', function * () {
    this.timeout(0)
    const message = new Messages()
    message.to('sent@test.mandrillapp.com')
    message.from('virk@bar.com')
    message.subject('mail with attachment')
    message.html('Hello world')
    const mandrill = new Mandrill(Config)
    const r = yield mandrill.send(message.data)
    expect(r.messageId).to.exist
    expect(r.accepted).to.be.an('array')
    expect(['sent', 'queued', 'scheduled'].indexOf(r.accepted[0].status)).to.be.at.least(0)
  })

  it('should be able to send attachments using mandrill', function * () {
    this.timeout(0)
    const message = new Messages()
    message.to('sent@test.mandrillapp.com')
    message.from('virk@bar.com')
    message.subject('mail with attachment')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    message.html('Hello world')
    const mandrill = new Mandrill(Config)
    const r = yield mandrill.send(message.data)
    expect(r.messageId).to.exist
    expect(r.accepted).to.be.an('array')
    expect(['sent', 'queued', 'scheduled'].indexOf(r.accepted[0].status)).to.be.at.least(0)
  })

})
