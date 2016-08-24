'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const CE = require('../Exceptions')

class Message {

  constructor () {
    this.data = {}
    this.allowed_levels = ['high', 'normal', 'low']
  }

  /**
   * formats email via field based upon
   * name and email
   *
   * @param {String} viaEmail
   * @param {String} viaName
   * @return {String}
   *
   * @private
   */
  _formatField (viaEmail, viaName) {
    return typeof (viaName) !== 'undefined' ? `${viaName} <${viaEmail}>` : viaEmail
  }

  /**
   * set from field on outgoing message
   *
   * @param  {String} fromEmail
   * @param  {String} [fromName]
   * @return {Object}
   *
   * @example
   * message.from('email@example.com')
   * message.from('email@example.com', 'John Doe')
   *
   * @public
   */
  from (fromEmail, fromName) {
    this.data.from = this._formatField(fromEmail, fromName)
    return this
  }

  /**
   * sets sender field on email
   *
   * @param  {String} fromEmail
   * @param  {String} [fromName]
   * @return {String}
   *
   * @example
   * message.sender('email@example.com')
   * message.sender('email@example.com', 'John Doe')
   *
   * @public
   */
  sender (fromEmail, fromName) {
    this.data.sender = this._formatField(fromEmail, fromName)
    return this
  }

  /**
   * sets reply to field on email
   *
   * @param  {String} fromEmail
   * @param  {String} [fromName]
   * @return {String}
   *
   * @example
   * message.replyTo('email@example.com')
   * message.replyTo('email@example.com', 'John Doe')
   *
   * @public
   */
  replyTo (fromEmail, fromName) {
    this.data.replyTo = this._formatField(fromEmail, fromName)
    return this
  }

  /**
   * set to field on outgoing message
   *
   * @param  {String} toEmail
   * @param  {String} [toName]
   * @return {Object}
   *
   * @example
   * message.to('email@example.com')
   * message.to('email@example.com', 'John Doe')
   *
   * @public
   */
  to (toEmail, toName) {
    this.data.to = this.data.to || []
    const toField = this._formatField(toEmail, toName)
    this.data.to.push(toField)
    return this
  }

  /**
   * set cc field on outgoing message
   *
   * @param  {String} ccEmail
   * @param  {String} ccName
   * @return {Object}
   *
   * @example
   * message.cc('email@example.com')
   * message.cc('email@example.com', 'John Doe')
   *
   * @public
   */
  cc (ccEmail, ccName) {
    this.data.cc = this.data.cc || []
    const ccField = this._formatField(ccEmail, ccName)
    this.data.cc.push(ccField)
    return this
  }

  /**
   * set bcc field on outgoing message
   *
   * @param  {String} bccEmail
   * @param  {String} bccName
   * @return {Object}
   *
   * @example
   * message.bcc('email@example.com')
   * message.bcc('email@example.com', 'John Doe')
   *
   * @public
   */
  bcc (bccEmail, bccName) {
    this.data.bcc = this.data.bcc || []
    const bccField = this._formatField(bccEmail, bccName)
    this.data.bcc.push(bccField)
    return this
  }

  /**
   * sets subject for outgoing email
   *
   * @param  {String} message
   * @return {Object}
   *
   * @example
   * message.subject('Welcome to Adonis')
   *
   * @public
   */
  subject (message) {
    this.data.subject = message
    return this
  }

  /**
   * sets priority level for outgoing
   * email
   *
   * @param  {String} level
   * @return {Object}
   *
   * @example
   * message.priority('high')
   * message.priority('normal')
   * message.priority('low')
   *
   * @public
   */
  priority (level) {
    if (this.allowed_levels.indexOf(level) <= -1) {
      throw CE.InvalidArgumentException.invalidParameter('Email priority must be high, low or normal')
    }
    this.data.priority = level
    return this
  }

  /**
   * set header key/value pair for outgoing
   * email
   *
   * @param  {String} key
   * @param  {Mixed} value
   * @return {Object}
   *
   * @example
   * message.header('x-id', 1)
   *
   * @public
   */
  header (key, value) {
    this.data.headers = this.data.headers || []
    this.data.headers.push({key, value})
    return this
  }

  /**
   * sets an array of headers on outgoing
   * email
   *
   * @param  {Array} arrayOfHeaders
   * @return {Object}
   *
   * @example
   * message.headers([{key: 'x-id', value: 1}])
   *
   * @public
   */
  headers (arrayOfHeaders) {
    this.data.headers = arrayOfHeaders
    return this
  }

  /**
   * attaches a file to outgoing email
   *
   * @param  {String} filePath
   * @param  {Object} [options={}]
   * @return {Object}
   *
   * @example
   * message.attach(__dirname, './assets/image.png')
   * message.attach(__dirname, './assets/image.png', {filename: 'Logo'})
   * message.attach(__dirname, './assets/image.png', {filename: 'Logo', contentType: 'image/png'})
   *
   * @public
   */
  attach (filePath, options) {
    this.data.attachments = this.data.attachments || []
    options = options || {}
    options.path = filePath
    delete options.content
    this.data.attachments.push(options)
    return this
  }

  /**
   * attach data as an attachment to
   * outgoing email
   *
   * @param  {Mixed}   data
   * @param  {String}   filename
   * @param  {Object}   [options={}]
   * @return {Object}
   *
   * @example
   * message.attachData('Hello world', 'hello.txt', {contentType: 'text/plain'})
   *
   * @public
   */
  attachData (data, filename, options) {
    this.data.attachments = this.data.attachments || []
    options = options || {}
    options.content = data
    options.filename = filename
    delete options.path
    this.data.attachments.push(options)
    return this
  }

  /**
   * attaches file with cid to be used
   * inside html
   *
   * @param  {String} filePath
   * @param  {String} cid
   * @param  {Object} options
   * @return {Object}
   *
   * @example
   * message.embed(__dirname, './assets/logo.png', 'unique@kreata.ee')
   * <img src="cid:unique@kreata.ee" />
   *
   * @public
   */
  embed (filePath, cid, options) {
    this.data.attachments = this.data.attachments || []
    options = options || {}
    options.path = filePath
    options.cid = cid
    delete options.content
    this.data.attachments.push(options)
    return this
  }

  /**
   * sets email html
   *
   * @param  {String} body
   * @return {Object}
   *
   * @public
   */
  html (body) {
    this.data.html = body
    return this
  }

  /**
   * sets email plain text
   *
   * @param  {String} body
   * @return {Object}
   *
   * @public
   */
  text (body) {
    this.data.text = body
    return this
  }

  /**
   * sets watch html for the email
   *
   * @param  {String}  body
   * @return {Object}
   *
   * @public
   */
  watchHtml (body) {
    this.data.watchHtml = body
    return this
  }

}

module.exports = Message
