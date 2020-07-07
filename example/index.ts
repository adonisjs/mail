import Mail from '@ioc:Adonis/Addons/Mail'

Mail.use('transactional')
	.send((message) => {
		message.htmlView('welcome.edge')
		message.htmlView('welcome.edge')
	})
	.then((reponse) => {
		console.log(reponse)
	})
