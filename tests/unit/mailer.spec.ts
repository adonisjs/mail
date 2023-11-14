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
import { MailEvents } from '../../src/types.js'
import { BaseMail } from '../../src/base_mail.js'
import { JSONDriver } from '../../src/drivers/json/main.js'

const app = new AppFactory().create(new URL('./', import.meta.url), () => {})

test.group('Mailer', () => {
  test('send email using the driver', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, {})
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

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, { from: 'foo@global.com' })
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

  test('use global from address and anme', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, {
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

  test('overwrite global from address', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, { from: 'foo@global.com' })
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

  test('throw error when content view is defined without the template engine', async ({
    assert,
  }) => {
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, { from: 'foo@global.com' })
    const send = () =>
      mailer.send((message) => {
        message.subject('Hello world')
        message.from('foo@bar.com')
        message.to('bar@baz.com')
        message.htmlView('foo/bar', {})
      })

    await assert.rejects(
      send,
      'Cannot render templates without a template engine. Make sure to call the "mailer.setTemplateEngine" method first'
    )
  })

  test('render template using the template engine', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const edge = new Edge()

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, { from: 'foo@global.com' })
    mailer.setTemplateEngine(edge)

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

  test('pre-compute message content using templates', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const edge = new Edge()

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, { from: 'foo@global.com' })
    mailer.setTemplateEngine(edge)

    edge.registerTemplate('foo/text', {
      template: `Hello {{ username }} from text view`,
    })
    edge.registerTemplate('foo/watch', {
      template: `Hello {{ username }} from watch view`,
    })
    edge.registerTemplate('foo/bar', {
      template: `Hello {{ username }}`,
    })

    const response = await mailer.send(async (message) => {
      message.htmlView('foo/bar', { username: 'virk' })
      message.textView('foo/text', { username: 'virk' })
      message.watchView('foo/watch', { username: 'virk' })

      await mailer.preComputeContents(message)
    })

    const message = JSON.parse(response.original.message)
    assert.equal(message.html, 'Hello virk')
    assert.equal(message.text, 'Hello virk from text view')
    assert.equal(message.watch, 'Hello virk from watch view')
  })

  test('define text and watch contents', async ({ assert }) => {
    const emitter = new Emitter<MailEvents>(app)
    const edge = new Edge()

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, { from: 'foo@global.com' })
    mailer.setTemplateEngine(edge)

    edge.registerTemplate('foo/text', {
      template: `Hello {{ username }} from text view`,
    })
    edge.registerTemplate('foo/watch', {
      template: `Hello {{ username }} from watch view`,
    })

    const response = await mailer.send((message) => {
      message.subject('Hello world')
      message.from('foo@bar.com')
      message.to('bar@baz.com')
      message.textView('foo/text', { username: 'virk' })
      message.watchView('foo/watch', { username: 'virk' })
    })

    const message = JSON.parse(response.original.message)
    assert.equal(message.text, 'Hello virk from text view')
    assert.equal(message.watch, 'Hello virk from watch view')
  })

  test('close driver transport', async ({ assert }) => {
    const jsonDriver = new JSONDriver()
    const spy = sinon.spy(jsonDriver, 'close')
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', jsonDriver, emitter, { from: 'foo@global.com' })
    await mailer.close()

    assert.isTrue(spy.called)
    assert.isTrue(spy.calledOnce)
  })

  test('queue email', async ({ assert }) => {
    assert.plan(2)
    const emitter = new Emitter<MailEvents>(app)

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, {
      from: {
        address: 'foo@global.com',
        name: 'foo',
      },
    })

    mailer.setMessenger({
      async queue(mail) {
        assert.deepEqual(mail.message, {
          from: {
            address: 'foo@global.com',
            name: 'foo',
          },
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

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, { from: 'foo@global.com' })

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

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, {})

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

    const mailer = new Mailer('marketing', new JSONDriver(), emitter, { from: 'foo@global.com' })

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
