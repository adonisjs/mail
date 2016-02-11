'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class SES {

  constructor (Config) {
    const nodemailer = require('nodemailer')
    const sesTransport = require('nodemailer-ses-transport')

    /**
     * options required by node mailer
     * transport
     * @type {Object}
     */
    const options = Config.get('mail.ses')
    this.transporter = nodemailer.createTransport(sesTransport(options))
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

module.exports = SES
