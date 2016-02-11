'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Message = require('./message')

class MailManager {

  constructor (view, driver) {
    this.driver = driver
    this.view = view
  }

  /**
   * @description sends email with given data
   * @method send
   * @param  {String}   view
   * @param  {Object}   data
   * @param  {Function} callback
   * @return {void}
   * @public
   */
  * send (view, data, callback) {
    /**
     * compiling view using view provider
     * @type {String}
     */
    const compiledView = yield this.view.render(view, data)

    /**
     * creating a new message instance to be used for
     * building mail options
     * @type {Message}
     */
    const message = new Message()
    callback(message)
    message.html(compiledView)

    /**
     * finally calling send method on
     * driver to send email
     */
    return yield this.driver.send(message.data)
  }

  * raw (text, callback) {
    /**
     * creating a new message instance to be used for
     * building mail options
     * @type {Message}
     */
    const message = new Message()
    callback(message)
    message.text(text)

    /**
     * finally calling send method on
     * driver to send email
     */
    return yield this.driver.send(message.data)
  }

}

module.exports = MailManager
