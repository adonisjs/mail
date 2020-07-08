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
import { Logger } from '@adonisjs/logger/build/standalone'
import { Emitter } from '@adonisjs/events/build/standalone'
import { Profiler } from '@adonisjs/profiler/build/standalone'
import { MailDriverContract, MailerContract, MessageNode, MailersList } from '@ioc:Adonis/Addons/Mail'

import { Mailer } from '../src/Mail/Mailer'
import { SesDriver } from '../src/Drivers/Ses'
import { SmtpDriver } from '../src/Drivers/Smtp'
import { MailManager } from '../src/Mail/MailManager'

const ioc = new Ioc()
const logger = new Logger({ enabled: true, name: 'adonis', level: 'info' })
ioc.singleton('Adonis/Core/View', () => new Edge())
ioc.singleton('Adonis/Core/Profiler', () => new Profiler(__dirname, logger, {}))
ioc.singleton('Adonis/Core/Event', () => new Emitter(ioc))

test.group('Mail Manager', () => {
	test('return driver for a given mapping', (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'smtp',
				},
			},
		}

		const manager = new MailManager(ioc, config as any)
		assert.equal(manager['getMappingDriver']('marketing'), 'smtp')
	})

	test('return default mapping name', (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'smtp',
				},
			},
		}

		const manager = new MailManager(ioc, config as any)
		assert.equal(manager['getDefaultMappingName'](), 'marketing')
	})

	test('return config for a mapping name', (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'smtp',
				},
			},
		}

		const manager = new MailManager(ioc, config as any)
		assert.deepEqual(manager['getMappingConfig']('marketing'), { driver: 'smtp' })
	})
})

test.group('Mail Manager | Cache', () => {
	test('close driver and release it from cache', async (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode
			public closed: boolean

			public async send(message) {
				this.message = message
			}

			public async close() {
				this.closed = true
			}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
		})

		const mailer = manager.use()
		assert.instanceOf(manager['mappingsCache'].get('marketing')!, Mailer)
		assert.instanceOf(manager['mappingsCache'].get('marketing')!.driver, CustomDriver)

		await mailer.close()
		assert.equal(manager['mappingsCache'].size, 0)
		assert.isTrue(customDriver.closed)
	})

	test('close driver by invoking close on manager instance', async (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode
			public closed: boolean

			public async send(message) {
				this.message = message
			}

			public async close() {
				this.closed = true
			}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
		})

		manager.use()
		assert.instanceOf(manager['mappingsCache'].get('marketing')!, Mailer)
		assert.instanceOf(manager['mappingsCache'].get('marketing')!.driver, CustomDriver)

		await manager.close('marketing' as any)
		assert.equal(manager['mappingsCache'].size, 0)
		assert.isTrue(customDriver.closed)
	})

	test('close all mappings and clear cache', async (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode
			public closed: boolean

			public async send(message) {
				this.message = message
			}

			public async close() {
				this.closed = true
			}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
		})

		manager.use()
		assert.equal(manager['mappingsCache'].size, 1)
		assert.instanceOf(manager['mappingsCache'].get('marketing')!, Mailer)
		assert.instanceOf(manager['mappingsCache'].get('marketing')!.driver, CustomDriver)

		await manager.closeAll()
		assert.equal(manager['mappingsCache'].size, 0)
		assert.isTrue(customDriver.closed)
	})
})

test.group('Mail Manager | SMTP', () => {
	test('get mailer instance for smtp driver', (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'smtp',
				},
			},
		}

		const manager = new MailManager(ioc, config as any)
		const mailer = manager.use() as MailerContract<keyof MailersList>

		assert.instanceOf(mailer, Mailer)
		assert.instanceOf(mailer.driver, SmtpDriver)
	})

	test('cache mailer instances for smtp', (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'smtp',
				},
			},
		}

		const manager = new MailManager(ioc, config as any)
		const mailer = manager.use()
		const mailer1 = manager.use()

		assert.deepEqual(mailer, mailer1)
	})
})

test.group('Mail Manager | SES', () => {
	test('get mailer instance for ses driver', (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'ses',
				},
			},
		}

		const manager = new MailManager(ioc, config as any)
		const mailer = manager.use()

		assert.instanceOf(mailer, Mailer)
		assert.instanceOf(mailer.driver, SesDriver)
	})

	test('cache mailer instances for ses driver', (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'ses',
				},
			},
		}

		const manager = new MailManager(ioc, config as any)
		const mailer = manager.use()
		const mailer1 = manager.use()

		assert.deepEqual(mailer, mailer1)
	})
})

