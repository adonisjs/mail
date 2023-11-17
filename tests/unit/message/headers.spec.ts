/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import nodemailer from 'nodemailer'
import { Message } from '../../../src/message.js'

test.group('Message | headers', () => {
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

  test('define list headers', async ({ assert }) => {
    const message = new Message()
    message.listHelp('admin@example.com?subject=help')
    message.listUnsubscribe({
      url: 'http://example.com',
      comment: 'Comment',
    })

    message.listSubscribe([
      'admin@example.com?subject=subscribe',
      {
        url: 'http://example.com',
        comment: 'Subscribe',
      },
    ])

    const transport = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    })

    const response = await transport.sendMail(message.toObject().message)
    const emailText = response.message.toString()

    assert.isTrue(emailText.includes('List-Help: <mailto:admin@example.com?subject=help>'))
    assert.isTrue(emailText.includes('List-Unsubscribe: <http://example.com> (Comment)'))
    assert.isTrue(
      emailText.includes('List-Subscribe: <mailto:admin@example.com?subject=subscribe>')
    )
    assert.isTrue(emailText.includes('List-Subscribe: <http://example.com> (Subscribe)'))
  })
})
