'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const MailManager = require('../../src/Mail/MailManager')
const CE = require('../../src/Exceptions/index')
const test = require('japa')
const { ioc } = require('@adonisjs/fold')
const fs = require('fs')
const path = require('path')
const got = require('got')

const Config = {
  get: (key) => {
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

ioc.bind('Config', () => {
  return Config
})

const View = {
  render: async (name) => {
    return new Promise((resolve, reject) => {
      fs.readFile(`${path.join(__dirname, './views/' + name + '.html')}`, (error, contents) => {
        if (error) reject(error)
        else resolve(contents.toString('utf8'))
      })
    })
  }
}
const mailManager = new MailManager(View, Config)

test.group('Smtp driver', () => {
  test.skip('should not create the driver instance, until one of the mailing methods have been called', (assert) => {
    const mailManager = new MailManager()
    assert.equal(mailManager instanceof MailManager, true)
  })

  test.skip('should throw an error when driver is not found', (assert) => {
    const mailManager = new MailManager()
    const fn = () => {
      return mailManager.driver('foo')
    }
    assert.throws(fn, CE.RuntimeException, 'E_INVALID_MAIL_DRIVER: Unable to locate foo mail driver')
  })

  test.skip('should be able to extend mail provider', async (assert) => {
    class Dummy {
      async send () {
        return 'send called'
      }
    }
    MailManager.extend('dummy', new Dummy())
    const Config = {
      get: () => {
        return 'dummy'
      }
    }
    const mailManager = new MailManager(View, Config)
    const i = await mailManager.send('welcome', {}, () => {})
    assert.equal(i, 'send called')
  })

  test.skip('should not create the driver instance if already exists', async (assert) => {
    class Dummy {
      async send () {
        return 'send called'
      }
    }
    MailManager.extend('dummy', new Dummy())
    const Config = {
      get: () => {
        return 'dummy'
      }
    }
    const mailManager = new MailManager(View, Config)
    await mailManager.send('welcome', {}, () => {})
    await mailManager.raw('welcome', () => {})
    assert.equal(Object.keys(mailManager.driversPool).length, 1)
    assert.deepEqual(Object.keys(mailManager.driversPool), ['default'])
  })

  test.skip('should return the old driver instance if exists', async (assert) => {
    class Dummy {
      async send () {
        return 'send called'
      }
    }
    MailManager.extend('dummy', new Dummy())
    const Config = {
      get: () => {
        return 'dummy'
      }
    }
    const mailManager = new MailManager(View, Config)
    const mail = mailManager.driver('default')
    mail.driver.foo = 'bar'
    const mail1 = mailManager.driver('default')
    assert.equal(mail1.driver.foo, 'bar')
  })

  test.skip('should create the driver instance if does not exists', async (assert) => {
    class Dummy {
      async send () {
      }
    }

    class Custom {
      async send () {
      }
    }
    MailManager.extend('dummy', new Dummy())
    MailManager.extend('custom', new Custom())

    const Config = {
      get: () => {
        return 'dummy'
      }
    }

    const mailManager = new MailManager(View, Config)
    await mailManager.send('welcome', {}, () => {})
    await mailManager.driver('custom').raw('welcome', () => {})
    assert.equal(Object.keys(mailManager.driversPool).length, 2)
    assert.deepEqual(Object.keys(mailManager.driversPool), ['default', 'custom'])
  })

  test.skip('should return driver transport using getTransport method', (assert) => {
    const mailManager = new MailManager(View, Config)
    assert.isFunction(mailManager.getTransport().use)
  })

  test.skip('should return driver transport when new driver is retreived', (assert) => {
    class Dummy {
      constructor () {
        this.transport = 'foo'
      }
    }
    MailManager.extend('dummy', new Dummy())
    const mailManager = new MailManager()
    assert.equal(mailManager.driver('dummy').getTransport(), 'foo')
  })
})

test.group('Smtp driver, Sending Mail @smtpmail', (group) => {
  group.after(async () => {
    await got.patch(`${mailtrapUri}/clean`, {headers: mailTrapHeaders})
  })

  test.skip('should be able to send raw email', async (assert) => {
    await mailManager.raw('Hello world', (message) => {
      message.to('virk@inbox.mailtrap.io')
      message.from('random@bar.com')
      message.subject('This is a raw email')
    })
    const mailTrapResponse = await got(`${mailtrapUri}/messages`, {headers: mailTrapHeaders})
    const emailBody = JSON.parse(mailTrapResponse.body)[0]
    assert.equal(emailBody.subject, 'This is a raw email')
    assert.equal(emailBody.text_body.trim(), 'Hello world')
    assert.equal(emailBody.from_email, 'random@bar.com')
    assert.equal(emailBody.to_email, 'virk@inbox.mailtrap.io')
  })

  test.skip('should be able to send attachments with email', async (assert, done) => {
    await mailManager.raw('Email with attachment', (message) => {
      message.to('virk@inbox.mailtrap.io')
      message.from('random@bar.com')
      message.subject('Email with attachment')
      message.attach(path.join(__dirname, './assets/logo_white.svg'))
    })
    const mailTrapResponse = await got(`${mailtrapUri}/messages`, {headers: mailTrapHeaders})
    const emailId = JSON.parse(mailTrapResponse.body)[0].id
    const attachments = await got(`${mailtrapUri}/messages/${emailId}/attachments`, {headers: mailTrapHeaders})
    const attachment = JSON.parse(attachments.body)[0]
    assert.equal(attachment.filename, 'logo_white.svg')
    assert.equal(attachment.attachment_type, 'attachment')
    assert.equal(attachment.content_type, 'image/svg+xml')
    setTimeout(() => {
      done()
    }, 1000)
  })

  test.skip('should be able to send raw data as attachments with email', async (assert) => {
    await mailManager.raw('Email with raw attachment', (message) => {
      message.to('virk@inbox.mailtrap.io')
      message.from('random@bar.com')
      message.subject('Email with attachment')
      message.attachData('What\'s up', 'hello.txt')
    })
    const mailTrapResponse = await got(`${mailtrapUri}/messages`, {headers: mailTrapHeaders})
    const emailId = JSON.parse(mailTrapResponse.body)[0].id
    const attachments = await got(`${mailtrapUri}/messages/${emailId}/attachments`, {headers: mailTrapHeaders})
    const attachment = JSON.parse(attachments.body)[0]
    assert.equal(attachment.filename, 'hello.txt')
    assert.equal(attachment.attachment_type, 'attachment')
    assert.equal(attachment.content_type, 'text/plain')
  })

  test.skip('should be able to send email using a view', async (assert, done) => {
    await mailManager.send('welcome', {}, (message) => {
      message.to('virk@inbox.mailtrap.io')
      message.from('random@bar.com')
      message.subject('Welcome to adonis')
    })
    const mailTrapResponse = await got(`${mailtrapUri}/messages`, {headers: mailTrapHeaders})
    const emailBody = JSON.parse(mailTrapResponse.body)[0]
    assert.equal(emailBody.subject, 'Welcome to adonis')
    assert.equal(emailBody.html_body.trim(), '<h2> Welcome to adonis </h2>')
    setTimeout(() => {
      done()
    }, 1000)
  })

  test.skip('should be able to attach attachments using cid', async (assert) => {
    await mailManager.send('paris', {}, (message) => {
      message.to('virk@inbox.mailtrap.io')
      message.from('random@bar.com')
      message.subject('Welcome to adonis')
      message.embed(path.join(__dirname, './assets/paris-880754_960_720.jpg'), 'paris')
    })
    const mailTrapResponse = await got(`${mailtrapUri}/messages`, {headers: mailTrapHeaders})
    const emailBody = JSON.parse(mailTrapResponse.body)[0]
    assert.equal(emailBody.html_body.trim(), '<img src="cid:paris" />')
  })

  test.skip('should be able to send runtime config to the send method', async (assert, done) => {
    try {
      await mailManager.send('paris', {}, (message) => {
        message.to('virk@inbox.mailtrap.io')
        message.from('random@bar.com')
        message.subject('Welcome to adonis')
        message.embed(path.join(__dirname, './assets/paris-880754_960_720.jpg'), 'paris')
      }, 'smtp.invalid')
      assert.equal(true, false)
    } catch (e) {
      assert.match(e.message, /ECONNREFUSED/)
      setTimeout(() => {
        done()
      }, 1000)
    }
  })

  test.skip('should not override instance transport when sending runtime configKey', async (assert) => {
    try {
      await mailManager.send('paris', {}, (message) => {
        message.to('virk@inbox.mailtrap.io')
        message.from('random@bar.com')
        message.subject('Welcome to adonis')
        message.embed(path.join(__dirname, './assets/paris-880754_960_720.jpg'), 'paris')
      }, 'smtp.invalid')
      assert.equal(true, false)
    } catch (e) {
      assert.match(e.message, /ECONNREFUSED/)
      const response = await mailManager.send('paris', {}, (message) => {
        message.to('virk@inbox.mailtrap.io')
        message.from('random@bar.com')
        message.subject('Welcome to adonis')
        message.embed(path.join(__dirname, './assets/paris-880754_960_720.jpg'), 'paris')
      })
      assert.equal(response.accepted.length, 1)
    }
  })
})
