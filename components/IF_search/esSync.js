var db = require('db');
var elasticsearch = require('elasticsearch');
var config = require('config');
var kip = require('kip');
var searchterms = require('./searchterms');
console.log(JSON.stringify(config, null, 2));

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

var _ = require('lodash');

var types = [];

var esKipSchemaBase = {
    _id: {
        type: "string"
    },
    id: {
        type: "string"
    },
    name: {
        type: "string"
    },
    description: {
        type: "string"
    },
    location: {
        type: "string"
    },
    createdDate: {
        type: "date"
    },
    tags: {
        type: 'string',
        index: 'not_analyzed'
    },
    miscText: {
        type: "string"
    },
    popularity: {
        type: "double"
    },
    fullText: {
        type: "string"
    }
}

var esItemSchema = _.merge({}, esKipSchemaBase, {
    geolocation: {
        type: "geo_point",
        source: 'loc.coordinates'
    },
    price: {
        type: 'float'
    },
    priceRange: {
        type: 'integer'
    },
    parentName: {
        type: 'string',
        source: 'parent.name'
    },
    ownerName: {
        type: 'string',
        source: 'owner.name'
    },
    description: {
      type: 'string',
      source: function() {
        if (!this.description) {
          return '';
        }
        return searchterms.fashionTokenize(this.description)
      },
      index: 'not_analyzed'
    },
    name: {
      type: 'string',
      source: function () {
        // the name property will be both the mongo document name
        // and the name found by cloudsight if any
        return _.flatten([
          this.name,
          _.get(this, 'source_cloudsight.name') || ''
        ].filter(function(v) {
          return !!v;
        }).map(function(s) {
          return searchterms.fashionTokenize(s);
        }))
      },
      index: 'not_analyzed'
    },
    brand: {
        type: 'string',
        source: function() {
          var brand = _.get(this, 'linkbackname', '').split('.')[0];
          if (brand && brand !== 'shoptiques') {
            return brand;
          }
        }
    },
    categories: {
        type: 'string',
        index: 'not_analyzed',
        source: 'itemTags.categories'
    },
    tags: {
        type: 'string',
        source: function() {
            return _.uniq(searchterms.fashionTokenize(_.flattenDeep([
                _.get(this, 'itemTags.text'),
                // _.get(this, 'meta.humanTags.itemType'),
                // _.get(this, 'meta.humanTags.itemStyle'),
                // _.get(this, 'meta.humanTags.itemEvent'),
                // _.get(this, 'meta.humanTags.itemDetail'),
                // _.get(this, 'meta.humanTags.itemFabric'),
                //_.get(this, 'source_justvisual.keywords'),
                _.get(this, 'source_cloudsight.categories'),
                _.get(this, 'meta.classifierNameTags')
            ]).filter(function(a) {
                return typeof a !== 'undefined' && a !== '';
            }).join(' ')))
        },
        index: 'not_analyzed',
    },
    descriptionTags: {
        type: 'string',
        source: function() {
            return _.uniq(_.get(this, 'meta.classifierDescTags')).filter(function(a) {
              return typeof a !== 'undefined' && a !== '';
            }).join(' ')
        },
        index: 'not_analyzed'
    },
    // miscText: {
    //   source: function() {
    //     return _.flattenDeep([
    //       (_.get(this, 'source_justvisual.images') || []).map(function(i) {
    //         return [
    //           _.get(i, 'description'),
    //           _.get(i, 'title')
    //         ];
    //       })
    //     ]).filter(function(a) {
    //         return typeof a !== 'undefined' && a !== '';
    //     })
    //   }
    // },
    // override some defaults from kipSchemaBase
    location: {
        source: 'addressString'
    },
    createdDate: {
        source: 'time.created'
    }
})

types.push({
    type: 'item',
    source: 'Landmark',
    properties: esItemSchema
});


