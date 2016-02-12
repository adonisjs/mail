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
   * sends email with given data
   *
   * @method send
   *
   * @param  {String}   view
   * @param  {Object}   data
   * @param  {Function} callback
   * @param  {String} [config]
   *
   * @return {Array}
   *
   * @example
   * mail.send('welcome', {}, function (message) {
   *
   * })
   * mail.send('welcome', {}, function (message) {
   *
   * }, 'alternate.config')
   *
   *
   * @public
   */
  * send (view, data, callback, config) {
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
    return yield this.driver.send(message.data, config)
  }

  /**
   * sends email using raw text instead of making
   * view from templates.
   *
   * @method raw
   *
   * @param  {String}   text
   * @param  {Function} callback
   * @param  {String}   config
   * @return {Array}
   *
   * @example
   * mail.raw('<h2> Hello </h2>', function (message) {
   *
   * })
   * mail.raw('<h2> Hello </h2>', function (message) {
   *
   * }, 'alternate.config')
   *
   * @public
   */
  raw (text, callback, config) {
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
    return yield this.driver.send(message.data, config)
  }

}

module.exports = MailManager
