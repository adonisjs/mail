/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import { BaseMailer } from '../../src/base_mailer/index.js'
import { createMailManager } from '../../test_helpers/index.js'
import { SmtpDriver } from '../../src/drivers/smtp/driver.js'
import { Message } from '../../src/message/index.js'
import driversList from '../../src/drivers_list.js'
import { defineConfig } from '../../index.js'

test.group('BaseMailer', () => {
  test('send email using the mailer class', async ({ assert }) => {
    const { manager } = await createMailManager()
    const fakeMailer = manager.fake()

    class MyMailer extends BaseMailer {
      prepare(message: Message) {
        message.subject('Welcome').to('virk@adonisjs.com').from('virk@adonisjs.com')
      }
    }

    const mailer = new MyMailer()
    await mailer.send()

    assert.deepEqual(fakeMailer.find({ subject: 'Welcome' }), {
      subject: 'Welcome',
      from: { address: 'virk@adonisjs.com', name: '' },
      to: [{ address: 'virk@adonisjs.com', name: '' }],
    })
  })

  test('use a custom mailer', async ({ assert }) => {
    assert.plan(1)

    const config = defineConfig({
      default: 'marketing',
      list: {
        marketing: { driver: 'smtp', host: 'smtp.io' },
        transactional: { driver: 'smtp', host: 'smtp.io' },
      },
    })

    driversList.extend('smtp', (c) => new SmtpDriver(c))
    const { manager } = await createMailManager(config)
    manager.fake('transactional')

    class MyMailer extends BaseMailer {
      // @ts-ignore
      mailer = MyMailer.mail.use('transactional')

      prepare(message: Message) {
        message.subject('Welcome').to('virk@adonisjs.com').from('virk@adonisjs.com')
      }
    }

    const mailer = new MyMailer()
    // @ts-ignore
    mailer.mailer.send = async function send(callback: any, c: any) {
      const message = new Message(false)
      await callback(message)

      assert.deepEqual(message.toJSON().message, {
        subject: 'Welcome',
        from: { address: 'virk@adonisjs.com' },
        to: [{ address: 'virk@adonisjs.com' }],
      })
    }

    await mailer.send()
    driversList.list['smtp'] = undefined
  })
})
