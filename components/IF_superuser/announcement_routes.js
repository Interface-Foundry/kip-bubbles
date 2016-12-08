'use strict';

var express = require('express'),
    router = express.Router(),
    announcementSchema = require('../IF_schemas/announcements_schema.js'),
    _ = require('underscore');

//load all announcements for that region as a a regular user
router.get('/:id', function(req, res) {
    //find all announcements for given region, then sort by priority
    announcementSchema.aggregate({
        $match: {
            region: req.params.id.toString().toLowerCase(),
            live: true
        }
    }, {
        $sort: {
            priority: 1
        }
    }, function(err, announcements) {
        if (err) {
            return handleError(res, err);
        }
        if (!announcements) {
            console.log('No announcements found.')
            return [];
        }

        return res.send(announcements);
    });
})

//load all announcements for that region as an admin
router.get('/su/:id', function(req, res) {
    if (req.user && req.user.admin) {
        //find all announcements for given region, then sort by priority
        announcementSchema.aggregate({
            $match: {
                region: req.params.id.toString().toLowerCase()
            }
        }, {
            $sort: {
                priority: 1
            }
        }, function(err, announcements) {
            if (err) {
                return handleError(res, err);
            }
            if (!announcements) {
                console.log('No announcements found.')
                return [];
            }
            return res.send(announcements);
        });

    } else {
        console.log('Not authorized.')
    }
})

//Create new announcement for that region and shift priorities for all others
router.post('/su', function(req, res) {
    if (req.user.admin) {
        //Increment priority for all other announcements other than one being created
        announcementSchema.update({}, {
                $inc: {
                    priority: 1
                }
            }, {
                multi: true
            }, function(err, result) {
                if (err) {
                    console.log(err)
                    return handleError(res, err);
                }
                console.log('documents incremented', result)
            })
            //Then create the new announcement with priority one
        var newannouncement = new announcementSchema();
        //Merge new announcement with whatever is sent from frontend
        var announcement = _.extend(newannouncement, req.body);
        //Save announcement
        announcement.save(
            function(err, announcement) {
                if (err) {
                    console.log(err)
                    return handleError(res, err);
                }
                console.log('saved!', announcement)
                    //Re-sort all announcements, then send to front-end
                announcementSchema.find().sort({
                    priority: 1
                }).exec(function(err, announcements) {
                    console.log('announcements is..', announcements)
                    if (err) {
                        console.log(err)
                    }
                    if (!announcements) {
                        console.log('No announcements found.')
                        return [];
                    }
                    return res.send(announcements)
                })
            });
    }
})

//When superuser changes priority of announcement
router.post('/su/:id/sort', function(req, res) {

    //-------If priority is moving up-----//
    if (req.body.dir === 'up' && req.body.priority !== 1) {
        //find the announcement immediately above the current announcement
        //and increment it's priority
        announcementSchema.update({
            priority: req.body.priority - 1
        }, {
            $inc: {
                priority: 1
            }
        }).exec(function() {
            //find the current announcement and decrement it's priority
            announcementSchema.update({
                _id: req.params.id
            }, {
                $inc: {
                    priority: -1
                }
            }).exec(function(err, result) {

                console.log('prioritiezed announcement is..', result)
                    //Re-sort all announcements, then send to front-end
                announcementSchema.find().sort({
                    priority: 1
                }).exec(function(err, announcements) {

                    if (err) {
                        console.log(err)
                    }
                    return res.send(announcements)
                })
            })
        })
    }

    //-------If priority is moving down-----//
    if (req.body.dir === 'down') {
        //find the announcement immediately below the current announcement
        //and decrement it's priority (aka move priority up)
        announcementSchema.update({
            priority: req.body.priority + 1
        }, {
            $inc: {
                priority: -1
            }
        }).exec(function() {
            //find the current announcement and increment it's priority
            announcementSchema.update({
                _id: req.params.id
            }, {
                $inc: {
                    priority: 1
                }
            }).exec(function(err, result) {

                console.log('prioritiezed announcement is..', result)
                    //Re-sort all announcements, then send to front-end
                announcementSchema.find().sort({
                    priority: 1
                }).exec(function(err, announcements) {

                    if (err) {
                        console.log(err)
                    }
                    return res.send(announcements)
                })
            })
        })
    }

})

//When superuser edits announcement content or toggles 'Live' button
router.put('/su/:id', function(req, res) {
    announcementSchema.findOne({
        _id: req.params.id
    }, function(err, result) {
        if (err) {
            return handleError(res, err);
        }
        if (!result) {
            return res.send(404);
        }
        //Merge existing announcement with updated object from frontend
        var announcement = _.extend(result, req.body);

        //Save announcement
        announcement.save(
            function(err, announcement) {
                if (err) {
                    console.log(err)
                }
                console.log('updated announcement is..', announcement)
                    //Re-sort all announcements, then send to front-end
                announcementSchema.find().sort({
                    priority: 1
                }).exec(function(err, announcements) {

                    if (err) {
                        console.log(err)
                    }
                    return res.send(announcement)
                })
            })
    })
})

//delete announcement for that region
router.delete('/su/:id', function(req, res) {
    if (req.user.admin) {
        announcementSchema.findById(req.params.id, function(err, announcement) {
            if (err) {
                return handleError(res, err);
            }
            if (!announcement) {
                return res.send(404);
            }
            var prior = announcement.priority;

            announcementSchema.update({
                    priority: {
                        $gt: prior
                    }
                }, {
                    $inc: {
                        priority: -1
                    }
                }, {
                    multi: true
                },
                function(err, numberAffected, rawResponse) {
                    if (err) {
                        console.log(err)
                    }
                    console.log('updated ', numberAffected, 'records')
                    console.log(rawResponse)
                    announcement.remove(function(err) {
                        if (err) {
                            return handleError(res, err);
                        }
                        console.log('deleted successfully!')
                            //Re-sort all announcements, then send to front-end
                        announcementSchema.find().sort({
                            priority: 1
                        }).exec(function(err, announcements) {
                            console.log('announcements is..', announcements)
                            if (err) {
                                console.log(err)
                            }
                            return res.send(announcements)
                        })
                    })
                })
        });
    } else {
        console.log('you are not authorized...stand down..')
    }
})

module.exports = router;