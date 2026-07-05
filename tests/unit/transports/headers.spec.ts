/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import { captureServer } from '../../helpers.js'
import { Message } from '../../../src/message.js'
import { BrevoTransport } from '../../../src/transports/brevo.js'
import { ResendTransport } from '../../../src/transports/resend.js'

test.group('Resend transport | headers', () => {
  test('forward custom and list headers into the payload headers object', async ({ assert }) => {
    const { server, ready, payload } = captureServer({ id: 'resend-message-id' })
    const baseUrl = await ready

    const message = new Message()
    message.from('sender@example.com')
    message.to('receiver@example.com')
    message.subject('Hello')
    message.html('<p>Hello</p>')
    message.header('X-Custom-Header', 'custom-value')
    message.listUnsubscribe('https://example.com/unsubscribe', { oneClick: true })

    const transport = new ResendTransport({ key: 'test_key', baseUrl })
    await transport.send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.equal(body.headers['X-Custom-Header'], 'custom-value')
    assert.equal(body.headers['List-Unsubscribe'], '<https://example.com/unsubscribe>')
    assert.equal(body.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click')
  })

  test('do not set headers object when no custom headers are defined', async ({ assert }) => {
    const { server, ready, payload } = captureServer({ id: 'resend-message-id' })
    const baseUrl = await ready

    const message = new Message()
    message.from('sender@example.com')
    message.to('receiver@example.com')
    message.subject('Hello')
    message.html('<p>Hello</p>')

    const transport = new ResendTransport({ key: 'test_key', baseUrl })
    await transport.send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.notProperty(body, 'headers')
  })

  test('do not forward structural headers handled by the API', async ({ assert }) => {
    const { server, ready, payload } = captureServer({ id: 'resend-message-id' })
    const baseUrl = await ready

    const message = new Message()
    message.from('sender@example.com')
    message.to('receiver@example.com')
    message.replyTo('reply@example.com')
    message.subject('Hello')
    message.html('<p>Hello</p>')
    message.header('X-Custom-Header', 'custom-value')

    const transport = new ResendTransport({ key: 'test_key', baseUrl })
    await transport.send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.notProperty(body.headers, 'From')
    assert.notProperty(body.headers, 'To')
    assert.notProperty(body.headers, 'Subject')
    assert.notProperty(body.headers, 'Reply-To')
    assert.notProperty(body.headers, 'Message-ID')
  })
})

test.group('Brevo transport | headers', () => {
  test('forward custom and list headers into the payload headers object', async ({ assert }) => {
    const { server, ready, payload } = captureServer({ messageId: 'brevo-message-id' })
    const baseUrl = await ready

    const message = new Message()
    message.from('sender@example.com')
    message.to('receiver@example.com')
    message.subject('Hello')
    message.html('<p>Hello</p>')
    message.header('X-Custom-Header', 'custom-value')
    message.listUnsubscribe('https://example.com/unsubscribe')

    const transport = new BrevoTransport({ key: 'test_key', baseUrl })
    await transport.send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.equal(body.headers['X-Custom-Header'], 'custom-value')
    assert.equal(body.headers['List-Unsubscribe'], '<https://example.com/unsubscribe>')
  })

  test('do not set headers object when no custom headers are defined', async ({ assert }) => {
    const { server, ready, payload } = captureServer({ messageId: 'brevo-message-id' })
    const baseUrl = await ready

    const message = new Message()
    message.from('sender@example.com')
    message.to('receiver@example.com')
    message.subject('Hello')
    message.html('<p>Hello</p>')

    const transport = new BrevoTransport({ key: 'test_key', baseUrl })
    await transport.send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.notProperty(body, 'headers')
  })
})
