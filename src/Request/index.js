'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const got = require('got')

class Request {
  constructor () {
    this._headers = {}
    this._basicAuth = null
    this._auth = null
    this._isJson = false
  }

  /**
   * Accept json
   *
   * @method isJson
   *
   * @chainable
   */
  acceptJson () {
    this._isJson = true
    return this
  }

  /**
   * Set auth header
   *
   * @method auth
   *
   * @param  {String} val
   *
   * @chainable
   */
  auth (val) {
    this._auth = val
    return this
  }

  /**
   * Set basic auth onrequest headers
   *
   * @method basicAuth
   *
   * @param  {String}  val
   *
   * @chainable
   */
  basicAuth (val) {
    this._basicAuth = val
    return this
  }

  /**
   * Set headers on request
   *
   * @method headers
   *
   * @param  {Object} headers
   *
   * @chainable
   */
  headers (headers) {
    this._headers = headers
    return this
  }

  /**
   * Make a post http request
   *
   * @method post
   *
   * @param  {String} url
   * @param  {Object} body
   *
   * @return {void}
   */
  async post (url, body) {
    const headers = this._auth ? Object.assign({ 'Authorization': this._auth }, this._headers) : this._headers
    try {
      const response = await got(url, {
        headers,
        body,
        json: this._isJson,
        auth: this._basicAuth
      })
      return response.body
    } catch ({ response, message }) {
      const error = new Error(message)
      error.errors = response.body
      throw error
    }
  }
}

module.exports = Request
