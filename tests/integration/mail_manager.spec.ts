/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import sinon from 'sinon'
import { test } from '@japa/runner'
import { Emitter } from '@adonisjs/core/events'
import { AppFactory } from '@adonisjs/core/factories/app'
import NodeMailerTransport from 'nodemailer/lib/smtp-transport/index.js'

import { MailManager } from '../../src/mail_manager.js'
import { MailResponse } from '../../src/mail_response.js'
import { SMTPTransport } from '../../src/transports/smtp.js'
import { JSONTransport } from '../../src/transports/json.js'
import { MailgunTransport } from '../../src/transports/mailgun.js'
import { MailEvents, MailgunSentMessageInfo } from '../../src/types.js'
import { MemoryQueueMessenger } from '../../src/messengers/memory_queue.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('Mail manager', () => {
  test('configure mail manager with multiple transports', async ({ assert, expectTypeOf }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      mailers: {
        smtp: () =>
          new SMTPTransport({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunTransport({
            key: process.env.MAILGUN_ACCESS_KEY!,
            baseUrl: process.env.MAILGUN_BASE_URL!,
            domain: process.env.MAILGUN_DOMAIN!,
          }),
      },
    })

    expectTypeOf(mail.use).parameters.toMatchTypeOf<[('mailgun' | 'smtp')?]>()
    expectTypeOf(mail.use('mailgun').transport).toMatchTypeOf<MailgunTransport>()
    expectTypeOf(mail.use('smtp').transport).toMatchTypeOf<SMTPTransport>()
    expectTypeOf(mail.send).returns.toMatchTypeOf<
      Promise<
        MailResponse<NodeMailerTransport.SentMessageInfo> | MailResponse<MailgunSentMessageInfo>
      >
    >()
    assert.instanceOf(mail.use('mailgun').transport, MailgunTransport)
    assert.instanceOf(mail.use('smtp').transport, SMTPTransport)
  })

  test('send email using the default mailer', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      default: 'smtp',
      mailers: {
        smtp: () =>
          new SMTPTransport({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunTransport({
            key: process.env.MAILGUN_ACCESS_KEY!,
            baseUrl: process.env.MAILGUN_BASE_URL!,
            domain: process.env.MAILGUN_DOMAIN!,
          }),
      },
    })

    const response = await mail.send((message) => {
      message.from(process.env.MAILTRAP_FROM_EMAIL!)
      message.to(process.env.TEST_EMAILS_RECIPIENT!)
      message.cc(process.env.TEST_EMAILS_CC!)
      message.subject('Adonisv5')
      message.html('<p> Hello Adonis </p>')
    })

    assert.exists(response.original)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.MAILTRAP_FROM_EMAIL!)
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
          new SMTPTransport({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunTransport({
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
          assert.equal(message.from, process.env.MAILTRAP_FROM_EMAIL!)
        },
      }
    })

    await mail.sendLater((message) => {
      message.from(process.env.MAILTRAP_FROM_EMAIL!)
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
          new SMTPTransport({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunTransport({
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
          new SMTPTransport({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunTransport({
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
          new SMTPTransport({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunTransport({
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
          new SMTPTransport({
            host: process.env.MAILTRAP_SMTP_HOST!,
            auth: {
              type: 'login' as const,
              user: process.env.MAILTRAP_USERNAME!,
              pass: process.env.MAILTRAP_PASSWORD!,
            },
          }),
        mailgun: () =>
          new MailgunTransport({
            key: process.env.MAILGUN_ACCESS_KEY!,
            baseUrl: process.env.MAILGUN_BASE_URL!,
            domain: process.env.MAILGUN_DOMAIN!,
          }),
      },
    })

    mail.use('mailgun')
    mail.setMessenger((mailer) => {
      assert.oneOf(mailer.name, ['mailgun', 'smtp'])
      return new MemoryQueueMessenger(mailer, emitter)
    })

    mail.use('smtp')
  })

  test('use fakes for testing emails', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mail = new MailManager(emitter, {
      mailers: {
        mailer1: () => new JSONTransport(),
        mailer2: () => new JSONTransport(),
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
    const smtpTransport = new SMTPTransport({
      host: process.env.MAILTRAP_SMTP_HOST!,
      auth: {
        type: 'login' as const,
        user: process.env.MAILTRAP_USERNAME!,
        pass: process.env.MAILTRAP_PASSWORD!,
      },
    })
    const mailgunTransport = new MailgunTransport({
      key: process.env.MAILGUN_ACCESS_KEY!,
      baseUrl: process.env.MAILGUN_BASE_URL!,
      domain: process.env.MAILGUN_DOMAIN!,
    })

    const mail = new MailManager(emitter, {
      mailers: {
        smtp: () => smtpTransport,
        mailgun: () => mailgunTransport,
      },
    })

    const mailgun = mail.use('mailgun')
    const smtp = mail.use('smtp')

    const smtpCloseSpy = sinon.spy(smtpTransport, 'close')
    await mail.closeAll()

    /**
     * Assert the close methods were closed on both
     * the mailer's transports
     */
    assert.isTrue(smtpCloseSpy.calledOnce)

    /**
     * Assert the mailer instances are fresh and
     * not cached copies
     */
    assert.notStrictEqual(mail.use('mailgun'), mailgun)
    assert.notStrictEqual(mail.use('smtp'), smtp)
  })
})
