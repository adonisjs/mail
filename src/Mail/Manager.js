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
  /**
   * Returns an instance of sender with the defined
   * driver.
   *
   * @method driver
   *
   * @param  {String} name
   * @param  {Object} config
   *
   * @return {MailSender}
   */
  driver (name, config) {
    if (!name) {
      throw GE.InvalidArgumentException.invalidParameter('Cannot get driver instance without a name')
    }

    const Driver = Drivers[name.toLowerCase()]

    if (!Driver) {
      throw GE.InvalidArgumentException.invalidParameter(`${name} is not a valid mail driver`)
    }

    return new MailSender(new Driver(config))
  }
}

module.exports = new MailManager()
