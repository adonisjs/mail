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

import { Message } from '../../../src/message.js'
import { PostmarkTransport } from '../../../src/transports/postmark.js'

test.group('Postmark Transport', () => {
  test('send email using postmark transport', async ({ assert }) => {
    const postmark = new PostmarkTransport({
      key: process.env.POSTMARK_API_KEY!,
      baseUrl: process.env.POSTMARK_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.POSTMARK_FROM_EMAIL!)
    message.to(process.env.POSTMARK_TO_EMAIL!)
    message.subject('Adonisv6')
    message.html('<p> Hello Adonis </p>')

    const response = await postmark.send(message.toJSON().message)

    assert.equal(response.envelope!.from, process.env.POSTMARK_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [process.env.POSTMARK_TO_EMAIL!])
    assert.isDefined(response.messageId)
    assert.equal(response.original.ErrorCode, 0)
  })

  test('send email with custom and list headers', async ({ assert }) => {
    const postmark = new PostmarkTransport({
      key: process.env.POSTMARK_API_KEY!,
      baseUrl: process.env.POSTMARK_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.POSTMARK_FROM_EMAIL!)
    message.to(process.env.POSTMARK_TO_EMAIL!)
    message.subject('Adonis headers')
    message.html('<p> Hello Adonis </p>')
    message.header('X-Custom-Header', 'custom-value')
    message.listUnsubscribe('https://adonisjs.com/unsubscribe')
    message.addListHeader('unsubscribe-post', 'List-Unsubscribe=One-Click')

    /**
     * Postmark rejects the payload (and "send" throws) when the headers
     * are malformed, so a zero ErrorCode means the custom and list headers
     * were accepted.
     */
    const response = await postmark.send(message.toJSON().message)
    assert.isDefined(response.messageId)
    assert.equal(response.original.ErrorCode, 0)
  })

  test('send email with a file attachment and inline embed', async ({ assert, fs }) => {
    await fs.create('adonis.txt', 'Hello from AdonisJS')

    const postmark = new PostmarkTransport({
      key: process.env.POSTMARK_API_KEY!,
      baseUrl: process.env.POSTMARK_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.POSTMARK_FROM_EMAIL!)
    message.to(process.env.POSTMARK_TO_EMAIL!)
    message.subject('Adonis attachments')
    message.html('<p> Hello Adonis </p> <img src="cid:logo" />')
    message.attach(join(fs.basePath, 'adonis.txt'))
    message.embed(join(fs.basePath, 'adonis.txt'), 'logo')

    /**
     * Postmark requires a ContentType on every attachment and rejects local
     * file paths it cannot read, so a zero ErrorCode means the resolved
     * attachment content was accepted.
     */
    const response = await postmark.send(message.toJSON().message)
    assert.isDefined(response.messageId)
    assert.equal(response.original.ErrorCode, 0)
  })

  test('throw error when key is missing', async () => {
    new PostmarkTransport({
      baseUrl: process.env.POSTMARK_BASE_URL!,
    } as any)
  }).throws('Invalid config for "postmark" transport. The "key" property is missing')

  test('throw error when baseUrl is missing', async () => {
    new PostmarkTransport({
      key: process.env.POSTMARK_API_KEY!,
    } as any)
  }).throws('Invalid config for "postmark" transport. The "baseUrl" property is missing')
})
