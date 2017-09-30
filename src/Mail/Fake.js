'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const MailManager = require('./Manager')
const clone = require('clone')
const proxyMethods = ['send', 'raw']

/**
 * Fake mail is used to send fake emails
 * and run assertions.
 *
 * @class FakeMail
 * @constructor
 */
class FakeMail {
  constructor (Config, View) {
    this.Config = Config
    this.View = View
    this.sender = MailManager.driver('memory', {}, this.View)
    this._mails = []
  }

  /**
   * Returns reference to this, required to be API
   * compatable
   *
   * @method connection
   *
   * @return {FakeMail}
   */
  connection () {
    return this
  }

  /**
   * Returns the last sent email.
   *
   * @method recent
   *
   * @return {Object}
   */
  recent () {
    return this._mails[this._mails.length - 1]
  }

  /**
   * Returns the last sent email and removes it from
   * the array as well
   *
   * @method pullRecent
   *
   * @return {Object}
   */
  pullRecent () {
    return this._mails.pop()
  }

  /**
   * Returns a copy of all the emails
   *
   * @method all
   *
   * @return {Array}
   */
  all () {
    return clone(this._mails)
  }

  /**
   * Clear all stored emails
   *
   * @method clear
   *
   * @return {void}
   */
  clear () {
    this._mails = []
  }
}

proxyMethods.forEach((method) => {
  FakeMail.prototype[method] = async function (...params) {
    const mail = await this.sender[method](...params)
    this._mails.push(mail)
    return mail
  }
})

module.exports = FakeMail
