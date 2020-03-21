/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import dotenv from 'dotenv'
import { join } from 'path'
import FormData from 'form-data'
import { Edge } from 'edge.js'

import { MailgunTransporter, MailgunDriver } from '../src/Drivers/Mailgun'
import { Message } from '../src/Message'

test.group('Mailgun Driver', group => {
  group.before(() => {
    dotenv.config({ path: join(__dirname, '..', '.env') })
  })

  test('get list of receipent with email properly formatted', assert => {
    const mailgunTransporter = new MailgunTransporter({
      domain: 'test.domain',
      apiKey: 'test',
    })
    const formdata = new FormData()
    const message = new Message(new Edge())
    message.from('test@bar.com')
    message.to('foo@bar.com')
    message.bcc('baz@bar.com')
    mailgunTransporter.prepareAddresses(formdata, message.toJSON())
    const stream = formdata['_streams']
    assert.include(stream[0], 'name="from"')
    assert.equal(stream[1], 'test@bar.com')
    assert.include(stream[3], 'name="to"')
    assert.equal(stream[4], 'foo@bar.com')
    assert.include(stream[6], 'name="bcc"')
    assert.equal(stream[7], 'baz@bar.com')
  })

  test('get the addresses with email and name properly formatted', assert => {
    const mailgunTransporter = new MailgunTransporter({
      domain: 'test.domain',
      apiKey: 'test',
    })
    const formdata = new FormData()
    const message = new Message(new Edge())
    message.from('test@bar.com', 'Mr test')
    message.to('foo@bar.com', 'Mr foo')
    message.bcc('baz@bar.com', 'Mr baz')
    mailgunTransporter.prepareAddresses(formdata, message.toJSON())
    const stream = formdata['_streams']
    assert.include(stream[0], 'name="from"')
    assert.equal(stream[1], 'Mr test <test@bar.com>')
    assert.include(stream[3], 'name="to"')
    assert.equal(stream[4], 'Mr foo <foo@bar.com>')
    assert.include(stream[6], 'name="bcc"')
    assert.equal(stream[7], 'Mr baz <baz@bar.com>')
  })

  test('return empty object when no extras are defined', assert => {
    const mailgunTransporter = new MailgunTransporter({
      domain: 'test.domain',
      apiKey: 'test',
    })
    assert.deepEqual(mailgunTransporter.getExtras(), {})
  })

  test('return config from the static config', assert => {
    const mailgunTransporter = new MailgunTransporter({
      domain: 'test.domain',
      apiKey: 'test',
      extras: {
        'o:campaign': 'marketing',
      },
    })
    assert.deepEqual(mailgunTransporter.getExtras(), {
      'o:campaign': 'marketing',
    })
  })

  test('give priority to runtime config', assert => {
    const mailgunTransporter = new MailgunTransporter({
      domain: 'test.domain',
      apiKey: 'test',
      extras: {
        'o:campaign': 'marketing',
      },
    })
    assert.deepEqual(mailgunTransporter.getExtras({ 'o:campaign': 'sales' }), {
      'o:campaign': 'sales',
    })
  })

  test('return correct endpoint', assert => {
    const mailgunTransporter = new MailgunTransporter({
      domain: 'test.domain',
      apiKey: 'test',
    })
    assert.deepEqual(
      mailgunTransporter.endpoint,
      'https://api.mailgun.net/v3/test.domain/messages'
    )
  })

  test('send plain email', async (assert) => {
    const config = {
      domain: process.env.MAILGUN_DOMAIN!,
      apiKey: process.env.MAILGUN_API_KEY!,
    }
    const mailgun = new MailgunDriver(config)
    const message = new Message(new Edge())
    message.from('test@foor.bar', 'Test name')
    message.to(process.env.MAILGUN_EMAIL!, 'Test user')
    message.subject('Adonisv5')
    message.html('<p> Hello Adonis </p>')
    const response = await mailgun.send(message.toJSON())
    assert.isDefined(response.messageId)
    assert.equal(response.acceptedCount, 1)
  }).timeout(0)

  test('return mail error', async (assert) => {
    assert.plan(1)

    const config = {
      domain: process.env.MAILGUN_DOMAIN!,
      apiKey: '',
    }

    const mailgun = new MailgunDriver(config)
    try {
      await mailgun.send({
        from: {address: process.env.MAILGUN_EMAIL!},
        to: [{ name: 'Test user', address: process.env.MAILGUN_EMAIL! }],
        subject: 'Mailgun email',
        html: '<h2> Hello </h2>',
      })
    } catch (error) {
      assert.include(error.message, 'status code 401')
    }
  }).timeout(0)
})