function createIndexes() {
    es.indices.delete({
        index: 'kip'
    }, function (e) {
        var body = { mappings: {
            items:
            {
                properties: schemaToMapping(esItemSchema)
            }
        }};
        kip.prettyPrint(body);
        es.indices.create({
            index: 'kip',
            body: body
        }, function(e) {
            if (kip.err(e)) return;
            console.log('created new mapping for items')
            db.Landmarks.update({world: false}, {'flags.mustUpdateElasticsearch': true}, {multi: true}, function() {
                console.log('marked all existing items for update');
                GO();
            })
        })
    })
}

function schemaToMapping(schema) {
    var s = _.cloneDeep(schema);
    return Object.keys(s).reduce(function(mapping, k) {
        var prop = s[k];
        if (prop.type === 'object' && typeof prop.properties !== 'undefined') {
            mapping[k] = schemaToMapping(prop.properties);
            return mapping;
        }
        delete prop.source;
        mapping[k] = prop;
        return mapping;
    }, {})
}

/**
 * Ingest a document
 */
function GO() {
    db.Landmarks
        .find({
            'world': false,
            'flags.mustUpdateElasticsearch': {$ne: false},
            'hidden': {$ne: true}
        })
        .populate('source_justvisual.images')
        .limit(50)
        .exec(function(e, landmarks) {
            if (e) {
                console.error(e);
                return;
            }
            if (landmarks.length === 0) {
                if (process.argv[2] === 'rebuild') { console.log('finished'); process.exit(0) }
                console.log('finished updating elasticsearch, will check again in 10 minutes (current time', new Date(), ')');
                setTimeout(GO, 1000*60*10)
                return;
            }

            var bulkBody = landmarks.reduce(function(body, l) {
                body.push({index: {_index: 'kip', _type: 'items', _id: l._id.toString()}})
                var doc = mongoToEs(esItemSchema, l);
                // console.log(JSON.stringify(doc, null, 2));
                // maybe do custom things here
                body.push(doc);
                return body;
            }, [])

            es.bulk({
                body: bulkBody
            }, function(err, res) {
                if (err) {
                    console.error(err);
                }
                console.log(landmarks[0]._id.toString())

                db.Landmarks.update({
                    _id: {$in: landmarks.map(function(l) { return l._id;})}
                }, {'flags.mustUpdateElasticsearch': false}, {multi: true}, function(e, r) {
                    if (e) { console.error(e) }

                    setImmediate(function() {
                        GO();
                    })
                })
            })

        })
}

function mongoToEs(schema, doc) {
    var hasFullText = false;
    var esDoc = Object.keys(schema).reduce(function(esDoc, k) {
        if (k === 'fullText') {
          hasFullText = true;
        }
        var prop = schema[k];
        if (prop.type === 'object' && typeof prop.properties !== 'undefined') {
            esDoc[k] = mongoToEs(prop.properties, doc);
            return esDoc;
        }
        if (typeof prop.source === 'undefined') {
            esDoc[k] = doc[k]
        } else if (typeof prop.source === 'string') {
            esDoc[k] = _.get(doc, prop.source)
        } else if (typeof prop.source === 'function') {
            esDoc[k] = prop.source.call(doc);
        } else {
            console.error('source of unknown type');
        }
        return esDoc;
    }, {});

    // build a custom full text field with our custom tokenizer
    // if (hasFullText) {
    //   var fullText = Object.keys(schema).reduce(function(fullText, k) {
    //     if (schema[k].type === 'string') {
    //       if (esDoc[k] instanceof Array) {
    //         fullText.push(searchterms.tokenize(_.flatten(esDoc[k]).join(' ')));
    //       } else if (typeof esDoc[k] === 'string') {
    //         fullText.push(searchterms.tokenize(esDoc[k]))
    //       }
    //     }
    //     return fullText; // array of token arrays
    //   }, []);
    //   esDoc.fullText = _.flatten(fullText).join(' ');
    // }
    return esDoc;
}

if (process.argv[2] === 'rebuild') {
    createIndexes();
} else {
    GO();
}

/*
also, here's what you'll want in your crontab if you use crontabs

* * * * * node /home/ubuntu/IF-root/components/IF_search/esSync 2>&1 >>/home/ubuntu/esSync.log
0 0 * * * rm /home/ubuntu/esSync.log

 */
