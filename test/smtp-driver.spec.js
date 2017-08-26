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
const helpers = require('./helpers')
const { smtp: SmtpDriver } = require('../src/Mail/Drivers')

test.group('Stmp driver', (group) => {
  group.beforeEach(() => {
    this.config = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    }
  })

  test('newup smtp driver', (assert) => {
    const smtp = new SmtpDriver()
    smtp.setConfig(this.config)
    assert.instanceOf(smtp, SmtpDriver)
    assert.isDefined(smtp.transporter)
  })

  test('send plain email', async (assert) => {
    const smtp = new SmtpDriver()
    smtp.setConfig(this.config)

    const response = await helpers.processWithDelay(smtp.send({
      from: process.env.SMTP_FROM_EMAIL,
      to: process.env.SMTP_TO_EMAIL,
      subject: 'Plain email',
      html: '<h2> Hello </h2>'
    }), 3 * 1000)

    assert.deepEqual(response.accepted, [process.env.SMTP_TO_EMAIL])
    assert.deepEqual(response.rejected, [])

    const mail = await helpers.getMailTrapEmail()
    assert.equal(mail.subject, 'Plain email')
    assert.equal(mail.html_body.trim(), '<h2> Hello </h2>')

    await helpers.cleanInbox()
  }).timeout(0)

  test('send email with attachment', async (assert) => {
    const smtp = new SmtpDriver()
    smtp.setConfig(this.config)

    const response = await helpers.processWithDelay(smtp.send({
      from: process.env.SMTP_FROM_EMAIL,
      to: process.env.SMTP_TO_EMAIL,
      subject: 'Attachment email',
      html: '<h2> Attachment </h2>',
      attachments: [{
        filename: 'sample.txt',
        content: 'Hello world'
      }]
    }), 3 * 1000)

    assert.deepEqual(response.accepted, [process.env.SMTP_TO_EMAIL])
    assert.deepEqual(response.rejected, [])

    const mail = await helpers.getMailWithAttachments()
    assert.equal(mail.subject, 'Attachment email')
    assert.equal(mail.html_body.trim(), '<h2> Attachment </h2>')
    assert.lengthOf(mail.attachments, 1)
    assert.equal(mail.attachments[0].filename, 'sample.txt')

    await helpers.cleanInbox()
  }).timeout(0)

  test('throw errors if unable to send email', async (assert) => {
    assert.plan(1)
    this.config.auth.user = null
    const smtp = new SmtpDriver()
    smtp.setConfig(this.config)

    try {
      await helpers.processWithDelay(smtp.send({
        from: process.env.SMTP_FROM_EMAIL,
        to: process.env.SMTP_TO_EMAIL,
        subject: 'Attachment email',
        html: '<h2> Attachment </h2>',
        attachments: [{
          filename: 'sample.txt',
          content: 'Hello world'
        }]
      }), 3 * 1000)
    } catch ({ code }) {
      assert.equal(code, 'EAUTH')
    }
  }).timeout(0)
})
