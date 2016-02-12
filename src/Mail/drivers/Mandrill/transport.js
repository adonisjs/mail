'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const got = require('got')

class MandrillTransport {

  constructor (options) {
    this.options = options
    this.apiUrl = 'https://mandrillapp.com/api/1.0/messages/send-raw.json'
  }

  /**
   * parses mandrill response and convert it into
   * nodemailer standard response
   *
   * @method _parseMessages
   *
   * @param  {Array}       messages
   * @return {Object}
   *
   * @private
   */
  _parseMessages (messages) {
    const accepted = []
    const rejected = []
    let messageId = null
    if (messages instanceof Array) {
      messages.forEach(function (message) {
        if (['sent', 'queued', 'scheduled'].indexOf(message.status) > -1) {
          accepted.push(message)
        } else {
          rejected.push(result)
        }
      })
      messageId = (messages[0] || {})._id
    }
    return { messageId, accepted, rejected }
  }

  /**
   * sends email using mandrill raw messages api
   *
   * @method send
   *
   * @param  {Object}   mail
   * @param  {Function} callback
   *
   * @public
   */
  send (mail, callback) {
    const input = mail.message.createReadStream()
    let rawMessage = ''

    input.on('data', (chunk) => {
      rawMessage += chunk
    })

    input.on('error', (error) => {
      callback(error, {})
    })

    input.on('end', () => {
      const body = this.options
      body.raw_message = rawMessage.toString()

      got.post(this.apiUrl, {body})
      .then((response) => {
        const body = JSON.parse(response.body)
        callback(null, this._parseMessages(body))
      })
      .catch((error) => {
        callback(error, {})
      })
    })
  }

}

module.exports = MandrillTransport
