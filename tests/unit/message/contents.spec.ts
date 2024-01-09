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

import { Message } from '../../../src/message.js'

test.group('Message | contents', (group) => {
  group.each.setup(() => {
    return () => {
      Message.templateEngine = undefined
    }
  })

  test('define htmlView', ({ assert }) => {
    const message = new Message()
    message.htmlView('welcome', { name: 'virk' })
    assert.deepEqual(message.toJSON(), {
      message: {},
      views: {
        html: { template: 'welcome', data: { name: 'virk' } },
      },
    })
  })

  test('define textView', ({ assert }) => {
    const message = new Message()
    message.textView('welcome', { name: 'virk' })

    assert.deepEqual(message.toJSON(), {
      message: {},
      views: {
        text: { template: 'welcome', data: { name: 'virk' } },
      },
    })
  })

  test('define watchView', ({ assert }) => {
    const message = new Message()
    message.watchView('welcome', { name: 'virk' })

    assert.deepEqual(message.toJSON(), {
      message: {},
      views: {
        watch: { template: 'welcome', data: { name: 'virk' } },
      },
    })
  })

  test('define html from raw content', ({ assert }) => {
    const message = new Message()
    message.html('<p> Hello world </p>')
    assert.deepEqual(message.toJSON().message, { html: '<p> Hello world </p>' })
  })

  test('assert html', ({ assert }) => {
    const message = new Message()
    assert.throws(
      () => message.assertHtmlIncludes('world'),
      'Expected message html body to match substring, but it is undefined'
    )

    message.html('<p> Hello world </p>')

    message.assertHtmlIncludes('Hello world')
    message.assertHtmlIncludes(/world/)
    assert.throws(
      () => message.assertHtmlIncludes('foo'),
      'Expected message html body to include "foo"'
    )
    assert.throws(
      () => message.assertHtmlIncludes(/foo/),
      'Expected message html body to match "/foo/"'
    )
  })

  test('define text from raw content', ({ assert }) => {
    const message = new Message()
    message.text('Hello world')
    assert.deepEqual(message.toJSON().message, { text: 'Hello world' })
  })

  test('assert text', ({ assert }) => {
    const message = new Message()
    assert.throws(
      () => message.assertTextIncludes('world'),
      'Expected message text body to match substring, but it is undefined'
    )

    message.text('Hello world')

    message.assertTextIncludes('Hello world')
    message.assertTextIncludes(/world/)
    assert.throws(
      () => message.assertTextIncludes('foo'),
      'Expected message text body to include "foo"'
    )
    assert.throws(
      () => message.assertTextIncludes(/foo/),
      'Expected message text body to match "/foo/"'
    )
  })

  test('define watch from raw content', ({ assert }) => {
    const message = new Message()
    message.watch('Hello world')
    assert.deepEqual(message.toJSON().message, { watch: 'Hello world' })
  })

  test('assert watch contents', ({ assert }) => {
    const message = new Message()
    assert.throws(
      () => message.assertWatchIncludes('world'),
      'Expected message watch body to match substring, but it is undefined'
    )

    message.watch('Hello world')

    message.assertWatchIncludes('Hello world')
    message.assertWatchIncludes(/world/)
    assert.throws(
      () => message.assertWatchIncludes('foo'),
      'Expected message watch body to include "foo"'
    )
    assert.throws(
      () => message.assertWatchIncludes(/foo/),
      'Expected message watch body to match "/foo/"'
    )
  })

  test('render template using the template engine', async ({ assert }) => {
    const edge = new Edge()

    edge.registerTemplate('foo/bar', {
      template: `Hello {{ username }}`,
    })
    edge.registerTemplate('foo/text', {
      template: `Hello {{ username }} from text view`,
    })
    edge.registerTemplate('foo/watch', {
      template: `Hello {{ username }} from watch view`,
    })

    Message.templateEngine = {
      render(templatePath, helpers, data) {
        return edge.share(helpers).render(templatePath, data)
      },
    }

    const message = new Message()
    message.subject('Hello world')
    message.from('foo@bar.com')
    message.to('bar@baz.com')
    message.htmlView('foo/bar', { username: 'virk' })
    message.textView('foo/text', { username: 'virk' })
    message.watchView('foo/watch', { username: 'virk' })

    await message.computeContents()
    assert.equal(message.nodeMailerMessage.html, 'Hello virk')
    assert.equal(message.nodeMailerMessage.text, 'Hello virk from text view')
    assert.equal(message.nodeMailerMessage.watch, 'Hello virk from watch view')
  })

  test('embed images within templates', async ({ assert }) => {
    const edge = new Edge()
    edge.registerTemplate('foo/bar', {
      template: `<img src="{{ embedImage('./foo.jpg') }}" />`,
    })

    Message.templateEngine = {
      render(templatePath, helpers, data) {
        return edge.share(helpers).render(templatePath, data)
      },
    }

    const message = new Message()
    message.htmlView('foo/bar', { username: 'virk' })
    await message.computeContents()

    assert.equal(message.nodeMailerMessage.attachments![0].filename, 'foo.jpg')
    assert.equal(message.nodeMailerMessage.attachments![0].path, './foo.jpg')
    assert.exists(message.nodeMailerMessage.attachments![0].cid)
    assert.equal(
      message.nodeMailerMessage.html,
      `<img src="cid:${message.nodeMailerMessage.attachments![0].cid}" />`
    )
  })

  test('embed images as data within templates', async ({ assert }) => {
    const edge = new Edge()
    edge.registerTemplate('foo/bar', {
      template: `<img src="{{ embedImageData('hello', { filename: 'fake.jpg' }) }}" />`,
    })

    Message.templateEngine = {
      render(templatePath, helpers, data) {
        return edge.share(helpers).render(templatePath, data)
      },
    }

    const message = new Message()
    message.htmlView('foo/bar', { username: 'virk' })
    await message.computeContents()

    assert.equal(message.nodeMailerMessage.attachments![0].filename, 'fake.jpg')
    assert.equal(message.nodeMailerMessage.attachments![0].content, 'hello')
    assert.isUndefined(message.nodeMailerMessage.attachments![0].path)
    assert.exists(message.nodeMailerMessage.attachments![0].cid)
    assert.equal(
      message.nodeMailerMessage.html,
      `<img src="cid:${message.nodeMailerMessage.attachments![0].cid}" />`
    )
  })

  test('throw error when templateEngine is not configured', async () => {
    const message = new Message()
    message.subject('Hello world')
    message.from('foo@bar.com')
    message.to('bar@baz.com')
    message.htmlView('foo/bar', { username: 'virk' })
    message.textView('foo/text', { username: 'virk' })
    message.watchView('foo/watch', { username: 'virk' })

    await message.computeContents()
  }).throws('Cannot render email templates without a template engine')
})
