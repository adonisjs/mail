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

/**
 * Ethereal driver is used to run test emails
 *
 * @class EtherealDriver
 * @constructor
 */
class EtherealDriver {
  /**
   * This method is called by mail manager automatically
   * and passes the config object
   *
   * @method setConfig
   *
   * @param  {Object}  config
   */
  setConfig (config) {
    if (config.user && config.pass) {
      this.setTransporter(config.user, config.pass)
    } else {
      this.transporter = null
    }

    this.log = typeof (config.log) === 'function' ? config.log : function (messageUrl) {
      console.log(messageUrl)
    }
  }

  /**
   * Initiate transporter
   *
   * @method setTransporter
   *
   * @param  {String}       user
   * @param  {String}       pass
   */
  setTransporter (user, pass) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user, pass }
    })
  }

  /**
   * Creates a new transporter on fly
   *
   * @method createTransporter
   *
   * @return {String}
   */
  createTransporter () {
    return new Promise((resolve, reject) => {
      nodemailer.createTestAccount((error, account) => {
        if (error) {
          reject(error)
          return
        }
        this.setTransporter(account.user, account.pass)
        resolve()
      })
    })
  }

  /**
   * Sends email
   *
   * @method sendEmail
   *
   * @param  {Object}  message
   *
   * @return {Object}
   */
  sendEmail (message) {
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
  async send (message) {
    if (!this.transporter) {
      await this.createTransporter()
    }

    const mail = await this.sendEmail(message)
    this.log(nodemailer.getTestMessageUrl(mail))

    return mail
  }
}

module.exports = EtherealDriver
