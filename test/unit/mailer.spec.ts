/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { AppFactory } from '@adonisjs/core/factories/app'
import { Mailer } from '../../src/mailer.js'
import { CustomDriver } from '../../test_helpers/index.js'
import { MailManagerFactory } from '../../factories/mail_manager.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Mailer', () => {
  test('send mail should emit mail:sent event', async () => {
    const application = new AppFactory().create(BASE_URL, () => {})
    const manager = new MailManagerFactory({
      default: 'test',
      list: { test: () => new CustomDriver() },
    }).create(application)

    const emitter = manager.emitter.fake()

    const mailer = new Mailer('test', manager, false, new CustomDriver())

    await mailer.send((message) => {
      message.subject('Welcome').text('Hello world').to('jul@adonisjs.com')
    })

    emitter.assertEmitted((event) => {
      const isMailSent = event.event === 'mail:sent'

      if (!isMailSent) return false
      const message = event.data.message

      return (
        message.subject === 'Welcome' &&
        message.to[0].address === 'jul@adonisjs.com' &&
        message.text === 'Hello world' &&
        event.data.mailer === 'test'
      )
    })
  })

  test('send mail should emit mail:sending event', async () => {
    const application = new AppFactory().create(BASE_URL, () => {})
    const manager = new MailManagerFactory({
      default: 'test',
      list: { test: () => new CustomDriver() },
    }).create(application)

    const emitter = manager.emitter.fake()

    const mailer = new Mailer('test', manager, false, new CustomDriver())

    await mailer.send((message) => {
      message.subject('Welcome').text('Hello world').to('jul@adonisjs.com')
    })

    emitter.assertEmitted((event) => {
      const isMailSending = event.event === 'mail:sending'

      if (!isMailSending) return false
      const message = event.data.message

      return (
        message.subject === 'Welcome' &&
        message.to[0].address === 'jul@adonisjs.com' &&
        message.text === 'Hello world' &&
        event.data.mailer === 'test'
      )
    })
  })
})
