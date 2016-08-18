'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/* global it, describe, context, after */
const Mail = require('../../src/Mail')
const chai = require('chai')
const Ioc = require('adonis-fold').Ioc
const NE = require('node-exceptions')
const fs = require('fs')
const path = require('path')
const co = require('co')
const got = require('got')
const expect = chai.expect
require('co-mocha')

const Config = {
  get: function (key) {
    switch (key) {
      case 'mail.driver':
        return 'smtp'
      case 'smtp.invalid':
        return {}
      case 'mail.smtp':
        return {
          host: 'mailtrap.io',
          pool: true,
          port: 2525,
          auth: {
            user: process.env.MAILTRAP_USERNAME,
            pass: process.env.MAILTRAP_PASSWORD
          }
        }
    }
  }
}

const mailtrapUri = 'https://mailtrap.io/api/v1/inboxes/28268'
const mailTrapHeaders = {'Api-Token': process.env.MAILTRAP_APIKEY}

Ioc.bind('Config', function () {
  return Config
})

const View = {
  make: function * (name) {
    return new Promise(function (resolve, reject) {
      fs.readFile(`${path.join(__dirname, './views/' + name + '.html')}`, function (error, contents) {
        if (error) reject(error)
        else resolve(contents.toString('utf8'))
      })
    })
  }
}
const mail = new Mail(View, Config)

