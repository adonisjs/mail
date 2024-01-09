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

import { Message } from '../../../src/message.js'
import { BaseMail } from '../../../src/base_mail.js'
import type { MailEvents } from '../../../src/types.js'
import { FakeMailer } from '../../../src/fake_mailer.js'
import { MemoryQueueMessenger } from '../../../src/messengers/memory_queue.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('Fake mailer', () => {
  test('send email using JSON transport', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    const response = await mailer.send(new VerifyEmail())
    assert.exists(response.messageId)
    assert.deepEqual(response.envelope, { from: 'foo@bar.com', to: ['bar@baz.com'] })
  })

  test('send email immediately even when queued', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    const spy = sinon.spy(mailer, 'sendCompiled')
    await mailer.sendLater(new VerifyEmail())

    assert.isTrue(spy.called)
    assert.isTrue(spy.calledOnce)
    assert.isTrue(
      spy.calledWith(
        {
          message: {
            subject: 'Verify your email address',
            from: 'foo@bar.com',
            to: ['bar@baz.com'],
          },
          views: {},
        },
        undefined
      )
    )
  })

  test('do not allow swapping messenger', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})
    mailer.setMessenger(new MemoryQueueMessenger(mailer, emitter))

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    const spy = sinon.spy(mailer, 'sendCompiled')
    await mailer.sendLater(new VerifyEmail())

    assert.isTrue(spy.called)
    assert.isTrue(spy.calledOnce)
    assert.isTrue(
      spy.calledWith(
        {
          message: {
            subject: 'Verify your email address',
            from: 'foo@bar.com',
            to: ['bar@baz.com'],
          },
          views: {},
        },
        undefined
      )
    )
  })

  test('get list of sent and queue mails', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    await mailer.send(new VerifyEmail())
    await mailer.sendLater(new VerifyEmail())

    assert.instanceOf(mailer.mails.sent()[0], VerifyEmail)
    assert.instanceOf(mailer.mails.queued()[0], VerifyEmail)
  })

  test('get list of sent and queue messages', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new FakeMailer('mailgun', emitter, {})

    await mailer.send((message) => {
      message.subject('Verify email address')
    })
    await mailer.sendLater((message) => {
      message.subject('Verify email address')
    })

    assert.instanceOf(mailer.messages.sent()[0], Message)
    assert.instanceOf(mailer.messages.queued()[0], Message)
  })
})
