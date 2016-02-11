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
    const mandrillTransport = require('nodemailer-mandrill-transport')

    /**
     * options required by node mailer
     * transport
     * @type {Object}
     */
    const options = {
      auth: {
        apiKey: Config.get('mail.mandrill.apiKey')
      }
    }
    this.transporter = nodemailer.createTransport(mandrillTransport(options))
  }

  /**
   * @description this method is called by mail Manager
   * and it has the final message object to be used
   * for sending email
   * @method send
   * @param  {Object} message
   * @return {void}
   * @public
   */
  send (message) {
    return this.transporter.sendMail(message)
  }
}

module.exports = Mandrill
