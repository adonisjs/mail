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
import { BrevoTransport } from '../../../src/transports/brevo.js'
import { ResendTransport } from '../../../src/transports/resend.js'

const FILE_CONTENT = 'hello-attachment-bytes'
const FILE_BASE64 = Buffer.from(FILE_CONTENT).toString('base64')

test.group('Resend transport | attachments', () => {
  test('resolve a file path attachment to base64 content', async ({ assert, fs }) => {
    await fs.create('logo.txt', FILE_CONTENT)
    const { server, ready, payload } = captureServer({ id: 'resend-message-id' })
    const baseUrl = await ready

    const message = new Message()
    message.from('sender@example.com')
    message.to('receiver@example.com')
    message.subject('Hello')
    message.html('<p>Hello</p>')
    message.attach(join(fs.basePath, 'logo.txt'))

    await new ResendTransport({ key: 'test_key', baseUrl }).send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.deepEqual(body.attachments, [{ filename: 'logo.txt', content: FILE_BASE64 }])
  })

  test('map embedded attachment cid to content_id', async ({ assert, fs }) => {
    await fs.create('logo.txt', FILE_CONTENT)
    const { server, ready, payload } = captureServer({ id: 'resend-message-id' })
    const baseUrl = await ready

    const message = new Message()
    message.from('sender@example.com')
    message.to('receiver@example.com')
    message.subject('Hello')
    message.html('<img src="cid:logo" />')
    message.embed(join(fs.basePath, 'logo.txt'), 'logo')

    await new ResendTransport({ key: 'test_key', baseUrl }).send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.deepEqual(body.attachments, [
      { filename: 'logo.txt', content: FILE_BASE64, content_id: 'logo' },
    ])
  })

  test('resolve raw data attachment to base64 content', async ({ assert }) => {
    const { server, ready, payload } = captureServer({ id: 'resend-message-id' })
    const baseUrl = await ready

    const message = new Message()
    message.from('sender@example.com')
    message.to('receiver@example.com')
    message.subject('Hello')
    message.html('<p>Hello</p>')
    message.attachData(Buffer.from(FILE_CONTENT), { filename: 'logo.txt' })

    await new ResendTransport({ key: 'test_key', baseUrl }).send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.deepEqual(body.attachments, [{ filename: 'logo.txt', content: FILE_BASE64 }])
  })
})

test.group('Brevo transport | attachments', () => {
  test('resolve a file path attachment to base64 content', async ({ assert, fs }) => {
    await fs.create('logo.txt', FILE_CONTENT)
    const { server, ready, payload } = captureServer({ messageId: 'brevo-message-id' })
    const baseUrl = await ready

    const message = new Message()
    message.from('sender@example.com')
    message.to('receiver@example.com')
    message.subject('Hello')
    message.html('<p>Hello</p>')
    message.attach(join(fs.basePath, 'logo.txt'))

    await new BrevoTransport({ key: 'test_key', baseUrl }).send(message.toJSON().message)
    server.close()

    const body = await payload
    assert.deepEqual(body.attachment, [{ name: 'logo.txt', content: FILE_BASE64 }])
  })
})
