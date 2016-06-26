'use strict'

const BaseDriver = require('../BaseDriver')

class SendGrid extends BaseDriver {

  constructor (Config) {
    super(Config)
    this.TransportLibrary = require('./transport')
    this.transport = this._createTransport('mail.sendgrid')
  }

}

module.exports = SendGrid
