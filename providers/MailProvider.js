'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ServiceProvider } = require('@adonisjs/fold')

class MailProvider extends ServiceProvider {
  /**
   * Register mail provider under `Adonis/Addons/Mail`
   * namespace
   *
   * @method _registerMail
   *
   * @return {void}
   *
   * @private
   */
  _registerMail () {
    this.app.singleton('Adonis/Addons/Mail', (app) => {
      const View = app.use('Adonis/Src/View')
      const Config = app.use('Adonis/Src/Config')

      const Mail = require('../src/Mail')
      return new Mail(Config, View)
    })
    this.app.alias('Adonis/Addons/Mail', 'Mail')
  }

  /**
   * Register mail manager to expose the API to get
   * extended
   *
   * @method _registerMailManager
   *
   * @return {void}
   */
  _registerMailManager () {
    this.app.manager('Adonis/Addons/Mail', require('../src/Mail/Manager'))
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
    this._registerMailManager()
  }
}

module.exports = MailProvider