test.group('Mail Manager | send', () => {
	test('invoke send method on the driver instance', async (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode
			public options: any

			public async send(message, options) {
				this.message = message
				this.options = options
			}

			public async close() {}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
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

	test('message should be able to make views', async (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode
			public options: any

			public async send(message, options) {
				this.message = message
				this.options = options
			}

			public async close() {}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)
		ioc.use('Adonis/Core/View').registerTemplate('welcome', { template: 'Hello world' })

		manager.extend('custom', () => {
			return customDriver
		})

		await manager.use().send((message) => {
			message.to('foo@bar.com')
			message.from('baz@bar.com')
			message.subject('Hello world')
			message.htmlView('welcome')
		})

		assert.deepEqual(customDriver.message, {
			to: [{ address: 'foo@bar.com' }],
			from: { address: 'baz@bar.com' },
			subject: 'Hello world',
			html: 'Hello world',
		})
	})

	test('pass meta options to the driver send method', async (assert) => {
		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode
			public options: any

			public async send(message, options) {
				this.message = message
				this.options = options
			}

			public async close() {}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
		})

		await (manager.use() as any).send(() => {}, { foo: 'bar' })
		assert.deepEqual(customDriver.options, { foo: 'bar' })
	})

	test('invoke before send hook', async (assert) => {
		assert.plan(2)

		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode

			public async send(message: MessageNode) {
				this.message = message
			}

			public async close() {}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
		})

		manager.before('send', (mailer, message) => {
			assert.equal(mailer.name, 'marketing')
			assert.deepEqual(message.toJSON(), {
				to: [{ address: 'foo@bar.com' }],
				from: { address: 'baz@bar.com' },
				subject: 'Hello world',
			})
		})

		await manager.use().send((message) => {
			message.to('foo@bar.com')
			message.from('baz@bar.com')
			message.subject('Hello world')
		})
	})

	test('invoke after send hook', async (assert) => {
		assert.plan(2)

		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode

			public async send(message: MessageNode) {
				this.message = message
				return { messageId: '1' }
			}

			public async close() {}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
		})

		manager.after('send', (mailer, response) => {
			assert.equal(mailer.name, 'marketing')
			assert.deepEqual(response as any, { messageId: '1' })
		})

		await manager.use().send((message) => {
			message.to('foo@bar.com')
			message.from('baz@bar.com')
			message.subject('Hello world')
		})
	})
})

test.group('Mail Manager | trap', () => {
	test('trap mail send call', async (assert) => {
		assert.plan(2)

		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode
			public options: any

			public async send(message, options) {
				this.message = message
				this.options = options
			}

			public async close() {}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
		})

		manager.trap((message) => {
			assert.deepEqual(message, {
				to: [{ address: 'foo@bar.com' }],
				from: { address: 'baz@bar.com' },
				subject: 'Hello world',
			})
		})

		await manager.use().send((message) => {
			message.to('foo@bar.com')
			message.from('baz@bar.com')
			message.subject('Hello world')
		})

		assert.isUndefined(customDriver.message)
	})

	test('remove trap after restore', async (assert) => {
		assert.plan(2)

		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode
			public options: any

			public async send(message, options) {
				this.message = message
				this.options = options
			}

			public async close() {}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
		})

		manager.trap((message) => {
			assert.deepEqual(message, {
				to: [{ address: 'foo@bar.com' }],
				from: { address: 'baz@bar.com' },
				subject: 'Hello world',
			})
		})

		await manager.use().send((message) => {
			message.to('foo@bar.com')
			message.from('baz@bar.com')
			message.subject('Hello world')
		})

		manager.restore()

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

	test('trap multiple mail send calls', async (assert) => {
		assert.plan(3)

		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode
			public options: any

			public async send(message, options) {
				this.message = message
				this.options = options
			}

			public async close() {}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
		})

		let i = 0

		manager.trap((message) => {
			i++
			if (i === 1) {
				assert.deepEqual(message, {
					to: [{ address: 'foo@bar.com' }],
					from: { address: 'baz@bar.com' },
					subject: 'Hello world',
				})
			}

			if (i === 2) {
				assert.deepEqual(message, {
					to: [{ address: 'foo@bar.com' }],
					from: { address: 'baz@bar.com' },
					subject: 'Hi world',
				})
			}
		})

		await manager.use().send((message) => {
			message.to('foo@bar.com')
			message.from('baz@bar.com')
			message.subject('Hello world')
		})

		await manager.use().send((message) => {
			message.to('foo@bar.com')
			message.from('baz@bar.com')
			message.subject('Hi world')
		})

		assert.isUndefined(customDriver.message)
	})

	test('trap should when calling send on mail manager', async (assert) => {
		assert.plan(2)

		const config = {
			mailer: 'marketing',
			mailers: {
				marketing: {
					driver: 'custom',
				},
			},
		}

		class CustomDriver implements MailDriverContract {
			public message: MessageNode
			public options: any

			public async send(message, options) {
				this.message = message
				this.options = options
			}

			public async close() {}
		}

		const customDriver = new CustomDriver()
		const manager = new MailManager(ioc, config as any)

		manager.extend('custom', () => {
			return customDriver
		})

		manager.trap((message) => {
			assert.deepEqual(message, {
				to: [{ address: 'foo@bar.com' }],
				from: { address: 'baz@bar.com' },
				subject: 'Hello world',
			})
		})

		await manager.send((message) => {
			message.to('foo@bar.com')
			message.from('baz@bar.com')
			message.subject('Hello world')
		})

		assert.isUndefined(customDriver.message)
	})
})
