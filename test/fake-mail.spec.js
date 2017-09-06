'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ioc } = require('@adonisjs/fold')
const test = require('japa')
const { Config } = require('@adonisjs/sink')
const FakeMail = require('../src/Mail/Fake')
const Mail = require('../src/Mail')

test.group('FakeMail', () => {
  test('fake mail send all emails via memory driver', async (assert) => {
    const fakeMail = new FakeMail(new Config())
    const response = await fakeMail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })
    assert.equal(response.message.from.address, 'foo@bar.com')
    assert.equal(response.message.to[0].address, 'baz@bar.com')
    assert.equal(response.message.text, 'Hello everyone')
  })

  test('store sent email in memory', async (assert) => {
    const fakeMail = new FakeMail(new Config())
    const response = await fakeMail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })
    assert.deepEqual(response, fakeMail._mails[0])
  })

  test('give last email from the mails array', async (assert) => {
    const fakeMail = new FakeMail(new Config())
    const response = await fakeMail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })
    assert.deepEqual(response, fakeMail.recent())
  })

  test('pull last email from array', async (assert) => {
    const fakeMail = new FakeMail(new Config())
    await fakeMail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    const response = await fakeMail.raw('Another one', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    assert.deepEqual(response, fakeMail.pullRecent())
    assert.lengthOf(fakeMail._mails, 1)
  })

  test('return a copy of all emails', async (assert) => {
    const fakeMail = new FakeMail(new Config())
    await fakeMail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
      message.subject('Hello everyone')
    })

    await fakeMail.raw('Another one', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    const mails = fakeMail.all()
    assert.lengthOf(mails, 2)
    mails[0].message.subject = 'Foo'
    assert.equal(fakeMail._mails[0].message.subject, 'Hello everyone')
  })

  test('clear all emails', async (assert) => {
    const fakeMail = new FakeMail(new Config())
    await fakeMail.raw('Hello everyone', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
      message.subject('Hello everyone')
    })

    await fakeMail.raw('Another one', (message) => {
      message.from('foo@bar.com')
      message.to('baz@bar.com')
    })

    fakeMail.clear()
    assert.lengthOf(fakeMail.all(), 0)
  })

  test('bind fake mailer when fake method is called', async (assert) => {
    const mail = new Mail(new Config())
    mail.fake()
    assert.instanceOf(ioc.use('Adonis/Addons/Mail'), FakeMail)
    ioc.use('Adonis/Addons/Mail').restore()
  })

  test('restore fake mailer', async (assert) => {
    assert.plan(2)

    const mail = new Mail(new Config())
    mail.fake()

    assert.instanceOf(ioc.use('Adonis/Addons/Mail'), FakeMail)
    ioc.use('Adonis/Addons/Mail').restore()

    try {
      ioc.use('Adonis/Addons/Mail')
    } catch ({ message }) {
      assert.equal(message, `Cannot find module 'Adonis/Addons/Mail'`)
    }
  })
})
