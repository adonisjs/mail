/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LoggerFactory } from '@adonisjs/core/factories/logger'
import { getDirname } from '@poppinss/utils'
import { test } from '@japa/runner'
import dotenv from 'dotenv'
import { join } from 'node:path'

import { Message } from '../../src/message/index.js'
import { SparkPostDriver } from '../../src/drivers/sparkpost.js'

test.group('SparkPost Driver', (group) => {
  group.setup(() => {
    dotenv.config({ path: join(getDirname(import.meta.url), '..', '..', '.env') })
  })

  test('send email using sparkpost driver', async ({ assert }) => {
    const sparkpost = new SparkPostDriver(
      {
        driver: 'sparkpost',
        key: process.env.SPARKPOST_API_KEY!,
        baseUrl: process.env.SPARKPOST_BASE_URL!,
      },
      new LoggerFactory().create(),
    )

    const message = new Message()
    message.from(process.env.SPARKPOST_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)

    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await sparkpost.send(message.toJSON().message)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.SPARKPOST_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  })
})
