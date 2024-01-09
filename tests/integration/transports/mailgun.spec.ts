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

import { Message } from '../../../src/message.js'
import { MailgunTransport } from '../../../src/transports/mailgun.js'

/**
 * Returns mailgun message from their "/events" API
 */
function getMailgunMessage(messageId: string) {
  return retry(
    async () => {
      const response = await got.get<{ items: any }>(
        `${process.env.MAILGUN_BASE_URL}/${process.env.MAILGUN_DOMAIN}/events?message-id=${messageId}`,
        {
          responseType: 'json',
          username: 'api',
          password: process.env.MAILGUN_ACCESS_KEY,
        }
      )

      if (!response.body.items.length) {
        throw new Error('Empty events list')
      }

      return response
    },
    { retries: 3, minTimeout: 2000 }
  )
}

test.group('Mailgun Transport', () => {
  test('send email using mailgun transport', async ({ assert }) => {
    const mailgun = new MailgunTransport({
      key: process.env.MAILGUN_ACCESS_KEY!,
      baseUrl: process.env.MAILGUN_BASE_URL!,
      domain: process.env.MAILGUN_DOMAIN!,
    })

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

    const { body } = await getMailgunMessage(response.messageId)
    assert.exists(body.items[0])
    assert.oneOf(body.items[0].recipient, [
      process.env.TEST_EMAILS_RECIPIENT,
      process.env.TEST_EMAILS_CC,
    ])
  })

  test('define tags', async ({ assert }) => {
    const mailgun = new MailgunTransport({
      key: process.env.MAILGUN_ACCESS_KEY!,
      baseUrl: process.env.MAILGUN_BASE_URL!,
      domain: process.env.MAILGUN_DOMAIN!,
    })

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

    const { body } = await getMailgunMessage(response.messageId)
    assert.sameMembers(body.items[0].tags, ['test', 'newsletter'])
  })

  test('send attachments', async ({ assert }) => {
    const mailgun = new MailgunTransport({
      key: process.env.MAILGUN_ACCESS_KEY!,
      baseUrl: process.env.MAILGUN_BASE_URL!,
      domain: process.env.MAILGUN_DOMAIN!,
    })

    const message = new Message()
    message.from(process.env.MAILGUN_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.attach(new URL('../../../package.json', import.meta.url), {
      contentType: 'application/json',
      filename: 'package.json',
    })
    message.html('<p> Hello Adonis </p>')

    const response = await mailgun.send(message.toJSON().message)
    assert.exists(response.messageId)
    assert.equal(response.envelope!.from, process.env.MAILGUN_FROM_EMAIL)
    assert.deepEqual(response.envelope!.to, [
      process.env.TEST_EMAILS_RECIPIENT!,
      process.env.TEST_EMAILS_CC!,
    ])

    const { body } = await getMailgunMessage(response.messageId)
    assert.exists(body.items[0])
    assert.containsSubset(body.items[0].message.attachments, [
      {
        'content-type': 'application/json',
        'filename': 'package.json',
      },
    ])
  })

  test('get error when credentials are invalid', async ({ assert }) => {
    assert.plan(3)

    const mailgun = new MailgunTransport({
      key: 'foo',
      baseUrl: process.env.MAILGUN_BASE_URL!,
      domain: process.env.MAILGUN_DOMAIN!,
    })

    const message = new Message()
    message.from(process.env.MAILGUN_FROM_EMAIL!)
    message.to(process.env.TEST_EMAILS_RECIPIENT!)
    message.cc(process.env.TEST_EMAILS_CC!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    try {
      await mailgun.send(message.toJSON().message)
    } catch (error) {
      assert.equal(error.message, 'Unable to send email using the mailgun transport')
      assert.exists(error.cause)
      assert.equal(error.cause.response.statusCode, 401)
    }
  })

  test('get error when receipent was missing', async ({ assert }) => {
    assert.plan(3)

    const mailgun = new MailgunTransport({
      key: process.env.MAILGUN_ACCESS_KEY!,
      baseUrl: process.env.MAILGUN_BASE_URL!,
      domain: process.env.MAILGUN_DOMAIN!,
    })

    const message = new Message()
    message.from(process.env.MAILGUN_FROM_EMAIL!)
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')

    try {
      await mailgun.send(message.toJSON().message)
    } catch (error) {
      assert.equal(error.message, 'Unable to send email using the mailgun transport')
      assert.exists(error.cause)
      assert.equal(error.cause.response.statusCode, 400)
    }
  })
})
