var db = require('db');
var elasticsearch = require('elasticsearch');
var config = require('config');
var express = require('express');
var Promise = require('bluebird');
var app = express();
var kip = require('kip');
var geolib = require('geolib');
var searchterms = require('./searchterms');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var _ = require('lodash');
var pageSize = 20;
var defaultRadius = 2;

// logs elasticsearch stuff, flesh out later once we know what's useful
var ESLogger = function(config) {
    var defaultLogger = function() {};

    this.error = defaultLogger;
    this.warning = defaultLogger;
    this.info = defaultLogger;
    this.debug = defaultLogger;
    this.trace = defaultLogger;
    this.close = defaultLogger;
};
var es = new elasticsearch.Client({
    host: config.elasticsearch.url,
    log: ESLogger
});


// parse user if we're running this on it's own server
if (!module.parent) {
  //app.use(require('../IF_auth/new_auth.js'));
}
app.use(cookieParser());
app.use(bodyParser.json());

var searchItemsUrl = '/api/items/search';
app.post(searchItemsUrl, function(req, res, next) {

    // page is 0-indexed
    var page = parseInt(req.query.page) || 0;

    var responseBody = {
        links: {
            self: req.originalUrl,
            next: searchItemsUrl + '?page=' + (page + 1),
            prev: page == 0 ? null : searchItemsUrl + '?page=' + (page - 1),
            first: searchItemsUrl,
            last: null // there's no such thing as a last search result.  we have a long tail of non-relevant results
        },
        query: req.body,
        results: []
    };


    search(req.body, page)
        .then(function(res) {
            if (res.length < 20) {
                req.body.radius = 5;
                console.log('searching radius', req.body.radius);
                return search(req.body, page);
            } else {
                return res;
            }
        })
        .then(function(res) {
            if (res.length < 20) {
                req.body.radius = 50;
                console.log('searching radius', req.body.radius);
                return search(req.body, page);
            } else {
                return res;
            }
        })
        .then(function(res) {
            if (res.length < 20) {
                req.body.radius = 500;
                console.log('searching radius', req.body.radius);
                return search(req.body, page);
            } else {
                return res;
            }
        })
        .then(function(results) {
            // first un-mongoose the results
            results = results.map(function(r) {
              return r.toObject();
            })

            // Add the parents here.  fetch them from the db in one query
            // The goal is to make item.parents a list of landmarks ordered by
            // distance to the search location.  And make item.parent the
            // closest one.

            // only make one db call to fetch all the parents in this result set
            var allParents = results.reduce(function (all, r) {
              return all.concat(r.parents || []);
            }, [])

            db.Landmarks.find({
              _id: {$in: allParents}
            })
            .select('-meta -source_generic_item -source_justvisual')
            .exec(function(e, parents) {
              if (e) { return next(e); }

              results.map(function(r) {
                if (r.parents && r.parents.length > 0) {
                  var strparents = r.parents
                    .filter(function(_id) { return !!_id })
                    .map(function(_id) { return _id.toString()});
                  r.parents = parents.filter(function(p) {
                    return strparents.indexOf(p._id.toString()) >= 0;
                  }).sort(function(a, b) {
                    // sort by location
                    var a_dist = geolib.getDistance({
                      longitude: a.loc.coordinates[0],
                      latitude: a.loc.coordinates[1]
                    }, {
                      longitude: req.body.loc.lon,
                      latitude: req.body.loc.lat
                    });
                    var b_dist = geolib.getDistance({
                      longitude: b.loc.coordinates[0],
                      latitude: b.loc.coordinates[1]
                    }, {
                      longitude: req.body.loc.lon,
                      latitude: req.body.loc.lat
                    });
                    return a_dist - b_dist;
                  });
                  r.parent = r.parents[0];
                  delete r.parents;
                }
              })

              responseBody.results = results;
              res.send(responseBody);

              (new db.Analytics({
                anonId: req.anonId,
                userId: req.userId,
                action: 'search',
                data: {
                  query: req.body,
                  resultCount: results.length
                }
              })).save();
            })
        }, next)
});

