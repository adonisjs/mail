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

/**
 * This class sends the email using the defined driverInstance.
 * You can make use of the @ref('Message') class to build
 * the message via message builder.
 *
 * @class MailSender
 * @constructor
 */
class MailSender {
  constructor (driverInstance, viewInstance) {
    this._driverInstance = driverInstance
    this._viewInstance = viewInstance
  }

  /**
   * Parse the `views` array of string passed to
   * the `send` method and returns an object
   * of views for html, text and watch
   *
   * @method _parseViews
   *
   * @param  {String|Array}    views
   *
   * @return {Object}
   *
   * @private
   */
  _parseViews (views) {
    if (views instanceof Array === true) {
      const returnHash = {}

      /**
       * Loop over views to find the best match
       */
      const viewsCopy = views.slice().filter((view) => {
        if (view.endsWith('.text') || view.endsWith('-text')) {
          returnHash['text'] = view
          return false
        }

        if (view.endsWith('.watch') || view.endsWith('-watch')) {
          returnHash['watch'] = view
          return false
        }

        return true
      })

      /**
       * If any views are left in the array, use
       * the first one for the html
       */
      if (viewsCopy.length) {
        returnHash['html'] = viewsCopy[0]
      }

      return returnHash
    }
    return { html: views }
  }

  /**
   * Send the message using the defined driver. The
   * callback will receive the message builder
   * instance
   *
   * @method send
   * @async
   *
   * @param  {String|Array}  views
   * @param  {Object}        [data]
   * @param  {Function}      callback
   *
   * @return {Object}
   *
   * @example
   * ```js
   * await sender.send('welcome', {}, (message) => {
   *   message.from('foo@bar.com')
   * })
   *
   * await sender.send(['welcome', 'welcome.text', 'welcome.watch'], {}, (message) => {
   *   message.from('foo@bar.com')
   * })
   * ```
   *
   * @throws {Error} If promise fails
   */
  send (views, data, callback) {
    const message = new Message()

    const viewsMap = this._parseViews(views)

    /**
     * Set html text by rendering the view
     */
    if (viewsMap.html) {
      message.html(this._viewInstance.render(viewsMap.html, data))
    }

    /**
     * Set plain text by rendering the view
     */
    if (viewsMap.text) {
      message.text(this._viewInstance.render(viewsMap.text, data))
    }

    /**
     * Set watch text by rendering the view
     */
    if (viewsMap.watch) {
      message.watchHtml(this._viewInstance.render(viewsMap.watch, data))
    }

    callback(message)
    return this._driverInstance.send(message.toJSON())
  }

  /**
   * Send email via raw text
   *
   * @method raw
   * @async
   *
   * @param  {String}   body
   * @param  {Function} callback
   *
   * @return {Object}
   *
   * @example
   * ```js
   * await sender.raw('Your security code is 301030', (message) => {
   *   message.from('foo@bar.com')
   * })
   * ```
   */
  raw (body, callback) {
    const message = new Message()

    if (/^\s*</.test(body)) {
      message.html(body)
    } else {
      message.text(body)
    }

    callback(message)
    return this._driverInstance.send(message.toJSON())
  }
}

module.exports = MailSender
