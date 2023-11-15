/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import got from 'got'
import retry from 'async-retry'
import { test } from '@japa/runner'

import { Message } from '../../src/message.js'
import { ResendDriver } from '../../src/drivers/resend/main.js'

function getEmailById(id: string) {
  return retry(
    async () => {
      const response = await got.get<any>(`https://api.resend.com/emails/${id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'json',
      })
      return response
    },
    { retries: 2, minTimeout: 2000 }
  )
}

test.group('Resend Driver', () => {
  test('send email using resend driver', async ({ assert }) => {
    const resend = new ResendDriver({
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
})
