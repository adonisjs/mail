'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

require('dotenv').load()
const test = require('japa')
const Message = require('../src/Mail/Message')
const { sparkpost: SparkPost } = require('../src/Mail/Drivers')

test.group('Spark Post', () => {
  test('get driver instance', (assert) => {
    const sparkPost = new SparkPost()
    assert.instanceOf(sparkPost, SparkPost)
  })

  test('get to address as recipient', (assert) => {
    const sparkpost = new (SparkPost.Transport)()
    const message = new Message()
    message.to('foo@bar.com')
    const recipients = sparkpost._getRecipients({ data: message.toJSON() })
    assert.deepEqual(recipients, [{
      address: {
        email: 'foo@bar.com'
      }
    }])
  })

  test('get to address with name as recipient', (assert) => {
    const sparkpost = new (SparkPost.Transport)()
    const message = new Message()
    message.to('foo@bar.com', 'foo')
    const recipients = sparkpost._getRecipients({ data: message.toJSON() })
    assert.deepEqual(recipients, [{
      address: {
        email: 'foo@bar.com',
        name: 'foo'
      }
    }])
  })

  test('get cc with name as recipient', (assert) => {
    const sparkpost = new (SparkPost.Transport)()
    const message = new Message()
    message.to('foo@bar.com', 'foo')
    message.cc('baz@bar.com', 'baz')
    const recipients = sparkpost._getRecipients({ data: message.toJSON() })
    assert.deepEqual(recipients, [
      {
        address: {
          email: 'foo@bar.com',
          name: 'foo'
        }
      },
      {
        address: {
          email: 'baz@bar.com',
          name: 'baz'
        }
      }
    ])
  })

  test('get bcc with name as recipient', (assert) => {
    const sparkpost = new (SparkPost.Transport)()
    const message = new Message()
    message.to('foo@bar.com', 'foo')
    message.bcc('baz@bar.com', 'baz')
    const recipients = sparkpost._getRecipients({ data: message.toJSON() })
    assert.deepEqual(recipients, [
      {
        address: {
          email: 'foo@bar.com',
          name: 'foo'
        }
      },
      {
        address: {
          email: 'baz@bar.com',
          name: 'baz'
        }
      }
    ])
  })

  test('get config options', (assert) => {
    const sparkpost = new (SparkPost.Transport)({
      extras: {
        options: {
          sandbox: false
        }
      }
    })

    const options = sparkpost._getOptions()
    assert.deepEqual(options, { sandbox: false })
  })

  test('give priority to runtime options', (assert) => {
    const sparkpost = new (SparkPost.Transport)({
      extras: {
        options: {
          sandbox: false
        }
      }
    })

    const options = sparkpost._getOptions({
      options: { sandbox: true }
    })
    assert.deepEqual(options, { sandbox: true })
  })

  test('get campaign id', (assert) => {
    const sparkpost = new (SparkPost.Transport)({
      extras: {
        campaign_id: 10
      }
    })

    const campaignId = sparkpost._getCampaignId()
    assert.equal(campaignId, 10)
  })

  test('give priority to runtime campaign id', (assert) => {
    const sparkpost = new (SparkPost.Transport)({
      extras: {
        campaign_id: 10
      }
    })

    const campaignId = sparkpost._getCampaignId({ campaign_id: 20 })
    assert.equal(campaignId, 20)
  })

  test('send email', async (assert) => {
    const config = {
      apiKey: process.env.SPARKPOST_API_KEY
    }

    const sparkPost = new SparkPost()
    sparkPost.setConfig(config)

    const response = await sparkPost.send({
      from: [process.env.SMTP_TO_EMAIL],
      to: [{ name: 'virk', address: process.env.SMTP_TO_EMAIL }],
      subject: 'Plain email',
      html: '<h2> Hello </h2>'
    })

    assert.equal(response.acceptedCount, 1)
    assert.deepEqual(response.rejectedCount, 0)
  }).timeout(0)

  test('send email with attachment', async (assert) => {
    const config = {
      apiKey: process.env.SPARKPOST_API_KEY
    }

    const sparkPost = new SparkPost(config)
    sparkPost.setConfig(config)

    const response = await sparkPost.send({
      from: [process.env.SMTP_TO_EMAIL],
      to: [{ name: 'virk', address: process.env.SMTP_TO_EMAIL }],
      subject: 'Plain email',
      html: '<h2> Hello </h2>',
      attachments: [{
        filename: 'sample.txt',
        content: 'Hello world'
      }],
      extras: {
        campaignId: '10'
      }
    })

    assert.equal(response.acceptedCount, 1)
    assert.deepEqual(response.rejectedCount, 0)
  }).timeout(0)
})
