'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/
const BaseDriver = require('../BaseDriver')

class Mandrill extends BaseDriver {

  constructor (Config) {
    super(Config)
    this.TransportLibrary = require('./transport')
    this.transport = this._createTransport('mail.mandrill')
  }

}

module.exports = Mandrill
