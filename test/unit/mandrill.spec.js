// 'use strict'
//
// /**
//  * adonis-framework
//  *
//  * (c) Harminder Virk <virk@adonisjs.com>
//  *
//  * For the full copyright and license information, please view the LICENSE
//  * file that was distributed with this source code.
// */
//
// /* global it, describe */
// const chai = require('chai')
// const expect = chai.expect
// const path = require('path')
// const Mandrill = require('../../src/Mail/Drivers/Mandrill')
// const Messages = require('../../src/Mail/Message')
//
// const Config = {
//   get: function (key) {
//     if (key === 'mandrill.wrong') {
//       return {
//         apiKey: 'blah'
//       }
//     }
//     return {
//       apiKey: process.env.MANDRILL_APIKEY
//     }
//   }
// }
//
// require('co-mocha')
//
// describe('Mandrill driver', function () {
//   it('should be able to send messages using mandrill', function * () {
//     this.timeout(0)
//     const message = new Messages()
//     message.to('sent@test.mandrillapp.com')
//     message.from('virk@bar.com')
//     message.subject('mail with attachment')
//     message.html('Hello world')
//     const mandrill = new Mandrill(Config)
//     const r = yield mandrill.send(message.data)
//     expect(r.messageId).to.exist
//     expect(r.accepted).to.be.an('array')
//     expect(['sent', 'queued', 'scheduled'].indexOf(r.accepted[0].status)).to.be.at.least(0)
//   })
//
//   it('should be able to send attachments using mandrill', function * () {
//     this.timeout(0)
//     const message = new Messages()
//     message.to('sent@test.mandrillapp.com')
//     message.from('virk@bar.com')
//     message.subject('mail with attachment')
//     message.attach(path.join(__dirname, './assets/logo_white.svg'))
//     message.html('Hello world')
//     const mandrill = new Mandrill(Config)
//     const r = yield mandrill.send(message.data)
//     expect(r.messageId).to.exist
//     expect(r.accepted).to.be.an('array')
//     expect(['sent', 'queued', 'scheduled'].indexOf(r.accepted[0].status)).to.be.at.least(0)
//   })
//
//   it('should make use of new configuration when passing extra config key', function * () {
//     this.timeout(0)
//     const message = new Messages()
//     message.to('sent@test.mandrillapp.com')
//     message.from('virk@bar.com')
//     message.subject('mail with attachment')
//     message.attach(path.join(__dirname, './assets/logo_white.svg'))
//     message.html('Hello world')
//     const mandrill = new Mandrill(Config)
//     try {
//       yield mandrill.send(message.data, 'mandrill.wrong')
//       expect(true).to.equal(false)
//     } catch (e) {
//       expect(e.message).to.equal('Invalid API key')
//     }
//   })
//
//   it('should not affect the actual instance transporter when sending different config option with send method', function * () {
//     this.timeout(0)
//     const message = new Messages()
//     message.to('sent@test.mandrillapp.com')
//     message.from('virk@bar.com')
//     message.subject('mail with attachment')
//     message.attach(path.join(__dirname, './assets/logo_white.svg'))
//     message.html('Hello world')
//     const mandrill = new Mandrill(Config)
//     try {
//       yield mandrill.send(message.data, 'mandrill.wrong')
//       expect(true).to.equal(false)
//     } catch (e) {
//       expect(e.message).to.equal('Invalid API key')
//       const r = yield mandrill.send(message.data)
//       expect(r.messageId).to.exist
//       expect(r.accepted).to.be.an('array')
//     }
//   })
// })
