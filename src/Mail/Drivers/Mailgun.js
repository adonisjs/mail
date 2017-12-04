'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const nodemailer = require('nodemailer')
const FormData = require('form-data')
const Request = require('../../Request')

class MailGunTransporter {
  constructor (config) {
    this.config = config
    this._acceptanceMessages = ['Queued', 'Success', 'Done', 'Sent']
  }

  /**
   * Transport name
   *
   * @attribute name
   *
   * @return {String}
   */
  get name () {
    return 'mailgun'
  }

  /**
   * Transport version
   *
   * @attribute version
   *
   * @return {String}
   */
  get version () {
    return '1.0.0'
  }

  /**
   * The mailgun endpoint
   *
   * @attribute endpoint
   *
   * @return {String}
   */
  get endpoint () {
    return `https://api.mailgun.net/v3/${this.config.domain}/messages.mime`
  }

  /**
   * The auth header value to be sent along
   * as header
   *
   * @attribute authHeader
   *
   * @return {String}
   */
  get authHeader () {
    return `api:${this.config.apiKey}`
  }

  /**
   * Formats a single recipient details into mailgun formatted
   * string
   *
   * @method _getRecipient
   *
   * @param  {Object|String}      recipient
   *
   * @return {String}
   *
   * @private
   */
  _getRecipient (recipient) {
    const { address, name } = typeof (recipient) === 'string' ? { address: recipient } : recipient
    return name ? `${name} <${address}>` : address
  }

  /**
   * Returns list of comma seperated receipents
   *
   * @method _getRecipients
   *
   * @param  {Object}       mail
   *
   * @return {String}
   *
   * @private
   */
  _getRecipients (mail) {
    let recipients = []
    recipients = recipients.concat(mail.data.to.map(this._getRecipient.bind(this)))
    recipients = recipients.concat((mail.data.cc || []).map(this._getRecipient.bind(this)))
    recipients = recipients.concat((mail.data.bcc || []).map(this._getRecipient.bind(this)))
    return recipients.join(',')
  }

  /**
   * Returns extras object by merging runtime config
   * with static config
   *
   * @method _getExtras
   *
   * @param  {Object|Null}   extras
   *
   * @return {Object}
   *
   * @private
   */
  _getExtras (extras) {
    return Object.assign({}, this.config.extras, extras)
  }

  /**
   * Format the response message into standard output
   *
   * @method _formatSuccess
   *
   * @param  {Object}       response
   *
   * @return {Object}
   *
   * @private
   */
  _formatSuccess (response) {
    const isAccepted = this._acceptanceMessages.find((term) => response.message.indexOf(term) > -1)
    return {
      messageId: response.id,
      acceptedCount: isAccepted ? 1 : 0,
      rejectedCount: isAccepted ? 0 : 1
    }
  }

  /**
   * Send email from transport
   *
   * @method send
   *
   * @param  {Object}   mail
   * @param  {Function} callback
   *
   * @return {void}
   */
  send (mail, callback) {
    const form = new FormData()
    form.append('to', this._getRecipients(mail))
    form.append('message', mail.message.createReadStream(), { filename: 'message.txt' })

    const extras = this._getExtras(mail.data.extras)
    Object.keys(extras).forEach((key) => (form.append(key, extras[key])))

    new Request()
      .basicAuth(this.authHeader)
      .headers(form.getHeaders())
      .post(this.endpoint, form)
      .then((response) => JSON.parse(response))
      .then((response) => {
        callback(null, this._formatSuccess(response))
      })
      .catch(callback)
  }
}

class MailGun {
  /**
   * This method is called by mail manager automatically
   * and passes the config object
   *
   * @method setConfig
   *
   * @param  {Object}  config
   */
  setConfig (config) {
    this.transporter = nodemailer.createTransport(new MailGunTransporter(config))
  }

  /**
   * Send a message via message object
   *
   * @method send
   * @async
   *
   * @param  {Object} message
   *
   * @return {Object}
   *
   * @throws {Error} If promise rejects
   */
  send (message) {
    return new Promise((resolve, reject) => {
      this.transporter.sendMail(message, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }
}

module.exports = MailGun
module.exports.Transport = MailGunTransporter
