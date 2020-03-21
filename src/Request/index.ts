/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import axios from 'axios'

export type HeaderObject = { [key: string]: string }

export class Request {
  private headers: HeaderObject
  private basicAuth: string
  private auth: string

  constructor () {
    this.headers = {}
    this.basicAuth = ''
    this.auth = ''
  }

  /**
   * Set auth header
   */
  public setAuth (val: string) {
    this.auth = val
    return this
  }

  /**
   * Set basic auth onrequest headers
   */
  public setBasicAuth (val: string) {
    this.basicAuth = val
    return this
  }

  /**
   * Set headers on request
   */
  public setHeaders (headers: HeaderObject) {
    this.headers = headers
    return this
  }

  /**
   * Make a post http request
   */
  public async post (url: string, data?: any, options?: any) {
    const headers = this.auth
      ? Object.assign({ Authorization: this.auth }, this.headers)
      : this.headers

    const requestConfig = {
      url,
      headers,
      data,
      method: 'post',
      ...options,
    }

    if(this.basicAuth){
      const [username, password] = this.basicAuth.split(':')
      requestConfig.auth = {
        username,
        password,
      }
    }

    try {
      const response = await axios(requestConfig)
      return response.data
    } catch (err) {
      const error = new Error(err)
      throw error
    }
  }
}
