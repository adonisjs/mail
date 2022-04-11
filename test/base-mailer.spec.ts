/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { MessageContract, BaseMailer as BaseMailerContract } from '@ioc:Adonis/Addons/Mail'

import { Message } from '../src/Message'
import { MailManager } from '../src/Mail/MailManager'
import { fs, setup } from '../test-helpers'
import { BaseMailer as BaseMailerClass } from '../src/BaseMailer'

const BaseMailer = BaseMailerClass as unknown as typeof BaseMailerContract

test.group('BaseMailer', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('send email using the mailer class', async ({ assert }) => {
    assert.plan(1)

    const config = {
      mailer: 'marketing',
      mailers: {
        marketing: {
          driver: 'smtp',
        },
      },
    }

    const app = await setup()
    const manager = new MailManager(app, config as any)
    BaseMailer.mail = manager

    class MyMailer extends BaseMailer {
      public prepare(message: MessageContract) {
        message.subject('Welcome').to('virk@adonisjs.com').from('virk@adonisjs.com')
      }
    }

    const fakeMailer = manager.fake()

    const mailer = new MyMailer()
    await mailer.send()

    assert.deepEqual(fakeMailer.find({ subject: 'Welcome' }), {
      subject: 'Welcome',
      from: { address: 'virk@adonisjs.com' },
      to: [{ address: 'virk@adonisjs.com' }],
    })
  })

  test('use a custom mailer', async ({ assert }) => {
    assert.plan(1)

    const config = {
      mailer: 'marketing',
      mailers: {
        marketing: {
          driver: 'smtp',
        },
        transactional: {
          driver: 'ses',
        },
      },
    }

    const app = await setup()
    const manager = new MailManager(app, config as any)
    BaseMailer.mail = manager

    class MyMailer extends BaseMailer<'transactional'> {
      public mailer = this.mail.use('transactional').options({
        FromArn: 'foo',
      })

      public prepare(message: MessageContract) {
        message.subject('Welcome').to('virk@adonisjs.com').from('virk@adonisjs.com')
      }
    }

    const mailer = new MyMailer()
    mailer.mailer.send = async function send(callback): Promise<any> {
      const message = new Message(false)
      await callback(message)

      assert.deepEqual(message.toJSON().message, {
        subject: 'Welcome',
        from: { address: 'virk@adonisjs.com' },
        to: [{ address: 'virk@adonisjs.com' }],
      })
    }

    await mailer.send()
  })
})
