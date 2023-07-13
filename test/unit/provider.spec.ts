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

import driversList from '../../src/drivers_list.js'
import { SmtpDriver } from '../../src/drivers/smtp/driver.js'
import { MailgunDriver } from '../../src/drivers/mailgun/driver.js'
import { SesDriver } from '../../src/drivers/ses/driver.js'
import { SparkPostDriver } from '../../src/drivers/sparkpost/driver.js'
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

  test('register repl binding', async ({ assert }) => {
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

    const app = ignitor.createApp('repl')
    await app.init()
    await app.boot()

    const repl = await app.container.make('repl')
    const replMethods = repl.getMethods()

    assert.property(replMethods, 'loadMail')
    assert.property(replMethods, 'loadMailers')

    assert.isFunction(replMethods.loadMail.handler)
    assert.isFunction(replMethods.loadMailers.handler)
  })

  test('do not register repl binding when not in repl environment', async ({ assert }) => {
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

    const repl = await app.container.make('repl')
    const replMethods = repl.getMethods()

    assert.notProperty(replMethods, 'loadMail')
    assert.notProperty(replMethods, 'loadMailers')
  })
})
