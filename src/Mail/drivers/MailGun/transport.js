'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const got = require('got')
const FormData = require('form-data')

class MailGunTransport {

  constructor (options) {
    this.options = options
    this.name = 'mailgun'
    this.acceptanceMessages = ['Queued', 'Success', 'Done', 'Sent']
    this.rejectionMessages = ['Failed']
    this.version = '1.0.0'
  }

  /**
   * parses mailgun response and convert it into
   * nodemailer standard response.
   *
   * @param  {Array}       messages
   * @return {Object}
   *
   * @private
   */
  _parseMessage (message) {
    const accepted = []
    const rejected = []
    this.acceptanceMessages.forEach((term) => {
      if (message.message.indexOf(term) > -1) {
        accepted.push(message)
      }
    })
    this.rejectionMessages.forEach((term) => {
      if (message.message.indexOf(term) > -1) {
        rejected.push(message)
      }
    })
    const messageId = message.id
    return { messageId, accepted, rejected }
  }

  /**
   * sends email using mailgun raw messages api
   *
   * @method send
   *
   * @param  {Object}   mail
   * @param  {Function} callback
   *
   * @public
   */
  send (mail, callback) {
    const apiUrl = `https://api.mailgun.net/v3/${this.options.domain}/messages.mime`
    const auth = `api:${this.options.apiKey}`
    const input = mail.message.createReadStream()
    const form = new FormData()
    form.append('message', input, { filename: 'message.txt' })
    form.append('to', mail.data.to.join(','))

    const postOptions = {
      body: form,
      auth: auth,
      headers: form.getHeaders()
    }

    got.post(apiUrl, postOptions)
    .then((response) => {
      const body = JSON.parse(response.body)
      callback(null, this._parseMessage(body))
    })
    .catch((error) => {
      const errorBody = error.response.body || error
      callback(errorBody, {})
    })
  }
}

module.exports = MailGunTransport
