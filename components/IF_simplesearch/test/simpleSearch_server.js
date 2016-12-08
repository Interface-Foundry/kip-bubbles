// var db = require('db');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var uuid = require('uuid');

app.use(bodyParser.json());
app.use(express.static(__dirname + '/static'));


app.get('/*', function(req, res, next) {
    res.sendfile(__dirname + '/simpleSearch.html');
});

app.post('/search', function (req, res, next) {
    console.log(req.body);

    // if (req.body && req.body.email && req.body.password  && req.body.token) {
    //     console.log('resetting password for user', req.body.email);
    // } else {
    //     console.log('could not reset password, some field was missing');
    //     return next('Could not reset password, please try again');
    // }

    // db.Users.findOne({
    //     'local.email': req.body.email
    // }, function(e, u) {
    //     if (e) { return next(e) }
    //     if (!u) { return next('Could not reset password, invalid email')}
    //     if (u.local.resetPasswordToken !== req.body.token) {
    //         return next('Could not reset password.  Make sure you are using the most recent link we sent you (and that you copy/pasted it correctly if you had to).  Note that each link can only be used once.');
    //     }
    //     var salt = bcrypt.genSaltSync(10);
    //     var hash = bcrypt.hashSync(req.body.password, salt);
    //     u.local.password = hash;
    //     u.local.resetPasswordToken = '';
    //     u.save(function(err, savedUser) {
    //         if (err || !savedUser) {
    //             return next('Could not create user.')
    //         }
    //         console.log('savedUser: ', savedUser)
    //         var token = getToken(savedUser);
    //         res.cookie('kipAuth', token);
    //         res.json({
    //             user: savedUser,
    //             token: token
    //         });
    //     })


    // })
})


if (!module.parent) {
    app.listen(8088, function() {
        console.log('app listening on port 8088');
    })
} else {
    module.exports = app;
}