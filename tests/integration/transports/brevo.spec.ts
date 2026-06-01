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
import { BrevoTransport } from '../../../src/transports/brevo.js'

test.group('Brevo Transport', () => {
  test('send email using brevo transport', async ({ assert }) => {
    const brevo = new BrevoTransport({
      key: process.env.BREVO_API_KEY!,
      baseUrl: process.env.BREVO_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.BREVO_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv6')
    message.html('<p> Hello Adonis </p>')

    const response = await brevo.send(message.toJSON().message)

    assert.equal(response.envelope!.from, process.env.BREVO_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  })

  test('send email with replyTo using brevo transport', async ({ assert }) => {
    const brevo = new BrevoTransport({
      key: process.env.BREVO_API_KEY!,
      baseUrl: process.env.BREVO_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.BREVO_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.replyTo('reply@example.com', 'Reply Name')
    message.subject('Test email with replyTo')
    message.html('<p> Hello with replyTo </p>')

    const response = await brevo.send(message.toJSON().message)

    assert.equal(response.envelope!.from, process.env.BREVO_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [process.env.TEST_EMAILS_RECIPIENT!])
  })

  test('send email with custom and list headers', async ({ assert }) => {
    const brevo = new BrevoTransport({
      key: process.env.BREVO_API_KEY!,
      baseUrl: process.env.BREVO_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.BREVO_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.subject('Test email with headers')
    message.html('<p> Hello with headers </p>')
    message.header('X-Custom-Header', 'custom-value')
    message.listUnsubscribe('https://adonisjs.com/unsubscribe')

    /**
     * The Brevo API rejects the payload (and "send" throws) when the
     * headers are malformed, so a resolved messageId means the custom
     * and list headers were accepted.
     */
    const response = await brevo.send(message.toJSON().message)

    assert.equal(response.envelope!.from, process.env.BREVO_FROM_EMAIL)
    assert.isDefined(response.messageId)
  })

  test('send email with a file attachment', async ({ assert, fs }) => {
    await fs.create('adonis.txt', 'Hello from AdonisJS')

    const brevo = new BrevoTransport({
      key: process.env.BREVO_API_KEY!,
      baseUrl: process.env.BREVO_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.BREVO_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.subject('Test email with attachment')
    message.html('<p> Hello with attachment </p>')
    message.attach(join(fs.basePath, 'adonis.txt'))

    /**
     * Before resolving the content to base64, a file path attachment threw
     * because "content" was undefined. A resolved messageId means the
     * attachment content was read and accepted.
     */
    const response = await brevo.send(message.toJSON().message)

    assert.equal(response.envelope!.from, process.env.BREVO_FROM_EMAIL)
    assert.isDefined(response.messageId)
  })
})
