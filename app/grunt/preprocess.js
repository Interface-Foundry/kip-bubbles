module.exports = {
	phonegap: {
		files: {
			'phonegap/www/app.css': 'dist/app.css',
			'phonegap/www/app.js': 'dist/app.js',
			'phonegap/www/lib.js': 'dist/lib.js',
			'phonegap/www/index.html': 'src/index.html',
			'phonegap/www/components/world/world.html': 'src/components/world/world.html',
			'phonegap/www/components/user/templates/me.html': 'src/components/user/templates/me.html',
			'phonegap/www/templates/authDialog.html': 'phonegap/www/templates/authDialog.html',
			'phonegap/www/templates/createAccountDialog.html': 'phonegap/www/templates/createAccountDialog.html'
		},
		options: {
			inline: true,
			context: {
				PHONEGAP: true,
				KEYCHAIN: true
			}
		}
	},
	dist: {
		files: {
		'dist/app.css': 'dist/app.css',
		'dist/app.js': 'dist/app.js',
		'dist/lib.js': 'dist/lib.js',
		'dist/index.html': 'src/index.html',
		'dist/components/user/templates/me.html': 'src/components/user/templates/me.html',
		'dist/components/world/world.html': 'src/components/world/world.html',
		'dist/templates/authDialog.html': 'dist/templates/authDialog.html',
		'dist/templates/createAccountDialog.html': 'dist/templates/createAccountDialog.html'
		},
		options: {
			inline: true,
			context: {
				WEB: true
			}
		}
	}
}