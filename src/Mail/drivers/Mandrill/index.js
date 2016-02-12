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
    this.config = Config
    this.transport = this._createTransport('mail.mandrill')
  }

  /**
   * creates a new transport instance with given config
   * key. It uses config provider to fetch values for
   * config key.
   *
   * @method _createTransport
   *
   * @param  {String}         configKey [description]
   * @return {Object}                   [description]
   *
   * @example
   * Mandrill._createTranport('mail.mandrill')
   *
   * @private
   */
  _createTransport (configKey) {
    const nodemailer = require('nodemailer')
    const Transport = require('./transport')
    const options = this.config.get(configKey)
    return nodemailer.createTransport(new Transport(options))
  }

  /**
   * uses transport instance to send the message
   *
   * @method send
   *
   * @param  {Object} message
   * @param  {Object} configKey
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

module.exports = Mandrill
