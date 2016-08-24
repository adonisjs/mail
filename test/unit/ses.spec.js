'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/* global it, describe */
const chai = require('chai')
const expect = chai.expect
const Ses = require('../../src/Mail/drivers').ses
const Message = require('../../src/Mail/Message')
require('co-mocha')

const Config = {
  get: function () {
    return {
      accessKeyId: process.env.SES_KEY,
      secretAccessKey: process.env.SES_SECRET,
      region: 'us-west-2'
    }
  }
}

describe('SES driver', function () {
  it('should be able to send email using ses driver', function * () {
    this.timeout(0)
    const message = new Message()
    message.to('success@simulator.amazonses.com')
    message.from(process.env.SES_EMAIL)
    message.subject('Hello world')
    message.html('Hello world')
    const ses = new Ses(Config)
    const res = yield ses.send(message.data)
    expect(res.messageId).to.exist
  })
})
