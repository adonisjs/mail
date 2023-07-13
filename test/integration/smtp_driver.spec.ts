/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { getDirname } from '@poppinss/utils'
import { test } from '@japa/runner'
import { join } from 'node:path'
import dotenv from 'dotenv'

import { Message } from '../../src/message.js'
import { SmtpDriver } from '../../src/drivers/smtp/driver.js'

test.group('Smtp Driver', (group) => {
  group.setup(() => {
    dotenv.config({ path: join(getDirname(import.meta.url), '..', '..', '.env') })
  })

  test('send email using smtp driver', async ({ assert }) => {
    const smtp = new SmtpDriver({
      driver: 'smtp',
      host: process.env.MAILTRAP_SMTP_HOST!,
      auth: {
        type: 'login' as const,
        user: process.env.MAILTRAP_USERNAME!,
        pass: process.env.MAILTRAP_PASSWORD!,
      },
    })

    const message = new Message()
    message.from(process.env.MAILTRAP_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await smtp.send(message.toJSON().message)

    assert.exists(response.response)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.MAILTRAP_EMAIL!)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  })
})
