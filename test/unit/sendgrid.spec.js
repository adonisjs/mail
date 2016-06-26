'use strict'

/* global it, describe */
const chai = require('chai')
const path = require('path')
const expect = chai.expect
const SendGrid = require('../../src/Mail/drivers/SendGrid')
const Message = require('../../src/Mail/MailManager/message')
require('co-mocha')

const Config = {
  get: function () {
    return { apiKey: process.env.SENDGRID_APIKEY }
  }
}

const BadConfig = {
  get: function () {
    return { apiKey: 'invalid-api-key' }
  }
}

describe('SendGrid', function () {
  it('should be able to send email using sendgrid driver', function * () {
    this.timeout(0)
    const message = new Message()
    message.to('adonis-sg@sharklasers.com', 'test to')
    message.from('test@test.test', 'test from')
    message.subject('Hello world')
    message.text('Hello world')
    message.html('<b>Hello world</b>')
    const sengrid = new SendGrid(Config)
    const res = yield sengrid.send(message.data)
    expect(res.messageId).to.exist
  })

  it('should be able to send text only email using sendgrid driver', function * () {
    this.timeout(0)
    const message = new Message()
    message.to('adonis-sg@sharklasers.com', 'test to')
    message.from('test@test.test', 'test from')
    message.subject('Hello world')
    message.text('Hello world')
    const sengrid = new SendGrid(Config)
    const res = yield sengrid.send(message.data)
    expect(res.messageId).to.exist
  })

  it('should be able to send html only email using sendgrid driver', function * () {
    this.timeout(0)
    const message = new Message()
    message.to('adonis-sg@sharklasers.com', 'test to')
    message.from('test@test.test', 'test from')
    message.subject('Hello world')
    message.html('<b>Hello world</b>')
    const sengrid = new SendGrid(Config)
    const res = yield sengrid.send(message.data)
    expect(res.messageId).to.exist
  })

  it('should be able to send attachments using sendgrid', function * () {
    this.timeout(0)
    const message = new Message()
    message.to('adonis-sg@sharklasers.com', 'test to')
    message.from('test@test.test', 'test from')
    message.subject('mail with attachment')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    message.html('Hello world')
    const sengrid = new SendGrid(Config)
    const res = yield sengrid.send(message.data)
    expect(res.messageId).to.exist
  })

  it('should be able to send multiple attachments using sendgrid', function * () {
    this.timeout(0)
    const message = new Message()
    message.to('adonis-sg@sharklasers.com', 'test to')
    message.from('test@test.test', 'test from')
    message.subject('mail with attachment')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    message.attach(path.join(__dirname, './assets/paris-880754_960_720.jpg'))
    message.html('Hello world')
    const sengrid = new SendGrid(Config)
    const res = yield sengrid.send(message.data)
    expect(res.messageId).to.exist
  })

  it('should fail if no content is sent', function * () {
    this.timeout(0)
    const message = new Message()
    message.to('adonis-sg@sharklasers.com', 'test to')
    message.from('test@test.test', 'test from')
    message.subject('Hello world')
    const sengrid = new SendGrid(Config)
    try {
      yield sengrid.send(message.data)
      expect(true).to.equal(false)
    } catch (e) {
      expect(e.statusCode).to.equal(400)
    }
  })

  it('should fail if no sender is sent', function * () {
    this.timeout(0)
    const message = new Message()
    message.to('adonis-sg@sharklasers.com', 'test to')
    message.subject('Hello world')
    message.html('Hello world')
    const sengrid = new SendGrid(Config)
    try {
      yield sengrid.send(message.data)
      expect(true).to.equal(false)
    } catch (e) {
      expect(e.statusCode).to.equal(400)
    }
  })

  it('should throw an erorr when using wrong api key', function * () {
    this.timeout(0)
    const message = new Message()
    message.to('adonis-sg@sharklasers.com', 'test to')
    message.from('test@test.test', 'test from')
    message.subject('Hello world')
    message.html('Hello world')
    message.text('<b>Hello world</b>')
    const sengrid = new SendGrid(BadConfig)
    try {
      yield sengrid.send(message.data)
      expect(true).to.equal(false)
    } catch (e) {
      expect(e.statusCode).to.equal(401)
    }
  })
})
