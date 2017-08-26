'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const Message = require('../src/Mail/Message')

test.group('Message', () => {
  test('create a nodemailer compatible message object', (assert) => {
    const message = new Message()
    message.from('baz@bar.com')
    message.to('foo@bar.com')
    assert.deepEqual(message.toJSON(), {
      to: ['foo@bar.com'],
      from: ['baz@bar.com']
    })
  })

  test('message object with from name and email', (assert) => {
    const message = new Message()
    message.from('baz@bar.com', 'Mr baz')
    message.to('foo@bar.com')
    assert.deepEqual(message.toJSON(), {
      to: ['foo@bar.com'],
      from: [{ address: 'baz@bar.com', name: 'Mr baz' }]
    })
  })

  test('message object with to name and email', (assert) => {
    const message = new Message()
    message.from('baz@bar.com', 'Mr baz')
    message.to('foo@bar.com', 'Mr foo')
    assert.deepEqual(message.toJSON(), {
      to: [{ address: 'foo@bar.com', name: 'Mr foo' }],
      from: [{ address: 'baz@bar.com', name: 'Mr baz' }]
    })
  })

  test('add multiple to addresses', (assert) => {
    const message = new Message()
    message.from('baz@bar.com', 'Mr baz')
    message
      .to('foo@bar.com', 'Mr foo')
      .to('kr@bar.com', 'Mr kr')

    assert.deepEqual(message.toJSON(), {
      to: [{ address: 'foo@bar.com', name: 'Mr foo' }, { address: 'kr@bar.com', name: 'Mr kr' }],
      from: [{ address: 'baz@bar.com', name: 'Mr baz' }]
    })
  })

  test('pass address array directly', (assert) => {
    const message = new Message()
    message.from('baz@bar.com', 'Mr baz')
    message.to([{ address: 'foo@bar.com', name: 'Mr foo' }, { address: 'kr@bar.com', name: 'Mr kr' }])

    assert.deepEqual(message.toJSON(), {
      to: [{ address: 'foo@bar.com', name: 'Mr foo' }, { address: 'kr@bar.com', name: 'Mr kr' }],
      from: [{ address: 'baz@bar.com', name: 'Mr baz' }]
    })
  })

  test('define cc address', (assert) => {
    const message = new Message()
    message.cc('baz@bar.com', 'Mr baz')

    assert.deepEqual(message.toJSON(), {
      cc: [{ address: 'baz@bar.com', name: 'Mr baz' }]
    })
  })

  test('define bcc address', (assert) => {
    const message = new Message()
    message.bcc('baz@bar.com', 'Mr baz')

    assert.deepEqual(message.toJSON(), {
      bcc: [{ address: 'baz@bar.com', name: 'Mr baz' }]
    })
  })

  test('define sender address', (assert) => {
    const message = new Message()
    message.sender('baz@bar.com', 'Mr baz')

    assert.deepEqual(message.toJSON(), {
      sender: [{ address: 'baz@bar.com', name: 'Mr baz' }]
    })
  })

  test('define replyTo address', (assert) => {
    const message = new Message()
    message.replyTo('baz@bar.com', 'Mr baz')

    assert.deepEqual(message.toJSON(), {
      replyTo: [{ address: 'baz@bar.com', name: 'Mr baz' }]
    })
  })

  test('set email subject', (assert) => {
    const message = new Message()
    message.subject('Hello')

    assert.deepEqual(message.toJSON(), {
      subject: 'Hello'
    })
  })

  test('set email plain text body', (assert) => {
    const message = new Message()
    message.subject('Hello').text('Plain text hello')

    assert.deepEqual(message.toJSON(), {
      subject: 'Hello',
      text: 'Plain text hello'
    })
  })

  test('set email html body', (assert) => {
    const message = new Message()
    message.subject('Hello').html('<h2> html hello </h2>')

    assert.deepEqual(message.toJSON(), {
      subject: 'Hello',
      html: '<h2> html hello </h2>'
    })
  })

  test('set email watch html body', (assert) => {
    const message = new Message()
    message.subject('Hello').watchHtml('<h2> html hello </h2>')

    assert.deepEqual(message.toJSON(), {
      subject: 'Hello',
      watchHtml: '<h2> html hello </h2>'
    })
  })

  test('set email attachments without name', (assert) => {
    const message = new Message()
    message.attach('foo.jpg')

    assert.deepEqual(message.toJSON(), {
      attachments: [{ path: 'foo.jpg' }]
    })
  })

  test('set email attachments with custom content type', (assert) => {
    const message = new Message()
    message.attach('foo.jpg', { contentType: 'image/jpg' })

    assert.deepEqual(message.toJSON(), {
      attachments: [{ path: 'foo.jpg', contentType: 'image/jpg' }]
    })
  })

  test('attach data as attachment', (assert) => {
    const message = new Message()
    message.attachData('hello', 'text.txt')

    assert.deepEqual(message.toJSON(), {
      attachments: [{ content: 'hello', filename: 'text.txt' }]
    })
  })

  test('throw exception when filename is missing with attachData', (assert) => {
    const message = new Message()
    const fn = () => message.attachData('hello')
    assert.throw(fn, 'E_INVALID_PARAMETER: Define filename as 2nd argument when calling message.attachData')
  })

  test('set email alternative', (assert) => {
    const message = new Message()
    message.alternative('**hello**', { contentType: 'text/x-web-markdown' })
    assert.deepEqual(message.toJSON(), {
      alternatives: [{ content: '**hello**', contentType: 'text/x-web-markdown' }]
    })
  })

  test('embed file in content', (assert) => {
    const message = new Message()
    message.embed('foo.jpg', 'logo')
    assert.deepEqual(message.toJSON(), {
      attachments: [{ path: 'foo.jpg', cid: 'logo' }]
    })
  })

  test('define inReplyTo message id', (assert) => {
    const message = new Message()
    message.inReplyTo('11010')

    assert.deepEqual(message.toJSON(), {
      inReplyTo: '11010'
    })
  })

  test('define driver extras', (assert) => {
    const message = new Message()
    message.driverExtras({ campaign_id: 20 })

    assert.deepEqual(message.toJSON(), {
      extras: { campaign_id: 20 }
    })
  })
})
