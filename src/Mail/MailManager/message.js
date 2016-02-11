'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const NE = require('node-exceptions')

class Message {

  constructor () {
    this.data = {}
    this.allowed_levels = ['high', 'normal', 'low']
  }

  /**
   * @description formats email via field based upon
   * name and email
   * @method _formatField
   * @param {String} viaEmail
   * @param {String} viaName
   * @return {String}
   * @private
   */
  _formatField (viaEmail, viaName) {
    return typeof (viaName) !== 'undefined' ? `${viaName} <${viaEmail}>` : viaEmail
  }

  /**
   * @description set from field on outgoing message
   * @method from
   * @param  {String} fromEmail
   * @param  {String} fromName
   * @return {Object}
   * @public
   */
  from (fromEmail, fromName) {
    this.data.from = this._formatField(fromEmail, fromName)
    return this
  }

  /**
   * sets sender field on email
   *
   * @param  {String} fromEmail [description]
   * @param  {String} fromName  [description]
   * @return {String}           [description]
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
   * @param  {String} fromEmail [description]
   * @param  {String} fromName  [description]
   * @return {String}           [description]
   *
   * @public
   */
  replyTo (fromEmail, fromName) {
    this.data.replyTo = this._formatField(fromEmail, fromName)
    return this
  }

  /**
   * @description set to field on outgoing message
   * @method to
   * @param  {String} toEmail
   * @param  {String} toName
   * @return {Object}
   * @public
   */
  to (toEmail, toName) {
    this.data.to = this.data.to || []
    const toField = this._formatField(toEmail, toName)
    this.data.to.push(toField)
    return this
  }

  /**
   * @description set cc field on outgoing message
   * @method cc
   * @param  {String} ccEmail
   * @param  {String} ccName
   * @return {Object}
   * @public
   */
  cc (ccEmail, ccName) {
    this.data.cc = this.data.cc || []
    const ccField = this._formatField(ccEmail, ccName)
    this.data.cc.push(ccField)
    return this
  }

  /**
   * @description set bcc field on outgoing message
   * @method bcc
   * @param  {String} bccEmail
   * @param  {String} bccName
   * @return {Object}
   * @public
   */
  bcc (bccEmail, bccName) {
    this.data.bcc = this.data.bcc || []
    const bccField = this._formatField(bccEmail, bccName)
    this.data.bcc.push(bccField)
    return this
  }

  /**
   * @description sets subject for outgoing email
   * @method subject
   * @param  {String} message
   * @return {Object}
   * @public
   */
  subject (message) {
    this.data.subject = message
    return this
  }

  /**
   * @description sets priority level for outgoing
   * email
   * @method priority
   * @param  {String} level
   * @return {Object}
   * @public
   */
  priority (level) {
    if (this.allowed_levels.indexOf(level) <= -1) {
      throw new NE.InvalidArgumentException('Priority must be high, low or normal')
    }
    this.data.priority = level
    return this
  }

  /**
   * @description set header key/value pair for outgoing
   * email
   * @method header
   * @param  {String} key
   * @param  {Mixed} value
   * @return {Object}
   * @public
   */
  header (key, value) {
    this.data.headers = this.data.headers || []
    this.data.headers.push({key, value})
    return this
  }

  /**
   * @description sets an array of headers on outgoing
   * email
   * @method headers
   * @param  {Array} arrayOfHeaders
   * @return {Object}
   * @public
   */
  headers (arrayOfHeaders) {
    this.data.headers = arrayOfHeaders
    return this
  }

  /**
   * @descriptions attaches a file to outgoing email
   * @method attach
   * @param  {String} filePath
   * @param  {Object} options
   * @return {Object}
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
   * @description attach data as an attachment to
   * outgoing email
   * @method attachData
   * @param  {Mixed}   data
   * @param  {String}   filename
   * @param  {Object}   options
   * @return {Object}
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
   * @description attaches file with cid to be used
   * inside html
   * @method embed
   * @param  {String} filePath
   * @param  {String} cid
   * @param  {Object} options
   * @return {Object}
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
   * @description sets email html
   * @method html
   * @param  {String} body
   * @return {Object}
   * @public
   */
  html (body) {
    this.data.html = body
    return this
  }

  /**
   * @description sets email plain text
   * @method text
   * @param  {String} body
   * @return {Object}
   * @public
   */
  text (body) {
    this.data.text = body
    return this
  }

}

module.exports = Message
