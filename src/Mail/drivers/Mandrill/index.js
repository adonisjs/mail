'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/
class Mandrill {

  constructor (Config) {
    const nodemailer = require('nodemailer')
    const Transport = require('./transport')
    const options = Config.get('mail.mandrill')
    this.transport = nodemailer.createTransport(new Transport(options))
  }

  /**
   * uses transport instance to send the message
   *
   * @method send
   *
   * @param  {Object} message
   * @return {Promise}
   *
   * @public
   */
  send (message) {
    return this.transport.sendMail(message)
  }

}

module.exports = Mandrill
