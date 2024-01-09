/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import sinon from 'sinon'
import { Edge } from 'edge.js'
import { test } from '@japa/runner'
import { Emitter } from '@adonisjs/core/events'
import { AppFactory } from '@adonisjs/core/factories/app'

import { Mailer } from '../../src/mailer.js'
import { Message } from '../../src/message.js'
import { MailEvents } from '../../src/types.js'
import { BaseMail } from '../../src/base_mail.js'
import { JSONTransport } from '../../src/transports/json.js'
import { SMTPTransport } from '../../src/transports/smtp.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('Mailer', (group) => {
  group.each.setup(() => {
    return () => {
      Message.templateEngine = undefined
    }
  })

  test('send email using the transport', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, {})
    const response = await mailer.send((message) => {
      message.subject('Hello world')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })

    const message = JSON.parse(response.original.message)

    assert.equal(message.subject, 'Hello world')
    assert.equal(message.messageId, response.messageId)
    assert.deepEqual(message.from, { address: 'foo@bar.com', name: '' })
    assert.deepEqual(message.to, [{ address: 'bar@baz.com', name: '' }])
  })

  test('use global from address', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, { from: 'foo@global.com' })
    const response = await mailer.send((message) => {
      message.subject('Hello world')
      message.to('bar@baz.com')
    })

    const message = JSON.parse(response.original.message)

    assert.equal(message.subject, 'Hello world')
    assert.equal(message.messageId, response.messageId)
    assert.deepEqual(message.from, { address: 'foo@global.com', name: '' })
    assert.deepEqual(message.to, [{ address: 'bar@baz.com', name: '' }])
  })

  test('use global from address and name', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, {
      from: {
        address: 'foo@global.com',
        name: 'foo',
      },
    })
    const response = await mailer.send((message) => {
      message.subject('Hello world')
      message.to('bar@baz.com')
    })

    const message = JSON.parse(response.original.message)

    assert.equal(message.subject, 'Hello world')
    assert.equal(message.messageId, response.messageId)
    assert.deepEqual(message.from, { address: 'foo@global.com', name: 'foo' })
    assert.deepEqual(message.to, [{ address: 'bar@baz.com', name: '' }])
  })

  test('use global replyTo address and name', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, {
      from: {
        address: 'foo@global.com',
        name: 'foo',
      },
      replyTo: {
        address: 'noreply@global.com',
        name: 'foo',
      },
    })
    const response = await mailer.send((message) => {
      message.subject('Hello world')
      message.to('bar@baz.com')
    })

    const message = JSON.parse(response.original.message)

    assert.equal(message.subject, 'Hello world')
    assert.equal(message.messageId, response.messageId)
    assert.deepEqual(message.from, { address: 'foo@global.com', name: 'foo' })
    assert.deepEqual(message.replyTo, [{ address: 'noreply@global.com', name: 'foo' }])
    assert.deepEqual(message.to, [{ address: 'bar@baz.com', name: '' }])
  })

  test('overwrite global from address', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, { from: 'foo@global.com' })
    const response = await mailer.send((message) => {
      message.subject('Hello world')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
    })

    const message = JSON.parse(response.original.message)

    assert.equal(message.subject, 'Hello world')
    assert.equal(message.messageId, response.messageId)
    assert.deepEqual(message.from, { address: 'foo@bar.com', name: '' })
    assert.deepEqual(message.to, [{ address: 'bar@baz.com', name: '' }])
  })

  test('render template before sending the email', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const edge = new Edge()

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, { from: 'foo@global.com' })
    Message.templateEngine = {
      render(template, helpers, data) {
        return edge.share(helpers).render(template, data)
      },
    }

    edge.registerTemplate('foo/bar', {
      template: `Hello {{ username }}`,
    })

    const response = await mailer.send((message) => {
      message.subject('Hello world')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
      message.htmlView('foo/bar', { username: 'virk' })
    })

    const message = JSON.parse(response.original.message)
    assert.equal(message.html, 'Hello virk')
  })

  test('do not render templates when inline contents has been set', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const edge = new Edge()

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, { from: 'foo@global.com' })
    Message.templateEngine = {
      render(template, helpers, data) {
        return edge.share(helpers).render(template, data)
      },
    }

    edge.registerTemplate('foo/bar', {
      template: `Hello {{ username }}`,
    })

    const response = await mailer.send((message) => {
      message.subject('Hello world')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
      message.html('Hello world')
      message.htmlView('foo/bar', { username: 'virk' })
    })

    const message = JSON.parse(response.original.message)
    assert.equal(message.html, 'Hello world')
  })

  test('throw error when content view is defined without the template engine', async ({
    assert,
  }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, { from: 'foo@global.com' })
    const send = () =>
      mailer.send((message) => {
        message.subject('Hello world')
        message.from('foo@bar.com')
        message.to('bar@baz.com')
        message.htmlView('foo/bar', {})
      })

    await assert.rejects(send, 'Cannot render email templates without a template engine')
  })

  test('close transport transport', async ({ assert }) => {
    const smtpTransport = new SMTPTransport({ host: '' })
    const spy = sinon.spy(smtpTransport, 'close')
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', smtpTransport, emitter, { from: 'foo@global.com' })
    await mailer.close()

    assert.isTrue(spy.called)
    assert.isTrue(spy.calledOnce)
  })

  test('queue email', async ({ assert }) => {
    assert.plan(2)
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, {
      from: {
        address: 'foo@global.com',
        name: 'foo',
      },
    })

    mailer.setMessenger({
      async queue(mail) {
        assert.deepEqual(mail.message, {
          subject: 'Hello world',
          to: ['bar@baz.com'],
        })
        assert.deepEqual(mail.views, {
          html: {
            template: 'foo',
            data: {
              username: 'virk',
            },
          },
        })
      },
    })

    await mailer.sendLater((message) => {
      message.subject('Hello world')
      message.to('bar@baz.com')
      message.htmlView('foo', { username: 'virk' })
    })
  })

  test('pass sendConfig to messenger', async ({ assert }) => {
    assert.plan(1)
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, { from: 'foo@global.com' })

    mailer.setMessenger({
      async queue(_, config) {
        assert.deepEqual(config, { foo: 'bar' })
      },
    })

    await mailer.sendLater(
      (message) => {
        message.subject('Hello world')
        message.to('bar@baz.com')
        message.htmlView('foo', { username: 'virk' })
      },
      { foo: 'bar' } as any
    )
  })

  test('send email using the mail class', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, {})

    class VerifyEmail extends BaseMail {
      from: string = 'foo@bar.com'
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
      }
    }

    const response = await mailer.send(new VerifyEmail())
    const message = JSON.parse(response.original.message)

    assert.equal(message.subject, 'Verify your email address')
    assert.equal(message.messageId, response.messageId)
    assert.deepEqual(message.from, { address: 'foo@bar.com', name: '' })
    assert.deepEqual(message.to, [{ address: 'bar@baz.com', name: '' }])
  })

  test('queue email using the mail class', async ({ assert }) => {
    assert.plan(2)

    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONTransport(), emitter, { from: 'foo@global.com' })

    mailer.setMessenger({
      async queue(mail) {
        assert.deepEqual(mail.message, {
          from: {
            address: 'foo@bar.com',
            name: 'Foo',
          },
          subject: 'Verify your email address',
          to: ['bar@baz.com'],
        })
        assert.deepEqual(mail.views, {
          html: {
            template: 'foo',
            data: {
              username: 'virk',
            },
          },
        })
      },
    })

    class VerifyEmail extends BaseMail {
      from = {
        address: 'foo@bar.com',
        name: 'Foo',
      }
      subject: string = 'Verify your email address'

      prepare() {
        this.message.to('bar@baz.com')
        this.message.htmlView('foo', { username: 'virk' })
      }
    }

    await mailer.sendLater(new VerifyEmail())
  })
})
