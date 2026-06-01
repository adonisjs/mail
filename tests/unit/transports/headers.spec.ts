/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { createServer, type Server } from 'node:http'
import { type AddressInfo } from 'node:net'

import { Message } from '../../../src/message.js'
import { BrevoTransport } from '../../../src/transports/brevo.js'
import { ResendTransport } from '../../../src/transports/resend.js'

/**
 * Spins up a local HTTP server that captures the JSON payload of the first
 * request and responds with a canned body, so we can assert on what a JSON
 * based transport actually sends without hitting the real API.
 */
function captureServer(responseBody: Record<string, any>) {
  let resolvePayload: (value: any) => void
  const payload = new Promise<any>((resolve) => (resolvePayload = resolve))

  const server: Server = createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      resolvePayload(JSON.parse(body))
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(responseBody))
    })
  })

  const ready = new Promise<string>((resolve) => {
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo
      resolve(`http://localhost:${port}`)
    })
  })

  return { server, ready, payload }
}

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
    message.listUnsubscribe('https://example.com/unsubscribe')
    message.addListHeader('unsubscribe-post', 'List-Unsubscribe=One-Click')

    const transport = new ResendTransport({ key: 'test_key', baseUrl })
    await transport.send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.equal(body.headers['X-Custom-Header'], 'custom-value')
    assert.equal(body.headers['List-Unsubscribe'], '<https://example.com/unsubscribe>')
    assert.property(body.headers, 'List-Unsubscribe-Post')
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
