/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import { Edge } from 'edge.js'
import { Ioc } from '@adonisjs/fold'
import { Mailer } from '../src/Mail/Mailer'
import { SmtpDriver } from '../src/Drivers/Smtp'
import { MailManager } from '../src/Mail/MailManager'

import { DriverContract, MessageNode } from '@ioc:Adonis/Addons/Mail'

test.group('Mail Manager', () => {
  test('return driver for a given mapping', (assert) => {
    const ioc = new Ioc()
    const view = new Edge()
    const config = {
      mailer: 'marketing',
      mailers: {
        marketing: {
          driver: 'smtp',
        },
      },
    }

    const manager = new MailManager(ioc, config as any, view)
    assert.equal(manager['getMappingDriver']('marketing'), 'smtp')
  })

  test('return default mapping name', (assert) => {
    const ioc = new Ioc()
    const view = new Edge()
    const config = {
      mailer: 'marketing',
      mailers: {
        marketing: {
          driver: 'smtp',
        },
      },
    }

    const manager = new MailManager(ioc, config as any, view)
    assert.equal(manager['getDefaultMappingName'](), 'marketing')
  })

  test('return config for a mapping name', (assert) => {
    const ioc = new Ioc()
    const view = new Edge()
    const config = {
      mailer: 'marketing',
      mailers: {
        marketing: {
          driver: 'smtp',
        },
      },
    }

    const manager = new MailManager(ioc, config as any, view)
    assert.deepEqual(manager['getMappingConfig']('marketing'), { driver: 'smtp' })
  })

  test('get mailer instance for smtp driver', (assert) => {
    const ioc = new Ioc()
    const view = new Edge()
    const config = {
      mailer: 'marketing',
      mailers: {
        marketing: {
          driver: 'smtp',
        },
      },
    }

    const manager = new MailManager(ioc, config as any, view)
    const mailer = manager.use()

    assert.instanceOf(mailer, Mailer)
    assert.instanceOf(mailer['_driver'], SmtpDriver)
  })

  test('cache mailer instances for smtp driver', (assert) => {
    const ioc = new Ioc()
    const view = new Edge()
    const config = {
      mailer: 'marketing',
      mailers: {
        marketing: {
          driver: 'smtp',
        },
      },
    }

    const manager = new MailManager(ioc, config as any, view)
    const mailer = manager.use()
    const mailer1 = manager.use()

    assert.deepEqual(mailer, mailer1)
  })

  test('close driver and release it from cache', async (assert) => {
    const ioc = new Ioc()
    const view = new Edge()
    const config = {
      mailer: 'marketing',
      mailers: {
        marketing: {
          driver: 'fake',
        },
      },
    }

    class FakeDriver implements DriverContract {
      public message: MessageNode
      public closed: boolean

      public async send (message) {
        this.message = message
      }

      public async close () {
        this.closed = true
      }
    }

    const fakeDriver = new FakeDriver()
    const manager = new MailManager(ioc, config as any, view)

    manager.extend('fake', () => {
      return fakeDriver
    })

    const mailer = manager.use()
    assert.instanceOf(manager['mappingsCache'].get('marketing')!, Mailer)
    assert.instanceOf(manager['mappingsCache'].get('marketing')!['_driver'], FakeDriver)

    await mailer.close()
    assert.equal(manager['mappingsCache'].size, 0)
    assert.isTrue(fakeDriver.closed)
  })

  test('close driver by invoke close on manager instance', async (assert) => {
    const ioc = new Ioc()
    const view = new Edge()
    const config = {
      mailer: 'marketing',
      mailers: {
        marketing: {
          driver: 'fake',
        },
      },
    }

    class FakeDriver implements DriverContract {
      public message: MessageNode
      public closed: boolean

      public async send (message) {
        this.message = message
      }

      public async close () {
        this.closed = true
      }
    }

    const fakeDriver = new FakeDriver()
    const manager = new MailManager(ioc, config as any, view)

    manager.extend('fake', () => {
      return fakeDriver
    })

    manager.use()
    assert.instanceOf(manager['mappingsCache'].get('marketing')!, Mailer)
    assert.instanceOf(manager['mappingsCache'].get('marketing')!['_driver'], FakeDriver)

    await manager.close('marketing')
    assert.equal(manager['mappingsCache'].size, 0)
    assert.isTrue(fakeDriver.closed)
  })

  test('close all mappings and clear cache', async (assert) => {
    const ioc = new Ioc()
    const view = new Edge()
    const config = {
      mailer: 'marketing',
      mailers: {
        marketing: {
          driver: 'fake',
        },
      },
    }

    class FakeDriver implements DriverContract {
      public message: MessageNode
      public closed: boolean

      public async send (message) {
        this.message = message
      }

      public async close () {
        this.closed = true
      }
    }

    const fakeDriver = new FakeDriver()
    const manager = new MailManager(ioc, config as any, view)

    manager.extend('fake', () => {
      return fakeDriver
    })

    manager.use()
    assert.instanceOf(manager['mappingsCache'].get('marketing')!, Mailer)
    assert.instanceOf(manager['mappingsCache'].get('marketing')!['_driver'], FakeDriver)

    await manager.closeAll()
    assert.equal(manager['mappingsCache'].size, 0)
    assert.isTrue(fakeDriver.closed)
  })
})
