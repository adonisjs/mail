/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createServer, type Server } from 'node:http'
import { type AddressInfo } from 'node:net'

/**
 * Spins up a local HTTP server that captures the JSON payload of the first
 * request and responds with a canned body, so we can assert on what a JSON
 * based transport actually sends without hitting the real API.
 */
export function captureServer(responseBody: Record<string, any>) {
  let resolvePayload: (value: any) => void
  let resolveRequest: (value: { url?: string; headers: Record<string, any> }) => void
  const payload = new Promise<any>((resolve) => (resolvePayload = resolve))
  const request = new Promise<{ url?: string; headers: Record<string, any> }>(
    (resolve) => (resolveRequest = resolve)
  )

  const server: Server = createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      resolveRequest({ url: req.url, headers: req.headers })
      resolvePayload(JSON.parse(body))
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(responseBody))
    })
  })

  const ready = new Promise<string>((resolve) => {
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo
      resolve(`http://localhost:${port}`)
    })
  })

  return { server, ready, payload, request }
}
