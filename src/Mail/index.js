'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const GE = require('@adonisjs/generic-exceptions')
const MailManager = require('./Manager')
const proxyMethods = ['send', 'raw']

const proxyHandler = {
  get (target, name) {
    /**
     * if node is inspecting then stick to target properties
     */
    if (typeof (name) === 'symbol' || name === 'inspect') {
      return target[name]
    }

    /**
     * If a faker object exists, give preference to it over
     * the actual methods
     */
    if (target._fake && target._fake[name] !== undefined) {
      return typeof (target._fake[name]) === 'function' ? target._fake[name].bind(target._fake) : target._fake[name]
    }

    return target[name]
  }
}

/**
 * The mail class is used to grab an instance of
 * sender for a given connection and driver.
 *
 * @namespace Adonis/Addons/Mail
 * @alias Mail
 *
 * @class Mail
 * @constructor
 */
class Mail {
  constructor (Config, View) {
    this.Config = Config
    this.View = View
    this._sendersPool = {}
    this._fake = null

    return new Proxy(this, proxyHandler)
  }

  /**
   * Returns an instance of a mail connection. Also this
   * method will cache the connection for re-usability.
   *
   * @method connection
   *
   * @param  {String}   name
   *
   * @return {Object}
   */
  connection (name) {
    name = name || this.Config.get('mail.connection')

    /**
     * Returns the cache connection if defined
     */
    if (this._sendersPool[name]) {
      return this._sendersPool[name]
    }

    /**
     * Cannot get default connection
     */
    if (!name) {
      throw GE.InvalidArgumentException.invalidParameter('Make sure to define connection inside config/mail.js file')
    }

    /**
     * Get connection config
     */
    const connectionConfig = this.Config.get(`mail.${name}`)

    /**
     * Cannot get config for the defined connection
     */
    if (!connectionConfig) {
      throw GE.RuntimeException.missingConfig(name, 'config/mail.js')
    }

    /**
     * Throw exception when config doesn't have driver property
     * on it
     */
    if (!connectionConfig.driver) {
      throw GE.RuntimeException.missingConfig(`${name}.driver`, 'config/mail.js')
    }

    this._sendersPool[name] = MailManager.driver(connectionConfig.driver, connectionConfig, this.View)
    return this._sendersPool[name]
  }

  /**
   * Setup a faker object, which will be used over
   * using the actual emailer methods
   *
   * @method fake
   *
   * @return {void}
   */
  fake () {
    this._fake = new (require('./Fake'))(this.Config, this.View)
  }

  /**
   * Restore faker object
   *
   * @method restore
   *
   * @return {void}
   */
  restore () {
    this._fake = null
  }
}

proxyMethods.forEach((method) => {
  Mail.prototype[method] = function (...params) {
    return this.connection()[method](...params)
  }
})

module.exports = Mail
