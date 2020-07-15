/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import dotenv from 'dotenv'
import { join } from 'path'
import { Logger } from '@adonisjs/logger/build/standalone'

import { Message } from '../src/Message'
import { SparkPostDriver } from '../src/Drivers/SparkPost'

const logger = new Logger({ enabled: true, name: 'adonis', level: 'info' })

test.group('SparkPost Driver', (group) => {
	group.before(() => {
		dotenv.config({ path: join(__dirname, '..', '.env') })
	})

	test('send email using sparkpost driver', async (assert) => {
		const sparkpost = new SparkPostDriver(
			{
				driver: 'sparkpost',
				key: process.env.SPARKPOST_API_KEY!,
				baseUrl: 'https://api.sparkpost.com/api/v1',
			},
			logger
		)

		const message = new Message()
		message.from(process.env.FROM_EMAIL!)
		message.to('virk@adonisjs.com')
		message.cc('info@adonisjs.com')
		message.subject('Adonisv5')
		message.html('<p> Hello Adonis </p>')

		const response = await sparkpost.send(message.toJSON().message)
		assert.exists(response.messageId)
		assert.equal(response.envelope!.from, process.env.FROM_EMAIL)
		assert.deepEqual(response.envelope!.to, ['virk@adonisjs.com', 'info@adonisjs.com'])
	}).timeout(1000 * 10)
})
