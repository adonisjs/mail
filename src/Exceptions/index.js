'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const NE = require('node-exceptions')

class RuntimeException extends NE.RuntimeException {
  /**
   * default error code to be used for raising
   * exceptions
   *
   * @return {Number}
   */
  static get defaultErrorCode () {
    return 500
  }

  /**
   * this exception is raised when an uknown
   * mail driver is used
   *
   * @param  {String} driver
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidMailDriver (driver, code) {
    return new this(`Unable to locate ${driver} mail driver`, code || this.defaultErrorCode, 'E_INVALID_MAIL_DRIVER')
  }

}

class InvalidArgumentException extends NE.InvalidArgumentException {

  /**
   * default error code to be used for raising
   * exceptions
   *
   * @return {Number}
   */
  static get defaultErrorCode () {
    return 500
  }

  /**
   * This exception is raised when user does not specify
   * a valid email view or defined views are in not
   * the right format
   *
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidMailView (code) {
    return new this('Make sure to specify a view for your email', code || this.defaultErrorCode, 'E_INVALID_MAIL_VIEW')
  }

  /**
   * this exception is raised when a method parameter value
   * is invalid.
   *
   * @param  {String} message
   * @param  {Number} [code=500]
   *
   * @return {Object}
   */
  static invalidParameter (message, code) {
    return new this(message, code || this.defaultErrorCode, 'E_INVALID_PARAMETER')
  }
}

module.exports = {RuntimeException, InvalidArgumentException}
