/*
 * @adonisjs/events
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { join } from 'path'
import { Registrar, Ioc } from '@adonisjs/fold'
import { Application } from '@adonisjs/application/build/standalone'

import { MailManager } from '../src/Mail/MailManager'

test.group('Mail Provider', () => {
	test('register mail provider', async (assert) => {
		const ioc = new Ioc()

		ioc.bind('Adonis/Core/Application', () => {
			return new Application(join(__dirname, 'fixtures'), ioc, {}, {})
		})

		const registrar = new Registrar(ioc, join(__dirname, '..'))
		await registrar
			.useProviders(['@adonisjs/view', '@adonisjs/core', './providers/MailProvider'])
			.registerAndBoot()

		assert.instanceOf(ioc.use('Adonis/Addons/Mail'), MailManager)
		assert.deepEqual(ioc.use('Adonis/Addons/Mail'), ioc.use('Adonis/Addons/Mail'))
	})
})
