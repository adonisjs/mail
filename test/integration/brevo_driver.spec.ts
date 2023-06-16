/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'

import dotenv from 'dotenv'
import { test } from '@japa/runner'
import { getDirname } from '@poppinss/utils'
import { LoggerFactory } from '@adonisjs/core/factories/logger'

import { Message } from '../../src/message/index.js'
import { BrevoDriver } from '../../src/drivers/brevo.js'

test.group('Brevo Driver', (group) => {
  group.setup(() => {
    dotenv.config({ path: join(getDirname(import.meta.url), '..', '..', '.env') })
  })

  test('send email using brevo driver', async ({ assert }) => {
    const brevo = new BrevoDriver(
      { driver: 'brevo', key: process.env.BREVO_API_KEY! },
      new LoggerFactory().create(),
    )

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
