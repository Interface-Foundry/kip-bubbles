var Log = require('../IF_logging/if_logger');
var log = Log();
module.exports = function(app, passport, landmarkSchema) {

// normal routes ===============================================================

	// // show the home page (will also have our login links)
	// app.get('/signup2', function(req, res) {
	// 	res.render('index.ejs');
	// });



	// LOGOUT ==============================
	app.get('/api/user/logout', function(req, res) {
		log({
			user: req.user && req.user._id,
			message: 'logout'
		});
		req.logout();
		res.redirect('/login');
	});


	//app.get('/users', auth, user.list); // BY ADDING THE "auth" function, will return 401 if not auth

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login form

		// // route to test if the user is logged in or not
		// app.get('/api/user/loggedin', function(req, res) {

		// 	if (req.isAuthenticated()){
		// 		res.send(req.user);
		// 	}
		// 	else {
		// 		res.sendStatus(500);
		// 	}
		// });

		// process the login form
		// app.post('/api/user/login', passport.authenticate('local-login', {
		// 	successRedirect: '/',
		// 	failureRedirect: '/'}),
		// function(req,res){

		// 	console.log('--------- /API/USER/LOGIN -------------');
		// 	console.log(req.cookies);
		// 	console.log(req.user);
		// });



		// app.post('/api/user/login', function(req, res, next) {
		//  passport.authenticate('local-login', function(err, user, info) {
		//    if (err) { return next(err); }
		//    // if (!user) { return res.send(401); }
		//    // req.logIn(user, function(err) {
		//    //   if (err) { return next(err); }
		//    //   return res.send(user);
		//    // });
		// 	 else {
		// 	 	res.send(req.user);
		// 	 }

		//  })(req, res, next);
		// });


		// process the signup form
		app.post('/api/user/login', passport.authenticate('local-login', {

		}), function(req,res){
			// console.log('--------- /API/USER/LOGIN -------------');
			// console.log(req);
			res.status(200).send(req.user);
			log({
				message: 'login',
				type: 'local',
				user: req.user && req.user._id
			});
		});

		app.post('/api/user/login-basic', passport.authenticate('local-basic', {}),
		function(req, res) {
			console.log('req.body is.', req.body)
			console.log('req.user is', req.user)
			res.status(200).send(req.user);
			log({
				message: 'login',
				type: 'basic',
				user: req.user && req.user._id
			});
		});


		// app.post('/api/user/login',
		//   passport.authenticate('local-login', { }),
		//   function(req, res) {
		// 	    console.log('--------- /API/USER/LOGIN -------------');
		// 		console.log(req.cookies);
		// 		console.log(req.user);
		// 		res.send(req.user);
		//   });

		// app.post('/api/user/login', function(req, res, next) {
		//  passport.authenticate('local-login', function(err, user, info) {
		//    if (err) { return next(err); }
		//    else {
		//    	res.send(req.user);
		//    }

		//  })(req, res, next);
		// });


		// process the signup form
		app.post('/api/user/signup', passport.authenticate('local-signup', {

		}), function(req,res){
			res.send(req.user);
			log({
				message: 'signup',
				type: 'local',
				user: req.user && req.user._id
			});
		});

	// facebook -------------------------------

		app.get('/auth/facebook', function(req, res, next) {
		  req.session.redirect = req.query.redirect;
		  next();
		}, passport.authenticate('facebook', { scope : 'email' }));


		app.get('/auth/facebook/callback', passport.authenticate('facebook', {
		  failureRedirect: '/'
		}), function (req, res) {
		  res.redirect(req.session.redirect || '/');
		  delete req.session.redirect;
			log({
				message: 'login',
				type: 'facebook',
				user: req.user && req.user._id
			});
		});

	// twitter --------------------------------

		app.get('/auth/twitter', function(req, res, next) {
		  req.session.redirect = req.query.redirect;
		  next();
		}, passport.authenticate('twitter', { scope : 'email' }));


		app.get('/auth/twitter/callback', passport.authenticate('twitter', {
		  failureRedirect: '/login'
		}), function (req, res) {
		  res.redirect(req.session.redirect || '/home');
		  delete req.session.redirect;
		});



	// iOS Facebook Auth --------------------------------
		app.route('/auth/facebook/mobile_signin').post(function(req, res, next){
			passport.authenticate('client_facebook', function(err, user, info){
				if (err || !user){
					res.status(400).send(info);
					log({
						err: info,
						message: 'login failed',
						type: 'facebook.mobile',
						user: req.user && req.user._id
					});
				} else {
					req.login(user, function(err){
						if (err){
							res.status(400).send(err);
							log({
								err: err,
								message: 'login failed',
								type: 'facebook.mobile',
								user: req.user && req.user._id
							});
						} else {
							res.json(user);
							log({
								message: 'login',
								type: 'facebook.mobile',
								user: req.user && req.user._id
							});
						}
					});
					//res.json(user);
				}
			})(req, res, next);
		});



	// meetup --------------------------------

		// send to meetup to do the authentication
		//app.get('/auth/meetup', passport.authenticate('meetup', { scope : 'email' }));


		app.get('/auth/meetup', function(req, res, next) {
		  req.session.redirect = req.query.redirect;
		  next();
		}, passport.authenticate('meetup', { scope : 'email' }));


		app.get('/auth/meetup/callback', passport.authenticate('meetup', {
		  failureRedirect: '/login'
		}), function (req, res) {
		  res.redirect(req.session.redirect || '/profile/worlds/meetup');
		  delete req.session.redirect;
		});


	// bearer login via token auth --------------------------------

	app.get('/auth/bearer', passport.authenticate('bearer', { session: false }),
		function(req, res) {
	        res.send(200,'logged in');
			log({
				message: 'login',
				type: 'bearer',
				user: req.user && req.user._id
			});
	    }
	);



// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

	// locally --------------------------------
		app.get('/connect/local', function(req, res) {
			//res.render('connect-local.ejs', { message: req.flash('loginMessage') });
			res.send(200,'authing');
		});
		app.post('/connect/local', passport.authenticate('local-signup', {
			successRedirect : '/home', // redirect to the secure profile section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

	// facebook -------------------------------


		// send to facebook to do the authentication
		app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

		// handle the callback after facebook has authorized the user
		app.get('/connect/facebook/callback',
			passport.authorize('facebook', {
				successRedirect : '/home',
				failureRedirect : '/home'
			}));

	// twitter --------------------------------

		// send to twitter to do the authentication
		app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

		// handle the callback after twitter has authorized the user
		app.get('/connect/twitter/callback',
			passport.authorize('twitter', {
				successRedirect : '/home',
				failureRedirect : '/home'
			}));


	// meetup --------------------------------

		// send to meetup to do the authentication
		app.get('/connect/meetup', passport.authorize('meetup', { scope : 'email' }));

		// handle the callback after meetup has authorized the user
		app.get('/connect/meetup/callback',
			passport.authorize('meetup', {
				successRedirect : '/home',
				failureRedirect : '/home'
			}));



// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	app.get('/unlink/local', function(req, res) {
		var user            = req.user;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// facebook -------------------------------
	app.get('/unlink/facebook', function(req, res) {
		var user            = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// twitter --------------------------------
	app.get('/unlink/twitter', function(req, res) {
		var user           = req.user;
		user.twitter.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});


};




// // route middleware to ensure user is logged in
// function isLoggedIn(req, res, next) {

// 	if (!req.isAuthenticated()){
// 		res.send(401);  //send unauthorized
// 	}

// 	else{
// 		return next();
// 	}

// }


// ensureAuthenticated = function (req, res, next) {
//   if (req.isAuthenticated()) { return next(); }

//   // If the user is not authenticated, then we will start the authentication
//   // process.  Before we do, let's store this originally requested URL in the
//   // session so we know where to return the user later.
//   console.log('-------- THING');
//   req.session.redirectUrl = req.url;

//   // Resume normal authentication...

//   logger.info('User is not authenticated.');
//   req.flash("warn", "You must be logged-in to do that.");
//   res.redirect('/');
// }
