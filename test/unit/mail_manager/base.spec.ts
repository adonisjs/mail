/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import { Mailer } from '../../../src/mail/mailer.js'
import driversList from '../../../src/drivers_list.js'
import { SesDriver } from '../../../src/drivers/ses.js'
import { SmtpDriver } from '../../../src/drivers/smtp.js'
import { defineConfig } from '../../../src/define_config.js'
import { CustomDriver, CustomDriverAsync, createMailManager } from '../../../test_helpers/index.js'
import { MessageNode } from '../../../src/types/message.js'

test.group('Mail Manager | Base', () => {
  test('create mailer instance from the manager', async ({ assert }) => {
    const { manager } = await createMailManager()
    const mailer = manager.use('smtp')

    assert.instanceOf(mailer, Mailer)
  })

  test('use specified driver', async ({ assert }) => {
    class FooDriver {
      async send() {}
      close() {}
    }

    const { manager } = await createMailManager({
      default: 'foo',
      list: {
        smtp: () => new SmtpDriver({ driver: 'smtp', host: 'test' }),
        foo: () => new FooDriver(),
      },
    })

    const mailer = manager.use('foo')
    assert.instanceOf(mailer.driver, FooDriver)

    const mailer1 = manager.use('smtp')
    assert.instanceOf(mailer1.driver, SmtpDriver)
  })

  test('use default driver', async ({ assert }) => {
    const { manager } = await createMailManager({
      default: 'smtp',
      list: {
        smtp: () => new SmtpDriver({ driver: 'smtp', host: 'test' }),
      },
    })

    const mailer = manager.use()
    assert.instanceOf(mailer.driver, SmtpDriver)
  })

  test('send() config should be inferred from the use mailer name', async ({ expectTypeOf }) => {
    const { manager } = await createMailManager({
      default: 'smtp',
      list: {
        smtp: () =>
          new (class {
            async send(message: MessageNode, config?: { foo: string }) {
              return { message, config }
            }

            close() {}
          })(),
      },
    })

    const mailer = manager.use('smtp')
    expectTypeOf(mailer.send).parameter(1).toEqualTypeOf<{ foo: string } | undefined>()
  })

  test('extend mailer with a custom driver', async ({ assert }) => {
    assert.plan(1)

    const config = defineConfig({
      default: 'marketing',
      list: { marketing: { driver: 'mydriver' } } as any,
    })

    // @ts-ignore
    driversList.extend('mydriver', () => ({ send: () => assert.isTrue(true) }))

    const { manager } = await createMailManager(config)
    const mailer = manager.use('marketing')

    await mailer.send(() => {})
  })

  test('raise error when trying to create a unknown driver', async ({ assert }) => {
    const { manager } = await createMailManager({ list: {} })
    assert.throws(() => manager.use('unknown' as any), '"unknown" is not a valid mailer name')
  })

  test('raise error when trying to create an unknown driver from driverList', ({ assert }) => {
    assert.throws(() => driversList.create('unknown' as any, {} as any), 'Unknown mail driver')
  })

  test('global settings should be effective', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'smtp',
      list: { smtp: () => customDriver },
    })

    manager.alwaysFrom('jul@adonisjs.com', 'Jul')
    manager.alwaysTo('foo@adonisjs.com')

    const mailer = manager.use('smtp')

    await mailer.send((message) => {
      message.to('other@foo.com').from('bla@baz.com').text('Hello world')
    })

    assert.deepEqual(customDriver.message?.from, { address: 'jul@adonisjs.com', name: 'Jul' })
    assert.deepEqual(customDriver.message?.to, [{ address: 'foo@adonisjs.com', name: undefined }])
  })

  test('multiple alwaysTo calls should append the email', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'smtp',
      list: { smtp: () => customDriver },
    })

    manager.alwaysTo('jul1@adonisjs.com', 'jul1')
    manager.alwaysTo('jul2@adonisjs.com', 'jul2')

    const mailer = manager.use('smtp')

    await mailer.send((message) => {
      message.to('other@foo.com').from('bla@baz.com').text('Hello world')
    })

    assert.deepEqual(customDriver.message?.to, [
      { address: 'jul1@adonisjs.com', name: 'jul1' },
      { address: 'jul2@adonisjs.com', name: 'jul2' },
    ])
  })

  test('allow to define alwaysFrom from config', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'smtp',
      list: { smtp: () => customDriver },
      from: { address: 'julr@adonisjs.com', name: 'jul' },
    })

    const mailer = manager.use('smtp')

    await mailer.send((message) => {
      message.to('foo@bar.com').text('Hello world')
    })

    assert.deepEqual(customDriver.message?.from, { address: 'julr@adonisjs.com', name: 'jul' })
  })

  test('should expose a prettyPrint method', async ({ assert }) => {
    const { manager } = await createMailManager()

    assert.isDefined(manager.prettyPrint)
  })

  test('register afterCompile hook', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'smtp',
      list: {
        smtp: () => customDriver,
        smtp2: () => customDriver,
      },
    })

    manager.afterCompile(async (mailerName, message) => {
      assert.equal(mailerName, 'smtp')
      message.message.html = 'hello'
    })

    const mailer = manager.use()
    await mailer.send((message) => {
      message.to('foo@bar.com').html('world')
    })

    assert.equal(customDriver.message?.html, 'hello')
  })
})

