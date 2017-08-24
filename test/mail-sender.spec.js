'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

require('dotenv').load()
const test = require('japa')
const MailSender = require('../src/Mail/Sender')
const helpers = require('./helpers')
const { smtp: SmtpDriver } = require('../src/Mail/Drivers')

test.group('Mail sender', () => {
  test('send email using driver instance', async (assert) => {
    /**
     * Driver instance
     */
    const smtp = new SmtpDriver()
    smtp.setConfig({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    })

    /**
     * Using driver with the mail sender
     *
     * @type {MailSender}
     */
    const mailSender = new MailSender(smtp)

    /**
     * Sending email with a minimum delay, since mailtrap doesn't
     * allow sending more than 2 emails in 1 sec
     */
    const response = await helpers.processWithDelay(mailSender.send('', {}, (message) => {
      message.from(process.env.SMTP_FROM_EMAIL)
      message.to(process.env.SMTP_TO_EMAIL)
      message.subject('Hello everyone')
    }), 3 * 1000)

    assert.deepEqual(response.accepted, [process.env.SMTP_TO_EMAIL])
    assert.deepEqual(response.rejected, [])

    /**
     * Using mail trap api to verify email was received
     */
    const mail = await helpers.getMailTrapEmail()
    assert.equal(mail.subject, 'Hello everyone')

    /**
     * Cleaning the inbox
     */
    await helpers.cleanInbox()
  }).timeout(0)

  test('parse a single view for html', (assert) => {
    const sender = new MailSender()
    assert.deepEqual(sender._parseViews('welcome'), { html: 'welcome' })
  })

  test('parse an array of views', (assert) => {
    const sender = new MailSender()
    assert.deepEqual(sender._parseViews(['welcome']), { html: 'welcome' })
  })

  test('parse view for plain text', (assert) => {
    const sender = new MailSender()
    assert.deepEqual(sender._parseViews(['welcome.text', 'welcome']), { html: 'welcome', text: 'welcome.text' })
  })

  test('parse view for watch', (assert) => {
    const sender = new MailSender()
    assert.deepEqual(sender._parseViews(['welcome.watch', 'welcome']), {
      html: 'welcome',
      watch: 'welcome.watch'
    })
  })

  test('parse views for text and watch only', (assert) => {
    const sender = new MailSender()
    assert.deepEqual(sender._parseViews(['welcome.watch', 'welcome.text']), {
      text: 'welcome.text',
      watch: 'welcome.watch'
    })
  })

  test('send email as raw body', async (assert) => {
    /**
     * Driver instance
     */
    const smtp = new SmtpDriver()
    smtp.setConfig({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    })

    /**
     * Using driver with the mail sender
     *
     * @type {MailSender}
     */
    const mailSender = new MailSender(smtp)

    /**
     * Sending email with a minimum delay, since mailtrap doesn't
     * allow sending more than 2 emails in 1 sec
     */
    const response = await helpers.processWithDelay(mailSender.raw('the text', (message) => {
      message.from(process.env.SMTP_FROM_EMAIL)
      message.to(process.env.SMTP_TO_EMAIL)
      message.subject('Hello everyone')
    }), 3 * 1000)

    assert.deepEqual(response.accepted, [process.env.SMTP_TO_EMAIL])
    assert.deepEqual(response.rejected, [])

    /**
     * Using mail trap api to verify email was received
     */
    const mail = await helpers.getMailTrapEmail()
    assert.equal(mail.subject, 'Hello everyone')
    assert.equal(mail.text_body.trim(), 'the text')

    /**
     * Cleaning the inbox
     */
    await helpers.cleanInbox()
  }).timeout(0)

  test('render views via view instance', async (assert) => {
    const fakeDriver = {
      send () {}
    }

    const view = {
      _views: [],
      render (view, data) {
        this._views.push({ view, data })
      }
    }

    const sender = new MailSender(fakeDriver, view)
    await sender.send(['welcome', 'welcome.text', 'welcome.watch'], {}, function () {})
    assert.deepEqual(view._views, [
      {
        view: 'welcome',
        data: {}
      },
      {
        view: 'welcome.text',
        data: {}
      },
      {
        view: 'welcome.watch',
        data: {}
      }
    ])
  })
})
