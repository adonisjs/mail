/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import sinon from 'sinon'
import { Edge } from 'edge.js'
import { test } from '@japa/runner'
import { Emitter } from '@adonisjs/core/events'
import { AppFactory } from '@adonisjs/core/factories/app'
import SMTPTransport from 'nodemailer/lib/smtp-transport/index.js'

import { MailManager } from '../../src/mail_manager.js'
import { MailResponse } from '../../src/mail_response.js'
import { SMTPDriver } from '../../src/drivers/smtp/main.js'
import { MailgunDriver } from '../../src/drivers/mailgun/main.js'
import { MailEvents, MailgunSentMessageInfo } from '../../src/types.js'
import { MemoryQueueMessenger } from '../../src/messengers/memory_queue.js'
import { JSONDriver } from '../../src/drivers/json/main.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('Mail manager', () => {
  test('configure mail manager with multiple drivers', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      mailers: {
        smtp: () =>
          new SMTPDriver({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunDriver({
            key: process.env.MAILGUN_ACCESS_KEY!,
            baseUrl: process.env.MAILGUN_BASE_URL!,
            domain: process.env.MAILGUN_DOMAIN!,
          }),
      },
    })

    expectTypeOf(mail.use).parameters.toMatchTypeOf<[('mailgun' | 'smtp')?]>()
    expectTypeOf(mail.use('mailgun').driver).toMatchTypeOf<MailgunDriver>()
    expectTypeOf(mail.use('smtp').driver).toMatchTypeOf<SMTPDriver>()
    expectTypeOf(mail.send).returns.toMatchTypeOf<
      Promise<MailResponse<SMTPTransport.SentMessageInfo> | MailResponse<MailgunSentMessageInfo>>
    >()
    assert.instanceOf(mail.use('mailgun').driver, MailgunDriver)
    assert.instanceOf(mail.use('smtp').driver, SMTPDriver)
  })

  test('send email using the default mailer', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      default: 'smtp',
      mailers: {
        smtp: () =>
          new SMTPDriver({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunDriver({
            key: process.env.MAILGUN_ACCESS_KEY!,
            baseUrl: process.env.MAILGUN_BASE_URL!,
            domain: process.env.MAILGUN_DOMAIN!,
          }),
      },
    })

    const response = await mail.send((message) => {
      message.from(process.env.MAILTRAP_EMAIL!)
      message.to(process.env.TEST_EMAILS_RECIPIENT!)
      message.cc(process.env.TEST_EMAILS_CC!)
      message.subject('Adonisv5')
      message.html('<p> Hello Adonis </p>')
    })

    assert.exists(response.original)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.MAILTRAP_EMAIL!)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  })

  test('queue email using the default mailer', async ({ assert }) => {
    assert.plan(3)
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      default: 'smtp',
      mailers: {
        smtp: () =>
          new SMTPDriver({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunDriver({
            key: process.env.MAILGUN_ACCESS_KEY!,
            baseUrl: process.env.MAILGUN_BASE_URL!,
            domain: process.env.MAILGUN_DOMAIN!,
          }),
      },
    })

    mail.setMessenger(() => {
      return {
        async queue({ message }) {
          assert.deepEqual(message.to, [process.env.TEST_EMAILS_RECIPIENT!])
          assert.deepEqual(message.cc, [process.env.TEST_EMAILS_CC!])
          assert.equal(message.from, process.env.MAILTRAP_EMAIL!)
        },
      }
    })

    await mail.sendLater((message) => {
      message.from(process.env.MAILTRAP_EMAIL!)
      message.to(process.env.TEST_EMAILS_RECIPIENT!)
      message.cc(process.env.TEST_EMAILS_CC!)
      message.subject('Adonisv5')
      message.html('<p> Hello Adonis </p>')
    })
  })

  test('throw error when no default mailer is defined and trying to use the default mailer', async ({
    assert,
  }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      mailers: {
        smtp: () =>
          new SMTPDriver({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunDriver({
            key: process.env.MAILGUN_ACCESS_KEY!,
            baseUrl: process.env.MAILGUN_BASE_URL!,
            domain: process.env.MAILGUN_DOMAIN!,
          }),
      },
    })

    await assert.rejects(
      () => mail.send(() => {}),
      'Cannot create mailer instance. No default mailer is defined in the config'
    )
  })

  test('throw error trying to use an unknown mailer', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      mailers: {
        smtp: () =>
          new SMTPDriver({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunDriver({
            key: process.env.MAILGUN_ACCESS_KEY!,
            baseUrl: process.env.MAILGUN_BASE_URL!,
            domain: process.env.MAILGUN_DOMAIN!,
          }),
      },
    })

    assert.throws(
      () => mail.use('foo' as any),
      'Unknow mailer "foo". Make sure it is configured inside the config file'
    )
  })

  test('cache mailers', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      default: 'smtp',
      mailers: {
        smtp: () =>
          new SMTPDriver({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunDriver({
            key: process.env.MAILGUN_ACCESS_KEY!,
            baseUrl: process.env.MAILGUN_BASE_URL!,
            domain: process.env.MAILGUN_DOMAIN!,
          }),
      },
    })

    assert.strictEqual(mail.use('mailgun'), mail.use('mailgun'))
    assert.strictEqual(mail.use('smtp'), mail.use('smtp'))
  })

  test('configure messenger for mailers', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      default: 'smtp',
      mailers: {
        smtp: () =>
          new SMTPDriver({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunDriver({
            key: process.env.MAILGUN_ACCESS_KEY!,
            baseUrl: process.env.MAILGUN_BASE_URL!,
            domain: process.env.MAILGUN_DOMAIN!,
          }),
      },
    })

    mail.use('mailgun')
    mail.setMessenger((mailer) => {
      assert.oneOf(mailer.name, ['mailgun', 'smtp'])
      return new MemoryQueueMessenger(mailer)
    })

    mail.use('smtp')
  })

  test('configure template engine for mailers', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const edge = new Edge()

    const mail = new MailManager(emitter, {
      mailers: {
        mailer1: () => new JSONDriver(),
        mailer2: () => new JSONDriver(),
      },
    })

    edge.registerTemplate('foo', {
      template: `Hello {{ username }}`,
    })

    const mailer1 = mail.use('mailer1')
    mail.setTemplateEngine(edge)
    const mailer2 = mail.use('mailer2')

    const response1 = await mailer1.send((message) => {
      message.htmlView('foo', { username: 'virk' })
    })
    const response2 = await mailer2.send((message) => {
      message.htmlView('foo', { username: 'virk' })
    })

    assert.equal(JSON.parse(response1.original.message).html, 'Hello virk')
    assert.equal(JSON.parse(response2.original.message).html, 'Hello virk')
  })

  test('use fakes for testing emails', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      mailers: {
        mailer1: () => new JSONDriver(),
        mailer2: () => new JSONDriver(),
      },
    })

    const { messages } = mail.fake()
    await mail.use('mailer1').send((message) => {
      message.to('foo@bar.com')
      message.subject('Verify email address')
    })

    messages.assertSent({ subject: 'Verify email address' })
    assert.lengthOf(messages.sent(), 1)

    mail.restore()
    assert.lengthOf(messages.sent(), 0)

    await mail.use('mailer1').send((message) => {
      message.to('foo@bar.com')
      message.subject('Verify email address')
    })

    messages.assertNotSent({ subject: 'Verify email address' })
    assert.lengthOf(messages.sent(), 0)
  })

  test('close all mailers and remove from cache', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const smtpDriver = new SMTPDriver({
      host: process.env.MAILTRAP_SMTP_HOST!,
      auth: {
        type: 'login' as const,
        user: process.env.MAILTRAP_USERNAME!,
        pass: process.env.MAILTRAP_PASSWORD!,
      },
    })
    const mailgunDriver = new MailgunDriver({
      key: process.env.MAILGUN_ACCESS_KEY!,
      baseUrl: process.env.MAILGUN_BASE_URL!,
      domain: process.env.MAILGUN_DOMAIN!,
    })

    const mail = new MailManager(emitter, {
      mailers: {
        smtp: () => smtpDriver,
        mailgun: () => mailgunDriver,
      },
    })

    const mailgun = mail.use('mailgun')
    const smtp = mail.use('smtp')

    const mailgunCloseSpy = sinon.spy(mailgunDriver, 'close')
    const smtpCloseSpy = sinon.spy(smtpDriver, 'close')

    await mail.closeAll()

    /**
     * Assert the close methods were closed on both
     * the mailer's drivers
     */
    assert.isTrue(mailgunCloseSpy.calledOnce)
    assert.isTrue(smtpCloseSpy.calledOnce)

    /**
     * Assert the mailer instances are fresh and
     * not cached copies
     */
    assert.notStrictEqual(mail.use('mailgun'), mailgun)
    assert.notStrictEqual(mail.use('smtp'), smtp)
  })
})
