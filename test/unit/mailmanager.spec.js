'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/* global it, describe, context */
const MailManager = require('../../src/Mail/MailManager')
const LogDriver = require('../../src/Mail/drivers/Log')
const NE = require('node-exceptions')
const chai = require('chai')
const expect = chai.expect
const path = require('path')
require('co-mocha')

const view = {
  render: function * () {}
}

const driver = {
  send: function * () {}
}

describe('Mail', function () {
  context('MailManager', function () {
    it('should set from field on mail body', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.from('virk@foo.com')
        expect(message.data.from).to.equal('virk@foo.com')
      })
    })

    it('should set from field on mail body with from name', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.from('virk@foo.com', 'Aman Virk')
        expect(message.data.from).to.equal('Aman Virk <virk@foo.com>')
      })
    })

    it('should set replyTo field on mail body', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.replyTo('virk@foo.com')
        expect(message.data.replyTo).to.equal('virk@foo.com')
      })
    })

    it('should set replyTo field on mail body with replyTo name', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.replyTo('virk@foo.com', 'Aman Virk')
        expect(message.data.replyTo).to.equal('Aman Virk <virk@foo.com>')
      })
    })

    it('should set sender field on mail body', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.sender('virk@foo.com')
        expect(message.data.sender).to.equal('virk@foo.com')
      })
    })

    it('should set sender field on mail body with sender name', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.sender('virk@foo.com', 'Aman Virk')
        expect(message.data.sender).to.equal('Aman Virk <virk@foo.com>')
      })
    })

    it('should set to field on mail body', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.to('virk@bar.com')
        expect(message.data.to).deep.equal(['virk@bar.com'])
      })
    })

    it('should set to field on mail body with to name', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.to('virk@bar.com', 'Virk')
        expect(message.data.to).deep.equal(['Virk <virk@bar.com>'])
      })
    })

    it('should be able to set multiple to emails', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.to('virk@bar.com', 'Virk')
        message.to('virk@foo.com')
        expect(message.data.to).deep.equal(['Virk <virk@bar.com>', 'virk@foo.com'])
      })
    })

    it('should set cc field on mail body', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.cc('virk@bar.com')
        expect(message.data.cc).deep.equal(['virk@bar.com'])
      })
    })

    it('should set cc field on mail body with cc name', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.cc('virk@bar.com', 'Aman')
        expect(message.data.cc).deep.equal(['Aman <virk@bar.com>'])
      })
    })

    it('should be able to set multiple cc emails', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.cc('virk@bar.com', 'Aman')
        message.cc('virk@virk.com')
        expect(message.data.cc).deep.equal(['Aman <virk@bar.com>', 'virk@virk.com'])
      })
    })

    it('should set bcc field on mail body', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.bcc('virk@bar.com')
        expect(message.data.bcc).deep.equal(['virk@bar.com'])
      })
    })

    it('should set bcc field on mail body with bcc name', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.bcc('virk@bar.com', 'Aman')
        expect(message.data.bcc).deep.equal(['Aman <virk@bar.com>'])
      })
    })

    it('should be able to set multiple bcc emails', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.bcc('virk@bar.com', 'Aman')
        message.bcc('virk@virk.com')
        expect(message.data.bcc).deep.equal(['Aman <virk@bar.com>', 'virk@virk.com'])
      })
    })

    it('should be able to set email subject', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.subject('Hello world')
        expect(message.data.subject).to.equal('Hello world')
      })
    })

    it('should throw an error when email priority is not one of the defined levels', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        const fn = function () {
          return message.priority('foo')
        }
        expect(fn).to.throw(NE.InvalidArgumentException, /Priority must be/)
      })
    })

    it('should be able to set email priority', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.priority('normal')
        expect(message.data.priority).to.equal('normal')
      })
    })

    it('should be able to set email headers as an array', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        const xTime = new Date().getTime()
        message.headers([{key: 'X-TIME', value: xTime}])
        expect(message.data.headers[0].value).to.equal(xTime)
      })
    })

    it('should be able to set email headers using key value as method arguments', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        const xTime = new Date().getTime()
        message.header('X-TIME', xTime)
        expect(message.data.headers[0].value).to.equal(xTime)
      })
    })

    it('should attach file using raw text', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.attachData('Hello world', 'hello.txt')
        expect(message.data.attachments[0].content).to.equal('Hello world')
        expect(message.data.attachments[0].filename).to.equal('hello.txt')
      })
    })

    it("should attach file using it's path", function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.attach('../../package.json')
        expect(message.data.attachments[0].path).to.equal('../../package.json')
      })
    })

    it('should embed file using cid', function * () {
      const m = new MailManager(view, driver)
      yield m.send('user', {}, function (message) {
        message.embed('../../package.json', 'packagefile')
        expect(message.data.attachments[0].cid).to.equal('packagefile')
      })
    })

    it('should return the driver transport using getTransport method', function () {
      const Helpers = {
        storagePath: function () {}
      }
      const driver = new LogDriver(Helpers)
      const m = new MailManager(view, driver)
      expect(m.getTransport().use).to.be.a('function')
    })
  })

  context('Sending Fake Email', function () {
    let driverMessage = null
    const messageView = {
      render: function * (template) {
        if (template === 'index') {
          return 'Hello index'
        }
      }
    }

    const smtpDriver = {
      send: function * (message) {
        driverMessage = message
      }
    }

    it('should return send valid object to driver send method', function * () {
      this.timeout(5000)
      const m = new MailManager(messageView, smtpDriver)
      let expectedMessage = null
      yield m.send('index', {}, function (message) {
        message
          .from('harminder.virk@foo.com', 'Aman Virk')
          .to('virk@bar.com')
          .attach(path.join(__dirname, '../../.travis.yml'))
        expectedMessage = message.data
      })
      expect(expectedMessage).deep.equal(driverMessage)
    })
  })
})
