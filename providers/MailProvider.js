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
    const Mail = require('../src/Mail')
    this.app.singleton('Adonis/Addons/Mail', function (app) {
      const View = app.use('Adonis/Src/View')
      const Config = app.use('Adonis/Src/Config')
      return new Mail(View, Config)
    })
    this.app.manager('Adonis/Addons/Mail', Mail)
  }

}

module.exports = MailProvider
