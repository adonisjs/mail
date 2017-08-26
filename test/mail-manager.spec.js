'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const manager = require('../src/Mail/Manager')
const { smtp: SmtpDriver } = require('../src/Mail/Drivers')

test.group('Mail manager', () => {
  test('get instance of mail sender with driver', (assert) => {
    const sender = manager.driver('smtp', {})
    assert.instanceOf(sender._driverInstance, SmtpDriver)
  })

  test('throw exception when invalid driver name is passed', (assert) => {
    const sender = () => manager.driver('foo', {})
    assert.throw(sender, 'E_INVALID_PARAMETER: foo is not a valid mail driver')
  })

  test('throw exception when driver name is missing', (assert) => {
    const sender = () => manager.driver()
    assert.throw(sender, 'E_INVALID_PARAMETER: Cannot get driver instance without a name')
  })
})
