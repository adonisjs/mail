'use strict'

/* global it, describe */
const chai = require('chai')
const expect = chai.expect
const SendGrid = require('../../src/Mail/drivers/SendGrid')
const Message = require('../../src/Mail/MailManager/message')
require('co-mocha')

const Config = {
  get: function () {
    return {
      auth: { api_key: process.env.SENDGRID_APIKEY }
    }
  }
}

describe('SendGrid driver', function () {
  it('should be able to send email using sendgrid driver', function * () {
    this.timeout(0)
    const message = new Message()
    message.to('adonis-sg@sharklasers.com')
    message.from('test@test.test')
    message.subject('Hello world')
    message.html('Hello world')
    const sengrid = new SendGrid(Config)
    const res = yield sengrid.send(message.data)
    expect(res.message).to.equal('success')
  })
})
