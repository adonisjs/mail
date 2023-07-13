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

import { Message } from '../../src/message.js'
import { ResendDriver } from '../../src/drivers/resend/driver.js'
import got from 'got'

function getEmailById(id: string) {
  return got
    .get(`https://api.resend.com/emails/${id}`, {
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    .json<{
      object: 'email'
      id: string
      to: string[]
      from: string
      html: string
      subject: string
    }>()
}

test.group('Resend Driver', (group) => {
  group.setup(() => {
    dotenv.config({ path: join(getDirname(import.meta.url), '..', '..', '.env') })
  })

  test('send email using resend driver', async ({ assert }) => {
    const resend = new ResendDriver(
      { driver: 'resend', key: process.env.RESEND_API_KEY! },
      new LoggerFactory().create()
    )

    const message = new Message()
    message.from(process.env.RESEND_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv6')
    message.html('<p> Hello Adonis </p>')

    const response = await resend.send(message.toJSON().message, {
      tags: [
        { name: 'type', value: 'adonis6' },
        { name: 'version', value: '6' },
      ],
    })

    assert.equal(response.envelope!.from, process.env.RESEND_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])

    const email = await getEmailById(response.messageId)

    assert.deepEqual(email.object, 'email')
    assert.deepEqual(email.html, '<p> Hello Adonis </p>')
    assert.deepEqual(email.from, process.env.RESEND_FROM_EMAIL)
    assert.deepEqual(email.subject, 'Adonisv6')
  })
})
