/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import ky from 'ky'
import { join } from 'node:path'
import retry from 'async-retry'
import { test } from '@japa/runner'

import { Message } from '../../../src/message.js'
import { ResendTransport } from '../../../src/transports/resend.js'

function getEmailById(id: string) {
  return retry(
    async () => {
      const response = await ky.get<any>(`https://api.resend.com/emails/${id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      const body = await response.json()
      return { body }
    },
    { retries: 2, minTimeout: 2000 }
  )
}

test.group('Resend Transport', () => {
  test('send email using resend transport', async ({ assert }) => {
    const resend = new ResendTransport({
      key: process.env.RESEND_API_KEY!,
      baseUrl: process.env.RESEND_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.RESEND_FROM_EMAIL!)
    message.to(process.env.RESEND_TO_EMAIL!)
    message.cc(process.env.RESEND_TO_EMAIL!)
    message.subject('Adonisv6')
    message.html('<p> Hello Adonis </p>')

    const response = await resend.send(message.toJSON().message, {
      tags: [
        { name: 'type', value: 'adonis6' },
        { name: 'version', value: '6' },
      ],
    })

    assert.equal(response.envelope!.from, process.env.RESEND_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [process.env.RESEND_TO_EMAIL!])

    const email = await getEmailById(response.messageId)

    assert.deepEqual(email.body.object, 'email')
    assert.deepEqual(email.body.html, '<p> Hello Adonis </p>')
    assert.deepEqual(email.body.from, process.env.RESEND_FROM_EMAIL)
    assert.deepEqual(email.body.subject, 'Adonisv6')
  })

  test('send email with custom and list headers', async ({ assert }) => {
    const resend = new ResendTransport({
      key: process.env.RESEND_API_KEY!,
      baseUrl: process.env.RESEND_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.RESEND_FROM_EMAIL!)
    message.to(process.env.RESEND_TO_EMAIL!)
    message.subject('Adonis headers')
    message.html('<p> Hello Adonis </p>')
    message.header('X-Custom-Header', 'custom-value')
    message.listUnsubscribe('https://adonisjs.com/unsubscribe', { oneClick: true })

    /**
     * The Resend API rejects the payload (and "send" throws) when the
     * headers are malformed, so a resolved messageId means the custom
     * and list headers were accepted.
     */
    const response = await resend.send(message.toJSON().message)
    assert.isDefined(response.messageId)

    const email = await getEmailById(response.messageId)
    assert.equal(email.body.object, 'email')
  })

  test('send email with a file attachment and inline embed', async ({ assert, fs }) => {
    await fs.create('adonis.txt', 'Hello from AdonisJS')

    const resend = new ResendTransport({
      key: process.env.RESEND_API_KEY!,
      baseUrl: process.env.RESEND_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.RESEND_FROM_EMAIL!)
    message.to(process.env.RESEND_TO_EMAIL!)
    message.subject('Adonis attachments')
    message.html('<p> Hello Adonis </p> <img src="cid:logo" />')
    message.attach(join(fs.basePath, 'adonis.txt'))
    message.embed(join(fs.basePath, 'adonis.txt'), 'logo')

    /**
     * Before resolving the content to base64, the local file path was
     * forwarded as a hosted URL and rejected by the API. A resolved
     * messageId means the attachment content was accepted.
     */
    const response = await resend.send(message.toJSON().message)
    assert.isDefined(response.messageId)

    const email = await getEmailById(response.messageId)
    assert.equal(email.body.object, 'email')
  })

  test('throw error when key is missing', async () => {
    new ResendTransport({
      baseUrl: process.env.RESEND_BASE_URL!,
    } as any)
  }).throws('Invalid config for "resend" transport. The "key" property is missing')

  test('throw error when baseUrl is missing', async () => {
    new ResendTransport({
      key: process.env.RESEND_API_KEY!,
    } as any)
  }).throws('Invalid config for "resend" transport. The "baseUrl" property is missing')
})
