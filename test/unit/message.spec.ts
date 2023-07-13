/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import { Message } from '../../src/message.js'

test.group('Message', () => {
  test('add from address', ({ assert }) => {
    const message = new Message()
    message.from('foo@bar.com')
    assert.deepEqual(message.toJSON().message, { from: { address: 'foo@bar.com' } })
  })

  test('add from address with name', ({ assert }) => {
    const message = new Message()
    message.from('foo@bar.com', 'Foo')
    assert.deepEqual(message.toJSON().message, { from: { address: 'foo@bar.com', name: 'Foo' } })
  })

  test('add to address', ({ assert }) => {
    const message = new Message()
    message.to('foo@bar.com')
    assert.deepEqual(message.toJSON().message, { to: [{ address: 'foo@bar.com' }] })
  })

  test('add to address with name', ({ assert }) => {
    const message = new Message()
    message.to('foo@bar.com', 'Foo')
    assert.deepEqual(message.toJSON().message, { to: [{ address: 'foo@bar.com', name: 'Foo' }] })
  })

  test('add cc address', ({ assert }) => {
    const message = new Message()
    message.cc('foo@bar.com')
    assert.deepEqual(message.toJSON().message, { cc: [{ address: 'foo@bar.com' }] })
  })

  test('add cc address with name', ({ assert }) => {
    const message = new Message()
    message.cc('foo@bar.com', 'Foo')
    assert.deepEqual(message.toJSON().message, { cc: [{ address: 'foo@bar.com', name: 'Foo' }] })
  })

  test('add bcc address', ({ assert }) => {
    const message = new Message()
    message.bcc('foo@bar.com')
    assert.deepEqual(message.toJSON().message, { bcc: [{ address: 'foo@bar.com' }] })
  })

  test('add bcc address with name', ({ assert }) => {
    const message = new Message()
    message.bcc('foo@bar.com', 'Foo')
    assert.deepEqual(message.toJSON().message, { bcc: [{ address: 'foo@bar.com', name: 'Foo' }] })
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

  test('define replyTo', ({ assert }) => {
    const message = new Message()
    message.replyTo('foo@bar.com')
    assert.deepEqual(message.toJSON().message, { replyTo: [{ address: 'foo@bar.com' }] })
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

  test('define text from raw content', ({ assert }) => {
    const message = new Message()
    message.text('Hello world')
    assert.deepEqual(message.toJSON().message, { text: 'Hello world' })
  })

  test('define watch from raw content', ({ assert }) => {
    const message = new Message()
    message.watch('Hello world')
    assert.deepEqual(message.toJSON().message, { watch: 'Hello world' })
  })

  test('define attachment', ({ assert }) => {
    const message = new Message()
    message.attach('foo.jpg')
    assert.deepEqual(message.toJSON().message, {
      attachments: [{ path: 'foo.jpg', filename: 'foo.jpg' }],
    })
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
      attachments: [{ path: 'foo.jpg', cid: 'logo' }],
    })
  })

  test('embed data with cid', ({ assert }) => {
    const message = new Message()
    message.embedData(Buffer.from('hello-world'), 'logo')
    assert.deepEqual(message.toJSON().message, {
      attachments: [{ content: Buffer.from('hello-world'), cid: 'logo' }],
    })
  })

  test('defined custom header', ({ assert }) => {
    const message = new Message()
    message.header('x-my-key', '1234')
    assert.deepEqual(message.toJSON().message, {
      headers: [{ 'x-my-key': '1234' }],
    })
  })

  test('defined custom header as array of values', ({ assert }) => {
    const message = new Message()
    message.header('x-my-key', ['1234', '5678'])
    assert.deepEqual(message.toJSON().message, {
      headers: [{ 'x-my-key': ['1234', '5678'] }],
    })
  })

  test('defined custom prepared header', ({ assert }) => {
    const message = new Message()
    message.preparedHeader('x-my-key', '1234')
    assert.deepEqual(message.toJSON().message, {
      headers: [{ 'x-my-key': { prepared: true, value: '1234' } }],
    })
  })

  test('defined custom prepared header as array of values', ({ assert }) => {
    const message = new Message()
    message.preparedHeader('x-my-key', ['1234', '5678'])
    assert.deepEqual(message.toJSON().message, {
      headers: [{ 'x-my-key': { prepared: true, value: ['1234', '5678'] } }],
    })
  })

  test('raise exception when attaching raw data in deferred mode', ({ assert }) => {
    const message = new Message(true)
    const fn = () => message.attachData(Buffer.from('hello-world'), { filename: 'foo-file' })
    assert.throws(fn, 'Cannot attach raw data when using "Mail.sendLater" method')
  })

  test('raise exception when embedding raw data in deferred mode', ({ assert }) => {
    const message = new Message(true)
    const fn = () => message.embedData(Buffer.from('hello-world'), '1', { filename: 'foo-file' })
    assert.throws(fn, 'Cannot attach raw data when using "Mail.sendLater" method')
  })

  test('attach ical event', ({ assert }) => {
    const message = new Message(true)
    message.icalEvent('hello', { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      content: 'hello',
      filename: 'invite.ics',
    })
  })

  test('attach ical event from file', ({ assert }) => {
    const message = new Message(true)
    message.icalEventFromFile('/foo/invite.ics', { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      path: '/foo/invite.ics',
      filename: 'invite.ics',
    })
  })

  test('attach ical event from path', ({ assert }) => {
    const message = new Message(true)
    message.icalEventFromUrl('http://foo.com/invite', { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      href: 'http://foo.com/invite',
      filename: 'invite.ics',
    })
  })

  test('attach ical event using the calendar object', ({ assert }) => {
    const message = new Message(true)
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
