/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import got from 'got'
import { join } from 'path'
import dotenv from 'dotenv'
import { Edge } from 'edge.js'
import { Message } from '../src/Message'
import { MailgunDriver } from '../src/Drivers/Mailgun'

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time))

test.group('Mailgun Driver', (group) => {
	group.before(() => {
		dotenv.config({ path: join(__dirname, '..', '.env') })
	})

	test('send email using mailgun driver', async (assert) => {
		const mailgun = new MailgunDriver({
			driver: 'mailgun',
			key: process.env.MAILGUN_ACCESS_KEY!,
			baseUrl: 'https://api.mailgun.net/v3',
			domain: 'adonisjs.com',
		})

		const message = new Message(new Edge())
		message.from(process.env.FROM_EMAIL!)
		message.to('virk@adonisjs.com')
		message.cc('info@adonisjs.com')
		message.subject('Adonisv5')
		message.html('<p> Hello Adonis </p>')

		const response = await mailgun.send(message.toJSON())
		assert.exists(response.messageId)
		assert.equal(response.envelope!.from, process.env.FROM_EMAIL)
		assert.deepEqual(response.envelope!.to, ['virk@adonisjs.com', 'info@adonisjs.com'])
	}).timeout(1000 * 10)

	test('enable tracking', async (assert) => {
		const mailgun = new MailgunDriver({
			driver: 'mailgun',
			key: process.env.MAILGUN_ACCESS_KEY!,
			baseUrl: process.env.MAILGUN_BASE_URL!,
			domain: 'adonisjs.com',
			oTracking: true,
		})

		const message = new Message(new Edge())
		message.from(process.env.FROM_EMAIL!)
		message.to('virk@adonisjs.com')
		message.cc('info@adonisjs.com')
		message.subject('Adonisv5')
		message.html('<p> Hello Adonis </p>')

		const response = await mailgun.send(message.toJSON())
		assert.exists(response.messageId)
		assert.equal(response.envelope!.from, process.env.FROM_EMAIL)
		assert.deepEqual(response.envelope!.to, ['virk@adonisjs.com', 'info@adonisjs.com'])
	}).timeout(1000 * 10)

	test('attach tags', async (assert) => {
		const mailgun = new MailgunDriver({
			driver: 'mailgun',
			key: process.env.MAILGUN_ACCESS_KEY!,
			baseUrl: 'https://api.mailgun.net/v3',
			domain: 'adonisjs.com',
			oTags: ['newsletter', 'test'],
		})

		const message = new Message(new Edge())
		message.from(process.env.FROM_EMAIL!)
		message.to('virk@adonisjs.com')
		message.cc('info@adonisjs.com')
		message.subject('Adonisv5')
		message.html('<p> Hello Adonis </p>')

		const response = await mailgun.send(message.toJSON())
		assert.exists(response.messageId)
		assert.equal(response.envelope!.from, process.env.FROM_EMAIL)
		assert.deepEqual(response.envelope!.to, ['virk@adonisjs.com', 'info@adonisjs.com'])

		await sleep(2000)

		const { body } = await got.get<{ items: any }>(
			`${process.env.MAILGUN_BASE_URL}/adonisjs.com/events?message-id=${response.messageId.replace(/<|>/g, '')}`,
			{
				responseType: 'json',
				username: 'api',
				password: process.env.MAILGUN_ACCESS_KEY,
			}
		)

		assert.deepEqual(body.items[0].tags, ['test', 'newsletter'])
	}).timeout(1000 * 10)
})
