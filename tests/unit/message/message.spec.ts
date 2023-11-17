/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { Message } from '../../../src/message.js'

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
})