test.group('Mail manager | send', () => {
  test('send email', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    await manager.use().send((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })

    assert.deepEqual(customDriver.message, {
      to: [{ address: 'foo@bar.com' }],
      from: { address: 'baz@bar.com' },
      subject: 'Hello world',
    })
  })

  test('pass config all the way to the driver send method', async ({ assert }) => {
    const customDriver = new CustomDriver()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    await manager.use().send(
      (message) => {
        message.to('foo@bar.com')
        message.from('baz@bar.com')
        message.subject('Hello world')
      },
      { foo: 'bar' },
    )

    assert.deepEqual(customDriver.options, { foo: 'bar' })
  })
})

test.group('Mail manager | sendLater', () => {
  test('schedule emails for sending', async ({ assert }, done) => {
    const customDriver = new CustomDriverAsync()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    manager.monitorQueue(() => {
      assert.deepEqual(customDriver.message, {
        to: [{ address: 'foo@bar.com' }],
        from: { address: 'baz@bar.com' },
        subject: 'Hello world',
      })
      done()
    })

    await manager.use().sendLater((message) => {
      message.to('foo@bar.com')
      message.from('baz@bar.com')
      message.subject('Hello world')
    })
  }).waitForDone()

  test('pass config all the way to the driver sendLater method', async ({ assert }, done) => {
    const customDriver = new CustomDriverAsync()
    const { manager } = await createMailManager({
      default: 'custom',
      list: { custom: () => customDriver },
    })

    manager.monitorQueue(() => {
      assert.deepEqual(customDriver.options, { foo: 'bar' })
      done()
    })

    await manager.use().sendLater(() => {}, { foo: 'bar' })
  }).waitForDone()
})

test.group('Mail Manager | Cache', () => {
  test('cache mailer instance', async ({ assert, expectTypeOf }) => {
    const { manager } = await createMailManager({
      default: 'smtp',
      list: {
        smtp: () => new SmtpDriver({} as any),
        smtp1: () => new SmtpDriver({} as any),
        ses: () => new SesDriver({} as any),
        ses1: () => new SesDriver({} as any),
      },
    })

    expectTypeOf(manager.use)
      .parameter(0)
      .toEqualTypeOf<'smtp' | 'ses' | 'ses1' | 'smtp1' | undefined>()

    assert.strictEqual(manager.use('smtp'), manager.use('smtp'))
    assert.notStrictEqual(manager.use('smtp'), manager.use('smtp1'))

    assert.strictEqual(manager.use('ses'), manager.use('ses'))
    assert.notStrictEqual(manager.use('ses'), manager.use('ses1'))
  })
})
