'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { registrar, ioc } = require('@adonisjs/fold')
const test = require('japa')
const path = require('path')
const fs = require('fs')
const MailManager = require('../../src/Mail/MailManager')

test.group('Providers', (group) => {
  group.before(() => {
    const providersDir = path.join(__dirname, '../../providers')
    const providers = fs.readdirSync(providersDir).map((file) => path.join(providersDir, file))
    ioc.bind('Adonis/Src/View', () => {})
    ioc.bind('Adonis/Src/Config', () => {})
    registrar.providers(providers)
    registrar.register()
  })

  test('should return mail provider', (assert) => {
    const mailManager = ioc.use('Adonis/Addons/Mail')
    assert.instanceOf(mailManager, MailManager)
  })

  test('mail provider should return mail instance on calling methods', (assert) => {
    const mailManager = ioc.use('Adonis/Addons/Mail')
    assert.isFunction(mailManager.send)
    assert.isFunction(mailManager.raw)
    assert.isFunction(mailManager.getTransport)
  })
})
