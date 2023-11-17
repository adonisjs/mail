/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Edge } from 'edge.js'
import { test } from '@japa/runner'
import { Emitter } from '@adonisjs/core/events'
import { AppFactory } from '@adonisjs/core/factories/app'

import { MailEvents, Recipient } from '../../src/types.js'
import { BaseMail, Mailer, Message } from '../../index.js'
import { JSONDriver } from '../../src/drivers/json/main.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('Base mail', (group) => {
  group.each.setup(() => {
    return () => {
      Message.templateEngine = undefined
    }
  })

  test('send mail using the mailer', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new Mailer('marketing', new JSONDriver(), emitter, {})

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    const response = await new VerifyEmail().send(mailer)
    const message = JSON.parse(response.original.message)

    assert.equal(message.subject, 'Verify your email address')
    assert.equal(message.messageId, response.messageId)
    assert.deepEqual(message.from, { address: 'foo@bar.com', name: '' })
    assert.deepEqual(message.to, [{ address: 'bar@baz.com', name: '' }])
  })

  test('send mail using the global email address', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new Mailer('marketing', new JSONDriver(), emitter, {
      from: 'foo@bar.com',
    })

    class VerifyEmail extends BaseMail {
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    const response = await new VerifyEmail().send(mailer)
    const message = JSON.parse(response.original.message)

    assert.equal(message.subject, 'Verify your email address')
    assert.equal(message.messageId, response.messageId)
    assert.deepEqual(message.from, { address: 'foo@bar.com', name: '' })
    assert.deepEqual(message.to, [{ address: 'bar@baz.com', name: '' }])
  })

  test('use global replyTo email address', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const mailer = new Mailer('marketing', new JSONDriver(), emitter, {
      from: 'foo@bar.com',
      replyTo: 'noreply@bar.com',
    })

    class VerifyEmail extends BaseMail {
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    const response = await new VerifyEmail().send(mailer)
    const message = JSON.parse(response.original.message)

    assert.equal(message.subject, 'Verify your email address')
    assert.equal(message.messageId, response.messageId)
    assert.deepEqual(message.from, { address: 'foo@bar.com', name: '' })
    assert.deepEqual(message.to, [{ address: 'bar@baz.com', name: '' }])
    assert.deepEqual(message.replyTo, [{ address: 'noreply@bar.com', name: '' }])
  })

  test('build email message', async () => {
    class VerifyEmail extends BaseMail {
      from = 'foo@bar.com'
      replyTo?: Recipient | undefined = 'noreply@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    const email = new VerifyEmail()
    await email.build()

    /**
     * Changes will be ignored after mail
     * has been built
     */
    email.from = 'foo@baz.com'
    await email.build()

    email.message.assertSubject('Verify your email address')
    email.message.assertFrom('foo@bar.com')
    email.message.assertTo('bar@baz.com')
    email.message.assertRecipient('replyTo', 'noreply@bar.com')
  })

  test('build email message with contents', async () => {
    const edge = new Edge()
    Message.templateEngine = {
      render(templatePath, helpers, data) {
        return edge.share(helpers).render(templatePath, data)
      },
    }

    edge.registerTemplate('emails/foo', {
      template: 'Hello {{ username }}',
    })

    class VerifyEmail extends BaseMail {
      from = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
        this.message.htmlView('emails/foo', { username: 'virk' })
      }
    }

    const email = new VerifyEmail()
    await email.buildWithContents()

    /**
     * Changes will be ignored after mail
     * has been built
     */
    email.from = 'foo@baz.com'
    await email.buildWithContents()

    email.message.assertSubject('Verify your email address')
    email.message.assertFrom('foo@bar.com')
    email.message.assertTo('bar@baz.com')
    email.message.assertHtmlIncludes('Hello virk')
  })
})
