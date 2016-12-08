var app = require('express').Router();
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var db = require('db');
var axios = require('axios');
var secret = 'SlytherinOrGTFO';
var expiresInMinutes = 10 * 365 * 24 * 60; // 10 years
var uniquer = require('../../IF_services/uniquer.js');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

/**
 * Creates a json web token for a user
 * @param user
 */
var getToken = function(user) {
    var jwtUser = {
        sub: user._id.toString(),
        name: user.name
    };

    return jwt.sign(jwtUser, secret, {
        expiresInMinutes: expiresInMinutes
    });
};

app.use(cookieParser());
app.use(bodyParser.json());


/**
 * Populate req.user if possible
 * Uses bearer auth
 * Header:
 *  Authentication
 * Value:
 *  "Bearer [json web token]"
 */
app.use(function(req, res, next) {
    var token = req.headers['authorization'] || req.cookies.kipAuth;
    if (!token) {
        return next();
    }

    token = token.split(' ').pop();
    jwt.verify(token, secret, function(err, decoded) {
        if (err) {
            console.error(err);
            return next();
        }
        if (decoded && decoded.sub) {
            // todo replace with something better than a full-fledged db call
            db.Users.findById(decoded.sub, function(e, u) {
                if (e) {
                    next(e)
                }
                if (u) {
                    req.user = u;
                    req.userId = u._id.toString();
                    req.isAdmin = u.admin === true;
                }
                next();
            });
        }
    });
});

/**
 * Anonymous session ids.
 */
app.use(function(req, res, next) {
  if (!req.headers['kip-anon-session'] && !req.cookies['kip-anon-session']) {
    var newSessionId = '324758-' + (Math.random()*(10e6)|0) + '-' + (Math.random()*(10e6)|0);
    res.cookie('kip-anon-session', newSessionId);
    req.anonId = newSessionId;
    res.set({'kip-anon-session': newSessionId});
  } else {
    req.anonId = req.headers['kip-anon-session'] || req.cookies['kip-anon-session'];
  }
  next();
})

/**
 * Expects {email, password}
 */
app.post('/api/auth/login', function(req, res, next) {
    if (!req.body || !req.body.email || !req.body.password) {
        next("Must pass in {email, password}");
    }

    db.Users.findOne({
            'local.email': req.body.email
        })
        .then(function(user) {
            if (!user || user == null) {
                return next('Could not find user for that email.')
            } else if (user.local.resetPasswordToken === 'b4b385ac-5641-11e5-885d-feff819cdc9f') {
                // manual reset function.
                // User has been authorized so that the next time they log in, a new pw is set.
                // if you want to allow a user to reset their password manually, do a mongodb update
                // making the resetPasswordToken match the above
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(req.body.password, salt);
                user.local.password = hash;
                user.local.resetPasswordToken = '';
                user.save(function(err, savedUser) {
                    if (err || !savedUser) {
                        return next('Could not create user.')
                    }
                    console.log('savedUser: ', savedUser)
                    var token = getToken(savedUser);
                    res.cookie('kipAuth', token);
                    res.json({
                        user: savedUser,
                        token: token
                    });
                })
                return;
            }

            bcrypt.compare(req.body.password, user.local.password, function(err, ok) {
                if (err) {
                    return next(err)
                }
                if (!ok) {
                    return next('invalid password');
                }

                var token = getToken(user);
                res.cookie('kipAuth', token);
                res.json({
                    user: user,
                    token: token
                });
            });
        }, next);
});

/**
 * Expects {email, password}
 */
app.post('/api/auth/signup', function(req, res, next) {
    if (!req.body || !req.body.email || !req.body.password) {
        return next("Must pass in {email, password}");
    }
    db.Users.findOne({
            'local.email': req.body.email
        })
        .then(function(user) {
            if (user) {
                return next('A user already exists for the email provided.')
            }
            var newUser = new db.Users()
            newUser.local.email = req.body.email;
            var name = req.body.email.split('@')[0].trim()
            uniquer.uniqueId(name, 'User').then(function(profileID) {
                newUser.profileID = profileID
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(req.body.password, salt);
                newUser.local.password = hash;
                newUser.save(function(err, savedUser) {
                    if (err || !savedUser) {
                        return next('Could not create user.')
                    }
                    console.log('savedUser: ', savedUser)
                    var token = getToken(savedUser);
                    res.cookie('kipAuth', token);
                    res.json({
                        user: savedUser,
                        token: token
                    });
                })
            }).catch(function(err) {
                return next('Error creating a unique profile ID.')
            });
        }, next)
});

/**
 * Expects at minimum {data: {userID, name}}
 */
app.post('/api/auth/verify-facebook', function(req, res, next) {
    if (!req.body || !req.body.user || !req.body.user.id || !req.body.auth) {
        return next("Error completing facebook registration or sign-in");
    }

    var fb_token = req.body.auth.authResponse.accessToken;

    axios.get('https://graph.facebook.com/v2.4/me?access_token=' + fb_token)
        .then(function(fb_res) {
            if (fb_res.data.id !== req.body.user.id) {
                throw new Error('Facebook credential mismatch between user ids ' + fb_res.data.id + ' and ' + req.body.user.id);
            }

            return db.Users.findOne({
                'facebook.id': req.body.user.id
            })
        })
        .then(function(user) {
            if (user) {
                return user;
            } else {
                var u = new db.User({
                    facebook: {
                        id: req.body.user.id,
                        name: req.body.user.name
                    },
                    name: req.body.user.name,
                    profileID: req.body.user.name.toLowerCase().replace(/[^\w]/g, '') + (Math.random()*100000|0)
                });
                return axios.get('https://graph.facebook.com/v2.4/me/picture?redirect=false&height=300&width=300&access_token=' + fb_token)
                    .then(function(pic) {
                        u.avatar = pic.data.data.url;
                        return u.save();
                    });
            }
        })
        .then(function(user) {
            res.cookie('kipAuth', getToken(user));
            res.json({
                user: user,
                token: getToken(user)
            });
        }, next);
});

/**
 * Expects at minimum {data: {userID, name}}
 */
app.post('/api/auth/verify-google', function(req, res, next) {
    if (!req.body || !req.body.user || !req.body.user.id) {
        return next("Error completing google registration or sign-in");
    }

    db.Users.findOne({
            'google.id': req.body.user.id
        })
        .then(function(user) {
            if (!user) {
                var u = new db.User({
                    google: req.body.user,
                    name: req.body.user.name,
                    avatar: req.body.user.picture,
                    profileID: req.body.user.name.toLowerCase().replace(/[^\w]/g, '') + (Math.random()*100000| 0)
                });
                return u.save(function(err, user) {
                    if (err) {
                        console.error(err);
                    }
                    res.json({
                        user: user,
                        token: getToken(user)
                    });
                });
            }

            res.cookie('kipAuth', getToken(user));
            res.json({
                user: user,
                token: getToken(user)
            });
        });
});

module.exports = app;
