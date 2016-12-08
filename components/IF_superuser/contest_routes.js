'use strict';

var express = require('express'),
    router = express.Router(),
    contestSchema = require('../IF_schemas/contest_schema.js'),
    _ = require('underscore');

//load current contest for that region
router.get('/:id', function(req, res) {
    if (req.user && req.user.admin) {
        //find current contest
        contestSchema.findOne({
            region: req.params.id.toString().toLowerCase(),
            live: true
        }, function(err, contest) {
            if (err) {
                console.log(err);
            }
            if (!contest) {
                console.log('No contest found.')
                return {};
            }
            return res.send(contest);
        });

    } else {

        contestSchema.findOne({
            region: req.params.id.toString().toLowerCase(),
            live: true
        }).exec(function(err, result) {
            if (err) {
                console.log(err);
            }
            if (!result) {
                console.log('No contest found.')
                return {};
            }
            console.log('hitting this', result)
            return res.send(result);
        });

    }
})

//create new contest for that region
router.post('/', function(req, res) {
    if (req.user.admin) {
        //Set all other contests to live:false
        contestSchema.update({}, {
            live: false
        }, {
            multi: true
        }, function(err, result) {
            if (err) {
                console.log(err)
            }
            console.log('all others now false', result)
        })
        var newcontest = new contestSchema();
        if (req.body._id) {
            delete req.body._id;
            delete req.body._v;
        }
        var contest = _.extend(newcontest, req.body);
        contest.save(
            function(err, contest) {
                if (err) {
                    console.log(err)
                }
                return res.send(contest);
            });
    }
})

// //edit the current contest
router.put('/:id', function(req, res) {
    console.log('hitting this?')
    if (req.user.admin) {
        //find current contest
        contestSchema.findOne({
            live: true
        }, function(err, result) {
            if (err) {
                console.log(err);
            }
            if (!result) {
                console.log('No contest found.')
                return {};
            }
            console.log('found a contest! -->', result)
            console.log('req.body is..', req.body.endDate)
            var contest = _.extend(result, req.body);

            contest.save(
                function(err, contest) {
                    if (err) {
                        console.log(err)
                    }
                    return res.send(contest);
                });

        });
    }
})


module.exports = router;