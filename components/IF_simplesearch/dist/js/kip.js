var simpleSearchApp=angular.module("simpleSearchApp",["ngHolder","angularMoment","ngRoute","angular-inview","smoothScroll"]).filter("httpsURL",[function(){return function(t){if(t.indexOf("https")>-1);else{var e=/http/gi;t=t.replace(e,"https")}return t}}]).factory("ResCache",["$cacheFactory",function(t){return t("resCache",{capacity:3})}]).factory("location",["$location","$route","$rootScope",function(t,e,n){return t.skipReload=function(){var r=e.current,o=n.$on("$locationChangeSuccess",function(){e.current=r,o()});return t},t}]);
simpleSearchApp.controller("HomeCtrl",["$scope","$http","$location","$document","$timeout","$interval","amMoment","$window","$routeParams","location","$rootScope","$route","ResCache","storeFactory","$anchorScroll",function(e,t,o,n,a,i,s,r,d,l,c,u,m,p,g){function h(){$(".row"+e.expandedIndex).removeClass("expand"),$(".row"+e.expandedIndex).addClass("contract"),a(function(){e.isExpanded=!1,e.expandedIndex=null},250),e.hideItem[e.expandedIndex+1]=!1,e.hideItem[e.expandedIndex+2]=!1,e.hideItem[e.expandedIndex+3]=!1,e.hideItem[e.expandedIndex+4]=!1,e.hideItem[e.expandedIndex+5]=!1}function f(o){console.log(o),x=o.coords.latitude,w=o.coords.longitude,t.get("https://maps.googleapis.com/maps/api/geocode/json?latlng="+x+","+w+"&sensor=true").then(function(t){for(var o=0;o<t.data.results.length;o++)if("APPROXIMATE"==t.data.results[o].geometry.location_type){t.data.results[o].formatted_address=t.data.results[o].formatted_address.replace(", USA",""),e.userCity=t.data.results[o].formatted_address,v=e.userCity,e.loadingLoc=!1;break}},function(e){})}function I(e,t,o,n){var a=Array.prototype.map.call(arguments,function(e){return e/180*Math.PI}),o=a[0],n=a[1],e=a[2],t=a[3],i=6372.8,s=e-o,r=t-n,d=Math.sin(s/2)*Math.sin(s/2)+Math.sin(r/2)*Math.sin(r/2)*Math.cos(o)*Math.cos(e),l=2*Math.asin(Math.sqrt(d));return i*l}function y(e,t){return"undefined"==typeof t||0===+t?Math.round(e):(e=+e,t=+t,isNaN(e)||"number"!=typeof t||t%1!==0?NaN:(e=e.toString().split("e"),e=Math.round(+(e[0]+"e"+(e[1]?+e[1]+t:t))),e=e.toString().split("e"),+(e[0]+"e"+(e[1]?+e[1]-t:-t))))}console.log("Want to API with us? Get in touch: hello@interfacefoundry.com");var x,w,v,C,b=!1,M=null,S=null;e.showGPS=!0,e.searchIndex=0,e.items=[],e.newQuery=null,e.hideItem={},e.expandedIndex=null,e.isExpanded=!1,e.outerWidth=$(window)[0].outerWidth,e.outerHeight=$(window)[0].outerHeight,e.mobileModalHeight,e.mobileFooterPos,e.mobileScreen=window.innerWidth<=750,e.mobileScreenIndex,e.showReportModal=null,e.report={},e.mobileImgIndex=0,e.mobileImgCnt=0,e.parent=p.store,e.infBool=!1,e.searchSlider={min:5,ceil:50,floor:.1},e.infBool=!1,e.hideExpandedOnClick=function(){e.isExpanded&&h()},e.hideExpandedOnEsc=function(e){27===e.keyCode&&h()},c.$on("$locationChangeState",function(e){e.preventDefault()}),e.returnHome=function(e){"home"===e?(o.path("/"),a(function(){c.searchTitle=null,u.reload()},0),u.reload()):e._id&&(o.path("/t/"+e.parent._id+"/"+e._id),p.setStore(e.parent),console.log("storeFactory: ",p,"loc: ",e),a(function(){u.reload()},0))},e.emptyQuery=function(){e.query=""},e.sayBye=function(t,o,n,a){o||e.expandedIndex===t?o&&"bottom"===a?(e.hideItem[t]=!1,e.hideItem[t+1]=!1,e.hideItem[t+2]=!1,e.hideItem[t+3]=!1,e.hideItem[t+4]=!1,e.hideItem[t+5]=!1):o&&"top"===a?(e.hideItem[t]=!1,e.hideItem[t-1]=!1,e.hideItem[t-2]=!1,e.hideItem[t-3]=!1,e.hideItem[t-4]=!1,e.hideItem[t-5]=!1):e.hideItem[t]=!1:e.hideItem[t]=!0},e.sayHello=function(){b||(e.infBool=!0,e.searchQuery())},e.closeMobileWrapper=function(t){if(e.mobileScreen){var o=$(".expandMobileWrapper.mWrapper"+t);o.css({width:""+e.outerWidth+"px",height:"0"}),e.mobileScreenIndex=null}},e.chooseImage=function(t){e.mobileImgIndex=t},e.singleItemMobile=function(e,t,o){},e.expandContent=function(t,o,n){a(function(){e.isExpanded=!0},250),e.mobileScreen=window.innerWidth<=750,e.mobileScreen?(e.outerHeight=$(window)[0].outerHeight,"close"===o?(e.mobileScreenIndex=null,$("body").removeClass("modalOpen"),$("html").removeClass("modalOpen"),$("div.container-fluid").removeClass("modalOpen"),$(window).off(),$(window).off(),e.mobileImgIndex=0,e.mobileModalHeight=0):(e.mobileScreenIndex=t,$("body").addClass("modalOpen"),$("html").addClass("modalOpen"),$("div.container-fluid").addClass("modalOpen"),$(window).on("touchstart",function(e){M=e.originalEvent.targetTouches[0].clientX,S=e.originalEvent.targetTouches[0].clientY}))):(o.stopPropagation(),e.expandedIndex===t?h():null!==e.expandedIndex?($(".row"+e.expandedIndex).removeClass("expand"),$(".row"+t).removeClass("contract"),$(".row"+t).addClass("expand"),e.expandedIndex=t):($(".row"+t).removeClass("contract"),$(".row"+t).addClass("expand"),e.expandedIndex=t))},$(window).on("click",function(t){"collapsedContent"===t.target.className&&($(".row"+e.expandedIndex).removeClass("expand"),e.expandedIndex=null)}),e.enlargeImage=function(t,o){e.mobileScreen?$(".mobileImg"+t).css({"background-image":"url("+o+")"}):($(".imageBot"+t).css({"background-image":"url("+o+")"}),$("#expandTop").addClass("is-disappearing"),a(function(){$(".imageTop"+t).css({"background-image":"url("+o+")"}),$("#expandTop").removeClass("is-disappearing")},400))},$("#locInput").geocomplete({details:"form",types:["geocode"]}).bind("geocode:result",function(t,o){e.userCity=o.formatted_address}),e.getGPSLocation=function(){e.loadingLoc=!0,navigator.geolocation?navigator.geolocation.getCurrentPosition(f):console.log("no geolocation support")},document.onclick=function(t){e.itemHighlight="form-grey",e.locationHighlight="form-grey"},e.scrollTop=function(){o.hash("topQueryBar"),g()},e.randomSearch=function(t){var o=["70s","vintage","fur","orange","health goth"];e.query=o[Math.floor(Math.random()*o.length)],e.searchQuery()},e.searchThis=function(t){e.query=t,e.searchQuery()},e.searchQuery=function(o){if("button"===o&&(e.items=[],e.searchIndex=0,$("input").blur()),e.userCity.indexOf("/")>-1){var n=/[^\w\s]/gi;e.userCity=e.userCity.replace(n,"")}if(e.query||(e.query="winter"),e.query&&e.query.indexOf("/")>-1){var n=/[^\w\s]/gi;e.query=e.query.replace(n,"")}if(b=!0,e.userCity!==v){v=e.userCity;var a=encodeURI(v);t.get("https://maps.googleapis.com/maps/api/geocode/json?address="+a+"&key=AIzaSyCABdI8Lpm5XLQZh-O4SpmShqMEKqKteUg").then(function(t){t.data.results[0]&&t.data.results[0].geometry&&(x=t.data.results[0].geometry.location.lat,w=t.data.results[0].geometry.location.lng),e.searchItems()},function(e){})}else e.searchItems()},e.searchItems=function(){var i=null,s=null,i=encodeURI(e.query);c.searchTitle=e.query+" - Kip";var s=encodeURI(e.userCity);o.path("/q/"+i+"/"+x+"/"+w+"/"+s),t.post("https://kipapp.co/styles/api/items/search?page="+e.searchIndex,{text:e.query,loc:{lat:x,lon:w},radius:5}).then(function(t){if(l.skipReload().path("/q/"+i+"/"+x+"/"+w+"/"+s).replace(),e.newQuery===!0){var o=[];e.items.forEach(function(e){o.push(e.id)}),t.data.results.forEach(function(t){o.indexOf(t.id)<0&&(o.push(t.id),e.items.push(t))}),m.put("user",e.items),m.put("query",i),e.newQuery=!1}else{var r=m.get("user"),d=m.get("query");if(i!==d)e.items=e.items.concat(t.data.results),m.put("user",e.items),m.put("query",i),e.newQuery=!1;else if(e.infBool){var c=[];e.items.forEach(function(e){c.push(e.id)}),t.data.results.forEach(function(t){c.indexOf(t.id)<0&&(c.push(t.id),e.items.push(t))}),m.put("user",e.items),m.put("query",i),e.newQuery=!1,e.infBool=!1}else e.items=r}if(e.items.length<1&&(e.noResults=!0,console.log("no results")),e.items&&e.items.length){e.noResults=!1;for(var u=0;u<e.items.length;u++){if(e.items[u].itemImageURL.length>6){var p=(e.items[u].itemImageURL.length-6,e.items[u].itemImageURL),g=p.length/2;p=p.splice(g,2)}if(e.items[u].parent.tel){var h=e.items[u].parent.tel;h=h.replace(/[+-\s]/g,""),11===h.length&&(h=h.replace(/^1/g,"")),e.items[u].parent.tel=h.slice(0,3)+"-"+h.slice(2,5)+"-"+h.slice(6)}if(e.items[u].loc&&!e.items[u].profileID){e.items[u].directionsURL=e.items[u].loc.coordinates[1]+","+e.items[u].loc.coordinates[0];var f=I(e.items[u].loc.coordinates[1],e.items[u].loc.coordinates[0],x,w);e.items[u].distanceKM=y(f,1);var v=1e3*f;v=.000621371192*v,e.items[u].distanceMI=y(v,1)}else u>-1&&e.items.splice(u,1)}}e.showQueryBar=!0,e.windowHeight=n[0].body.scrollHeight,a(function(){$("img.holderPlace").lazyload(),e.searchIndex++,C=$("div.resultsContainer"),C=C[0].clientHeight,b=!1},500),$("#locInput").geocomplete({details:"form",types:["geocode"]}).bind("geocode:result",function(t,o){e.userCity=o.formatted_address})},function(e){})},e.searchOneItem=function(){e.mongoId=e.mongoId.replace(/[^\w\s]/gi,""),e.mongoId=e.mongoId.replace(/\s+/g," ").trim();var a=encodeURI(e.mongoId);e.parentId=e.parentId.replace(/[^\w\s]/gi,""),e.parentId=e.parentId.replace(/\s+/g," ").trim();var i=encodeURI(e.parentId);o.path("/t/"+i+"/"+a),t.get("https://kipapp.co/styles/api/items/"+e.mongoId,{}).then(function(t){if(e.items=e.items.concat(t.data.item),e.items.length<1&&(e.noResults=!0,console.log("no results")),e.items&&e.items.length){e.noResults=!1;for(var o=0;o<e.items.length;o++){if(e.items[o].parent.tel){var a=e.items[o].parent.tel;a=a.replace(/[+-\s]/g,""),11===a.length&&(a=a.replace(/^1/g,"")),e.items[o].parent.tel=a.slice(0,3)+"-"+a.slice(2,5)+"-"+a.slice(6)}if(e.items[o].loc&&!e.items[o].profileID){e.items[o].directionsURL=e.items[o].loc.coordinates[1]+","+e.items[o].loc.coordinates[0];var i=I(e.items[o].loc.coordinates[1],e.items[o].loc.coordinates[0],x,w);e.items[o].distanceKM=y(i,1);var s=1e3*i;s=.000621371192*s,e.items[o].distanceMI=y(s,1)}else o>-1&&e.items.splice(o,1)}}e.showQueryBar=!0,e.windowHeight=n[0].body.scrollHeight,$("#locInput").geocomplete({details:"form",types:["geocode"]}).bind("geocode:result",function(t,o){e.userCity=o.formatted_address})},function(e){})},e.reportItem=function(o,n,i){"open"===o?e.showReportModal=i:"close"===o?e.showReportModal=null:"submit"===o&&t.post("https://kipapp.co/styles/api/items/"+n._id+"/report",{timeReported:new Date,comment:e.report.comment,reason:e.report.reason}).then(function(t){var o=$("#reportSubmit");o[0].innerHTML="Thanks!",o.css({backgroundColor:"lightgreen"}),a(function(){e.showReportModal=null},1e3),t.data.err})},e.closeOverlay=function(t){t.toElement;"modalOverlay"==t.target.classList[0]&&e.reportItem("close")},d.query?(e.query=decodeURI(d.query),e.userCity=decodeURI(d.cityName),x=d.lat,w=d.lng,e.searchItems()):d.mongoId?(e.mongoId=decodeURI(d.mongoId),e.parentId=decodeURI(d.parentId),t.get("https://kipapp.co/styles/api/geolocation").then(function(o){return 38===o.data.lat?void $("#locInput").geocomplete("find","NYC"):(x=o.data.lat,w=o.data.lng,void t.get("https://maps.googleapis.com/maps/api/geocode/json?latlng="+o.data.lat+","+o.data.lng+"&sensor=true").then(function(t){for(var o=0;o<t.data.results.length;o++)if("APPROXIMATE"==t.data.results[o].geometry.location_type){t.data.results[o].formatted_address=t.data.results[o].formatted_address.replace(", USA",""),e.userCity=t.data.results[o].formatted_address,v=e.userCity,e.loadingLoc=!1;break}},function(){}))},function(t){e.getGPSLocation()}),e.searchOneItem()):(t.get("https://kipapp.co/styles/api/geolocation").then(function(o){return 38===o.data.lat?void $("#locInput").geocomplete("find","NYC"):(x=o.data.lat,w=o.data.lng,void t.get("https://maps.googleapis.com/maps/api/geocode/json?latlng="+o.data.lat+","+o.data.lng+"&sensor=true").then(function(t){for(var o=0;o<t.data.results.length;o++)if("APPROXIMATE"==t.data.results[o].geometry.location_type){t.data.results[o].formatted_address=t.data.results[o].formatted_address.replace(", USA",""),e.userCity=t.data.results[o].formatted_address,v=e.userCity,e.loadingLoc=!1;break}},function(){}))},function(t){e.getGPSLocation()}),/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)&&(e.getGPSLocation(),e.hideGPSIcon=!0)),angular.element(document).ready(function(){e.windowHeight=r.height+"px",e.windowWidth=window.width+"px"})}]);
simpleSearchApp.config(["$routeProvider","$locationProvider",function(e,t){e.when("/",{templateUrl:"partials/home.html",controller:"HomeCtrl"}).when("/q/:query/:lat/:lng/:cityName",{templateUrl:"partials/results.html",controller:"HomeCtrl"}).when("/t/:parentId/:mongoId",{templateUrl:"partials/item.html",controller:"HomeCtrl"}).otherwise({redirectTo:"/"}),t.html5Mode({enabled:!0,requireBase:!1})}]);
simpleSearchApp.factory("storeFactory",function(){return{store:{},setStore:function(t){this.store=t}}});
simpleSearchApp.service("searchQuery",function(){var e=[],r=function(r){e=[],e.push(r)},c=function(){return e};return{addSearch:r,getSearch:c}});
simpleSearchApp.filter("deCapslock",[function(){return function(a){a=a.toLowerCase();var e=/\s((a[lkzr])|(c[aot])|(d[ec])|(fl)|(ga)|(hi)|(i[dlna])|(k[sy])|(la)|(m[edainsot])|(n[evhjmycd])|(o[hkr])|(pa)|(ri)|(s[cd])|(t[nx])|(ut)|(v[ta])|(w[aviy]))$/,r=a.match(e);return null!==r&&(r=r[0].toUpperCase(),a=a.replace(e,r)),a}}]);
simpleSearchApp.directive("afterResults",["$document",function(e){return{restrict:"E",replace:!0,scope:{windowHeight:"="},link:function(t){t.$parent.$last&&(t.windowHeight=e[0].body.clientHeight)}}}]);
simpleSearchApp.directive("autoFocus",["$timeout",function(t){return{restrict:"AC",link:function(i,c){t(function(){c[0].focus()},0)}}}]);
simpleSearchApp.directive("selectOnClick",["$window",function(e){return{restrict:"A",link:function(t,i){i.on("click",function(){e.getSelection().toString()||this.setSelectionRange(0,this.value.length)})}}}]);
simpleSearchApp.directive("dlEnterKey",function(){return function(e,n,t){n.bind("keydown keypress",function(n){var i=n.which||n.keyCode;13===i&&(e.$apply(function(){e.$eval(t.dlEnterKey)}),n.preventDefault())})}});
simpleSearchApp.directive("tooltip",function(){return{restrict:"A",link:function(t,i,o){$(i).hover(function(){$(i).tooltip("show")},function(){$(i).tooltip("hide")})}}});
simpleSearchApp.directive("ngEnter",function(){return function(n,e,t){e.bind("keydown keypress",function(e){13===e.which&&(n.$apply(function(){n.$eval(t.ngEnter,{event:e})}),e.preventDefault())})}});