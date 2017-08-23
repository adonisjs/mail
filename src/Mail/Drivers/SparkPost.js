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
const getStream = require('get-stream')
const Request = require('../../Request')

class SparkPostTransporter {
  constructor (config) {
    this.config = config
  }

  /**
   * The api endpoint for sparkpost
   *
   * @attribute endpoint
   *
   * @return {String}
   */
  get endpoint () {
    return `${(this.config.endpoint || 'https://api.sparkpost.com/api/v1')}/transmissions`
  }

  /**
   * Transport name
   *
   * @attribute name
   *
   * @return {String}
   */
  get name () {
    return 'sparkpost'
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
   * Validations to make sure to config is complete
   *
   * @method _runValidations
   *
   * @return {String}
   *
   * @private
   */
  _runValidations () {
    if (!this.config.apiKey) {
      throw new Error('Please define the sparkpost API key to send emails')
    }
  }

  /**
   * Returns the name and email formatted as spark
   * recipient
   *
   * @method _getReceipent
   *
   * @param  {String|Object}      item
   *
   * @return {Object}
   *
   * @private
   */
  _getRecipient (item) {
    return typeof (item) === 'string' ? { email: item } : { email: item.address, name: item.name }
  }

  /**
   * Returns an array of recipients formatted
   * as per spark post standard.
   *
   * @method _getRecipients
   *
   * @param  {Object}       mail
   *
   * @return {Array}
   *
   * @private
   */
  _getRecipients (mail) {
    let recipients = []

    /**
     * To addresses
     */
    recipients = recipients.concat(mail.data.to.map((address) => {
      return { address: this._getRecipient(address) }
    }))

    /**
     * Cc addresses
     */
    recipients = recipients.concat((mail.data.cc || []).map((address) => {
      return { address: this._getRecipient(address) }
    }))

    /**
     * Bcc addresses
     */
    recipients = recipients.concat((mail.data.bcc || []).map((address) => {
      return { address: this._getRecipient(address) }
    }))

    return recipients
  }

  /**
   * Format success message
   *
   * @method _formatSuccess
   *
   * @param  {Object}       response
   *
   * @return {String}
   *
   * @private
   */
  _formatSuccess (response) {
    if (!response.results) {
      return response
    }

    return {
      messageId: response.results.id,
      acceptedCount: response.results.total_accepted_recipients,
      rejectedCount: response.results.total_rejected_recipients
    }
  }

  /**
   * Sending email from transport
   *
   * @method send
   *
   * @param  {Object}   mail
   * @param  {Function} callback
   *
   * @return {void}
   */
  send (mail, callback) {
    this._runValidations()
    const recipients = this._getRecipients(mail)

    getStream(mail.message.createReadStream())
    .then((content) => {
      return new Request()
        .auth(this.config.apiKey)
        .acceptJson()
        .post(this.endpoint, {
          recipients,
          content: { email_rfc822: content },
          options: this.config.options || {}
        })
    })
    .then((response) => {
      callback(null, this._formatSuccess(response))
    })
    .catch(callback)
  }
}

/**
 * Spark post driver for adonis mail
 *
 * @class SparkPost
 * @constructor
 */
class SparkPost {
  constructor (config) {
    this.transporter = nodemailer.createTransport(new SparkPostTransporter(config))
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

module.exports = SparkPost
module.exports.Transport = SparkPostTransporter
