//Note: If you are getting 'missing id' logs in console, run uo_store_scraper first.

var cheerio = require('cheerio');
var db = require('db');
var Promise = require('bluebird');
var async = require('async');
var uniquer = require('../../uniquer');
var request = require('request')
var item_scraper = require('./uo_scraper')
var fs = require('fs')
var catalogs = require('./catalogs.js')


//This will loop forever through each of the catalogs listed above
async.whilst(
    function() {
        return true
    },
    function(loop) {

        loadStores().then(function(stores) {

            async.eachSeries(catalogs, function(catalog, callback) {
                loadCatalog(catalog, stores).then(function(res) {
                    console.log('Done with catalog.')
                    wait(callback, 10000)
                }).catch(function(err) {
                    if (err) {
                        console.log('29: ', err)
                    }
                    console.log('Error with catalog: ', catalog.category)
                    wait(callback, 10000)
                })
            }, function(err) {
                if (err) {
                    console.log('36: ', err)
                } else {
                    console.log('Finished scraping all catalogs for Urban Outfitters.');
                }
            })
        }).catch(function(err) {
            if (err) {
                console.log('Error loading stores: ', err)
            }
        })


    },
    function(err) {
        if (err) console.log('Navigator loop error: ', err)
    })


function loadStores() {
    return new Promise(function(resolve, reject) {
        db.Landmarks.find({
            'source_generic_store': {
                $exists: true
            },
            'linkbackname': 'urbanoutfitters.com'
        }, function(e, stores) {
            if (e) {
                console.log(e)
                reject(e)
            }
            if (!stores) {
                reject('No stores in db.')
            }
            if (stores) {
                resolve(stores)
            }
        })
    })
}


function loadCatalog(category, stores) {
    return new Promise(function(resolve, reject) {
        var options = {
            url: category.url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
            }
        };
        console.log('Starting catalog: ', category.category)

        var nextPage = ''

        async.doWhilst(
            function(callback) {
                if (nextPage) {
                    options.url = nextPage;
                }
                console.log('Scraping: ', options.url)

                loadPage(options, nextPage, category, stores).then(function(startVal) {
                    if (!startVal) {
                        nextPage = ''
                    }
                    setTimeout(callback, 1000);
                }).catch(function(err) {
                    if (err) console.log(err);
                    setTimeout(callback, 1000);
                })

            },
            function() {
                return nextPage !== '';
            },
            function(err) {
                if (err) console.log('err')
                console.log('Finished Catalog.')
            }
        );

    })
}

function loadPage(options, nextPage, category, stores) {
    return new Promise(function(resolve, reject) {
        request(options, function(error, response, body) {
            if ((!error) && (response.statusCode == 200)) {
                $ = cheerio.load(body); //load HTML

                var startVal = ''
                try {
                    startVal = $('.pagination a')['0'].attribs.href.split('&startValue=')[1]
                } catch (err) {
                    if (err) console.log(err)
                    return reject('No pagination element.')
                }

                nextPage = category.url.split('#')[0].concat('&startValue=' + startVal);

                async.eachSeries($('p.product-image>a'), function(item, callback) {
                    if (!item.attribs.href) {
                        console.log('invalid!')
                        return callback()
                    }
                    var detailsUrl = item.attribs.href;
                    detailsUrl = 'http://www.urbanoutfitters.com/urban/catalog/' + detailsUrl.toString().trim()
                    item_scraper(detailsUrl, category.category, stores).then(function(result) {
                        // console.log('Done.**')
                        wait(callback, 3000)
                    }).catch(function(err) {
                        console.log('Item scraper error: ', err)
                        wait(callback, 3000)
                    })
                }, function(err) {
                    if (err) console.log('async error, nav 129: ', err)
                    console.log('Done scraping page.')
                    resolve(startVal)
                })


            } else {
                if (error) {
                    console.log('error: ', error)
                    reject(error)
                } else if (response.statusCode !== 200) {
                    console.log('response.statusCode: ', response.statusCode)
                    reject(response.statusCode)
                }
            }


        })
    })
}


function wait(callback, delay) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + delay);
    callback();
}