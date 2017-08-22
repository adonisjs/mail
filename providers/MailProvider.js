'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ServiceProvider } = require('@adonisjs/fold')

class MailProvider extends ServiceProvider {
  /**
   * Register the mail to the IoC container
   * with `Adonis/Addons/Mail` namespace.
   *
   * @method _registerMail
   *
   * @return {void}
   *
   * @private
   */
  _registerMail () {
    const MailManager = require('../src/Mail/MailManager')
    this.app.singleton('Adonis/Addons/Mail', (app) => {
      const View = app.use('Adonis/Src/View')
      const Config = app.use('Adonis/Src/Config')
      return new MailManager(View, Config)
    })
    this.app.alias('Adonis/Addons/Mail', 'Mail')
    this.app.manager('Adonis/Addons/Mail', MailManager)
  }

  /**
   * Register the mail manager to the IoC container
   * with `Adonis/Addons/MailBaseManager` namespace.
   *
   * @method _registerMailBaseDriver
   *
   * @return {void}
   *
   * @private
   */
  _registerMailBaseDriver () {
    this.app.bind('Adonis/Addons/MailBaseDriver', () => require('../src/Mail/MailDrivers/BaseDriver'))
    this.app.alias('Adonis/Addons/MailBaseDriver', 'MailBaseDriver')
  }

  /**
   * Register bindings
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this._registerMail()
    this._registerMailBaseDriver()
  }
}

module.exports = MailProvider
