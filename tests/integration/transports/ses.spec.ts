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
import { SESTransport } from '../../../src/transports/ses.js'

test.group('SES Transport', () => {
  test('send email using the SES transport', async ({ assert, cleanup }) => {
    const ses = new SESTransport({
      apiVersion: '2010-12-01',
      region: process.env.SES_REGION!,
      credentials: {
        accessKeyId: process.env.SES_ACCESS_KEY_ID!,
        secretAccessKey: process.env.SES_SECRET_ACCESS_KEY!,
      },
    })
    cleanup(() => ses.close())

    const message = new Message()
    message.from(process.env.SES_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await ses.send(message.toJSON().message)

    assert.exists(response.original.response)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.SES_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  }).skip(true, 'We do not have SES account for testing')
})
