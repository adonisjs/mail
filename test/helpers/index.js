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

module.exports = {
  delayFn (time) {
    return new Promise((resolve) => (setTimeout(resolve, time)))
  },

  async processWithDelay (fn, time) {
    const res = await Promise.all([this.delayFn(time), fn])
    return res[1]
  },

  async getMailTrapEmail () {
    const mails = await got(`https://mailtrap.io/api/v1/inboxes/${process.env.MAILTRAP_INBOX_ID}/messages`, {
      headers: {
        'Api-Token': process.env.MAILTRAP_TOKEN
      },
      json: true
    })
    return mails.body[0]
  },

  async getMailWithAttachments () {
    const mail = await this.getMailTrapEmail()
    const attachments = await got(
      `https://mailtrap.io/api/v1/inboxes/${process.env.MAILTRAP_INBOX_ID}/messages/${mail.id}/attachments`,
      {
        headers: {
          'Api-Token': process.env.MAILTRAP_TOKEN
        },
        json: true
      }
    )

    mail.attachments = attachments.body
    return mail
  },

  async cleanInbox () {
    return got(`https://mailtrap.io/api/v1/inboxes/${process.env.MAILTRAP_INBOX_ID}/clean`, {
      method: 'PUT',
      headers: {
        'Api-Token': process.env.MAILTRAP_TOKEN
      }
    })
  }
}