function search(q, page) {
    //
    // Normalize query
    //

    // text should be a string
    if (q.text && (typeof q.text !== 'string')) {
        return Promise.reject({
            niceMessage: 'Could not complete search',
            devMessage: 'q.text must be a string, was ' + q.text
        });
    }

    // categories should be an array
    // these are the buttons they click
    if (q.categories && !(q.categories instanceof Array)) {
        return Promise.reject({
            niceMessage: 'Could not complete search',
            devMessage: 'q.categories must be an array, was ' + q.categories
        });
    }

    // color should be an array
    // these are converted to the appropriave hsl colors
    if (q.color && !(q.color instanceof Array)) {
        return Promise.reject({
            niceMessage: 'Could not complete search',
            devMessage: 'q.color must be an array, was ' + q.color
        });
    }

    // also add any colors from the text fields to the color array
    // TODO

    // priceRange should be a number 1-4
    if (q.priceRange && [1, 2, 3, 4].indexOf(q.priceRange) < 0) {
        return Promise.reject({
            niceMessage: 'Could not complete search',
            devMessage: 'q.priceRange must be a number 1-4, was ' + q.priceRange
        });
    }

    // radius needs to be number parseable
    if (q.radius && isNaN(parseFloat(q.radius))) {
        return Promise.reject({
            niceMessage: 'Could not complete search',
            devMessage: 'q.priceRange must be a number 1-4, was ' + q.priceRange
        });
    } else {
        q.radius = parseFloat(q.radius);
    }

    // loc should be {lon: Number, lat: Number}
    if (!q.loc) {
        return Promise.reject({
            niceMessage: 'Could not complete search',
            devMessage: 'q.loc is required'
        });
    } else if (!q.loc.lat || !q.loc.lon) {
        return Promise.reject({
            niceMessage: 'Could not complete search',
            devMessage: 'q.loc is required and needs "lat" and "lon" properties, was ' + q.loc
        });
    } else if (isNaN(parseFloat(q.loc.lat)) || isNaN(parseFloat(q.loc.lon))) {
        return Promise.reject({
            niceMessage: 'Could not complete search',
            devMessage: 'q.loc is required and needs "lat" and "lon" properties to be numbers, was ' + q.loc
        });
    } else {
        q.loc.lat = parseFloat(q.loc.lat);
        if (q.loc.lat > 90 || q.loc.lat < -90) {
            return Promise.reject({
                niceMessage: 'Could not complete search',
                devMessage: 'q.loc.lat must be valid latitude, was ' + q.loc.lat
            });
        }
        q.loc.lon = parseFloat(q.loc.lon);
        if (q.loc.lon > 180 && q.loc.lon <= 360) {
          q.loc.lon = q.loc.lon - 360;
        }
        if (q.loc.lon > 180 || q.loc.lon < -180) {
            return Promise.reject({
                niceMessage: 'Could not complete search',
                devMessage: 'q.loc.lon must be valid longitude, was ' + q.loc.lon
            });
        }
    }

    if (q.text) {
        return textSearch(q, page);
    } else {
        return filterSearch(q, page);
    }
}

/**
 * Search implementation for a query that has text
 * Need to use elasticsearch for this
 * @param q query (must contain at least "text" and "loc" properties)
 * @param page
 */
function textSearch(q, page) {

      console.log('text search', q);
      fuzzyQuery = elasticsearchQuery(q, page);
      kip.prettyPrint(fuzzyQuery)

      return es.search(fuzzyQuery)
          .then(function(results) {
              var ids = results.hits.hits.map(function(r) {
                  return r._id;
              });

              var users = db.Users.find({
                  $or: [{
                      'profileID': q.text
                  }, {
                      'local.email': q.text
                  }, {
                      'facebook.email': q.text
                  }, {
                      'name': q.text
                  }]
              }).select('-local.password -local.confirmedEmail -contact -bubbleRole -permissions').exec()

              var items = db.Landmarks.find({
                  _id: {
                      $in: ids
                  }
              })
              .select(db.Landmark.frontEndSelect)
              .exec();

              return Promise.settle([users, items]).then(function(arry) {
                  var u = arry[0];
                  var i = arry[1];

                  if (u.isFulfilled() && i.isFulfilled()) {
                      var results = u.value().concat(i.value().map(function(i) {
                          return db.Landmark.itemLocationHack(i, q.loc);
                      }));
                      return results
                  } else if (i.isFulfilled() && !u.isFulfilled()) {
                      return i.value().map(function(i) {
                          return db.Landmark.itemLocationHack(i, q.loc);
                      });
                  } else if (u.isFulfilled() && !i.isFulfilled()) {
                      return u.value()
                  }
              })

          }, kip.err);

  }

