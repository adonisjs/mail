'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

class BaseDriver {

  constructor (Config) {
    this.config = Config
  }

  /**
   * creates a new transport instance with given config
   * key. It uses config provider to fetch values for
   * config key.
   *
   * @method _createTransport
   *
   * @param  {String}         configKey
   * @return {Object}
   *
   * @example
   * Mandrill._createTranport('mail.mandrill')
   *
   * @private
   */
  _createTransport (configKey) {
    const nodemailer = require('nodemailer')
    const options = this.config.get(configKey)
    if (!this.TransportLibrary) {
      // make transport using the config. for example - SMTP transport
      // works without the transport library
      return nodemailer.createTransport(options)
    }
    return nodemailer.createTransport(new this.TransportLibrary(options))
  }

  /**
   * this method is called by mail Manager
   * and it has the final message object to be used
   * for sending email
   *
   * @param  {Object} message
   * @param  {String} configKey
   * @return {Promise}
   *
   * @public
   */
  send (message, configKey) {
    let transport = this.transport
    if (configKey) {
      transport = this._createTransport(configKey)
    }
    return transport.sendMail(message)
  }
}

module.exports = BaseDriver
