/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Copy/paste from Japa assert module
 * https://github.com/japa/assert/blob/develop/src/Assert/utils.ts
 */
export function subsetCompare(expected: any, actual: any): any {
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

/**
 * Convert a stream to a blob
 */
export function streamToBlob(stream: NodeJS.ReadableStream, mimeType: string) {
  return new Promise<Blob>((resolve, reject) => {
    const chunks: any = []

    stream
      .on('data', (chunk) => chunks.push(chunk))
      .once('end', () => resolve(new Blob(chunks, { type: mimeType })))
      .once('error', reject)
  })
}
