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
const { Config } = require('@adonisjs/sink')
const Mail = require('../src/Mail')
const { smtp: SmtpDriver } = require('../src/Mail/Drivers')

test.group('Mail', () => {
  test('throw exception when unable to find mail connection', (assert) => {
    const config = new Config()
    const mail = new Mail(config)
    const fn = () => mail.connection()
    assert.throw(fn, 'E_INVALID_PARAMETER: Make sure to define connection inside config/mail.js file')
  })

  test('throw exception connection config is missing', (assert) => {
    const config = new Config()
    config.set('mail.connection', 'smtp')
    const mail = new Mail(config)
    const fn = () => mail.connection()
    assert.throw(fn, 'E_MISSING_CONFIG: smtp is not defined inside config/mail.js file')
  })

  test('throw exception when driver is not defined on connection', (assert) => {
    const config = new Config()
    config.set('mail.connection', 'smtp')
    config.set('mail.smtp', {
      host: ''
    })
    const mail = new Mail(config)
    const fn = () => mail.connection()
    assert.throw(fn, 'E_MISSING_CONFIG: smtp.driver is not defined inside config/mail.js file')
  })

  test('get smtp driver instance', (assert) => {
    const config = new Config()
    config.set('mail.connection', 'smtp')
    config.set('mail.smtp', {
      driver: 'smtp'
    })
    const mail = new Mail(config)
    const smtp = mail.connection('smtp')
    assert.instanceOf(smtp._driverInstance, SmtpDriver)
  })

  test('return the cache instance if exists', (assert) => {
    const config = new Config()
    config.set('mail.connection', 'smtp')
    config.set('mail.smtp', {
      driver: 'smtp'
    })
    const mail = new Mail(config)
    const smtp = mail.connection('smtp')
    const smtp1 = mail.connection('smtp')
    assert.deepEqual(smtp, smtp1)
  })

  test('proxy sender methods', (assert) => {
    const config = new Config()
    config.set('mail.connection', 'smtp')
    config.set('mail.smtp', {
      driver: 'smtp'
    })
    const mail = new Mail(config)
    assert.isFunction(mail.send)
    assert.isFunction(mail.raw)
  })
})
