/*
 * @adonisjs/mail
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DateTime } from 'luxon'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { Message } from '../../../src/message.js'

test.group('Message | iCalEvents', () => {
  test('attach ical event', ({ assert }) => {
    const message = new Message()
    message.icalEvent('hello', { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      content: 'hello',
      filename: 'invite.ics',
    })
  })

  test('attach ical event from file', ({ assert }) => {
    const message = new Message()
    message.icalEventFromFile('/foo/invite.ics', { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      path: '/foo/invite.ics',
      filename: 'invite.ics',
    })
  })

  test('attach ical event from file URL', ({ assert }) => {
    const message = new Message()
    const fileUrl = new URL('foo/invite.ics', import.meta.url)

    message.icalEventFromFile(fileUrl, { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      path: fileURLToPath(fileUrl),
      filename: 'invite.ics',
    })
  })

  test('attach ical event from path', ({ assert }) => {
    const message = new Message()
    message.icalEventFromUrl('http://foo.com/invite', { filename: 'invite.ics' })

    assert.deepEqual(message.toJSON().message.icalEvent, {
      href: 'http://foo.com/invite',
      filename: 'invite.ics',
    })
  })

  test('attach ical event using the calendar object', ({ assert }) => {
    const message = new Message()
    message.icalEvent(
      (calendar) => {
        calendar.createEvent({
          summary: 'Discuss tech',
          start: DateTime.local().plus({ minutes: 30 }),
          end: DateTime.local().plus({ minutes: 60 }),
          url: 'http://adonisjs.com/meeting/1',
        })
      },
      { filename: 'invite.ics' }
    )

    assert.isTrue(message.toJSON().message.icalEvent!.content!.startsWith('BEGIN:VCALENDAR'))
    assert.isTrue(message.toJSON().message.icalEvent!.content!.endsWith('END:VCALENDAR'))
  })
})
