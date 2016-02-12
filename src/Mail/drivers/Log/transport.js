'use strict'

/**
 * adonis-framework
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/
const fs = require('co-fs-extra')

class Transport {

  constructor (toPath) {
    this.toPath = toPath
    this.name = 'log-driver'
    this.version = '1.0.0'
  }

  /**
   * writes email to a log file, which can be used later to
   * inspect email content
   *
   * @param  {Object}   mail
   * @param  {Function} callback
   *
   * @public
   */
  send (mail, callback) {
    const input = mail.message.createReadStream()
    const writable = fs.createOutputStream(this.toPath, {flags: 'a'})
    writable.write('- EMAIL START -\n')
    input.on('data', (chunk) => {
      writable.write(chunk)
    })
    input.on('end', () => {
      writable.end('\n- EMAIL END -\n\n')
    })
    writable.on('finish', () => {
      callback(null, true)
    })
    writable.on('error', (error) => {
      callback(error, null)
    })
    input.on('error', (error) => {
      callback(error, null)
    })
  }

}

module.exports = Transport
