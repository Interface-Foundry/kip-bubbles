// var db = require('db');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var uuid = require('uuid');
var compression = require('compression');
var base = process.env.NODE_ENV !== 'production' ? __dirname + '/static' : __dirname + '/dist';
var defaultPage = process.env.NODE_ENV !== 'production' ? __dirname + '/simpleSearch.html' : __dirname + '/dist/simpleSearch.html';
var querystring = require('querystring');
var request = require('request');
var db = require('db');
var kip = require('kip')
var fs = require('fs')

app.use(compression());
app.use(bodyParser.json());
app.use(express.static(base));
// app.use(require('prerender-node').set('prerenderToken', 'G7ZgxSO9pLyeidrHtWgX'));
app.use(require('prerender-node').set('prerenderServiceUrl', 'http://127.0.1.1:3000'));
app.use(require('prerender-node').set('protocol', 'https'));

//express compression
// var oneDay = 86400000;


// app.use(express.static(__dirname + '/app/dist', {
//     maxAge: oneDay
// }));

app.get('/testslack', function(req, res) {
  res.send(fs.readFileSync(__dirname + '/test-button.html', 'utf8'))
})

app.get('/newslack', function(req, res) {
    console.log('new slack integration request');
    // TODO post in our slack #dev channel
    // TODO check that "state" property matches
    res.redirect('/thanks')

    if (!req.query.code) {
        console.error(new Date())
        console.error('no code in the callback url, cannot proceed with new slack integration')
        // TODO post error in slack channel
        return;
    }


    var clientID = process.env.NODE_ENV === 'production' ? '2804113073.14708197459' : '2804113073.26284712467';
    var clientSecret = process.env.NODE_ENV === 'production' ? 'd4c324bf9caa887a66870abacb3d7cb5' : 'b69ba0ea3b4a951facc77962c49a1228';
    var redirect_uri = process.env.NODE_ENV === 'production' ? 'https://kipsearch.com/newslack' : 'http://yak.kipapp.co/newslack';
    var slackbot_reload_url = process.env.NODE_ENV === 'production' ? 'http://chat.kipapp.co/newslack' : 'http://localhost:8000/newslack';

    var body = {
      code: req.query.code,
      redirect_uri: redirect_uri
    }

    request({
      url: 'https://' + clientID + ':' + clientSecret + '@slack.com/api/oauth.access',
      method: 'POST',
      form: body
    }, function(e, r, b) {
        if (e) {
          console.log('error connecting to slack api');
          console.log(e);
        }
        if (typeof b === 'string') {
            b = JSON.parse(b);
        }
        if (!b.ok) {
            console.error('error connecting with slack, ok = false')
            console.error('body was', body)
            console.error('response was', b)
            return;
        } else if (!b.access_token || !b.scope) {
            console.error('error connecting with slack, missing prop')
            console.error('body was', body)
            console.error('response was', b)
            return;
        }

        console.log('got positive response from slack')
        console.log('body was', body)
        console.log('response was', b)
        var bot = new db.Slackbot(b)
        db.Slackbots.find({team_id: b.team_id}, function(e, bots) {
          if (e) { console.error(e) }

          if (bots && bots.length > 0) {
            console.log('already have a bot for this team')
            return;  
          } else {
            bot.save(function(e) {
                kip.err(e);
                request(slackbot_reload_url, function(e, r, b) {
                    if (e) {
                        console.error('error triggering chat server slackbot update')
                    }
                })
            })
          }
        })
    })


})

// var thanks = fs.readFileSync(__dirname + '/thanks.html', 'utf8');
app.get('/thanks', function(req, res) {
  var thanks = fs.readFileSync(__dirname + '/thanks.html', 'utf8');
  res.send(thanks);
})

app.get('/cinna/*', function(req, res, next) {
   res.redirect(querystring.unescape(req.url.replace('/cinna/',''))); //magic cinna moment
});


app.get('/*', function(req, res, next) {
    res.sendfile(defaultPage);
});


// app.post('/search', function(req, res, next) {
//     console.log(req.body);
// })


if (!module.parent) {
    app.listen(8088, function() {
        console.log('app listening on port 8088');
    })
} else {
    module.exports = app;
}