describe('Smtp driver', function () {
  context('Mail', function () {
    it('should not create the driver instance, until one of the mailing methods have been called', function () {
      const mail = new Mail()
      expect(mail instanceof Mail).to.equal(true)
    })

    it('should throw an error when driver is not found', function () {
      const mail = new Mail()
      const fn = function () {
        return mail.driver('foo')
      }
      expect(fn).to.throw(NE.DomainException, /Unable to locate foo mail driver/)
    })

    it('should be able to extend mail provider', function * () {
      class Dummy {
        * send () {
          return 'send called'
        }
      }
      Mail.extend('dummy', new Dummy())
      const Config = {
        get: function () {
          return 'dummy'
        }
      }
      const mail = new Mail(View, Config)
      const i = yield mail.send('welcome', {}, function () {})
      expect(i).to.equal('send called')
    })

    it('should not create the driver instance if already exists', function * () {
      class Dummy {
        * send () {
          return 'send called'
        }
      }
      Mail.extend('dummy', new Dummy())
      const Config = {
        get: function () {
          return 'dummy'
        }
      }
      const mail = new Mail(View, Config)
      yield mail.send('welcome', {}, function () {})
      yield mail.raw('welcome', function () {})
      expect(Object.keys(mail.driversPool).length).to.equal(1)
      expect(Object.keys(mail.driversPool)).deep.equal(['default'])
    })

    it('should return the old driver instance if exists', function * () {
      class Dummy {
        * send () {
          return 'send called'
        }
      }
      Mail.extend('dummy', new Dummy())
      const Config = {
        get: function () {
          return 'dummy'
        }
      }
      const mail = new Mail(View, Config)
      const mailManager = mail.driver('default')
      mailManager.driver.foo = 'bar'
      const mailManager1 = mail.driver('default')
      expect(mailManager1.driver.foo).to.equal('bar')
    })

    it('should create the driver instance if does not exists', function * () {
      class Dummy {
        * send () {
        }
      }

      class Custom {
        * send () {
        }
      }
      Mail.extend('dummy', new Dummy())
      Mail.extend('custom', new Custom())

      const Config = {
        get: function () {
          return 'dummy'
        }
      }

      const mail = new Mail(View, Config)
      yield mail.send('welcome', {}, function () {})
      yield mail.driver('custom').raw('welcome', function () {})
      expect(Object.keys(mail.driversPool).length).to.equal(2)
      expect(Object.keys(mail.driversPool)).deep.equal(['default', 'custom'])
    })

    it('should return driver transport using getTransport method', function () {
      const mail = new Mail(View, Config)
      expect(mail.getTransport().use).to.be.a('function')
    })

    it('should return driver transport when new driver is retreived', function () {
      class Dummy {
        constructor () {
          this.transport = 'foo'
        }
      }
      Mail.extend('dummy', new Dummy())
      const mail = new Mail()
      expect(mail.driver('dummy').getTransport()).to.equal('foo')
    })
  })

  context('Sending Mail', function () {
    this.timeout(0)

    after(function * () {
      yield got.patch(`${mailtrapUri}/clean`, {headers: mailTrapHeaders})
    })

    it('should be able to send raw email', function * () {
      yield mail.raw('Hello world', function (message) {
        message.to('virk@inbox.mailtrap.io')
        message.from('random@bar.com')
        message.subject('This is a raw email')
      })
      const mailTrapResponse = yield got(`${mailtrapUri}/messages`, {headers: mailTrapHeaders})
      const emailBody = JSON.parse(mailTrapResponse.body)[0]
      expect(emailBody.subject).to.equal('This is a raw email')
      expect(emailBody.text_body.trim()).to.equal('Hello world')
      expect(emailBody.from_email).to.equal('random@bar.com')
      expect(emailBody.to_email).to.equal('virk@inbox.mailtrap.io')
    })

    it('should be able to send attachments with email', function (done) {
      co(function * () {
        yield mail.raw('Email with attachment', function (message) {
          message.to('virk@inbox.mailtrap.io')
          message.from('random@bar.com')
          message.subject('Email with attachment')
          message.attach(path.join(__dirname, './assets/logo_white.svg'))
        })
        const mailTrapResponse = yield got(`${mailtrapUri}/messages`, {headers: mailTrapHeaders})
        const emailId = JSON.parse(mailTrapResponse.body)[0].id
        const attachments = yield got(`${mailtrapUri}/messages/${emailId}/attachments`, {headers: mailTrapHeaders})
        const attachment = JSON.parse(attachments.body)[0]
        expect(attachment.filename).to.equal('logo_white.svg')
        expect(attachment.attachment_type).to.equal('attachment')
        expect(attachment.content_type).to.equal('image/svg+xml')
        setTimeout(() => {
          done()
        }, 1000)
      })
    })

    it('should be able to send raw data as attachments with email', function * () {
      yield mail.raw('Email with raw attachment', function (message) {
        message.to('virk@inbox.mailtrap.io')
        message.from('random@bar.com')
        message.subject('Email with attachment')
        message.attachData('What\'s up', 'hello.txt')
      })
      const mailTrapResponse = yield got(`${mailtrapUri}/messages`, {headers: mailTrapHeaders})
      const emailId = JSON.parse(mailTrapResponse.body)[0].id
      const attachments = yield got(`${mailtrapUri}/messages/${emailId}/attachments`, {headers: mailTrapHeaders})
      const attachment = JSON.parse(attachments.body)[0]
      expect(attachment.filename).to.equal('hello.txt')
      expect(attachment.attachment_type).to.equal('attachment')
      expect(attachment.content_type).to.equal('text/plain')
    })

    it('should be able to send email using a view', function (done) {
      co(function * () {
        yield mail.send('welcome', {}, function (message) {
          message.to('virk@inbox.mailtrap.io')
          message.from('random@bar.com')
          message.subject('Welcome to adonis')
        })
        const mailTrapResponse = yield got(`${mailtrapUri}/messages`, {headers: mailTrapHeaders})
        const emailBody = JSON.parse(mailTrapResponse.body)[0]
        expect(emailBody.subject).to.equal('Welcome to adonis')
        expect(emailBody.html_body.trim()).to.equal('<h2> Welcome to adonis </h2>')
        setTimeout(() => {
          done()
        }, 1000)
      })
    })

    it('should be able to attach attachments using cid', function * () {
      yield mail.send('paris', {}, function (message) {
        message.to('virk@inbox.mailtrap.io')
        message.from('random@bar.com')
        message.subject('Welcome to adonis')
        message.embed(path.join(__dirname, './assets/paris-880754_960_720.jpg'), 'paris')
      })
      const mailTrapResponse = yield got(`${mailtrapUri}/messages`, {headers: mailTrapHeaders})
      const emailBody = JSON.parse(mailTrapResponse.body)[0]
      expect(emailBody.html_body.trim()).to.equal('<img src="cid:paris" />')
    })

    it('should be able to send runtime config to the send method', function (done) {
      co(function * () {
        try {
          yield mail.send('paris', {}, function (message) {
            message.to('virk@inbox.mailtrap.io')
            message.from('random@bar.com')
            message.subject('Welcome to adonis')
            message.embed(path.join(__dirname, './assets/paris-880754_960_720.jpg'), 'paris')
          }, 'smtp.invalid')
          expect(true).to.equal(false)
        } catch (e) {
          expect(e.message).to.match(/ECONNREFUSED/)
          setTimeout(() => {
            done()
          }, 1000)
        }
      })
    })

    it('should not override instance transport when sending runtime configKey', function * () {
      try {
        yield mail.send('paris', {}, function (message) {
          message.to('virk@inbox.mailtrap.io')
          message.from('random@bar.com')
          message.subject('Welcome to adonis')
          message.embed(path.join(__dirname, './assets/paris-880754_960_720.jpg'), 'paris')
        }, 'smtp.invalid')
        expect(true).to.equal(false)
      } catch (e) {
        expect(e.message).to.match(/ECONNREFUSED/)
        const response = yield mail.send('paris', {}, function (message) {
          message.to('virk@inbox.mailtrap.io')
          message.from('random@bar.com')
          message.subject('Welcome to adonis')
          message.embed(path.join(__dirname, './assets/paris-880754_960_720.jpg'), 'paris')
        })
        expect(response.accepted.length).to.equal(1)
      }
    })
  })
})
