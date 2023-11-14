/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'

import { Message } from '../../src/message.js'

test.group('Message', () => {
  test('add from address', ({ assert }) => {
    const message = new Message()
    message.from('foo@bar.com')
    assert.deepEqual(message.toJSON().message, { from: 'foo@bar.com' })
  })

  test('add from address with name', ({ assert }) => {
    const message = new Message()
    message.from('foo@bar.com', 'Foo')
    assert.deepEqual(message.toJSON().message, { from: { address: 'foo@bar.com', name: 'Foo' } })
  })

  test('assert from address', ({ assert }) => {
    const message = new Message()

    assert.throws(
      () => message.assertFrom('foo@bar.com'),
      'Expected message to be sent from "foo@bar.com"'
    )

    message.from('foo@bar.com')

    message.assertFrom('foo@bar.com')
    assert.throws(
      () => message.assertFrom('foo@baz.com'),
      'Expected message to be sent from "foo@baz.com"'
    )
    assert.throws(
      () => message.assertFrom('foo@bar.com', 'Foo'),
      'Expected message to be sent from "Foo <foo@bar.com>"'
    )
  })

  test('assert from address when original address has name', ({ assert }) => {
    const message = new Message()
    message.from('foo@bar.com', 'Foo')

    message.assertFrom('foo@bar.com')
    message.assertFrom('foo@bar.com', 'Foo')
    assert.throws(
      () => message.assertFrom('foo@baz.com'),
      'Expected message to be sent from "foo@baz.com"'
    )
    assert.throws(
      () => message.assertFrom('foo@bar.com', 'Bar'),
      'Expected message to be sent from "Bar <foo@bar.com>"'
    )
  })

  test('add to address', ({ assert }) => {
    const message = new Message()
    message.to('foo@bar.com')
    assert.deepEqual(message.toJSON().message, { to: ['foo@bar.com'] })
    assert.isTrue(message.hasTo('foo@bar.com'))
  })

  test('add to address with name', ({ assert }) => {
    const message = new Message()
    message.to('foo@bar.com', 'Foo')
    assert.deepEqual(message.toJSON().message, { to: [{ address: 'foo@bar.com', name: 'Foo' }] })
  })

  test('assert to address', ({ assert }) => {
    const message = new Message()

    assert.throws(
      () => message.assertTo('foo@bar.com'),
      'Expected message to be delivered to "foo@bar.com"'
    )

    message.to('foo@bar.com')
    message.assertTo('foo@bar.com')

    assert.throws(
      () => message.assertTo('foo@baz.com'),
      'Expected message to be delivered to "foo@baz.com"'
    )
    assert.throws(
      () => message.assertTo('foo@bar.com', 'Foo'),
      'Expected message to be delivered to "Foo <foo@bar.com>"'
    )
  })

  test('assert to address with original address has name', ({ assert }) => {
    const message = new Message()
    message.to('foo@bar.com', 'Foo')

    message.assertTo('foo@bar.com')
    message.assertTo('foo@bar.com', 'Foo')
    assert.throws(
      () => message.assertTo('foo@baz.com'),
      'Expected message to be delivered to "foo@baz.com"'
    )
    assert.throws(
      () => message.assertTo('foo@bar.com', 'Bar'),
      'Expected message to be delivered to "Bar <foo@bar.com>"'
    )
  })

  test('add cc address', ({ assert }) => {
    const message = new Message()
    message.cc('foo@bar.com')
    assert.deepEqual(message.toJSON().message, { cc: ['foo@bar.com'] })
    assert.isTrue(message.hasCc('foo@bar.com'))
  })

  test('add cc address with name', ({ assert }) => {
    const message = new Message()
    message.cc('foo@bar.com', 'Foo')
    assert.deepEqual(message.toJSON().message, { cc: [{ address: 'foo@bar.com', name: 'Foo' }] })
  })

  test('assert cc address', ({ assert }) => {
    const message = new Message()
    message.cc('foo@bar.com')

    message.assertCc('foo@bar.com')
    assert.throws(
      () => message.assertCc('foo@baz.com'),
      'Expected message to be delivered to "foo@baz.com"'
    )
    assert.throws(
      () => message.assertCc('foo@bar.com', 'Foo'),
      'Expected message to be delivered to "Foo <foo@bar.com>"'
    )
  })

  test('add bcc address', ({ assert }) => {
    const message = new Message()
    message.bcc('foo@bar.com')
    assert.deepEqual(message.toJSON().message, { bcc: ['foo@bar.com'] })
    assert.isTrue(message.hasBcc('foo@bar.com'))
  })

  test('add bcc address with name', ({ assert }) => {
    const message = new Message()
    message.bcc('foo@bar.com', 'Foo')
    assert.deepEqual(message.toJSON().message, { bcc: [{ address: 'foo@bar.com', name: 'Foo' }] })
  })

  test('assert bcc address', ({ assert }) => {
    const message = new Message()
    message.bcc('foo@bar.com')

    message.assertBcc('foo@bar.com')
    assert.throws(
      () => message.assertBcc('foo@baz.com'),
      'Expected message to be delivered to "foo@baz.com"'
    )
    assert.throws(
      () => message.assertBcc('foo@bar.com', 'Foo'),
      'Expected message to be delivered to "Foo <foo@bar.com>"'
    )
  })

  test('define messageId', ({ assert }) => {
    const message = new Message()
    message.messageId('1234')
    assert.deepEqual(message.toJSON().message, { messageId: '1234' })
  })

  test('define subject', ({ assert }) => {
    const message = new Message()
    message.subject('Hello')
    assert.deepEqual(message.toJSON().message, { subject: 'Hello' })
  })

  test('assert subject', ({ assert }) => {
    const message = new Message()
    message.subject('Hello')

    message.assertSubject('Hello')
    assert.throws(() => message.assertSubject('Hi'), 'Expected message subject to be "Hi"')
  })

  test('define replyTo', ({ assert }) => {
    const message = new Message()
    message.replyTo('foo@bar.com')
    assert.deepEqual(message.toJSON().message, { replyTo: ['foo@bar.com'] })
    assert.isTrue(message.hasReplyTo('foo@bar.com'))
  })

  test('define replyTo with name', ({ assert }) => {
    const message = new Message()
    message.replyTo('foo@bar.com', 'Foo')
    assert.deepEqual(message.toJSON().message, {
      replyTo: [{ address: 'foo@bar.com', name: 'Foo' }],
    })
  })

  test('define multiple replyTo with name', ({ assert }) => {
    const message = new Message()
    message.replyTo('foo@bar.com', 'Foo')
    message.replyTo('foo@baz.com', 'FooBaz')
    assert.deepEqual(message.toJSON().message, {
      replyTo: [
        { address: 'foo@bar.com', name: 'Foo' },
        { address: 'foo@baz.com', name: 'FooBaz' },
      ],
    })
  })

  test('assert replyTo', ({ assert }) => {
    const message = new Message()

    assert.throws(
      () => message.assertReplyTo('foo@bar.com'),
      'Expected reply-to addresses to include "foo@bar.com"'
    )

    message.replyTo('foo@bar.com', 'Foo')
    message.replyTo('foo@baz.com', 'FooBaz')

    message.assertReplyTo('foo@bar.com')
    message.assertReplyTo('foo@baz.com', 'FooBaz')
    message.assertReplyTo('foo@bar.com', 'Foo')

    assert.throws(
      () => message.assertReplyTo('foo@foo.com'),
      'Expected reply-to addresses to include "foo@foo.com"'
    )
    assert.throws(
      () => message.assertReplyTo('foo@bar.com', 'FooBaz'),
      'Expected reply-to addresses to include "FooBaz <foo@bar.com>"'
    )
    assert.throws(
      () => message.assertReplyTo('foo@baz.com', 'Foo'),
      'Expected reply-to addresses to include "Foo <foo@baz.com>"'
    )
  })

  test('define in reply to messageId', ({ assert }) => {
    const message = new Message()
    message.inReplyTo('1234')
    assert.deepEqual(message.toJSON().message, { inReplyTo: '1234' })
  })

  test('define references', ({ assert }) => {
    const message = new Message()
    message.references(['1234'])
    assert.deepEqual(message.toJSON().message, { references: ['1234'] })
  })

  test('define envelope', ({ assert }) => {
    const message = new Message()
    message.envelope({ from: 'foo@bar.com' })
    assert.deepEqual(message.toJSON().message, { envelope: { from: 'foo@bar.com' } })
  })

  test('define encoding', ({ assert }) => {
    const message = new Message()
    message.encoding('utf-8')
    assert.deepEqual(message.toJSON().message, { encoding: 'utf-8' })
  })

  test('define priority', ({ assert }) => {
    const message = new Message()
    message.priority('low')
    assert.deepEqual(message.toJSON().message, { priority: 'low' })
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

  test('define custom header', ({ assert }) => {
    const message = new Message()
    message.header('x-my-key', '1234')
    assert.deepEqual(message.toJSON().message, {
      headers: { 'x-my-key': '1234' },
    })
  })

  test('define custom header as array of values', ({ assert }) => {
    const message = new Message()
    message.header('x-my-key', ['1234', '5678'])
    assert.deepEqual(message.toJSON().message, {
      headers: { 'x-my-key': ['1234', '5678'] },
    })
  })

  test('define custom prepared header', ({ assert }) => {
    const message = new Message()
    message.preparedHeader('x-my-key', '1234')
    assert.deepEqual(message.toJSON().message, {
      headers: { 'x-my-key': { prepared: true, value: '1234' } },
    })
  })

  test('assert headers', ({ assert }) => {
    const message = new Message()

    assert.throws(
      () => message.assertHeader('x-my-key'),
      'Expected message headers to include "x-my-key"'
    )

    message.header('x-my-key', '1234')
    message.preparedHeader('x-prepared-key', '1234')
    message.header('x-ping-servers', ['foo', 'bar'])

    message.assertHeader('x-my-key')
    message.assertHeader('x-my-key', '1234')
    message.assertHeader('x-prepared-key')
    message.assertHeader('x-prepared-key', '1234')
    message.assertHeader('x-ping-servers', 'foo')
    message.assertHeader('x-ping-servers', ['foo'])
    message.assertHeader('x-ping-servers', ['foo', 'bar'])

    assert.throws(
      () => message.assertHeader('x-foo'),
      'Expected message headers to include "x-foo"'
    )
    assert.throws(
      () => message.assertHeader('x-foo', 'bar'),
      'Expected message headers to include "x-foo"'
    )
    assert.throws(
      () => message.assertHeader('x-my-key', 'bar'),
      'Expected message headers to include "x-my-key" with value "bar"'
    )
    assert.throws(
      () => message.assertHeader('x-ping-servers', 'baz'),
      'Expected message headers to include "x-ping-servers" with value "baz'
    )
    assert.throws(
      () => message.assertHeader('x-ping-servers', ['foo', 'bar', 'baz']),
      'Expected message headers to include "x-ping-servers" with value "foo,bar,baz"'
    )
  })

  test('attach ical event', ({ assert }) => {
    const message = new Message()
    message.icalEvent('hello', { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      content: 'hello',
      filename: 'invite.ics',
    })
  })

  test('attach ical event from file', ({ assert }) => {
    const message = new Message()
    message.icalEventFromFile('/foo/invite.ics', { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      path: '/foo/invite.ics',
      filename: 'invite.ics',
    })
  })

  test('attach ical event from file URL', ({ assert }) => {
    const message = new Message()
    const fileUrl = new URL('foo/invite.ics', import.meta.url)

    message.icalEventFromFile(fileUrl, { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      path: fileURLToPath(fileUrl),
      filename: 'invite.ics',
    })
  })

  test('attach ical event from path', ({ assert }) => {
    const message = new Message()
    message.icalEventFromUrl('http://foo.com/invite', { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      href: 'http://foo.com/invite',
      filename: 'invite.ics',
    })
  })

  test('attach ical event using the calendar object', ({ assert }) => {
    const message = new Message()
    message.icalEvent(
      (calendar) => {
        calendar.createEvent({
          summary: 'Discuss tech',
          start: DateTime.local().plus({ minutes: 30 }),
          end: DateTime.local().plus({ minutes: 60 }),
          url: 'http://adonisjs.com/meeting/1',
        })
      },
      { filename: 'invite.ics' }
    )

    assert.isTrue(message.toJSON().message.icalEvent!.content!.startsWith('BEGIN:VCALENDAR'))
    assert.isTrue(message.toJSON().message.icalEvent!.content!.endsWith('END:VCALENDAR'))
  })
})
