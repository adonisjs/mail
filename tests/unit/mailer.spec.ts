/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import sinon from 'sinon'
import edge from 'edge.js'
import { test } from '@japa/runner'
import { Mailer } from '../../src/mailer.js'
import { JSONDriver } from '../../src/drivers/json/main.js'

test.group('Mailer', () => {
  test('send email using the driver', async ({ assert }) => {
    const mailer = new Mailer('marketing', new JSONDriver(), {})
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
    const mailer = new Mailer('marketing', new JSONDriver(), { from: 'foo@global.com' })
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

  test('overwrite global from address', async ({ assert }) => {
    const mailer = new Mailer('marketing', new JSONDriver(), { from: 'foo@global.com' })
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
    const mailer = new Mailer('marketing', new JSONDriver(), { from: 'foo@global.com' })
    const send = () =>
      mailer.send((message) => {
        message.subject('Hello world')
        message.from('foo@bar.com')
        message.to('bar@baz.com')
        message.htmlView('foo/bar', {})
      })

    await assert.rejects(
      send,
      'Cannot render templates without a template engine. Make sure to call "mailer.setTemplateEngine" first'
    )
  })

  test('render template using the template engine', async ({ assert }) => {
    const mailer = new Mailer('marketing', new JSONDriver(), { from: 'foo@global.com' })
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

  test('define text and watch contents', async ({ assert }) => {
    const mailer = new Mailer('marketing', new JSONDriver(), { from: 'foo@global.com' })
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

    const mailer = new Mailer('marketing', jsonDriver, { from: 'foo@global.com' })
    await mailer.close()

    assert.isTrue(spy.called)
    assert.isTrue(spy.calledOnce)
  })

  test('queue email', async ({ assert }) => {
    assert.plan(2)
    const mailer = new Mailer('marketing', new JSONDriver(), { from: 'foo@global.com' })

    mailer.setMessenger({
      async queue(mail) {
        assert.deepEqual(mail.message, {
          from: 'foo@global.com',
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
    const mailer = new Mailer('marketing', new JSONDriver(), { from: 'foo@global.com' })

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
})
