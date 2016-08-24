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
const Mail = require('../../src/Mail/Mail')
const LogDriver = require('../../src/Mail/Drivers').log
const chai = require('chai')
const expect = chai.expect
const path = require('path')
require('co-mocha')

const view = {
  make: function * (key) {
    switch (key) {
      case 'welcome':
        return '<h2>Welcome to Adonis</h2>'
      case 'welcome.text':
        return 'Welcome to Adonis'
      case 'welcome.watch':
        return '<h2>Welcome to Adonis</h2>'
    }
  }
}

const driver = {
  send: function * () {}
}

describe('Mail', function () {
  context('Mail', function () {
    it('should throw an error when callback is not defined when using send method', function * () {
      const m = new Mail(view, driver)
      try {
        yield m.send('user')
        expect(true).to.equal(false)
      } catch (e) {
        expect(e.message).to.equal('E_INVALID_PARAMETER: Mail.send expects callback to be a function')
      }
    })

    it('should throw an error when callback is not defined when using raw method', function * () {
      const m = new Mail(view, driver)
      try {
        yield m.raw('user')
        expect(true).to.equal(false)
      } catch (e) {
        expect(e.message).to.equal('E_INVALID_PARAMETER: Mail.raw expects callback to be a function')
      }
    })

    it('should set from field on mail body', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.from('virk@foo.com')
        expect(message.data.from).to.equal('virk@foo.com')
      })
    })

    it('should set from field on mail body with from name', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.from('virk@foo.com', 'Aman Virk')
        expect(message.data.from).to.equal('Aman Virk <virk@foo.com>')
      })
    })

    it('should set replyTo field on mail body', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.replyTo('virk@foo.com')
        expect(message.data.replyTo).to.equal('virk@foo.com')
      })
    })

    it('should set replyTo field on mail body with replyTo name', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.replyTo('virk@foo.com', 'Aman Virk')
        expect(message.data.replyTo).to.equal('Aman Virk <virk@foo.com>')
      })
    })

    it('should set sender field on mail body', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.sender('virk@foo.com')
        expect(message.data.sender).to.equal('virk@foo.com')
      })
    })

    it('should set sender field on mail body with sender name', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.sender('virk@foo.com', 'Aman Virk')
        expect(message.data.sender).to.equal('Aman Virk <virk@foo.com>')
      })
    })

    it('should set to field on mail body', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.to('virk@bar.com')
        expect(message.data.to).deep.equal(['virk@bar.com'])
      })
    })

    it('should set to field on mail body with to name', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.to('virk@bar.com', 'Virk')
        expect(message.data.to).deep.equal(['Virk <virk@bar.com>'])
      })
    })

    it('should be able to set multiple to emails', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.to('virk@bar.com', 'Virk')
        message.to('virk@foo.com')
        expect(message.data.to).deep.equal(['Virk <virk@bar.com>', 'virk@foo.com'])
      })
    })

    it('should set cc field on mail body', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.cc('virk@bar.com')
        expect(message.data.cc).deep.equal(['virk@bar.com'])
      })
    })

    it('should set cc field on mail body with cc name', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.cc('virk@bar.com', 'Aman')
        expect(message.data.cc).deep.equal(['Aman <virk@bar.com>'])
      })
    })

    it('should be able to set multiple cc emails', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.cc('virk@bar.com', 'Aman')
        message.cc('virk@virk.com')
        expect(message.data.cc).deep.equal(['Aman <virk@bar.com>', 'virk@virk.com'])
      })
    })

    it('should set bcc field on mail body', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.bcc('virk@bar.com')
        expect(message.data.bcc).deep.equal(['virk@bar.com'])
      })
    })

    it('should set bcc field on mail body with bcc name', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.bcc('virk@bar.com', 'Aman')
        expect(message.data.bcc).deep.equal(['Aman <virk@bar.com>'])
      })
    })

    it('should be able to set multiple bcc emails', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.bcc('virk@bar.com', 'Aman')
        message.bcc('virk@virk.com')
        expect(message.data.bcc).deep.equal(['Aman <virk@bar.com>', 'virk@virk.com'])
      })
    })

    it('should be able to set email subject', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.subject('Hello world')
        expect(message.data.subject).to.equal('Hello world')
      })
    })

    it('should throw an error when email priority is not one of the defined levels', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        const fn = function () {
          return message.priority('foo')
        }
        expect(fn).to.throw('InvalidArgumentException: E_INVALID_PARAMETER: Email priority must be high, low or normal')
      })
    })

    it('should be able to set email priority', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.priority('normal')
        expect(message.data.priority).to.equal('normal')
      })
    })

    it('should be able to set email headers as an array', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        const xTime = new Date().getTime()
        message.headers([{key: 'X-TIME', value: xTime}])
        expect(message.data.headers[0].value).to.equal(xTime)
      })
    })

    it('should be able to set email headers using key value as method arguments', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        const xTime = new Date().getTime()
        message.header('X-TIME', xTime)
        expect(message.data.headers[0].value).to.equal(xTime)
      })
    })

    it('should attach file using raw text', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.attachData('Hello world', 'hello.txt')
        expect(message.data.attachments[0].content).to.equal('Hello world')
        expect(message.data.attachments[0].filename).to.equal('hello.txt')
      })
    })

    it("should attach file using it's path", function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.attach('../../package.json')
        expect(message.data.attachments[0].path).to.equal('../../package.json')
      })
    })

    it('should embed file using cid', function * () {
      const m = new Mail(view, driver)
      yield m.send('user', {}, function (message) {
        message.embed('../../package.json', 'packagefile')
        expect(message.data.attachments[0].cid).to.equal('packagefile')
      })
    })

    it('should set html view when an array with first item is passed', function * () {
      const m = new Mail(view, driver)
      yield m.send(['welcome'], {}, function (message) {
        expect(message.data.html).to.equal('<h2>Welcome to Adonis</h2>')
      })
    })

    it('should set html and text view when an array with two items has been passed', function * () {
      const m = new Mail(view, driver)
      yield m.send(['welcome', 'welcome.text'], {}, function (message) {
        expect(message.data.html).to.equal('<h2>Welcome to Adonis</h2>')
        expect(message.data.text).to.equal('Welcome to Adonis')
      })
    })

    it('should set html, text and watch view when an array with three items has been passed', function * () {
      const m = new Mail(view, driver)
      yield m.send(['welcome', 'welcome.text', 'welcome.watch'], {}, function (message) {
        expect(message.data.html).to.equal('<h2>Welcome to Adonis</h2>')
        expect(message.data.text).to.equal('Welcome to Adonis')
        expect(message.data.watchHtml).to.equal('<h2>Welcome to Adonis</h2>')
      })
    })

    it('should set text view when first item in array is empty', function * () {
      const m = new Mail(view, driver)
      yield m.send(['', 'welcome.text', 'welcome.watch'], {}, function (message) {
        expect(message.data.html).to.equal(undefined)
        expect(message.data.text).to.equal('Welcome to Adonis')
        expect(message.data.watchHtml).to.equal('<h2>Welcome to Adonis</h2>')
      })
    })

    it('should set watch view when first two items in array are empty', function * () {
      const m = new Mail(view, driver)
      yield m.send(['', '', 'welcome.watch'], {}, function (message) {
        expect(message.data.html).to.equal(undefined)
        expect(message.data.text).to.equal(undefined)
        expect(message.data.watchHtml).to.equal('<h2>Welcome to Adonis</h2>')
      })
    })

    it('should return the driver transport using getTransport method', function () {
      const Config = {
        get: function () {
          return {toPath: null}
        }
      }
      const driver = new LogDriver(Config)
      const m = new Mail(view, driver)
      expect(m.getTransport().use).to.be.a('function')
    })

    it('should send config key to the driver using send method', function * () {
      let configKey = null
      class Dummy {
        * send (message, config) {
          configKey = config
        }
      }
      const m = new Mail(view, new Dummy())
      yield m.send('view', {}, function () {}, 'mail.other')
      expect(configKey).to.equal('mail.other')
    })

    it('should send config key to the driver using raw method', function * () {
      let configKey = null
      class Dummy {
        * send (message, config) {
          configKey = config
        }
      }
      const m = new Mail(view, new Dummy())
      yield m.raw('view', function () {}, 'mail.other')
      expect(configKey).to.equal('mail.other')
    })

    it('should set view as html view when view value is string', function () {
      const m = new Mail(view, driver)
      const views = m._returnViews('welcome')
      expect(views).to.be.an('object')
      expect(views.htmlView).to.equal('welcome')
      expect(views.textView).to.equal(null)
      expect(views.watchView).to.equal(null)
    })

    it('should set view as html view an array with single item is passed', function () {
      const m = new Mail(view, driver)
      const views = m._returnViews(['welcome'])
      expect(views).to.be.an('object')
      expect(views.htmlView).to.equal('welcome')
      expect(views.textView).to.equal(null)
      expect(views.watchView).to.equal(null)
    })

    it('should set html and text view an array with couple of items have been passed', function () {
      const m = new Mail(view, driver)
      const views = m._returnViews(['welcome', 'welcome.text'])
      expect(views).to.be.an('object')
      expect(views.htmlView).to.equal('welcome')
      expect(views.textView).to.equal('welcome.text')
      expect(views.watchView).to.equal(null)
    })

    it('should set html, text and watch view an array with 3 items have been passed', function () {
      const m = new Mail(view, driver)
      const views = m._returnViews(['welcome', 'welcome.text', 'welcome.watch'])
      expect(views).to.be.an('object')
      expect(views.htmlView).to.equal('welcome')
      expect(views.textView).to.equal('welcome.text')
      expect(views.watchView).to.equal('welcome.watch')
    })

    it('should thrown an error when an empty array is passed', function () {
      const m = new Mail(view, driver)
      const fn = function () {
        return m._returnViews([])
      }
      expect(fn).to.throw('InvalidArgumentException: E_INVALID_MAIL_VIEW: Make sure to specify a view for your email')
    })

    it('should thrown an error when an empty string is passed', function () {
      const m = new Mail(view, driver)
      const fn = function () {
        return m._returnViews('')
      }
      expect(fn).to.throw('InvalidArgumentException: E_INVALID_MAIL_VIEW: Make sure to specify a view for your email')
    })

    it('should thrown an error when an null is passed', function () {
      const m = new Mail(view, driver)
      const fn = function () {
        return m._returnViews(null)
      }
      expect(fn).to.throw('InvalidArgumentException: E_INVALID_MAIL_VIEW: Make sure to specify a view for your email')
    })

    it('should not thrown an error when an array with text only view is defined', function () {
      const m = new Mail(view, driver)
      const views = m._returnViews(['', 'welcome.text'])
      expect(views).to.be.an('object')
      expect(views.htmlView).to.equal(null)
      expect(views.textView).to.equal('welcome.text')
      expect(views.watchView).to.equal(null)
    })
  })

  context('Sending Fake Email', function () {
    let driverMessage = null
    const messageView = {
      make: function * (template) {
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
      const m = new Mail(messageView, smtpDriver)
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
