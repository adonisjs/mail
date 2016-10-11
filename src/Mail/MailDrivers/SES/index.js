'use strict'

/*
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/
const BaseDriver = require('../BaseDriver')

class SES extends BaseDriver {

  constructor (Config) {
    super(Config)
    this.TransportLibrary = require('nodemailer-ses-transport')
    this.transport = this._createTransport('mail.ses')
  }

}

module.exports = SES
