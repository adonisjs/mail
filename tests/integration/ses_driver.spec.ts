/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import dotenv from 'dotenv'
import { join } from 'node:path'
import { test } from '@japa/runner'
import { getDirname } from '@poppinss/utils'

import { Message } from '../../src/message.js'
import { SESDriver } from '../../src/drivers/ses/main.js'

test.group('SES Driver', (group) => {
  group.setup(() => {
    dotenv.config({ path: join(getDirname(import.meta.url), '..', '..', '.env') })
  })

  test('send email using the SES driver', async ({ assert }) => {
    const ses = new SESDriver({
      apiVersion: '2010-12-01',
      key: process.env.AWS_ACCESS_KEY_ID!,
      secret: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
      sslEnabled: true,
    })

    const message = new Message()
    message.from(process.env.AWS_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await ses.send(message.toJSON().message)

    assert.exists(response.original.response)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.AWS_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  })
})
