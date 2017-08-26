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

/**
 * The message builder is used to construct a message
 * by chaining different methods.
 *
 * The instance of this class is passed to `Mail.send`
 * callback function.
 *
 * @class Message
 * @constructor
 */
class Message {
  constructor () {
    this.mailerMessage = {}
  }

  /**
   * Parse and set address object/array on
   * the address key
   *
   * @method _setAddress
   *
   * @param  {String}    key
   * @param  {String|Array}    address
   * @param  {String}    [name]
   *
   * @private
   */
  _setAddress (key, address, name) {
    this.mailerMessage[key] = this.mailerMessage[key] || []

    /**
     * If address is an array of address object, then concat
     * it directly
     */
    if (address instanceof Array === true) {
      this.mailerMessage[key] = this.mailerMessage[key].concat(address)
      return
    }

    const addressObj = name ? { name, address } : address
    this.mailerMessage[key].push(addressObj)
  }

  /**
   * Set `from` on the email.
   *
   * @method from
   *
   * @param  {String|Array} address
   * @param  {String} [name]
   *
   * @chainable
   *
   * @example
   * ```
   *  // just email
   * message.from('foo@bar.com')
   *
   *  // name + email
   * message.from('foo@bar.com', 'Foo')
   *
   * // Address object
   * message.from([{ address: 'foo@bar.com', name: 'Foo' }])
   * ```
   */
  from (address, name) {
    this._setAddress('from', address, name)
    return this
  }

  /**
   * Set `to` on the email.
   *
   * @method to
   *
   * @param  {String|Array} address
   * @param  {String} [name]
   *
   * @chainable
   *
   * @example
   * ```
   *  // just email
   * message.to('foo@bar.com')
   *
   *  // name + email
   * message.to('foo@bar.com', 'Foo')
   *
   * // Address object
   * message.to([{ address: 'foo@bar.com', name: 'Foo' }])
   * ```
   */
  to (address, name) {
    this._setAddress('to', address, name)
    return this
  }

  /**
   * Set `cc` on the email.
   *
   * @method cc
   *
   * @param  {String|Array} address
   * @param  {String} [name]
   *
   * @chainable
   *
   * @example
   * ```
   *  // just email
   * message.cc('foo@bar.com')
   *
   *  // name + email
   * message.cc('foo@bar.com', 'Foo')
   *
   * // Address object
   * message.cc([{ address: 'foo@bar.com', name: 'Foo' }])
   * ```
   */
  cc (address, name) {
    this._setAddress('cc', address, name)
    return this
  }

  /**
   * Set `bcc` on the email.
   *
   * @method bcc
   *
   * @param  {String|Array} address
   * @param  {String} [name]
   *
   * @chainable
   *
   * @example
   * ```
   *  // just email
   * message.bcc('foo@bar.com')
   *
   *  // name + email
   * message.bcc('foo@bar.com', 'Foo')
   *
   * // Address object
   * message.bcc([{ address: 'foo@bar.com', name: 'Foo' }])
   * ```
   */
  bcc (address, name) {
    this._setAddress('bcc', address, name)
    return this
  }

  /**
   * Set `sender` on the email.
   *
   * @method sender
   *
   * @param  {String|Array} address
   * @param  {String} [name]
   *
   * @chainable
   *
   * @example
   * ```
   *  // just email
   * message.sender('foo@bar.com')
   *
   *  // name + email
   * message.sender('foo@bar.com', 'Foo')
   *
   * // Address object
   * message.sender([{ address: 'foo@bar.com', name: 'Foo' }])
   * ```
   */
  sender (address, name) {
    this._setAddress('sender', address, name)
    return this
  }

  /**
   * Set `replyTo` on the email.
   *
   * @method replyTo
   *
   * @param  {String|Array} address
   * @param  {String} [name]
   *
   * @chainable
   *
   * @example
   * ```
   *  // just email
   * message.replyTo('foo@bar.com')
   *
   *  // name + email
   * message.replyTo('foo@bar.com', 'Foo')
   *
   * // Address object
   * message.replyTo([{ address: 'foo@bar.com', name: 'Foo' }])
   * ```
   */
  replyTo (address, name) {
    this._setAddress('replyTo', address, name)
    return this
  }

