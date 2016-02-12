'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/* global it, describe, before, after */
const chai = require('chai')
const expect = chai.expect
const path = require('path')
const fs = require('co-fs-extra')
const MailParser = require('mailparser').MailParser
const Log = require('../../src/Mail/drivers/Log')
const Message = require('../../src/Mail/MailManager/message')
require('co-mocha')

const Helpers = {
  storagePath: function () {
    return path.join(__dirname, './storage/logs/mail.eml')
  }
}

describe('Log driver', function () {
  before(function * () {
    yield fs.ensureFile(Helpers.storagePath())
  })

  after(function * () {
    yield fs.remove(path.join(__dirname, './storage'))
  })

  it('should be able to write MIME representation of email to a file', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.to[0].address).to.equal('virk@foo.com')
      expect(mail_object.from[0].address).to.equal('virk@bar.com')
      expect(mail_object.subject).to.equal('Hello world')
      expect(mail_object.html).to.equal('<h2>Hello world</h2>')
      expect(mail_object.text).to.equal('Hello world')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to set from name', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com', 'Harminder Virk')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.from[0].name).to.equal('Harminder Virk')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to set to name', function * (done) {
    const message = new Message()
    message.to('virk@foo.com', 'Harminder Virk')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.to[0].name).to.equal('Harminder Virk')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to define cc', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.cc('virk@baz.com', 'Harminder Virk')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.cc[0].name).to.equal('Harminder Virk')
      expect(mail_object.cc[0].address).to.equal('virk@baz.com')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to define multiple to fields', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.to('virk@baz.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.to.length).to.equal(2)
      expect(mail_object.to[0].address).to.equal('virk@foo.com')
      expect(mail_object.to[1].address).to.equal('virk@baz.com')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to set sender on email', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.sender('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.headers.sender).to.equal('virk@bar.com')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to set replyTo on email', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.replyTo('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.replyTo[0].address).to.equal('virk@bar.com')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to set priority on email', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.priority('high')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.headers['x-priority']).to.equal('high')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to set header on email using key value pair', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.header('x-id', 1)
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.headers['x-id']).to.equal('1')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to set headers on email using an array of headers', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.header([{key: 'x-id', value: 2}, {key: 'x-user', value: 'doe'}])
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.headers['x-id']).to.equal('2')
      expect(mail_object.headers['x-user']).to.equal('doe')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to set email subject', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.html('<h2>Hello world</h2>')
    message.text('Hello world')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.subject).to.equal('Hello world')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to attach file to email', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.attach(path.join(__dirname, './assets/logo_white.svg'))
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.attachments.length).to.equal(1)
      expect(mail_object.attachments[0].contentType).to.equal('image/svg+xml')
      expect(mail_object.attachments[0].fileName).to.equal('logo_white.svg')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to override attached file name', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.attach(path.join(__dirname, './assets/logo_white.svg'), {filename: 'logo.svg'})
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.attachments.length).to.equal(1)
      expect(mail_object.attachments[0].contentType).to.equal('image/svg+xml')
      expect(mail_object.attachments[0].fileName).to.equal('logo.svg')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to override attached file contentType', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.attach(path.join(__dirname, './assets/logo_white.svg'), {contentType: 'image/png'})
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.attachments.length).to.equal(1)
      expect(mail_object.attachments[0].contentType).to.equal('image/png')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to send raw data as attachment', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.attachData('hello world', 'a.txt')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.attachments.length).to.equal(1)
      expect(mail_object.attachments[0].contentType).to.equal('text/plain')
      expect(mail_object.attachments[0].fileName).to.equal('a.txt')
      expect(mail_object.attachments[0].content.toString('utf8')).to.equal('hello world')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })

  it('should be able to send embed images', function * (done) {
    const message = new Message()
    message.to('virk@foo.com')
    message.from('virk@bar.com')
    message.subject('Hello world')
    message.embed(path.join(__dirname, './assets/logo_white.svg'), 'LOGO')
    message.html('<img src="cid:LOGO" />')
    const log = new Log(Helpers)
    yield log.send(message.data)
    const mailparser = new MailParser()

    const emailLogs = yield fs.readFile(Helpers.storagePath(), 'utf8')
    const email = emailLogs.split(/-\s?Email Start\s?-/gi).pop().replace(/-\s?EMAIL END\s?-/i, '').trim()

    mailparser.on('end', function (mail_object) {
      expect(mail_object.html).to.equal('<img src="cid:LOGO" />')
      done()
    })

    mailparser.write(email)
    mailparser.end()
  })
})
