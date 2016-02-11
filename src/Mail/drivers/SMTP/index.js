'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class SMTP {

  constructor (Config) {
    const nodemailer = require('nodemailer')
    /**
     * options required by node mailer
     * transport
     * @type {Object}
     */
    const options = Config.get('mail.smtp')
    this.transporter = nodemailer.createTransport(options)
  }

  /**
   * this method is called by mail Manager
   * and it has the final message object to be used
   * for sending email
   *
   * @param  {Object} message
   * @return {void}
   *
   * @public
   */
  send (message) {
    return this.transporter.sendMail(message)
  }

}

module.exports = SMTP
