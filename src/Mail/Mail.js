'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const Message = require('./Message')
const CE = require('../Exceptions')

class Mail {

  constructor (view, driver) {
    this.driver = driver
    this.view = view
  }

  /**
   * returns transport for the given instance. Here
   * drivers are responsible for having transport
   * object on this instance
   *
   * @return {Object}
   *
   * @public
   */
  getTransport () {
    return this.driver.transport
  }

  /**
   * returns viewsPath to be used for setting up different
   * contents for a given email
   *
   * @param  {Array|String}     view
   * @return {Object}
   *
   * @private
   * @throws {InvalidArgumentException} If view is not defined
   */
  _returnViews (view) {
    let viewsHash = {
      htmlView: null,
      textView: null,
      watchView: null
    }

    if (typeof (view) === 'string' && view.length > 0) {
      viewsHash.htmlView = view
    } else if (view instanceof Array && view.length > 0) {
      viewsHash.htmlView = view[0] || null
      viewsHash.textView = view[1] || null
      viewsHash.watchView = view[2] || null
    } else {
      throw CE.InvalidArgumentException.invalidMailView()
    }
    return viewsHash
  }

  /**
   * sends email with given data
   *
   * @method send
   *
   * @param  {String|Array}   view
   * @param  {Object}   data
   * @param  {Function} callback
   * @param  {String} [config]
   * @return {Array}
   *
   * @throws {InvalidArgumentException} If callback is not define or not a function
   *
   * @example
   * mail.send('welcome', {}, function (message) {
   *
   * })
   * mail.send('welcome', {}, function (message) {
   *
   * }, 'alternate.config')
   *
   * mail.send(['welcome', 'welcome.text', 'welcome.watch'], function (message) {
   *
   * })
   *
   *
   * @public
   */
  * send (view, data, callback, config) {
    if (typeof (callback) !== 'function') {
      throw CE.InvalidArgumentException.invalidParameter('Mail.send expects callback to be a function')
    }

    /**
     * compiling view using view provider
     * @type {String}
     */
    const views = this._returnViews(view)

    /**
     * creating a new message instance to be used for
     * building mail options
     * @type {Message}
     */
    const message = new Message()

    if (views.htmlView) {
      const htmlCompiledView = yield this.view.make(views.htmlView, data)
      message.html(htmlCompiledView)
    }
    if (views.textView) {
      const textCompiledView = yield this.view.make(views.textView, data)
      message.text(textCompiledView)
    }
    if (views.watchView) {
      const watchCompiledView = yield this.view.make(views.watchView, data)
      message.watchHtml(watchCompiledView)
    }

    callback(message)

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
   * @throws {InvalidArgumentException} If callback is not define or not a function
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
  * raw (text, callback, config) {
    if (typeof (callback) !== 'function') {
      throw CE.InvalidArgumentException.invalidParameter('Mail.raw expects callback to be a function')
    }

    /**
     * creating a new message instance to be used for
     * building mail options
     * @type {Message}
     */
    const message = new Message()
    message.text(text)
    callback(message)

    /**
     * finally calling send method on
     * driver to send email
     */
    return yield this.driver.send(message.data, config)
  }

}

module.exports = Mail
