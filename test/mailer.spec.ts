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
import { Mailer } from '../src/Mail/Mailer'
import { MailDriverContract, MessageNode } from '@ioc:Adonis/Addons/Mail'

test.group('Mailer', () => {
	test('invoke send on the driver instance', async (assert) => {
		const view = new Edge()

		class FakeDriver implements MailDriverContract {
			public message: MessageNode
			public async send(message) {
				this.message = message
			}
			public async close() {}
		}

		const fakeDriver = new FakeDriver()
		const mailer = new Mailer('fake' as any, view, fakeDriver, () => {})

		await mailer.send((message) => {
			message.to('foo@bar.com')
			message.from('baz@bar.com')
			message.subject('Hello world')
		})

		assert.deepEqual(fakeDriver.message, {
			to: [{ address: 'foo@bar.com' }],
			from: { address: 'baz@bar.com' },
			subject: 'Hello world',
		})
	})

	test('message instance must be able to make views', async (assert) => {
		const view = new Edge()

		class FakeDriver implements MailDriverContract {
			public message: MessageNode
			public async send(message) {
				this.message = message
			}
			public async close() {}
		}

		const fakeDriver = new FakeDriver()
		const mailer = new Mailer('fake' as any, view, fakeDriver, () => {})
		view.registerTemplate('welcome', { template: 'Hello world' })

		await mailer.send((message) => {
			message.to('foo@bar.com')
			message.from('baz@bar.com')
			message.subject('Hello world')
			message.htmlView('welcome')
		})

		assert.deepEqual(fakeDriver.message, {
			to: [{ address: 'foo@bar.com' }],
			from: { address: 'baz@bar.com' },
			subject: 'Hello world',
			html: 'Hello world',
		})
	})

	test('invoke close on the driver instance', async (assert) => {
		const view = new Edge()

		class FakeDriver implements MailDriverContract {
			public message: MessageNode
			public closed: boolean

			public async send(message) {
				this.message = message
			}

			public async close() {
				this.closed = true
			}
		}

		const fakeDriver = new FakeDriver()
		const mailer = new Mailer('fake' as any, view, fakeDriver, () => {})

		await mailer.close()
		assert.isTrue(fakeDriver.closed)
	})
})
