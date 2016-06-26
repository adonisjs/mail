'use strict'

const fs = require('fs')
const got = require('got')

class SendGridTransport {

  constructor (options) {
    this.options = options
    this.apiUrl = 'https://api.sendgrid.com/v3/mail/send'
    this.name = 'sendgrid'
    this.version = '1.0.0'
  }

  /**
   * Takes a MIME formatted name/email pair and returns
   * a javascript object for the data.
   *
   * @method _mimeToObject
   *
   * @param  {String}       contact
   * @return {Object}
   *
   * @private
   */
  _mimeToObject (contact) {
    // Check for format 'Name <name@domain.tld>'
    // The email portion is required.
    const contactRegex = /(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/g
    const match = contactRegex.exec(contact)

    // If this name/email pair is invalid, ignore
    if (match === null) {
      return {}
    }

    const name = match[1]
    const email = match[2]

    const contactObject = { email: email }
    if (name !== undefined) {
      contactObject.name = name
    }

    return contactObject
  }

  /**
   * Sends email using sengrid v3 API
   *
   * @method send
   *
   * @param  {Object}   mail
   * @param  {Function} callback
   *
   * @public
   */
  send (mail, callback) {
    // Base64 encode each attachment
    const attachments = []
    const readPromises = []
    if (mail.data.attachments) {
      mail.data.attachments.forEach((attachment) => {
        const path = attachment.path
        const filename = path.split('/').pop()
        readPromises.push(
          new Promise((resolve, reject) => {
            fs.readFile(path, {
              encoding: 'base64'
            }, (err, data) => {
              if (err) return reject(err)
              const content = data
              attachments.push({ filename, content })
              return resolve(data)
            })
          })
        )
      })
    }

    Promise.all(readPromises).then(() => {
      const body = {
        personalizations: [],
        content: []
      }

      // Add attachments if there are any
      if (attachments.length > 0) {
        body.attachments = attachments
      }

      // Add from object
      body.from = this._mimeToObject(mail.data.from)

      // Add all recipient obejcts
      const toObjects = []
      mail.data.to.forEach((contact) => {
        toObjects.push(this._mimeToObject(contact))
      })

      // Add to recipients to body with subject
      body.personalizations.push({
        subject: mail.data.subject,
        to: toObjects
      })

      // add plain content
      if (mail.data.text) {
        body.content.push({
          type: 'text/plain',
          value: mail.data.text
        })
      }

      // add html content
      if (mail.data.html) {
        body.content.push({
          type: 'text/html',
          value: mail.data.html
        })
      }

      // Send request to api
      got.post(this.apiUrl, {
        body: JSON.stringify(body),
        json: true,
        headers: {
          'user-agent': 'adonis-mail',
          'Authorization': 'Bearer ' + this.options.apiKey,
          'Content-Type': 'application/json'
        }
      })
      .then((response) => {
        const messageId = (mail.message.getHeader('message-id') || '').replace(/[<>\s]/g, '')
        callback(null, { messageId })
      })
      .catch((error) => {
        try {
          callback(JSON.parse(error.response.body), {})
        } catch (e) {
          callback(error, {})
        }
      })
    }).catch((error) => {
      return callback(error, {})
    })
  }
}

module.exports = SendGridTransport
