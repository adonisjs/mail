/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { test } from '@japa/runner'

import { captureServer } from '../../helpers.js'
import { Message } from '../../../src/message.js'
import { CloudflareTransport } from '../../../src/transports/cloudflare.js'

const SUCCESS_RESPONSE = {
  success: true,
  errors: [],
  messages: [],
  result: { delivered: ['receiver@example.com'], permanent_bounces: [], queued: [] },
}

function makeMessage() {
  const message = new Message()
  message.from('sender@example.com', 'Sender')
  message.to('receiver@example.com', 'Receiver')
  message.subject('Hello')
  message.html('<p>Hello</p>')
  return message
}

test.group('Cloudflare transport | config', () => {
  test('throw when key is missing', () => {
    new CloudflareTransport({ baseUrl: 'https://api.cloudflare.com', accountId: 'acc' } as any)
  }).throws('Invalid config for "cloudflare" transport. The "key" property is missing')

  test('throw when baseUrl is missing', () => {
    new CloudflareTransport({ key: 'token', accountId: 'acc' } as any)
  }).throws('Invalid config for "cloudflare" transport. The "baseUrl" property is missing')

  test('throw when accountId is missing', () => {
    new CloudflareTransport({ key: 'token', baseUrl: 'https://api.cloudflare.com' } as any)
  }).throws('Invalid config for "cloudflare" transport. The "accountId" property is missing')
})

test.group('Cloudflare transport | payload', () => {
  test('post to the account scoped send endpoint with a bearer token', async ({ assert }) => {
    const { server, ready, payload, request } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    await new CloudflareTransport({ key: 'token', baseUrl, accountId: 'acc-123' }).send(
      makeMessage().toJSON().message
    )
    server.close()

    await payload
    const { url, headers } = await request
    assert.equal(url, '/accounts/acc-123/email/sending/send')
    assert.equal(headers.authorization, 'Bearer token')
  })

  test('format recipients as "Name <email>" strings', async ({ assert }) => {
    const { server, ready, payload } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    const message = makeMessage()
    message.cc('cc@example.com')
    message.bcc('bcc@example.com')
    message.replyTo('reply@example.com', 'Reply')

    await new CloudflareTransport({ key: 'token', baseUrl, accountId: 'acc' }).send(
      message.toJSON().message
    )
    server.close()

    const body = await payload
    assert.equal(body.from, 'Sender <sender@example.com>')
    assert.deepEqual(body.to, ['Receiver <receiver@example.com>'])
    assert.deepEqual(body.cc, ['cc@example.com'])
    assert.deepEqual(body.bcc, ['bcc@example.com'])
    assert.equal(body.reply_to, 'Reply <reply@example.com>')
  })

  test('forward custom and list headers', async ({ assert }) => {
    const { server, ready, payload } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    const message = makeMessage()
    message.header('X-Custom-Header', 'custom-value')
    message.listUnsubscribe('https://example.com/unsubscribe', { oneClick: true })

    await new CloudflareTransport({ key: 'token', baseUrl, accountId: 'acc' }).send(
      message.toJSON().message
    )
    server.close()

    const body = await payload
    assert.equal(body.headers['X-Custom-Header'], 'custom-value')
    assert.equal(body.headers['List-Unsubscribe'], '<https://example.com/unsubscribe>')
    assert.equal(body.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click')
  })

  test('resolve attachments to base64 with disposition', async ({ assert, fs }) => {
    await fs.create('logo.txt', 'hello-attachment-bytes')
    const base64 = Buffer.from('hello-attachment-bytes').toString('base64')
    const { server, ready, payload } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    const message = makeMessage()
    message.attach(join(fs.basePath, 'logo.txt'))

    await new CloudflareTransport({ key: 'token', baseUrl, accountId: 'acc' }).send(
      message.toJSON().message
    )
    server.close()

    const body = await payload
    assert.deepEqual(body.attachments, [
      { filename: 'logo.txt', content: base64, disposition: 'attachment' },
    ])
  })

  test('map embedded attachment cid to content_id with inline disposition', async ({
    assert,
    fs,
  }) => {
    await fs.create('logo.txt', 'hello-attachment-bytes')
    const base64 = Buffer.from('hello-attachment-bytes').toString('base64')
    const { server, ready, payload } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    const message = makeMessage()
    message.html('<img src="cid:logo" />')
    message.embed(join(fs.basePath, 'logo.txt'), 'logo')

    await new CloudflareTransport({ key: 'token', baseUrl, accountId: 'acc' }).send(
      message.toJSON().message
    )
    server.close()

    const body = await payload
    assert.deepEqual(body.attachments, [
      { filename: 'logo.txt', content: base64, disposition: 'inline', content_id: 'logo' },
    ])
  })
})

test.group('Cloudflare transport | errors', () => {
  test('throw when the API reports success false on a 200 response', async ({ assert }) => {
    const { server, ready } = captureServer({
      success: false,
      errors: [{ code: 1000, message: 'Sending domain is not verified' }],
      messages: [],
    })
    const baseUrl = await ready

    await assert.rejects(
      () =>
        new CloudflareTransport({ key: 'token', baseUrl, accountId: 'acc' }).send(
          makeMessage().toJSON().message
        ),
      'Unable to send email using the cloudflare transport'
    )
    server.close()
  })
})
