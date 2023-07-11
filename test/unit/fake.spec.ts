/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { CustomDriver, createMailManager } from '../../test_helpers/index.js'

test.group('Fake mail manager', () => {
  test('fake default mailer', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    const fakeMail = manager.fake()

    await manager.use().send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    assert.deepEqual(fakeMail.find({ to: [{ address: 'foo@bar.com' }] }), {
      to: [{ address: 'foo@bar.com', name: '' }],
      from: { address: 'baz@bar.com', name: '' },
      subject: 'Hello world',
    })

    assert.isNull(customDriver.message)
  })

  test('fake named mailer', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const customRealDriver = new CustomDriver()

    const { manager } = await createMailManager({
      default: 'smtp',
      list: { smtp: () => customRealDriver, custom: () => customDriver },
    })

    const fakeMail = manager.fake('custom')

    /**
     * Will be faked
     */
    await manager.use('custom').send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    /**
     * Will hit real driver
     */
    await manager.use().send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    assert.deepEqual(fakeMail.find({ to: [{ address: 'foo@bar.com' }] }), {
      to: [{ address: 'foo@bar.com', name: '' }],
      from: { address: 'baz@bar.com', name: '' },
      subject: 'Hello world',
    })

    assert.deepEqual(customRealDriver.message, {
      to: [{ address: 'foo@bar.com' }],
      from: { address: 'baz@bar.com' },
      subject: 'Hello world',
    })

    assert.isTrue(fakeMail.isFaked('custom'))
    assert.isFalse(fakeMail.isFaked('smtp'))
  })

  test('send later should not add mail to the queue', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    const fakeMail = manager.fake()
    await manager.use().sendLater((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    assert.deepEqual(fakeMail.find({ to: [{ address: 'foo@bar.com' }] }), {
      to: [{ address: 'foo@bar.com', name: '' }],
      from: { address: 'baz@bar.com', name: '' },
      subject: 'Hello world',
    })

    assert.isNull(customDriver.message)
  })

  test('remove fake after restore', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    const fakeMail = manager.fake()
    assert.isTrue(fakeMail.isFaked('custom'))

    manager.restore()

    await manager.use().send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    assert.deepEqual(
      fakeMail.filter(() => true),
      []
    )

    assert.deepEqual(customDriver.message, {
      to: [{ address: 'foo@bar.com' }],
      from: { address: 'baz@bar.com' },
      subject: 'Hello world',
    })

    assert.isFalse(fakeMail.isFaked('custom'))
  })

  test('fake when calling send on the mail manager', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    const fakeMail = manager.fake()

    await manager.send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    assert.deepEqual(fakeMail.find({ to: [{ address: 'foo@bar.com' }] }), {
      to: [{ address: 'foo@bar.com', name: '' }],
      from: { address: 'baz@bar.com', name: '' },
      subject: 'Hello world',
    })
    assert.isNull(customDriver.message)
  })

  test('fake when calling sendLater on the mail manager', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    const fakeMail = manager.fake()

    await manager.sendLater((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    assert.deepEqual(fakeMail.find({ to: [{ address: 'foo@bar.com' }] }), {
      to: [{ address: 'foo@bar.com', name: '' }],
      from: { address: 'baz@bar.com', name: '' },
      subject: 'Hello world',
    })

    assert.isNull(customDriver.message)
  })

  test('assertSent should throw AssertionError when mail is not sent', async ({ assert }) => {
    const { manager } = await createMailManager()
    const fakeMail = manager.fake()

    assert.throws(
      () => fakeMail.assertSent(() => false),
      'Expected to find sent email but not found any'
    )
  })

  test('assertSent should works fine when mail is found', async ({ assert }) => {
    const { manager } = await createMailManager()
    const fakeMail = manager.fake()

    await manager.send((message) => {
      message.to('jul@adonisjs.com').text('Hello world')
    })

    assert.doesNotThrows(() =>
      fakeMail.assertSent({
        to: [{ address: 'jul@adonisjs.com' }],
        text: 'Hello world',
      })
    )
  })

  test('assertNotSent should throw AssertionError when mail is found', async ({ assert }) => {
    const { manager } = await createMailManager()
    const fakeMail = manager.fake()

    await manager.send((message) => {
      message.to('jul@adonisjs.com').text('Hello world')
    })

    assert.throws(
      () =>
        fakeMail.assertNotSent({
          to: [{ address: 'jul@adonisjs.com' }],
          text: 'Hello world',
        }),
      'Expected to not find sent email but found one'
    )
  })

  test('assertNotSent should works fine when mail is not found', async ({ assert }) => {
    const { manager } = await createMailManager()
    const fakeMail = manager.fake()

    assert.doesNotThrows(() =>
      fakeMail.assertNotSent({
        to: [{ address: 'jul@adonisjs.com' }],
        text: 'Hello world',
      })
    )

    assert.doesNotThrows(() => fakeMail.assertNotSent(() => false))
  })

  test('assertNothingSent should throw AssertionError when mail is found', async ({ assert }) => {
    const { manager } = await createMailManager()
    const fakeMail = manager.fake()

    await manager.send((message) => {
      message.to('jul@adonisjs.com').text('Hello world')
    })

    assert.throws(() => fakeMail.assertNoneSent(), 'Expected to not find sent email but found one')
  })

  test('assertNothingSent should works fine when mail is not found', async ({ assert }) => {
    const { manager } = await createMailManager()
    const fakeMail = manager.fake()

    assert.doesNotThrows(() => fakeMail.assertNoneSent())
  })
})
