'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const ServiceProvider = require('adonis-fold').ServiceProvider

class MailProvider extends ServiceProvider {

  * register () {
    const MailManager = require('../src/Mail/MailManager')
    this.app.singleton('Adonis/Addons/Mail', function (app) {
      const View = app.use('Adonis/Src/View')
      const Config = app.use('Adonis/Src/Config')
      return new MailManager(View, Config)
    })
    this.app.manager('Adonis/Addons/Mail', MailManager)
    this.app.bind('Adonis/Addons/MailBaseDriver', function () {
      return require('../src/Mail/drivers/BaseDriver')
    })
  }

}

module.exports = MailProvider