function elasticsearchQuery(q, page) {

  // elasticsearch impl
  // update fuzziness of query based on search term length
  var fuzziness = 0;
  if (q.text.length >= 4) {
      fuzziness = 1;
  } else if (q.text.length >= 6) {
      fuzziness = 2;
  }

  // here's some reading on filtered queries
  // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-filtered-query.html#_multiple_filters
  var filter = {
      bool: {
          must: [{
              geo_distance: {
                  distance: (q.radius || defaultRadius) + "mi",
                  "geolocation": {
                      lat: q.loc.lat,
                      lon: q.loc.lon
                  }
              }
          }]
      }
  };

  // if the price is specified, add a price filter
  if (q.priceRange) {
      filter.bool.must.push({
          term: {
              priceRange: q.priceRange
          }
      });
  }

  // put it all together in a filtered fuzzy query
  var fuzzyQuery = {
      size: pageSize,
      from: page * pageSize,
      index: "kip",
      type: "items",
      fields: [],
      body: {
          query: {
              filtered: {
                  query: searchterms.getElasticsearchQuery(q.text),
                  filter: filter
              }
          }
      }
  };

  return fuzzyQuery;

}

/**
 * Search implementation for a query that does not have text
 * Just use mongodb
 * @param q query (must contain at least loc" property)
 * @param page
 */
function filterSearch(q, page) {
    console.log('filter search', q);

    var radius = q.radius || defaultRadius; // miles
    radius = 1609.344 * radius; // meters

    var query = {
        world: false,
        loc: {
            $near: {
                $geometry: {
                    type: "MultiPoint",
                    coordinates: [q.loc.lon, q.loc.lat]
                },
                $maxDistance: radius,
                $minDistance: 0
            }
        }
    };

    if (q.priceRange) {
        query.price = q.priceRange;
    }

    if (q.categories && q.categories.length > 0) {
        query['itemTags.categories'] = {
            $in: q.categories
        };

    }

    if (q.color) {
        query['itemTags.color'] = {
            $in: q.color
        };
    }

    console.log(query);

    return db.Landmarks
        .find(query)
        .limit(pageSize)
        .exec()
        .then(function(items) {
            return items.map(function(item) {
                return db.Landmark.itemLocationHack(item, q.loc);
            });
        });
}



  /**
   * Trending Items
   * POST /api/items/trending
   * body: {
   *   lat: Number,
   *   lon: Number,
   *   category: String (optional)
   * }
   */
  var trendingItemsUrl = '/api/items/trending';
  app.post(trendingItemsUrl, function(req, res, next) {
      // page is 0-indexed
      var page = parseInt(req.query.page) || 0;

      // make some links which allow easy page traversal on the client
      var links = {
          self: req.originalUrl,
          next: trendingItemsUrl + '?page=' + (page + 1),
          prev: page == 0 ? null : trendingItemsUrl + '?page=' + (page - 1),
          first: trendingItemsUrl,
          last: null // there's no such thing as a last search result.  we have a long tail of non-relevant results
      };

      req.body.radius = 2;

      // TODO curate text categories based on user's preferences
      var textCategories = ['Fall', 'School'].map(function(str) {
          var q = _.cloneDeep(req.body);
          q.text = str;
          return search(q, 0)
              .then(function(res) {
                  var newRes = (eliminateDuplicates(res, q, pageSize) !== null) ? (eliminateDuplicates(res, q)) : res
                  return {
                      category: 'Trending in "' + str + '"',
                      results: res
                  }
              })
      });

      var neighborhoods = new Promise(function(resolve, reject) {
          var q = {
              loc: req.body.loc
          };
          var loc = {
              type: 'Point',
              coordinates: [parseFloat(req.body.loc.lat), parseFloat(req.body.loc.lon)]
          };
          var url = config.neighborhoodServer.url + '/findArea?lat=' + req.body.loc.lat + '&lon=' + req.body.loc.lon;
          return Promise.settle([search(q, 0), request(url)])
              .then(function(results) {

                  if (!results[0].isFulfilled()) {
                      console.log(results[0].reason());
                      return reject();
                  }

                  if (!results[1].isFulfilled()) {
                      console.log(results[1].reason());
                      return reject();
                  }

                  try {
                      var area = JSON.parse(results[1].value()[0].body)
                  } catch (e) {
                      return reject();
                  }

                  var items = results[0].value()
                  data = {
                      category: 'Trending in ' + area.area,
                      results: items
                  }
                  resolve(data)
              })
      })


      var nearYou = search(req.body, 0)
          .then(function(res) {
              if (res.length < 20) {
                  req.body.radius = 5;
                  console.log('searching radius', req.body.radius);
                  return search(req.body, 0);
              } else {
                  return res;
              }
          })
          .then(function(res) {
              if (res.length < 20) {
                  req.body.radius = 50;
                  console.log('searching radius', req.body.radius);
                  return search(req.body, 0);
              } else {
                  return res;
              }
          })
          .then(function(res) {
              if (res.length < 20) {
                  req.body.radius = 500;
                  console.log('searching radius', req.body.radius);
                  return search(req.body, 0);
              } else {
                  return res;
              }
          })
          .then(function(res) {
              return {
                  category: 'Trending around me',
                  results: res
              }
          });

      Promise.settle(_.flatten([textCategories, neighborhoods,nearYou]))
          .then(function(results) {
              // only show "nearYou" if "neighborhoods" failed
              if (results[1].isFulfilled() && results[1].results && results[1].results.length > 0) {
                  if (results[2].isFulfilled() && results[2].results) {
                      delete results[2].results;
                  }
              }
              res.send({
                  query: req.body,
                  links: links,
                  results: results.reduce(function(full, r) {
                      if (r._settledValue && r._settledValue.results && r._settledValue.results.length > 0 && r._settledValue.category.length < 50) {
                          full.push(r._settledValue)
                      }
                      return full;
                  }, [])
              });
              (new db.Analytics({
                anonId: req.anonId,
                userId: req.userId,
                action: 'trending',
                data: {
                  query: req.body,
                  resultCount: results.reduce(function(count, r) {
                    if (r && r._settledValue && r._settledValue.results) {
                      count = count + r._settledValue.results.length;
                    }
                    return count;
                  }, 0)
                }
              })).save();
          }, next);
  })

