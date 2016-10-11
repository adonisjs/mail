'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/*
|--------------------------------------------------------------------------
|                           I AM SINGLETON
|--------------------------------------------------------------------------
*/
const Drivers = require('./MailDrivers')
const Ioc = require('adonis-fold').Ioc
const CE = require('../Exceptions')
const Mail = require('./Mail')

const extendedDrivers = {}

/**
 * @note make sure it is singleton
 * inside Ioc container
 * @class
 */
class MailManager {

  /**
   * requried by ioc container to let outside
   * world extend the mail provider.
   *
   * @method extend
   *
   * @param  {String} key
   * @param  {Mixed} value
   *
   * @public
   */
  static extend (key, value) {
    extendedDrivers[key] = value
  }

  /**
   * creates a new driver instance, by finding in shipped
   * drivers or looking inside extended drivers.
   *
   * @method _makeDriverInstance
   *
   * @param  {String}            driver
   * @return {Object}
   *
   * @private
   */
  _makeDriverInstance (driver) {
    driver = driver === 'default' ? this.config.get('mail.driver') : driver
    const driverInstance = Drivers[driver] ? Ioc.make(Drivers[driver]) : extendedDrivers[driver]
    if (!driverInstance) {
      throw CE.RuntimeException.invalidMailDriver(driver)
    }
    return driverInstance
  }

  /**
   * returns a new connection for a given driver, if connection
   * was created earlier, it will be returned instead of a
   * new connection.
   *
   * @param  {String} driver
   * @return {Object}
   *
   * @example
   * Mail.driver('mandrill')
   * Mail.driver('smtp')
   *
   * @public
   */
  driver (driver) {
    if (!this.driversPool[driver]) {
      const driverInstance = this._makeDriverInstance(driver)
      this.driversPool[driver] = driverInstance
    }
    return new Mail(this.view, this.driversPool[driver])
  }

  /**
   * class constructor
   */
  constructor (View, Config) {
    this.config = Config
    this.view = View
    this.driversPool = {}

    /**
     * here we spoof methods on the mail class, which means if
     * any of these methods are called, we will initiate the
     * mail class and will execute method on the created
     * instance instead of this class.
     */
    const methodsToSpoof = ['send', 'raw', 'getTransport']
    methodsToSpoof.forEach((method) => {
      this[method] = function () {
        const instance = this.driver('default')
        return instance[method].apply(instance, arguments)
      }.bind(this)
    })
  }
}

module.exports = MailManager
