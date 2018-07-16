'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

module.exports = {
  smtp: require('./Smtp'),
  sparkpost: require('./SparkPost'),
  mailgun: require('./Mailgun'),
  ses: require('./Ses'),
  memory: require('./Memory'),
  ethereal: require('./Ethereal')
}
