/*
 * @adonisjs/events
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { MailManager } from '../src/Mail/MailManager'
import { fs, setup } from '../test-helpers'

test.group('Mail Provider', (group) => {
	group.afterEach(async () => {
		await fs.cleanup()
	})

	test('register mail provider', async (assert) => {
		const app = await setup({
			mailer: 'smtp',
			mailers: {
				smtp: {},
			},
		})
		assert.instanceOf(app.container.use('Adonis/Addons/Mail'), MailManager)
		assert.deepEqual(
			app.container.use('Adonis/Addons/Mail'),
			app.container.use('Adonis/Addons/Mail')
		)
	})
})
