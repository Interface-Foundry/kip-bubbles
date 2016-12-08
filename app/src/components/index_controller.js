app.controller('indexIF', ['$location', '$scope', 'db', 'leafletData', '$rootScope', 'apertureService', 'mapManager', 'styleManager', 'alertManager', 'userManager', '$route', '$routeParams', '$location', '$timeout', '$http', '$q', '$sanitize', '$anchorScroll', '$window', 'dialogs', 'worldTree', 'beaconManager', 'lockerManager', 'contest', 'navService', 'analyticsService', 'ifGlobals', 'deviceManager', function($location, $scope, db, leafletData, $rootScope, apertureService, mapManager, styleManager, alertManager, userManager, $route, $routeParams, $location, $timeout, $http, $q, $sanitize, $anchorScroll, $window, dialogs, worldTree, beaconManager, lockerManager, contest, navService, analyticsService, ifGlobals, deviceManager) {
console.log('init controller-indexIF');
$scope.aperture = apertureService;
$scope.map = mapManager;
$scope.style = styleManager;
$scope.alerts = alertManager;
$scope.userManager = userManager;
$scope.navService = navService;
$scope.dialog = dialogs;
$scope.routeParams = $routeParams;
$scope.deviceManager = deviceManager;
    
// global bools indicate phonegap vs web
$rootScope.if_web = true;
$rootScope.if_phonegap = false;
//@IFDEF PHONEGAP
$rootScope.if_web = false;
$rootScope.if_phonegap = true;
//@ENDIF

if ($rootScope.if_web) {
	$rootScope.showBanner = true;
}

angular.extend($rootScope, {globalTitle: "Kip"}); 

$rootScope.hideBack = true; //controls back button showing

var deregFirstShow = $scope.$on('$routeChangeSuccess', _.after(2, function() {
	console.log('$routeChangeSuccess');
	console.log(arguments);
	$rootScope.hideBack = false;
	deregFirstShow();
}));

$scope.newWorld = function() {
    console.log('newWorld()');
    $scope.world = {};
    $scope.world.newStatus = true; //new
    db.worlds.create($scope.world, function(response){
      console.log('##Create##');
      console.log('response', response);
      $location.path('/edit/walkthrough/'+response[0].worldID);
    });
} //candidate for removal, should use worldTree.createWorld instead

$scope.search = function() {
	if ($scope.searchOn == true) {
		//call search
		console.log('searching');
		$location.path('/search/'+$scope.searchText);
		$scope.searchOn = false;
	} else {
		$scope.searchOn = true;
	}
}

// DEPRACATED
$scope.wtgtLogin = function() {
	contest.login(new Date);
}

logSearchClick = function(path) {
	analyticsService.log('search.general.clickthrough', {
		path: path,
		searchText: $scope.searchText || $('.search-bar').val()
	});
};
	
$scope.go = function(path) {
	logSearchClick(path);
	$location.path(path);
} 
	
$scope.goBack = function() {
	$window.history.go(navService.backPages);
}

$scope.goLocationServices = function() {
	var mapBrowserToLink = {
		chrome: 'https://support.google.com/chrome/answer/142065?hl=en',
		safari: 'https://support.apple.com/en-us/HT202355',
		firefox: 'https://support.mozilla.org/en-US/questions/988163',
		ie: 'http://windows.microsoft.com/en-us/internet-explorer/ie-security-privacy-settings'
	}
	var browser = deviceManager.browser;

	// open link in new tab if we have it
	if (_.has(mapBrowserToLink, browser)) $window.open(mapBrowserToLink[browser], '_blank');
}

$scope.logout = function() {
	userManager.logout();
	userManager.login.email = '';
	userManager.login.password = '';
	if ($rootScope.if_phonegap) {
		StatusBar.styleDefault();
		StatusBar.backgroundColorByHexString(styleManager.splashStatusBarColor);
	}
}


/*
$scope.sessionSearch = function() { 
    $scope.landmarks = db.landmarks.query({queryType:"search", queryFilter: $scope.searchText});
};
*/
    
$scope.getNearby = function($event) {
	$scope.nearbyLoading = true;
	worldTree.getNearby().then(function(data) {
    $scope.altBubbles = data['150m'];
    $scope.nearbyBubbles = data['2.5km'];
		$scope.nearbyLoading = false;
	}, function(reason) {
		console.log('getNearby error');
		console.log(reason);
		$scope.nearbyLoading = false;
	})
	$event.stopPropagation();
}

$scope.share = function(platform) {
  var link;
  var height = 450;
  var width = 560;
  //center popup on screen
  var left = (screen.width - width)/2;
  var top = (screen.height - height)/2;
  
  if (platform == 'facebook') {
    link = 'https://www.facebook.com/sharer/sharer.php?u=https://kipapp.co'+$location.url();
  }
  else if (platform == 'twitter') {
    link = 'https://twitter.com/intent/tweet?url=https://kipapp.co'+$location.url();
  }
  $window.open(
    link,
    'Kip',
    'height=450,width=558,top='+top+',left='+left+'scrollbars'
  );
};

//@IFDEF PHONEGAP
// $scope.fbLogin = function() {
//   console.log('HAHAHAHAOMGGGREJJREREFJEFJ')
// 	userManager.fbLogin().then(
// 		function (success) {
// 			console.log(success);
// 			userManager.checkLogin();
// 		}, function (failure) {
// 			console.log(failure);	
// 		})
// }
//@ENDIF


//@IFDEF IBEACON
if (beaconManager.supported == true) {
	beaconManager.startListening();
}
//@ENDIF





}]);
