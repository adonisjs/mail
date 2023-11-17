/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { Message } from '../../../src/message.js'

test.group('Message | attachments', () => {
  test('define attachment', ({ assert }) => {
    const message = new Message()
    message.attach('foo.jpg')
    assert.deepEqual(message.toJSON().message, {
      attachments: [{ path: 'foo.jpg', filename: 'foo.jpg' }],
    })
  })

  test('define attachment as a URL', ({ assert }) => {
    const message = new Message()
    const fileUrl = new URL('foo.jpg', import.meta.url)

    message.attach(fileUrl)
    assert.deepEqual(message.toJSON().message, {
      attachments: [{ path: fileURLToPath(fileUrl), filename: 'foo.jpg' }],
    })
  })

  test('assert attachments', ({ assert }) => {
    const message = new Message()
    const fileUrl = new URL('foo.jpg', import.meta.url)

    assert.throws(
      () => message.assertAttachment('foo.jpg'),
      'Expected message attachments to include "foo.jpg"'
    )

    message.attach('foo.jpg')
    message.attach(fileUrl)

    message.assertAttachment('foo.jpg')
    message.assertAttachment(fileUrl)
    message.assertAttachment(fileUrl, { filename: 'foo.jpg' })
    message.assertAttachment((attachment) => {
      return attachment.path === 'foo.jpg'
    })

    assert.throws(
      () => message.assertAttachment('bar.jpg'),
      'Expected message attachments to include "bar.jpg"'
    )
    assert.throws(
      () => message.assertAttachment(fileUrl, { filename: 'bar.jpg' }),
      `Expected message attachments to include "${fileUrl}"`
    )
    assert.throws(
      () =>
        message.assertAttachment((attachment) => {
          return attachment.path === 'bar.jpg'
        }),
      'Expected assertion callback to find an attachment'
    )
  })

  test('attachment filename must be basename of the file', ({ assert }) => {
    const message = new Message()
    message.attach('foo/bar/baz.jpg')
    assert.deepEqual(message.toJSON().message, {
      attachments: [{ path: 'foo/bar/baz.jpg', filename: 'baz.jpg' }],
    })
  })

  test('define attachment options', ({ assert }) => {
    const message = new Message()
    message.attach('foo.jpg', { filename: 'foo-file' })
    assert.deepEqual(message.toJSON().message, {
      attachments: [{ path: 'foo.jpg', filename: 'foo-file' }],
    })
  })

  test('define attachment as buffer', ({ assert }) => {
    const message = new Message()
    message.attachData(Buffer.from('hello-world'), { filename: 'foo-file' })
    assert.deepEqual(message.toJSON().message, {
      attachments: [{ content: Buffer.from('hello-world'), filename: 'foo-file' }],
    })
  })

  test('embed file with cid', ({ assert }) => {
    const message = new Message()
    message.embed('foo.jpg', 'logo')
    assert.deepEqual(message.toJSON().message, {
      attachments: [{ path: 'foo.jpg', filename: 'foo.jpg', cid: 'logo' }],
    })
  })

  test('embed file as a URL with cid', ({ assert }) => {
    const message = new Message()
    const fileUrl = new URL('foo.jpg', import.meta.url)

    message.embed(fileUrl, 'logo')
    assert.deepEqual(message.toJSON().message, {
      attachments: [{ path: fileURLToPath(fileUrl), filename: 'foo.jpg', cid: 'logo' }],
    })
  })

  test('assert embedded file', ({ assert }) => {
    const message = new Message()
    message.embed('foo.jpg', 'logo')

    message.assertAttachment('foo.jpg', { cid: 'logo' })
    message.assertAttachment('foo.jpg', { cid: 'logo', filename: 'foo.jpg' })

    assert.throws(
      () => message.assertAttachment('foo.jpg', { cid: 'bar' }),
      'Expected message attachments to include "foo.jpg"'
    )
  })

  test('embed data with cid', ({ assert }) => {
    const message = new Message()
    message.embedData(Buffer.from('hello-world'), 'logo')
    assert.deepEqual(message.toJSON().message, {
      attachments: [{ content: Buffer.from('hello-world'), cid: 'logo' }],
    })
  })
})
