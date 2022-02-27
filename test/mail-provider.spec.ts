/*
 * @adonisjs/events
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { MailManager } from '../src/Mail/MailManager'
import { fs, setup } from '../test-helpers'

test.group('Mail Provider', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('register mail provider', async ({ assert }) => {
    const app = await setup('web', {
      mailer: 'smtp',
      mailers: {
        smtp: {},
      },
    })
    assert.instanceOf(app.container.resolveBinding('Adonis/Addons/Mail'), MailManager)
    assert.deepEqual(app.container.resolveBinding('Adonis/Addons/Mail')['app'], app)
    assert.deepEqual(
      app.container.resolveBinding('Adonis/Addons/Mail'),
      app.container.resolveBinding('Adonis/Addons/Mail')
    )
  })

  test('register repl binding', async ({ assert }) => {
    const app = await setup('repl', {
      mailer: 'smtp',
      mailers: {
        smtp: {},
      },
    })

    assert.property(app.container.resolveBinding('Adonis/Addons/Repl')['customMethods'], 'loadMail')
    assert.isFunction(
      app.container.resolveBinding('Adonis/Addons/Repl')['customMethods']['loadMail']['handler']
    )
  })
})