  /**
   * Set in reply to message id
   *
   * @method inReplyTo
   *
   * @param  {String}  messageId
   *
   * @chainable
   *
   * ```js
   * message.inReplyTo('101002001')
   * ```
   */
  inReplyTo (messageId) {
    this.mailerMessage.inReplyTo = messageId
    return this
  }

  /**
   * Set subject for the emaul
   *
   * @method subject
   *
   * @param  {String} subject
   *
   * @chainable
   */
  subject (subject) {
    this.mailerMessage.subject = subject
    return this
  }

  /**
   * Set email text body
   *
   * @method text
   *
   * @param  {String} text
   *
   * @chainable
   */
  text (text) {
    this.mailerMessage.text = text
    return this
  }

  /**
   * Set email html body
   *
   * @method html
   *
   * @param  {String} html
   *
   * @chainable
   */
  html (html) {
    this.mailerMessage.html = html
    return this
  }

  /**
   * Set html for apple watch
   *
   * @method watchHtml
   *
   * @param  {String}  html
   *
   * @chainable
   */
  watchHtml (html) {
    this.mailerMessage.watchHtml = html
    return this
  }

  /**
   * Add a new attachment to the mail
   *
   * @method attach
   *
   * @param  {String} content
   * @param  {Object} [options]
   *
   * @chainable
   *
   * @example
   * ```js
   * message.attach('absolute/path/to/file')
   * message.attach('absolute/path/to/file', { contentTpe: 'plain/text' })
   * ```
   */
  attach (filePath, options) {
    this.mailerMessage.attachments = this.mailerMessage.attachments || []
    const attachment = Object.assign({ path: filePath }, options || {})
    this.mailerMessage.attachments.push(attachment)
    return this
  }

  /**
   * Attach raw data as attachment with a custom file name
   *
   * @method attachData
   *
   * @param  {String|Buffer|Stream}   content
   * @param  {String}                 filename
   * @param  {Object}                 [options]
   *
   * @chainable
   *
   * @example
   * ```js
   * message.attachData('hello', 'hello.txt')
   * message.attachData(new Buffer('hello'), 'hello.txt')
   * message.attachData(fs.createReadStream('hello.txt'), 'hello.txt')
   * ```
   */
  attachData (content, filename, options) {
    if (!filename) {
      throw GE
        .InvalidArgumentException
        .invalidParameter('Define filename as 2nd argument when calling message.attachData')
    }

    this.mailerMessage.attachments = this.mailerMessage.attachments || []

    const attachment = Object.assign({ content, filename }, options || {})
    this.mailerMessage.attachments.push(attachment)

    return this
  }

  /**
   * Set alternative content for the email.
   *
   * @method alternative
   *
   * @param  {String} content
   * @param  {Object} [options]
   *
   * @chainable
   *
   * @example
   * ```js
   * message.alternative('**Hello**', { contentType: 'text/x-web-markdown' })
   * ```
   */
  alternative (content, options) {
    this.mailerMessage.alternatives = this.mailerMessage.alternatives || []
    const alternative = Object.assign({ content }, options)
    this.mailerMessage.alternatives.push(alternative)
    return this
  }

  /**
   * Embed image to the content. This is done
   * via cid.
   *
   * @method embed
   *
   * @param  {String} filePath
   * @param  {String} cid   - Must be unique to single email
   * @param  {Object} [options]
   *
   * @chainable
   *
   * @example
   * ```
   * message.embed('logo.png', 'logo')
   * // inside html
   * <img src="cid:logo" />
   * ```
   */
  embed (filePath, cid, options) {
    return this.attach(filePath, Object.assign({ cid }, options))
  }

  /**
   * Set extras to be sent to the current driver in
   * use. It is the responsibility of the driver
   * to parse and use the extras
   *
   * @method driverExtras
   *
   * @param  {Object}     extras
   *
   * @chainable
   */
  driverExtras (extras) {
    this.mailerMessage.extras = extras
    return this
  }

  /**
   * Returns nodemailer compatable message
   * object
   *
   * @method toJSON
   *
   * @return {Object}
   */
  toJSON () {
    return this.mailerMessage
  }
}

module.exports = Message
