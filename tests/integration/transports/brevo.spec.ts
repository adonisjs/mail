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
})
