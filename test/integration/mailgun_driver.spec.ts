/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'

import got from 'got'
import dotenv from 'dotenv'
import { test } from '@japa/runner'
import { getDirname } from '@poppinss/utils'
import { LoggerFactory } from '@adonisjs/core/factories/logger'

import { MailgunDriver } from '../../src/drivers/mailgun/driver.js'
import { Message } from '../../src/message.js'

const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(resolve, time))

test.group('Mailgun Driver', (group) => {
  group.setup(() => {
    dotenv.config({ path: join(getDirname(import.meta.url), '..', '..', '.env') })
  })

  test('send email using mailgun driver', async ({ assert }) => {
    const mailgun = new MailgunDriver(
      {
        driver: 'mailgun',
        key: process.env.MAILGUN_ACCESS_KEY!,
        baseUrl: process.env.MAILGUN_BASE_URL!,
        domain: process.env.MAILGUN_DOMAIN!,
      },
      new LoggerFactory().create()
    )

    const message = new Message()
    message.from(process.env.MAILGUN_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await mailgun.send(message.toJSON().message)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.MAILGUN_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  })

  test('enable tracking', async ({ assert }) => {
    const mailgun = new MailgunDriver(
      {
        driver: 'mailgun',
        key: process.env.MAILGUN_ACCESS_KEY!,
        baseUrl: process.env.MAILGUN_BASE_URL!,
        domain: process.env.MAILGUN_DOMAIN!,
        oTracking: true,
      },
      new LoggerFactory().create()
    )

    const message = new Message()
    message.from(process.env.MAILGUN_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await mailgun.send(message.toJSON().message)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.MAILGUN_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])
  })

  test('attach tags', async ({ assert }) => {
    const mailgun = new MailgunDriver(
      {
        driver: 'mailgun',
        key: process.env.MAILGUN_ACCESS_KEY!,
        baseUrl: process.env.MAILGUN_BASE_URL!,
        domain: process.env.MAILGUN_DOMAIN!,
      },
      new LoggerFactory().create()
    )

    const message = new Message()
    message.from(process.env.MAILGUN_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    const response = await mailgun.send(message.toJSON().message, {
      oTags: ['newsletter', 'test'],
    })
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.MAILGUN_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])

    await sleep(4000)

    const { body } = await got.get<{ items: any }>(
      `${process.env.MAILGUN_BASE_URL}/${process.env.MAILGUN_DOMAIN}/events?message-id=${response.messageId}`,
      {
        responseType: 'json',
        username: 'api',
        password: process.env.MAILGUN_ACCESS_KEY,
      }
    )

    assert.sameMembers(body.items[0].tags, ['test', 'newsletter'])
  }).retry(2)
})
