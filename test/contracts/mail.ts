declare module '@ioc:Adonis/Addons/Mail' {
	interface MailersList {
		promotional: MailDrivers['smtp']
		transactions: MailDrivers['ses']
	}
}
