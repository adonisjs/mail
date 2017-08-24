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
const { ioc } = require('@adonisjs/fold')
const Drivers = require('./Drivers')
const MailSender = require('./Sender')

/**
 * Mail manager manages the drivers and also
 * exposes the api to add new drivers.
 *
 * @class MailManager
 * @constructor
 */
class MailManager {
  constructor () {
    this._drivers = {}
  }

  /**
   * Exposing api to be extend, IoC container will
   * use this method when someone tries to
   * extend mail provider
   *
   * @method extend
   *
   * @param  {String} name
   * @param  {Object} implementation
   *
   * @return {void}
   */
  extend (name, implementation) {
    this._drivers[name] = implementation
  }

  /**
   * Returns an instance of sender with the defined
   * driver.
   *
   * @method driver
   *
   * @param  {String} name
   * @param  {Object} config
   * @param  {Object} viewInstance
   *
   * @return {MailSender}
   */
  driver (name, config, viewInstance) {
    if (!name) {
      throw GE.InvalidArgumentException.invalidParameter('Cannot get driver instance without a name')
    }

    name = name.toLowerCase()
    const Driver = Drivers[name] || this._drivers[name]

    if (!Driver) {
      throw GE.InvalidArgumentException.invalidParameter(`${name} is not a valid mail driver`)
    }

    const driverInstance = ioc.make(Driver)
    driverInstance.setConfig(config)
    return new MailSender(driverInstance, viewInstance)
  }
}

module.exports = new MailManager()
