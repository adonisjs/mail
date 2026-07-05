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
import { PostmarkTransport } from '../../../src/transports/postmark.js'

const SUCCESS_RESPONSE = {
  To: 'receiver@example.com',
  SubmittedAt: '2026-06-01T00:00:00Z',
  MessageID: 'postmark-message-id',
  ErrorCode: 0,
  Message: 'OK',
}

function makeMessage() {
  const message = new Message()
  message.from('sender@example.com', 'Sender')
  message.to('receiver@example.com', 'Receiver')
  message.subject('Hello')
  message.html('<p>Hello</p>')
  return message
}

test.group('Postmark transport | config', () => {
  test('throw when key is missing', () => {
    new PostmarkTransport({ baseUrl: 'https://api.postmarkapp.com' } as any)
  }).throws('Invalid config for "postmark" transport. The "key" property is missing')

  test('throw when baseUrl is missing', () => {
    new PostmarkTransport({ key: 'token' } as any)
  }).throws('Invalid config for "postmark" transport. The "baseUrl" property is missing')
})

test.group('Postmark transport | payload', () => {
  test('post to the email endpoint with the server token header', async ({ assert }) => {
    const { server, ready, payload, request } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    const response = await new PostmarkTransport({ key: 'server-token', baseUrl }).send(
      makeMessage().toJSON().message
    )
    server.close()

    await payload
    const { url, headers } = await request
    assert.equal(url, '/email')
    assert.equal(headers['x-postmark-server-token'], 'server-token')
    assert.equal(response.messageId, 'postmark-message-id')
  })

  test('format recipients as comma separated "Name <email>" strings', async ({ assert }) => {
    const { server, ready, payload } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    const message = makeMessage()
    message.to('second@example.com')
    message.cc('cc@example.com')
    message.bcc('bcc@example.com')
    message.replyTo('reply@example.com', 'Reply')

    await new PostmarkTransport({ key: 'token', baseUrl }).send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.equal(body.From, 'Sender <sender@example.com>')
    assert.equal(body.To, 'Receiver <receiver@example.com>,second@example.com')
    assert.equal(body.Cc, 'cc@example.com')
    assert.equal(body.Bcc, 'bcc@example.com')
    assert.equal(body.ReplyTo, 'Reply <reply@example.com>')
  })

  test('forward config driven options', async ({ assert }) => {
    const { server, ready, payload } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    await new PostmarkTransport({
      key: 'token',
      baseUrl,
      messageStream: 'broadcast',
      tag: 'welcome',
      trackOpens: true,
      trackLinks: 'HtmlOnly',
      metadata: { tenant: 'acme' },
    }).send(makeMessage().toJSON().message)
    server.close()

    const body = await payload
    assert.equal(body.MessageStream, 'broadcast')
    assert.equal(body.Tag, 'welcome')
    assert.equal(body.TrackOpens, true)
    assert.equal(body.TrackLinks, 'HtmlOnly')
    assert.deepEqual(body.Metadata, { tenant: 'acme' })
  })

  test('forward custom and list headers as Name/Value pairs', async ({ assert }) => {
    const { server, ready, payload } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    const message = makeMessage()
    message.header('X-Custom-Header', 'custom-value')
    message.listUnsubscribe('https://example.com/unsubscribe', { oneClick: true })

    await new PostmarkTransport({ key: 'token', baseUrl }).send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.deepInclude(body.Headers, { Name: 'X-Custom-Header', Value: 'custom-value' })
    assert.deepInclude(body.Headers, {
      Name: 'List-Unsubscribe',
      Value: '<https://example.com/unsubscribe>',
    })
    assert.deepInclude(body.Headers, {
      Name: 'List-Unsubscribe-Post',
      Value: 'List-Unsubscribe=One-Click',
    })
  })

  test('resolve attachments to base64 with PascalCase fields', async ({ assert, fs }) => {
    await fs.create('logo.txt', 'hello-attachment-bytes')
    const base64 = Buffer.from('hello-attachment-bytes').toString('base64')
    const { server, ready, payload } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    const message = makeMessage()
    message.attach(join(fs.basePath, 'logo.txt'))

    await new PostmarkTransport({ key: 'token', baseUrl }).send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.deepEqual(body.Attachments, [
      { Name: 'logo.txt', Content: base64, ContentType: 'text/plain' },
    ])
  })

  test('map embedded attachment cid to a prefixed ContentID', async ({ assert, fs }) => {
    await fs.create('logo.txt', 'hello-attachment-bytes')
    const base64 = Buffer.from('hello-attachment-bytes').toString('base64')
    const { server, ready, payload } = captureServer(SUCCESS_RESPONSE)
    const baseUrl = await ready

    const message = makeMessage()
    message.html('<img src="cid:logo" />')
    message.embed(join(fs.basePath, 'logo.txt'), 'logo')

    await new PostmarkTransport({ key: 'token', baseUrl }).send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.deepEqual(body.Attachments, [
      { Name: 'logo.txt', Content: base64, ContentType: 'text/plain', ContentID: 'cid:logo' },
    ])
  })
})

test.group('Postmark transport | errors', () => {
  test('throw when the API returns a non-zero ErrorCode on a 200 response', async ({ assert }) => {
    const { server, ready } = captureServer({ ErrorCode: 300, Message: 'Invalid email request' })
    const baseUrl = await ready

    await assert.rejects(
      () => new PostmarkTransport({ key: 'token', baseUrl }).send(makeMessage().toJSON().message),
      'Unable to send email using the postmark transport'
    )
    server.close()
  })
})
