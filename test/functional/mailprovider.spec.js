'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const chai = require('chai')
const expect = chai.expect
const fold = require('adonis-fold')
const Ioc = fold.Ioc
const Registrar = fold.Registrar
const path = require('path')
const fs = require('fs')
// const sinon = require('sinon')
const MailManager = require('../../src/Mail/MailManager')
require('co-mocha')

describe('Providers', function () {
  before(function * () {
    const providersDir = path.join(__dirname, '../../providers')
    const providers = fs.readdirSync(providersDir).map((file) => path.join(providersDir, file))
    Ioc.bind('Adonis/Src/View', function () {})
    Ioc.bind('Adonis/Src/Config', function () {})
    yield Registrar.register(providers)
  })

  it('should return mail provider', function () {
    const mailManager = Ioc.use('Adonis/Addons/Mail')
    expect(mailManager).to.be.an.instanceof(MailManager)
  })

  it('mail provider should return mail instance on calling methods', function () {
    const mailManager = Ioc.use('Adonis/Addons/Mail')
    expect(mailManager.send).to.be.a('function')
    expect(mailManager.raw).to.be.a('function')
    expect(mailManager.getTransport).to.be.a('function')
  })
})
