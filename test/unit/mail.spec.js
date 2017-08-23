'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const Mail = require('../../src/Mail/Mail')
const LogDriver = require('../../src/Mail/MailDrivers').log
const CE = require('../../src/Exceptions')
const test = require('japa')
const path = require('path')

const view = {
  render: async (key) => {
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
  send: async () => {}
}

test.group('Mail', () => {
  test('should throw an error when callback is not defined when using send method', async (assert) => {
    const m = new Mail(view, driver)
    try {
      await m.send('user')
      assert.equal(true, false)
    } catch (e) {
      assert.equal(e.message, 'E_INVALID_PARAMETER: Mail.send expects callback to be a function')
    }
  })

  test('should throw an error when callback is not defined when using raw method', async (assert) => {
    const m = new Mail(view, driver)
    try {
      await m.raw('user')
      assert.equal(true, false)
    } catch (e) {
      assert.equal(e.message, 'E_INVALID_PARAMETER: Mail.raw expects callback to be a function')
    }
  })

  test('should set from field on mail body', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.from('virk@foo.com')
      assert.equal(message.data.from, 'virk@foo.com')
    })
  })

  test('should set from field on mail body with from name', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.from('virk@foo.com', 'Aman Virk')
      assert.equal(message.data.from, 'Aman Virk <virk@foo.com>')
    })
  })

  test('should set replyTo field on mail body', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.replyTo('virk@foo.com')
      assert.equal(message.data.replyTo, 'virk@foo.com')
    })
  })

  test('should set replyTo field on mail body with replyTo name', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.replyTo('virk@foo.com', 'Aman Virk')
      assert.equal(message.data.replyTo, 'Aman Virk <virk@foo.com>')
    })
  })

  test('should set sender field on mail body', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.sender('virk@foo.com')
      assert.equal(message.data.sender, 'virk@foo.com')
    })
  })

  test('should set sender field on mail body with sender name', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.sender('virk@foo.com', 'Aman Virk')
      assert.equal(message.data.sender, 'Aman Virk <virk@foo.com>')
    })
  })

  test('should set to field on mail body', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.to('virk@bar.com')
      assert.deepEqual(message.data.to, ['virk@bar.com'])
    })
  })

  test('should set to field on mail body with to name', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.to('virk@bar.com', 'Virk')
      assert.deepEqual(message.data.to, ['Virk <virk@bar.com>'])
    })
  })

  test('should be able to set multiple to emails', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.to('virk@bar.com', 'Virk')
      message.to('virk@foo.com')
      assert.deepEqual(message.data.to, ['Virk <virk@bar.com>', 'virk@foo.com'])
    })
  })

  test('should set cc field on mail body', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.cc('virk@bar.com')
      assert.deepEqual(message.data.cc, ['virk@bar.com'])
    })
  })

  test('should set cc field on mail body with cc name', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.cc('virk@bar.com', 'Aman')
      assert.deepEqual(message.data.cc, ['Aman <virk@bar.com>'])
    })
  })

  test('should be able to set multiple cc emails', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.cc('virk@bar.com', 'Aman')
      message.cc('virk@virk.com')
      assert.deepEqual(message.data.cc, ['Aman <virk@bar.com>', 'virk@virk.com'])
    })
  })

  test('should set bcc field on mail body', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.bcc('virk@bar.com')
      assert.deepEqual(message.data.bcc, ['virk@bar.com'])
    })
  })

  test('should set bcc field on mail body with bcc name', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.bcc('virk@bar.com', 'Aman')
      assert.deepEqual(message.data.bcc, ['Aman <virk@bar.com>'])
    })
  })

  test('should be able to set multiple bcc emails', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.bcc('virk@bar.com', 'Aman')
      message.bcc('virk@virk.com')
      assert.deepEqual(message.data.bcc, ['Aman <virk@bar.com>', 'virk@virk.com'])
    })
  })

  test('should be able to set email subject', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.subject('Hello world')
      assert.equal(message.data.subject, 'Hello world')
    })
  })

  test('should throw an error when email priority is not one of the defined levels', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      const fn = () => {
        return message.priority('foo')
      }
      assert.throws(fn, CE.InvalidArgumentException, 'E_INVALID_PARAMETER: Email priority must be high, low or normal')
    })
  })

  test('should be able to set email priority', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.priority('normal')
      assert.equal(message.data.priority, 'normal')
    })
  })

  test('should be able to set email headers as an array', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      const xTime = new Date().getTime()
      message.headers([{key: 'X-TIME', value: xTime}])
      assert.equal(message.data.headers[0].value, xTime)
    })
  })

  test('should be able to set email headers using key value as method arguments', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      const xTime = new Date().getTime()
      message.header('X-TIME', xTime)
      assert.equal(message.data.headers[0].value, xTime)
    })
  })

  test('should attach file using raw text', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.attachData('Hello world', 'hello.txt')
      assert.equal(message.data.attachments[0].content, 'Hello world')
      assert.equal(message.data.attachments[0].filename, 'hello.txt')
    })
  })

  test("should attach file using it's path", async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.attach('../../package.json')
      assert.equal(message.data.attachments[0].path, '../../package.json')
    })
  })

  test('should embed file using cid', async (assert) => {
    const m = new Mail(view, driver)
    await m.send('user', {}, (message) => {
      message.embed('../../package.json', 'packagefile')
      assert.equal(message.data.attachments[0].cid, 'packagefile')
    })
  })

  test('should set html view when an array with first item is passed', async (assert) => {
    const m = new Mail(view, driver)
    await m.send(['welcome'], {}, (message) => {
      assert.equal(message.data.html, '<h2>Welcome to Adonis</h2>')
    })
  })

  test('should set html and text view when an array with two items has been passed', async (assert) => {
    const m = new Mail(view, driver)
    await m.send(['welcome', 'welcome.text'], {}, (message) => {
      assert.equal(message.data.html, '<h2>Welcome to Adonis</h2>')
      assert.equal(message.data.text, 'Welcome to Adonis')
    })
  })

  test('should set html, text and watch view when an array with three items has been passed', async (assert) => {
    const m = new Mail(view, driver)
    await m.send(['welcome', 'welcome.text', 'welcome.watch'], {}, (message) => {
      assert.equal(message.data.html, '<h2>Welcome to Adonis</h2>')
      assert.equal(message.data.text, 'Welcome to Adonis')
      assert.equal(message.data.watchHtml, '<h2>Welcome to Adonis</h2>')
    })
  })

  test('should set text view when first item in array is empty', async (assert) => {
    const m = new Mail(view, driver)
    await m.send(['', 'welcome.text', 'welcome.watch'], {}, (message) => {
      assert.equal(message.data.html, undefined)
      assert.equal(message.data.text, 'Welcome to Adonis')
      assert.equal(message.data.watchHtml, '<h2>Welcome to Adonis</h2>')
    })
  })

  test('should set watch view when first two items in array are empty', async (assert) => {
    const m = new Mail(view, driver)
    await m.send(['', '', 'welcome.watch'], {}, (message) => {
      assert.equal(message.data.html, undefined)
      assert.equal(message.data.text, undefined)
      assert.equal(message.data.watchHtml, '<h2>Welcome to Adonis</h2>')
    })
  })

  test('should return the driver transport using getTransport method', (assert) => {
    const Config = {
      get: () => {
        return {toPath: null}
      }
    }
    const driver = new LogDriver(Config)
    const m = new Mail(view, driver)
    assert.isFunction(m.getTransport().use)
  })

  test('should send config key to the driver using send method', async (assert) => {
    let configKey = null
    class Dummy {
      async send (message, config) {
        configKey = config
      }
    }
    const m = new Mail(view, new Dummy())
    await m.send('view', {}, () => {}, 'mail.other')
    assert.equal(configKey, 'mail.other')
  })

  test('should send config key to the driver using raw method', async (assert) => {
    let configKey = null
    class Dummy {
      async send (message, config) {
        configKey = config
      }
    }
    const m = new Mail(view, new Dummy())
    await m.raw('view', () => {}, 'mail.other')
    assert.equal(configKey, 'mail.other')
  })

  test('should set view as html view when view value is string', (assert) => {
    const m = new Mail(view, driver)
    const views = m._returnViews('welcome')
    assert.isObject(views)
    assert.equal(views.htmlView, 'welcome')
    assert.equal(views.textView, null)
    assert.equal(views.watchView, null)
  })

  test('should set view as html view an array with single item is passed', (assert) => {
    const m = new Mail(view, driver)
    const views = m._returnViews(['welcome'])
    assert.isObject(views)
    assert.equal(views.htmlView, 'welcome')
    assert.equal(views.textView, null)
    assert.equal(views.watchView, null)
  })

  test('should set html and text view an array with couple of items have been passed', (assert) => {
    const m = new Mail(view, driver)
    const views = m._returnViews(['welcome', 'welcome.text'])
    assert.isObject(views)
    assert.equal(views.htmlView, 'welcome')
    assert.equal(views.textView, 'welcome.text')
    assert.equal(views.watchView, null)
  })

  test('should set html, text and watch view an array with 3 items have been passed', (assert) => {
    const m = new Mail(view, driver)
    const views = m._returnViews(['welcome', 'welcome.text', 'welcome.watch'])
    assert.isObject(views)
    assert.equal(views.htmlView, 'welcome')
    assert.equal(views.textView, 'welcome.text')
    assert.equal(views.watchView, 'welcome.watch')
  })

  test('should thrown an error when an empty array is passed', (assert) => {
    const m = new Mail(view, driver)
    const fn = () => {
      return m._returnViews([])
    }
    assert.throws(fn, CE.InvalidArgumentException, 'E_INVALID_MAIL_VIEW: Make sure to specify a view for your email')
  })

  test('should thrown an error when an empty string is passed', (assert) => {
    const m = new Mail(view, driver)
    const fn = () => {
      return m._returnViews('')
    }
    assert.throws(fn, CE.InvalidArgumentException, 'E_INVALID_MAIL_VIEW: Make sure to specify a view for your email')
  })

  test('should thrown an error when an null is passed', (assert) => {
    const m = new Mail(view, driver)
    const fn = () => {
      return m._returnViews(null)
    }
    assert.throws(fn, CE.InvalidArgumentException, 'E_INVALID_MAIL_VIEW: Make sure to specify a view for your email')
  })

  test('should not thrown an error when an array with text only view is defined', (assert) => {
    const m = new Mail(view, driver)
    const views = m._returnViews(['', 'welcome.text'])
    assert.isObject(views)
    assert.equal(views.htmlView, null)
    assert.equal(views.textView, 'welcome.text')
    assert.equal(views.watchView, null)
  })
})

test.group('Mail, Sending Fake Email', () => {
  let driverMessage = null
  const messageView = {
    render: async (template) => {
      if (template === 'index') {
        return 'Hello index'
      }
    }
  }

  const smtpDriver = {
    send: async (message) => {
      driverMessage = message
    }
  }

  test('should return send valid object to driver send method', async (assert) => {
    const m = new Mail(messageView, smtpDriver)
    let expectedMessage = null
    await m.send('index', {}, (message) => {
      message
        .from('harminder.virk@foo.com', 'Aman Virk')
        .to('virk@bar.com')
        .attach(path.join(__dirname, '../../.travis.yml'))
      expectedMessage = message.data
    })
    assert.deepEqual(expectedMessage, driverMessage)
  }).timeout(5000)
})
