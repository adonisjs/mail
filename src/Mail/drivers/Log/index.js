'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class Log {

  constructor (Helpers) {
    const nodemailer = require('nodemailer')
    const Transport = require('./transport')
    const emailsLogPath = Helpers.storagePath('logs/mail.log')
    this.transport = nodemailer.createTransport(new Transport(emailsLogPath))
  }

  send (message) {
    return this.transport.sendMail(message)
  }

}

module.exports = Log
