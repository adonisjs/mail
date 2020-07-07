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
import { Message } from '../src/Message'

test.group('Message', () => {
	test('add from address', (assert) => {
		const message = new Message(new Edge())
		message.from('foo@bar.com')
		assert.deepEqual(message.toJSON(), { from: { address: 'foo@bar.com' } })
	})

	test('add from address with name', (assert) => {
		const message = new Message(new Edge())
		message.from('foo@bar.com', 'Foo')
		assert.deepEqual(message.toJSON(), { from: { address: 'foo@bar.com', name: 'Foo' } })
	})

	test('add to address', (assert) => {
		const message = new Message(new Edge())
		message.to('foo@bar.com')
		assert.deepEqual(message.toJSON(), { to: [{ address: 'foo@bar.com' }] })
	})

	test('add to address with name', (assert) => {
		const message = new Message(new Edge())
		message.to('foo@bar.com', 'Foo')
		assert.deepEqual(message.toJSON(), { to: [{ address: 'foo@bar.com', name: 'Foo' }] })
	})

	test('add cc address', (assert) => {
		const message = new Message(new Edge())
		message.cc('foo@bar.com')
		assert.deepEqual(message.toJSON(), { cc: [{ address: 'foo@bar.com' }] })
	})

	test('add cc address with name', (assert) => {
		const message = new Message(new Edge())
		message.cc('foo@bar.com', 'Foo')
		assert.deepEqual(message.toJSON(), { cc: [{ address: 'foo@bar.com', name: 'Foo' }] })
	})

	test('add bcc address', (assert) => {
		const message = new Message(new Edge())
		message.bcc('foo@bar.com')
		assert.deepEqual(message.toJSON(), { bcc: [{ address: 'foo@bar.com' }] })
	})

	test('add bcc address with name', (assert) => {
		const message = new Message(new Edge())
		message.bcc('foo@bar.com', 'Foo')
		assert.deepEqual(message.toJSON(), { bcc: [{ address: 'foo@bar.com', name: 'Foo' }] })
	})

	test('define messageId', (assert) => {
		const message = new Message(new Edge())
		message.messageId('1234')
		assert.deepEqual(message.toJSON(), { messageId: '1234' })
	})

	test('define subject', (assert) => {
		const message = new Message(new Edge())
		message.subject('Hello')
		assert.deepEqual(message.toJSON(), { subject: 'Hello' })
	})

	test('define replyTo', (assert) => {
		const message = new Message(new Edge())
		message.replyTo('foo@bar.com')
		assert.deepEqual(message.toJSON(), { replyTo: { address: 'foo@bar.com' } })
	})

	test('define replyTo with name', (assert) => {
		const message = new Message(new Edge())
		message.replyTo('foo@bar.com', 'Foo')
		assert.deepEqual(message.toJSON(), { replyTo: { address: 'foo@bar.com', name: 'Foo' } })
	})

	test('define in reply to messageId', (assert) => {
		const message = new Message(new Edge())
		message.inReplyTo('1234')
		assert.deepEqual(message.toJSON(), { inReplyTo: '1234' })
	})

	test('define references', (assert) => {
		const message = new Message(new Edge())
		message.references(['1234'])
		assert.deepEqual(message.toJSON(), { references: ['1234'] })
	})

	test('define envelope', (assert) => {
		const message = new Message(new Edge())
		message.envelope({ from: 'foo@bar.com' })
		assert.deepEqual(message.toJSON(), { envelope: { from: 'foo@bar.com' } })
	})

	test('define encoding', (assert) => {
		const message = new Message(new Edge())
		message.encoding('utf-8')
		assert.deepEqual(message.toJSON(), { encoding: 'utf-8' })
	})

	test('define priority', (assert) => {
		const message = new Message(new Edge())
		message.priority('low')
		assert.deepEqual(message.toJSON(), { priority: 'low' })
	})

	test('define htmlView', (assert) => {
		const edge = new Edge()
		edge.registerTemplate('welcome', { template: '<p> Hello {{ name }} </p>' })

		const message = new Message(edge)
		message.htmlView('welcome', { name: 'virk' })
		assert.deepEqual(message.toJSON(), { html: '<p> Hello virk </p>' })
	})

	test('define textView', (assert) => {
		const edge = new Edge()
		edge.registerTemplate('welcome', { template: 'Hello {{ name }}' })

		const message = new Message(edge)
		message.textView('welcome', { name: 'virk' })
		assert.deepEqual(message.toJSON(), { text: 'Hello virk' })
	})

	test('define watchView', (assert) => {
		const edge = new Edge()
		edge.registerTemplate('welcome', { template: 'Hello {{ name }}' })

		const message = new Message(edge)
		message.watchView('welcome', { name: 'virk' })
		assert.deepEqual(message.toJSON(), { watch: 'Hello virk' })
	})

	test('define html from raw content', (assert) => {
		const message = new Message(new Edge())
		message.html('<p> Hello world </p>')
		assert.deepEqual(message.toJSON(), { html: '<p> Hello world </p>' })
	})

	test('define text from raw content', (assert) => {
		const message = new Message(new Edge())
		message.text('Hello world')
		assert.deepEqual(message.toJSON(), { text: 'Hello world' })
	})

	test('define watch from raw content', (assert) => {
		const message = new Message(new Edge())
		message.watch('Hello world')
		assert.deepEqual(message.toJSON(), { watch: 'Hello world' })
	})

	test('define attachment', (assert) => {
		const message = new Message(new Edge())
		message.attach('foo.jpg')
		assert.deepEqual(message.toJSON(), { attachments: [{ path: 'foo.jpg' }] })
	})

	test('define attachment options', (assert) => {
		const message = new Message(new Edge())
		message.attach('foo.jpg', { filename: 'foo-file' })
		assert.deepEqual(message.toJSON(), { attachments: [{ path: 'foo.jpg', filename: 'foo-file' }] })
	})

	test('define attachment as buffer', (assert) => {
		const message = new Message(new Edge())
		message.attachData(Buffer.from('hello-world'), { filename: 'foo-file' })
		assert.deepEqual(message.toJSON(), {
			attachments: [{ content: Buffer.from('hello-world'), filename: 'foo-file' }],
		})
	})

	test('embed file with cid', (assert) => {
		const message = new Message(new Edge())
		message.embed('foo.jpg', 'logo')
		assert.deepEqual(message.toJSON(), {
			attachments: [{ path: 'foo.jpg', cid: 'logo' }],
		})
	})

	test('embed data with cid', (assert) => {
		const message = new Message(new Edge())
		message.embedData(Buffer.from('hello-world'), 'logo')
		assert.deepEqual(message.toJSON(), {
			attachments: [{ content: Buffer.from('hello-world'), cid: 'logo' }],
		})
	})

	test('defined custom header', (assert) => {
		const message = new Message(new Edge())
		message.header('x-my-key', '1234')
		assert.deepEqual(message.toJSON(), {
			headers: [{ 'x-my-key': '1234' }],
		})
	})

	test('defined custom header as array of values', (assert) => {
		const message = new Message(new Edge())
		message.header('x-my-key', ['1234', '5678'])
		assert.deepEqual(message.toJSON(), {
			headers: [{ 'x-my-key': ['1234', '5678'] }],
		})
	})

	test('defined custom prepared header', (assert) => {
		const message = new Message(new Edge())
		message.preparedHeader('x-my-key', '1234')
		assert.deepEqual(message.toJSON(), {
			headers: [{ 'x-my-key': { prepared: true, value: '1234' } }],
		})
	})

	test('defined custom prepared header as array of values', (assert) => {
		const message = new Message(new Edge())
		message.preparedHeader('x-my-key', ['1234', '5678'])
		assert.deepEqual(message.toJSON(), {
			headers: [{ 'x-my-key': { prepared: true, value: ['1234', '5678'] } }],
		})
	})
})
