/*
 * @adonisjs/mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export class ObjectBuilder {
  private result: { [key: string]: any } = {}

  public add(key: string, value: any): this {
    if (value === undefined) {
      return this
    }
    this.result[key] = value
    return this
  }

  public toObject() {
    return this.result
  }
}

/**
 * Copy/paste from Japa assert module
 * https://github.com/japa/assert/blob/develop/src/Assert/utils.ts
 */
export function subsetCompare(expected: any, actual: any) {
  if (expected === actual) {
    return true
  }

  if (typeof actual !== typeof expected) {
    return false
  }

  if (typeof expected !== 'object' || expected === null) {
    return expected === actual
  }

  if (!!expected && !actual) {
    return false
  }

  /**
   * Handling arrays
   */
  if (Array.isArray(expected)) {
    if (typeof actual.length !== 'number') {
      return false
    }
    const aa = Array.prototype.slice.call(actual)
    return expected.every(function (exp) {
      return aa.some(function (act: any) {
        return subsetCompare(exp, act)
      })
    })
  }

  /**
   * Handling date instances
   */
  if (expected instanceof Date) {
    if (actual instanceof Date) {
      return expected.getTime() === actual.getTime()
    } else {
      return false
    }
  }

  /**
   * Handling objects
   */
  return Object.keys(expected).every(function (key) {
    const eo = expected[key]
    const ao = actual[key]

    if (typeof eo === 'object' && eo !== null && ao !== null) {
      return subsetCompare(eo, ao)
    }

    if (typeof eo === 'function') {
      return eo(ao)
    }

    return ao === eo
  })
}
