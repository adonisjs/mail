'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const { Config } = require('@adonisjs/sink')
const FakeMail = require('../src/Mail/Fake')
const Mail = require('../src/Mail')

test.group('FakeMail', () => {
  test('fake mail send all emails via memory driver', async (assert) => {
    const mail = new Mail(new Config())
    mail.fake()

    const response = await mail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    assert.equal(response.message.from.address, 'foo@bar.com')
    assert.equal(response.message.to[0].address, 'baz@bar.com')
    assert.equal(response.message.text, 'Hello everyone')
  })

  test('store sent email in memory', async (assert) => {
    const mail = new Mail(new Config())
    mail.fake()

    const response = await mail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    assert.deepEqual(response, mail._mails[0])
  })

  test('give last email from the mails array', async (assert) => {
    const mail = new Mail(new Config())
    mail.fake()

    const response = await mail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    assert.deepEqual(response, mail.recent())
  })

  test('pull last email from array', async (assert) => {
    const mail = new Mail(new Config())
    mail.fake()

    await mail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    const response = await mail.raw('Another one', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    assert.deepEqual(response, mail.pullRecent())
    assert.lengthOf(mail._mails, 1)
  })

  test('return a copy of all emails', async (assert) => {
    const mail = new Mail(new Config())
    mail.fake()

    await mail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
      message.subject('Hello everyone')
    })

    await mail.raw('Another one', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    const mails = mail.all()
    assert.lengthOf(mails, 2)
    mails[0].message.subject = 'Foo'
    assert.equal(mail._mails[0].message.subject, 'Hello everyone')
  })

  test('clear all emails', async (assert) => {
    const mail = new Mail(new Config())
    mail.fake()

    await mail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
      message.subject('Hello everyone')
    })

    await mail.raw('Another one', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    mail.clear()
    assert.lengthOf(mail.all(), 0)
  })

  test('restore fake mailer', async (assert) => {
    assert.plan(2)

    const mail = new Mail(new Config())
    mail.fake()

    assert.instanceOf(mail._fake, FakeMail)

    mail.restore()

    assert.isNull(mail._fake)
  })
})