//****TEMPORARY FIX: This function will identify duplicate items in response, find the closest item (distance) within those duplicates
//and return one of that item for each duplicated item.
function eliminateDuplicates(res, q, pageSize) {
    // console.log('eliminating duplicates')
    function distance(lat1, lon1, lat2, lon2, unit) {
        var radlat1 = Math.PI * lat1 / 180
        var radlat2 = Math.PI * lat2 / 180
        var radlon1 = Math.PI * lon1 / 180
        var radlon2 = Math.PI * lon2 / 180
        var theta = lon1 - lon2
        var radtheta = Math.PI * theta / 180
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist)
        dist = dist * 180 / Math.PI
        dist = dist * 60 * 1.1515
        if (unit == "K") {
            dist = dist * 1.609344
        }
        if (unit == "N") {
            dist = dist * 0.8684
        }
        return dist
    }

    function compare(a, b) {
        if (a.distance < b.distance)
            return -1;
        if (a.distance > b.distance)
            return 1;
        return 0;
    }
    var previous_name;
    var duplicates = {};
    var unique = {};
    var dupeNames = [];
    for (var i in res) {
        if (typeof(unique[res[i].name]) !== "undefined") {
            dupeNames.push(res[i].name);
        }
        unique[res[i].name] = 0;
    }
    dupeNames = dupeNames.sort().filter(function(name, pos, dupeNames) {
        return !pos || name != dupeNames[pos - 1];
    })
    var modifiedRes = []
    var unmodifiedRes = []
    res.forEach(function(current) {
        // console.log('current: ', current.name)
        if (current.name !== undefined && current.name === previous_name) {
            var obj = {}
            current.distance = distance(q.loc.lat, q.loc.lon, current.loc.coordinates[1], current.loc.coordinates[0])
            obj.id = current.id
            obj.name = current.name;
            obj.distance = current.distance;
            modifiedRes.push(obj)
        } else if (current.name !== undefined) {
            unmodifiedRes.push(current)
        }
        previous_name = current.name;
    });

    modifiedRes = modifiedRes.sort(function(a, b) {
        return a.name.localeCompare(b.name)
    }).sort(function(a, b) {
        return parseFloat(a.distance) - parseFloat(b.distance);
    })

    var closestDupeItems = {}
    dupeNames.forEach(function(name) {
        modifiedRes.forEach(function(item) {
            if (item.name === name) {
                if (!closestDupeItems[name]) {
                    closestDupeItems[name] = item
                }
            }
        })
    })
    var resIds = res.map(function(obj) {
        return res.id
    }).join()
    var result = []
    var unique = {};
    var string = ''
    for (var i = 0; i < res.length; i++) {
        for (var key in closestDupeItems) {
            string = string.concat(key)
            var item = res[i]
            if (item.name && item.name.trim() === key.trim() && item.id.trim() == closestDupeItems[key].id.trim()) {
                result.push(item)
            }
        }
    }

    var trueUniqueIds = []
    unmodifiedRes.forEach(function(item) {
        if (string.indexOf(item.name) == -1) {
            trueUniqueIds.push(item)
        }
    })
    result = trueUniqueIds.concat(result)
    return result

}




if (!module.parent) {
  app.listen(9090, function(e) {
    if(e) {
      console.log(e);
      process.exit(1);
    }
    console.log("kip style search listening on 9090")
  })
} else {
  module.exports = app;
  module.exports.getQuery = elasticsearchQuery;
}
