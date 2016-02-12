'use strict'

/**
 * adonis-framework
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
const Drivers = require('./drivers')
const Ioc = require('adonis-fold').Ioc
const NE = require('node-exceptions')
const MailManager = require('./MailManager')

const extendedDrivers = {}

/**
 * @note make sure it is singleton
 * inside Ioc container
 * @class
 */
class Mail {

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
    if (driver === 'default') {
      driver = this.config.get('mail.driver')
    }
    if (Drivers[driver]) {
      return Ioc.make(Drivers[driver])
    } else if (extendedDrivers[driver]) {
      return extendedDrivers[driver]
    } else {
      throw new NE.DomainException(`Unable to locate ${driver} mail driver`)
    }
  }

  /**
   * returns a new connection for a given driver, if connection
   * was created earlier, it will be returned instead of a
   * new connection.
   * @method new
   *
   * @param  {String} driver
   * @return {Object}
   *
   * @example
   * Mail.new('mandrill')
   * Mail.new('smtp')
   *
   * @public
   */
  new (driver) {
    if (!this.driversPool[driver]) {
      let driverInstance = this._makeDriverInstance(driver)
      this.driversPool[driver] = driverInstance
    }
    return new MailManager(this.view, this.driversPool[driver])
  }

  /**
   * class constructor
   */
  constructor (View, Config) {
    this.config = Config
    this.view = View
    this.driversPool = {}

    /**
     * here we spoof methods on the mail manager, which means
     * if any of these methods are called, we will initiate
     * the mailManager and will execute method on the
     * created instance instead of this class.
     * @type {Array}
     */
    this.methodsToSpoof = ['send', 'raw']
    this.methodsToSpoof.forEach((method) => {
      const self = this
      this[method] = function () {
        const instance = self.new('default')
        return instance[method].apply(instance, arguments)
      }
    })
  }
}

module.exports = Mail
