 // Garden state mall location: -74.078476,40.915989
 var http = require('http');
 var cheerio = require('cheerio');
 var db = require('db');
 var Promise = require('bluebird');
 var async = require('async');
 var uniquer = require('../../uniquer');
 var request = require('request');
 var _ = require('lodash');
 var tagParser = require('../tagParser');
 var fs = require('fs');
 var upload = require('../../upload');

 //Global var to hold category
 cat = '';
 //Global vars to hold default mongo objects
 owner = {}
 notfoundstore = {}

 module.exports = function(url, category, zipcode) {
     //Global variable declarations
     cat = category;
     oldStores = [];
     newStores = [];
     return new Promise(function(resolve, reject) {
         async.waterfall([
                 function(callback) {
                     loadMongoObjects().then(function(results) {
                         if (results[0].isFulfilled()) {
                             owner = results[0].value()
                         }
                         if (results[1].isFulfilled()) {
                             notfoundstore = results[1].value()
                         }
                         // console.log('Loaded mongo objects: ', owner.profileID, notfoundstore.id)
                         callback(null)
                     }).catch(function(err) {
                         if (err) {
                             var today = new Date().toString()
                                 // fs.appendFile('errors.log', '\n' + today + ' Category: ' + categoryName + category + err, function(err) {});
                         }
                         callback(null)
                     })
                 },
                 function(callback) {
                     getColorUrls(url).then(function(colorUrls) {
                         if (!colorUrls) {
                             colorUrls = []
                             colorUrls[0] = url
                         }
                         callback(null, colorUrls)
                     }).catch(function(err) {
                         console.log(err.lineNumber + err)
                         callback(err)
                     })
                 },
                 function(colorUrls, callback) {
                     async.eachSeries(colorUrls, function(url, finishedItem) {
                         async.waterfall([
                                     function(callback) {
                                         scrapeItem(url).then(function(item) {
                                             wait(function() {
                                                 callback(null, item, zipcode)
                                             }, 3000)
                                         }).catch(function(err) {
                                             callback(err)
                                         })
                                     },
                                     function(item, zipcode, callback) {
                                         getInventory(item, zipcode).then(function(inventory) {
                                             callback(null, item, inventory)
                                         }).catch(function(err) {
                                             if (err) {
                                                 console.log(err)
                                                 return reject(err)
                                             } else {
                                                 callback(err)
                                             }
                                         })
                                     },
                                     function(item, inventory, callback) {
                                         saveStores(item, inventory).then(function(stores) {
                                             callback(null, item, stores)
                                         }).catch(function(err) {
                                             callback(err)
                                         })
                                     },
                                     function(item, stores, callback) {
                                         if (item.styleId == undefined || item.styleId == null || !item.styleId) {
                                             return callback('StyleId missing from Nordstrom API query.')
                                         }
                                         if (item.name == undefined || item.name == null || !item.name) {
                                             item.name = 'item'
                                         }
                                         upload.uploadPictures('nordstrom_' + item.styleId.trim() + item.name.replace(/\s/g, '_'), item.images).then(function(images) {
                                             item.hostedImages = images
                                             callback(null, item, stores)
                                         }).catch(function(err) {
                                             if (err) console.log('Image upload error: ', err);
                                             callback(err)
                                         })
                                     },
                                     function(item, stores, callback) {
                                         saveItem(item, stores).then(function(item) {
                                             callback(null, item, stores)
                                         }).catch(function(err) {
                                             callback(err)
                                         })
                                     },
                                     function(item, stores, callback) {
                                         getLatLong(zipcode).then(function(coords) {
                                             callback(null, item, coords)
                                         }).catch(function(err) {
                                             callback(err)
                                         })
                                     },
                                     function(item, coords, callback) {
                                         updateInventory(item, coords).then(function() {
                                             callback(null)
                                         }).catch(function(err) {
                                             callback(err)
                                         })
                                     }
                                 ],
                                 function(err) {
                                     if (err) {
                                         var today = new Date().toString()
                                         fs.appendFile('errors.log', '\n' + today + 'Category: ' + cat + '\n' + err, function(err) {});
                                     }
                                     finishedItem()
                                 }) //end of async waterfall processing item
                     }, function(err) {
                         if (err) {
                             var today = new Date().toString()
                             fs.appendFile('errors.log', '\n' + today + 'Category: ' + cat + '\n' + err, function(err) {});
                         }
                         callback(null)
                     })
                 }
             ],
             function(err) {
                 if (err) {
                     var today = new Date().toString()
                     fs.appendFile('errors.log', '\n' + today + 'Category: ' + cat + '\n' + err, function(err) {});
                     return reject(err)
                 }
                 resolve()
             })
     })
 }

 function loadMongoObjects() {

     var user = db.Users.findOne({
         'profileID': 'nordstrom4201'
     }).exec();

     var store = db.Landmarks.findOne({
         'id': 'notfound_9999'
     }).exec();

     return Promise.settle([user, store]).then(function(arry) {
         var u = arry[0];
         var s = arry[1];
         if (u.isFulfilled()) {
             owner.profileID = u.profileID
             owner.name = u.name;
             owner.mongoId = u._id
         }

         if (s.isFulfilled()) {
             notfoundstore = s
         }

         return arry;
     })

 }

 function getColorUrls(url) {
     return new Promise(function(resolve, reject) {
         var colorUrls = [];
         var colors = [];
         var results = [];
         var searchString = url.split('/s/')[1].split('/')[0];
         var searchUrl = 'http://shop.nordstrom.com/sr?origin=keywordsearch&contextualcategoryid=0&keyword=' + searchString
         var baseUrl = 'http://shop.nordstrom.com'
         var options = {
             url: searchUrl,
             headers: {
                 'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
             }
         };

         request(options, function(error, response, body) {
             if ((!error) && (response.statusCode == 200)) {
                 $ = cheerio.load(body); //load HTML
                 var obj = $('div.search-results-right-container a');
                 var clr = $('li.selected a')
                     //Gather all available selected colors
                 for (var i in clr) {
                     if (clr[i].attribs && clr[i].attribs.title) {
                         colors.push(clr[i].attribs.title)
                     }
                 }
                 for (var key in obj) {
                     if (obj[key].attribs && obj[key].attribs.href && obj[key].attribs.href.indexOf('/s/') > -1 && obj[key].attribs.href.indexOf('#reviewTabs') == -1) {
                         var newUrl = baseUrl + obj[key].attribs.href
                         colorUrls.push(newUrl)
                     }
                 }
                 console.log('Found ' + colorUrls.length + ' colors for item: ', url)
                 for (var i = 0; i < colors.length; i++) {
                     var object = {
                         color: colors[i],
                         url: colorUrls[i]
                     }
                     results.push(object)
                 }
                 if (colorUrls.length > 0) {
                     resolve(colorUrls)
                 } else {
                     resolve()
                 }
             } else {
                 if (error) {
                     console.log('error: ', error)
                 } else if (response.statusCode !== 200) {
                     console.log('response.statusCode: ', response.statusCode);
                 }
                 reject()
             }
         })
     })
 }

 function scrapeItem(url) {
     return new Promise(function(resolve, reject) {
         //construct newItem object
         var newItem = {
             src: url,
             images: [],
             tags: []
         };

         var options = {
             url: url,
             headers: {
                 'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
             }
         };

         request(options, function(error, response, body) {
             if ((!error) && (response.statusCode == 200)) {
                 $ = cheerio.load(body); //load HTML

                 // console.log('DESCRIPTION: ', $('ul.style-features>li')[0].children[0].data)

                 //Description
                 if ($('ul.style-features>li') && $('ul.style-features>li').length > 0) {
                     var tempString = '';
                     for (var key in $('ul.style-features>li')) {
                         if ($('ul.style-features>li').hasOwnProperty(key)) {
                             if ($('ul.style-features>li')[key].children && $('ul.style-features>li')[key].children[0]) {
                                 tempString = tempString.concat(' ' + $('ul.style-features>li')[key].children[0].data)
                             }

                         }
                     }
                     tempArray = tempString.split(' ')
                     newItem.tags = tagParser.parse(tempArray);
                     // console.log('DESCRIPTION! ',newItem.tags )
                 }

                 //iterate on images found in HTML
                 $('img').each(function(i, elem) {
                     if (elem.attribs) {
                         if (elem.attribs.src) { //sort the two types of images to collect
                             if (elem.attribs.src.indexOf("/product/Mini") > -1) { //finding all images that have Mini (all images to scrape)         
                                 var s = elem.attribs.src.replace("Mini", "Large"); //get the bigger one
                                 newItem.images.push(s);
                             }
                         }
                     }
                 });

                 //Construct item name from Brand Name + Product Name 
                 var brandName = '';
                 //get brand name
                 $("section[class='brand-title']").map(function(i, section) {
                     for (var i = 0; i < section.children.length; i++) {
                         if (section.children[i].name == 'h2') {
                             brandName = section.children[i].children[0].children[0].data;
                         }
                     }
                 });
                 //get product name
                 $("section[class='product-title']").map(function(i, section) {
                     for (var i = 0; i < section.children.length; i++) {
                         if (section.children[i].name == 'h1') {
                             newItem.name = brandName + ' ' + section.children[i].children[0].data; //add brand name + product name together            
                         }
                     }
                 });

                 //get item price
                 if ($('div.price-display-item') && $('div.price-display-item')['0'] && $('div.price-display-item')['0'].children && $('div.price-display-item')['0'].children['0'].data && $('div.price-display-item')['0'].children['0'].data.indexOf('$') > -1) {
                     newItem.price = $('div.price-display-item')['0'].children['0'].data.replace(/[^\d.-]/g, '')
                     console.log('Regular Price: ', newItem.price)
                 } else if ($('div.price-current') && $('div.price-current')['0'] && $('div.price-current')['0'].children && $('div.price-current')['0'].children['0'].data && $('div.price-current')['0'].children['0'].data.indexOf('$') > -1) {
                     newItem.price = $('div.price-current')['0'].children['0'].data.replace(/[^\d.-]/g, '')
                     console.log('Sales Price: ', newItem.price)
                 } else if ($('section.product-title>h1') && $('section.product-title>h1')['0'] && $('section.product-title>h1')['0'].children && $('section.product-title>h1')['0'].children['0'].data && $('section.product-title>h1')['0'].children['0'].data.indexOf('$') > -1) {
                     newItem.price = $('section.product-title>h1')['0'].children['0'].data.replace(/[^\d.-]/g, '')
                     console.log('Regular Retail Price: ', newItem.price)
                 } else {
                     console.log('NO PRICE FOUND ')
                     return reject('NO PRICE FOUND ')
                 }
                 // $('td').each(function(i, elem) {
                 //     if (elem.attribs.class.indexOf('item-price') > -1) {
                 //         newItem.price = elem.children[1].children[0].data.replace(/[^\d.-]/g, ''); //remove dollar sign symbol
                 //     }
                 // });

                 newItem.styleId = newItem.src.substring(newItem.src.lastIndexOf("/") + 1).split('?')[0];

                 if (newItem.styleId) {
                     resolve(newItem);
                 } else {
                     console.log('missing params', newItem);
                     reject('missing params');
                 }
             } else {
                 if (error) {
                     console.log('error: ', error)
                 } else if (response.statusCode !== 200) {
                     console.log('response.statusCode: ', response.statusCode);
                     reject(response.statusCode)
                 }
             }
         })
     })
 }

 function getInventory(newItem, zipcode) {
     return new Promise(function(resolve, reject) {
         var radius = '100'; //max is 100 miles
         console.log('Item: ', newItem.name, '. Zipcode: ', zipcode)
             // 3073633
         var url = 'http://shop.nordstrom.com/es/GetStoreAvailability?styleid=' + newItem.styleId + '&type=Style&instoreavailability=true&radius=' + radius + '&postalcode=' + zipcode + '&format=json';
         var options = {
             url: url,
             headers: {
                 'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
             }
         };

         console.log('Nordstrom URL: ', url)
         request(options, function(error, response, body) {
             if ((!error) && (response.statusCode == 200)) {
                 body = JSON.parse(body);
                 body = JSON.parse(body); //o.m.g. request, just do the double parse and don't ask 
                 resolve(body)
             } else {
                 if (error) {
                     console.log('getinventory error ')
                     reject(error)
                 } else {
                     console.log('Bad Response: ', response.statusCode, body)
                     wait(function() {
                         reject(response.statusCode)
                     }, 10000)

                 }
             }
         })
     })
 }

 function saveStores(item, inventory) {
     return new Promise(function(resolve, reject) {
         var Stores = [];
         //bool to increment notFoundCount
         var notFound = true;
         async.eachSeries(inventory["PersonalizedLocationInfo"].Stores, function iterator(item, callback) {
             // var url = 'http://test.api.nordstrom.com/v1/storeservice/storenumber/' + item.StoreNumber + '?format=json&apikey=pyaz9x8yd64yb2cfbwc5qd6n';
             var url = 'http://shop.nordstrom.com/st/' + item.StoreNumber + '/directions';
             var options = {
                 url: url,
                 headers: {
                     'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13'
                 }
             };

             request(options, function(error, response, body) {

                 try {
                     $ = cheerio.load(body); //load HTML
                 } catch (err) {
                     console.log('Cheerio Error: ', err)
                     reject(err)
                 }
                 var storeObj = {
                     storeId: item.StoreNumber
                 };

                 //iterate on images found in HTML
                 $('div').each(function(i, elem) {
                     if (elem.attribs && elem.attribs.class) {

                         if (elem.attribs.class == 'leftColumn') {
                             storeObj.name = elem.children[0].children[0].data.replace(/[\n\t\r]/g, "");
                         }

                         if (elem.attribs.class == 'storeAddress') {
                             for (var i in elem.children) {
                                 if (elem.children[i].data) {
                                     var cleanData = elem.children[i].data.replace(/\./g, "").replace(/[\n\t\r]/g, "");
                                     if (/^[(]{0,1}[0-9]{3}[)]{0,1}[-\s\.]{0,1}[0-9]{3}[-\s\.]{0,1}[0-9]{4}$/.test(cleanData)) {
                                         storeObj.PhoneNumber = cleanData;
                                     } else if (!storeObj.StreetAddress) {
                                         storeObj.StreetAddress = elem.children[i].data;
                                     } else {
                                         storeObj.StreetAddress = storeObj.StreetAddress + ' ' + elem.children[i].data;
                                         storeObj.StreetAddress = storeObj.StreetAddress.replace(/[\n\t\r]/g, "");
                                     }

                                 }
                             }
                         }

                         if (elem.attribs.class == 'date') {
                             for (var i in elem.children) {
                                 if (elem.children[i].data) {
                                     if (!storeObj.Hours) {
                                         storeObj.Hours = elem.children[i].data;
                                     } else {
                                         storeObj.Hours = storeObj.Hours + ' ' + elem.children[i].data;
                                         storeObj.Hours = storeObj.Hours.replace(/[\n\t\r]/g, "");
                                     }

                                 }
                             }
                         }

                         if (elem.attribs.class == 'errorMessage hidden') { //get lat lng inside here
                             storeObj.Lat = elem.next.attribs['lat-value'];
                             storeObj.Lng = elem.next.attribs['lon-value'];
                         }
                     }
                 });

                 if (!storeObj.name) {
                     storeObj.name = 'nordstrom'
                 }

                 //Construct our own unique storeId 
                 uniquer.uniqueId(storeObj.name, 'Landmark').then(function(output) {

                         // console.log('STORE: ',storeObj.name, storeObj.storeId)

                         //Check if store exists in db
                         db.Landmarks.findOne({
                                 'source_generic_store.storeId': storeObj.storeId
                             }, function(err, store) {
                                 if (err) {
                                     console.log(err)
                                     setTimeout(function() {
                                         return callback()
                                     }, 100);
                                 }
                                 //If store does not exist in db yet, create it.
                                 if (!store) {
                                     // console.log('CREATING NEW STORE')
                                     var newStore = new db.Landmarks();
                                     newStore.source_generic_store = storeObj;
                                     newStore.linkbackname = 'nordstrom.com'
                                     newStore.addressString = storeObj.StreetAddress;
                                     newStore.id = output;
                                     newStore.tel = storeObj.PhoneNumber;
                                     newStore.world = true;
                                     newStore.name = storeObj.name;
                                     newStore.hasloc = true;
                                     newStore.loc.type = 'Point'
                                     newStore.loc.coordinates = [parseFloat(storeObj.Lng), parseFloat(storeObj.Lat)]
                                     delete newStore.source_generic_store.Lng;
                                     delete newStore.source_generic_store.Lat
                                     newStore.save(function(e, s) {
                                         if (e) {
                                             console.log(e)
                                         } else {
                                             console.log('Saved store.', s.id)
                                             notFound = false;
                                             Stores.push(s)
                                         }
                                         setTimeout(function() {
                                             return callback()
                                         }, 800);
                                     })
                                 }

                                 //If store already exists in db
                                 else if (store) {
                                     // console.log('STORE EXISTS: ', store._id,store.name, store.source_generic_store,store.addressString)
                                     console.log('.')
                                     Stores.push(store)
                                     setTimeout(function() {
                                         return callback()
                                     }, 100);
                                 }
                             }) //end of findOne
                     }) //end of uniquer
             }); //end of request

         }, function(err, res) {
             if (err) console.log(err)
             if (notFound) {
                 notFoundCount++
             }
             resolve(Stores)
         })
     })
 }

 function saveItem(newItem, Stores) {
     return new Promise(function(resolve, reject) {
         var storeIds = Stores.map(function(store) {
             return store._id
         })
         newStores = storeIds.map(function(id) {
             return id.toString();
         });
         var storeLocs = [];
         Stores.forEach(function(store) {
                 storeLocs.push(store.loc.coordinates)
             })
             //Check if item already exists
         db.Landmarks.findOne({
             'source_generic_item.styleId': newItem.styleId,
             'source_generic_item.name': newItem.name
         }, function(err, i) {
             if (err) console.log(err)
                 //Create new item in db if it does not already exist OR if it was created without description tags
             if (!i || (i && i.source_generic_item && !i.source_generic_item.tags)) {
                 //If item was previously scraped without the description tags, delete it
                 if (i && i.source_generic_item && !i.source_generic_item.tags) {
                     db.Landmarks.remove({
                         'id': i.id
                     })
                 }
                 var item = new db.Landmarks();
                 item.source_generic_item = newItem;
                 item.source_generic_item.inventory = storeIds;
                 item.parents = storeIds;
                 item.price = parseFloat(newItem.price);
                 if (isNaN(item.price)) {
                     console.log('Price for item was NaN: ', item)
                     return reject('Price was not a number..')
                 }
                 item.owner = owner;
                 item.name = item.source_generic_item.name.replace(/[^\w\s]/gi, '');
                 item.linkback = item.source_generic_item.src;
                 item.linkbackname = 'nordstrom.com';
                 item.itemImageURL = newItem.hostedImages;
                 item.itemTags.text.push('nordstrom');
                 item.itemTags.text.push(cat);
                 var tags = newItem.name.split(' ').map(function(word) {
                     return word.toString().toLowerCase()
                 })
                 tags = tags.concat(newItem.tags)
                 tags.forEach(function(tag) {
                     item.itemTags.text.push(tag)
                 })
                 item.itemTags.text = tagParser.parse(item.itemTags.text)
                 item.name = newItem.name;
                 item.world = false;
                 item.loc.coordinates = storeLocs
                 uniquer.uniqueId('nordstrom ' + newItem.name, 'Landmark').then(function(output) {
                     item.id = output;
                     //Save item
                     item.save(function(e, i) {
                         if (e) {
                             console.error(e);
                         }
                         console.log('Saved item!', item.itemTags.text)
                         return resolve(item)
                     })
                 })
             }

             //If item exists in db, add new inventory values to the item (removed stocks will be updated in a later function)
             else if (i) {
                 console.log('Item exists: ', i.id)
                 if (i.parents) {
                     oldStores = i.parents.map(function(id) {
                         return id.toString()
                     })
                 }
                 db.Landmarks.findOne({
                     '_id': i._id
                 }).update({
                     $addToSet: {
                         'source_generic_item.inventory': {
                             $each: storeIds
                         },
                         'loc.coordinates': {
                             $each: storeLocs
                         },
                         'parents': {
                             $each: storeIds
                         }
                     },
                     $set: {
                         'updated_time': new Date()
                     }
                 }, function(e, result) {
                     if (e) {
                         console.log(e)
                     }


                     console.log('Updated inventory.', i)
                     return resolve(i)
                 })
             }
         })

     })
 }

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

 function getLatLong(zipcode) {
     return new Promise(function(resolve, reject) {
         db.Zipcodes.findOne({
             zipcode: zipcode
         }, function(err, result) {
             if (err) console.log(err)
             if (result && result.loc.coordinates) {
                 resolve(result.loc.coordinates)
             } else {
                 console.log('Querying mapbox.')
                 var string = 'http://api.tiles.mapbox.com/v4/geocode/mapbox.places-v1/';
                 string = string + '+' + zipcode;
                 string = string + '.json?access_token=pk.eyJ1IjoiaW50ZXJmYWNlZm91bmRyeSIsImEiOiItT0hjYWhFIn0.2X-suVcqtq06xxGSwygCxw';
                 request({
                         uri: string
                     },
                     function(error, response, body) {
                         if (!error && response.statusCode == 200) {
                             var parseTest = JSON.parse(body);
                             if (parseTest.features[0] && parseTest.features[0].center.length > 1) {
                                 if (parseTest.features.length >= 1) {
                                     var results = JSON.parse(body).features[0].center;
                                     results[0].toString();
                                     results[1].toString();
                                     var newCoords = new db.Zipcode();
                                     newCoords.loc.coordinates = results;
                                     newCoords.zipcode = zipcode;
                                     newCoords.save(function(err, saved) {
                                         if (err) console.log(err)
                                         console.log('Zipcode saved.')
                                     })
                                     resolve(results)
                                 }
                             } else {
                                 console.log('Error: ', zipcode)
                                 reject()
                             }
                         } else {
                             console.log('Error: ', error)
                             reject(error)
                         }
                     });
             }
         })
     })
 }

 function updateInventory(item, coords) {
     return new Promise(function(resolve, reject) {
         var d = _.difference(oldStores, newStores);
         if (d.length < 1) {
             return resolve('No stores to remove.')
         }
         var storesToRemove = [];
         //For each difference store, calculate if it is within 100 miles of inventory query range (the relevant sphere)
         db.Landmarks.find({
             '_id': {
                 $in: d
             }
         }, function(err, stores) {
             if (err) {
                 console.log(err)
                 return callback()
             }
             if (!stores) {
                 console.log('Store not found!')
                 return callback()
             } else if (stores) {
                 stores.forEach(function(store) {
                     if (distance(store.loc.coordinates[1], store.loc.coordinates[0], parseFloat(coords[1]), parseFloat(coords[0]), 'K') < 163) {
                         storesToRemove.push(store)
                     }
                 })

                 console.log('Found ', storesToRemove.length, ' inventory records to remove.')
                 if (storesToRemove.length > 0) {
                     var ids = storesToRemove.map(function(store) {
                         return store._id
                     })
                     var locs = []
                     storesToRemove.forEach(function(store) {
                         locs.push(store.loc.coordinates)
                     })

                     db.Landmarks.update({
                         'source_generic_item.styleId': item.source_generic_item.styleId,
                         'source_generic_item.name': item.source_generic_item.name
                     }, {
                         $pullAll: {
                             'parents': storesToRemove,
                             'source_generic_item.inventory': storesToRemove,
                             'loc.coordinates': locs
                         }
                     }, function(err, res) {
                         if (err) {
                             console.log(err)
                             return resolve()
                         }
                         if (res) {
                             console.log('Updated inventory.', res)
                             resolve()
                         }
                     })

                 } // end of if
                 else {
                     // console.log('Inventory is up-to-date.')
                     resolve()
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