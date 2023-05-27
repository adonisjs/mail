/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IgnitorFactory } from '@adonisjs/core/factories'
import { test } from '@japa/runner'

import { defineConfig } from '../../src/define_config.js'
import driversList from '../../src/drivers_list.js'
import { SmtpDriver } from '../../src/drivers/smtp.js'
import { MailgunDriver } from '../../src/drivers/mailgun.js'
import { SesDriver } from '../../src/drivers/ses.js'
import { SparkPostDriver } from '../../src/drivers/sparkpost.js'
import { Mailer } from '../../src/mail/mailer.js'
import { MailManager } from '../../src/mail/mail_manager.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Mail Provider', () => {
  test('should expose the mail manager', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .withCoreProviders()
      .merge({
        config: { views: { cache: false } },
        rcFileContents: {
          providers: [
            '../../providers/mail_provider.js',
            '@adonisjs/view/providers/views_provider',
          ],
        },
      })
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const manager = await app.container.make('mail')

    assert.instanceOf(manager, MailManager)
  })

  test('construct mailer class from the container', async ({ assert }) => {
    const config = defineConfig({
      default: 'smtp',
      list: { smtp: { driver: 'smtp', host: 'smtp.mailtrap.io' } },
    })

    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .withCoreProviders()
      .merge({
        config: { views: { cache: false }, mail: config },
        rcFileContents: {
          providers: [
            '../../providers/mail_provider.js',
            '@adonisjs/view/providers/views_provider',
          ],
        },
      })
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const manager = await app.container.make('mail')
    const mailer = await app.container.make(Mailer)

    assert.instanceOf(mailer, Mailer)
    assert.strictEqual(mailer, manager.use())
  }).skip()

  test('should extends the drivers list with builtin drivers', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .withCoreConfig()
      .withCoreProviders()
      .merge({
        config: { views: { cache: false } },
        rcFileContents: {
          providers: [
            '../../providers/mail_provider.js',
            '@adonisjs/view/providers/views_provider',
          ],
        },
      })
      .create(BASE_URL, { importer: (filePath) => import(filePath) })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    assert.instanceOf(driversList.create('smtp', {} as any), SmtpDriver)
    assert.instanceOf(driversList.create('mailgun', {} as any), MailgunDriver)
    assert.instanceOf(driversList.create('ses', {} as any), SesDriver)
    assert.instanceOf(driversList.create('sparkpost', {} as any), SparkPostDriver)
  })
})
