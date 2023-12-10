/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import edge from 'edge.js'
import { test } from '@japa/runner'
import { IgnitorFactory } from '@adonisjs/core/factories'
import { MailManager, Mailer, Message, defineConfig, transports } from '../../index.js'

const BASE_URL = new URL('./tmp/', import.meta.url)
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, BASE_URL).href)
  }
  return import(filePath)
}

test.group('Mail Provider', () => {
  test('register mail provider', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/mail_provider.js')],
        },
      })
      .withCoreConfig()
      .withCoreProviders()
      .merge({
        config: {
          mail: defineConfig({
            default: 'mailgun',
            mailers: {
              mailgun: transports.mailgun({
                key: '',
                baseUrl: '',
                domain: '',
              }),
            },
          }),
        },
      })
      .create(BASE_URL, {
        importer: IMPORTER,
      })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    assert.instanceOf(await app.container.make('mail.manager'), MailManager)
    assert.instanceOf(await app.container.make(Mailer), Mailer)
  })

  test('throw error when config is invalid', async () => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [() => import('../../providers/mail_provider.js')],
        },
      })
      .withCoreConfig()
      .withCoreProviders()
      .merge({
        config: {
          mail: {},
        },
      })
      .create(BASE_URL, {
        importer: IMPORTER,
      })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    await app.container.make('mail.manager')
  }).throws('Invalid "config/mail.ts" file. Make sure you are using the "defineConfig" method')

  test('correctly share helpers and view data with edge', async ({ assert }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('@adonisjs/core/providers/edge_provider'),
            () => import('../../providers/mail_provider.js'),
          ],
        },
      })
      .withCoreConfig()
      .withCoreProviders()
      .merge({
        config: {
          mail: {},
        },
      })
      .create(BASE_URL, {
        importer: IMPORTER,
      })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    const message = new Message()
    edge.registerTemplate('foo/bar', {
      template: `Hello {{ username }} <img src="{{ embedImage('./foo.jpg') }}" />`,
    })

    message.htmlView('foo/bar', { username: 'jul' })
    await message.computeContents()

    assert.isDefined(message.nodeMailerMessage.attachments![0])
    assert.include(message.nodeMailerMessage.html, 'Hello jul')
  })
})
