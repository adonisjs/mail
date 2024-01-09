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
import { SMTPTransport } from '../../../src/transports/smtp.js'

test.group('SMTP Transport', () => {
  test('send email using the SMTP transport', async ({ assert, cleanup }) => {
    const smtp = new SMTPTransport({
      host: process.env.MAILTRAP_SMTP_HOST!,
      auth: {
        type: 'login' as const,
        user: process.env.MAILTRAP_USERNAME!,
        pass: process.env.MAILTRAP_PASSWORD!,
      },
    })
    cleanup(() => smtp.close())

    const message = new Message()
    message.from(process.env.MAILTRAP_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await smtp.send(message.toJSON().message)

    assert.exists(response.original.response)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.MAILTRAP_FROM_EMAIL!)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  })
})
