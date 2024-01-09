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
import { SparkPostTransport } from '../../../src/transports/sparkpost.js'

test.group('SparkPost Transport', () => {
  test('send email using sparkpost transport', async ({ assert }) => {
    const sparkpost = new SparkPostTransport({
      key: process.env.SPARKPOST_API_KEY!,
      baseUrl: process.env.SPARKPOST_BASE_URL!,
    })

    const message = new Message()
    message.from(process.env.SPARKPOST_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)

    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await sparkpost.send(message.toJSON().message)

    assert.exists(response.messageId)
    assert.equal(response.original.total_accepted_recipients, 2)
    assert.equal(response.original.total_rejected_recipients, 0)
    assert.equal(response.envelope!.from, process.env.SPARKPOST_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  })
})
