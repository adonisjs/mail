/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { defineConfig } from '../../src/define_config.js'
import driversList from '../../src/drivers_list.js'
import { MailgunDriver } from '../../src/drivers/mailgun.js'
import { MessageComposeCallback } from '../../src/types/main.js'
import { SesDriver } from '../../src/drivers/ses.js'
import { MailManagerFactory } from '../../factories/mail_manager.js'

test.group('Define config', () => {
  test('raise error when list of drivers is empty', ({ assert }) => {
    assert.throws(() => defineConfig({} as any), 'Missing "list" property inside the mail config')
  })

  test('raise error when default driver is not in the list', ({ assert }) => {
    assert.throws(
      // @ts-ignore
      () => defineConfig({ list: {}, default: 'smtp' as any }),
      '"smtp" is not a valid mailer name'
    )
  })

  test('returns a list of driver factory with defined drivers', ({ assert }) => {
    const config = defineConfig({
      default: 'smtp',
      list: {
        smtp: { driver: 'smtp', host: 'test' },
        mailgun: { driver: 'mailgun', baseUrl: 'test', domain: 'test', key: 'test' },
      },
    })

    assert.deepEqual(Object.keys(config.list), ['smtp', 'mailgun'])
    assert.isFunction(config.list.smtp)
    assert.isFunction(config.list.mailgun)
  })

  test('use driversList to create instance', ({ assert }) => {
    assert.plan(1)

    driversList.extend('smtp', (): any => {
      assert.isTrue(true)
    })

    const config = defineConfig({
      default: 'smtp',
      list: { smtp: { driver: 'smtp', host: 'test' } },
    })

    config.list.smtp(null as any)
  })

  test('factory should use mailer configuration', ({ assert }) => {
    assert.plan(2)

    const config = defineConfig({
      default: 'smtp',
      list: { smtp: { driver: 'smtp', host: 'foo' } },
    })

    driversList.extend('smtp', (c: any): any => {
      assert.isTrue(true)
      assert.equal(c.host, 'foo')
    })

    config.list.smtp(null as any)
  })

  test('send() types should be inferred from config', ({ expectTypeOf }) => {
    const config = defineConfig({
      default: 'mailgun',
      list: {
        ses: { driver: 'ses', apiVersion: 'test', key: 'test', region: 'test', secret: 'test' },
        mailgun: { driver: 'mailgun', baseUrl: 'test', domain: 'test', key: 'test' },
      },
    })

    driversList.extend('ses', (c) => new SesDriver(c))
    driversList.extend('mailgun', (c) => new MailgunDriver(c, {} as any))

    const manager = new MailManagerFactory(config).create(null as any)

    expectTypeOf(manager.use('mailgun').send).parameter(0).toEqualTypeOf<MessageComposeCallback>()
    expectTypeOf(manager.use('mailgun').send)
      .parameter(1)
      .toEqualTypeOf<Parameters<MailgunDriver['send']>[1]>()

    expectTypeOf(manager.use('ses').send).parameter(0).toEqualTypeOf<MessageComposeCallback>()
    expectTypeOf(manager.use('ses').send)
      .parameter(1)
      .toEqualTypeOf<Parameters<SesDriver['send']>[1]>()
  })
})
