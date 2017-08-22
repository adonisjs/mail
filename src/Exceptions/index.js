'use strict'

/*
 * adonis-validator
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const GE = require('@adonisjs/generic-exceptions')

/**
 * @class RuntimeException
 */
class RuntimeException extends GE.RuntimeException {
  /**
   * this exception is raised when an uknown
   * mail driver is used
   *
   * @param  {String} driver
   *
   * @return {Object}
   */
  static invalidMailDriver (driver) {
    return new this(`Unable to locate ${driver} mail driver`, 500, 'E_INVALID_MAIL_DRIVER')
  }
}

/**
 * @class InvalidArgumentException
 */
class InvalidArgumentException extends GE.InvalidArgumentException {
  /**
   * This exception is raised when user does not specify
   * a valid email view or defined views are in not
   * the right format
   *
   * @return {Object}
   */
  static invalidMailView () {
    return new this('Make sure to specify a view for your email', 500, 'E_INVALID_MAIL_VIEW')
  }
}

module.exports = { RuntimeException, InvalidArgumentException }
