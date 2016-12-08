app.controller('LandmarkController', ['World', 'Landmark', 'db', '$routeParams', '$scope', '$location', '$window', 'leafletData', '$rootScope', 'apertureService', 'mapManager', 'styleManager', 'userManager', 'alertManager', '$http', 'worldTree', 'bubbleTypeService', 'geoService',
function (World, Landmark, db, $routeParams, $scope, $location, $window, leafletData, $rootScope, apertureService, mapManager, styleManager, userManager, alertManager, $http, worldTree, bubbleTypeService, geoService) {


console.log('--Landmark Controller--');

$scope.aperture = apertureService;
// aperture setting needs to happen early in controller init to avoid hidden elements on ios
$scope.aperture.set('third');
$scope.bubbleTypeService = bubbleTypeService;
$scope.worldURL = $routeParams.worldURL;
$scope.landmarkURL = $routeParams.landmarkURL;
$scope.goToWorld = goToWorld;
$scope.collectedPresents = [];

var map = mapManager;
var style = styleManager;
var alerts = alertManager;




worldTree.getWorld($routeParams.worldURL).then(function(data) {
	$scope.world = data.world;
	$scope.style = data.style;
	styleManager.setNavBG($scope.style.navBG_color);
	if ($scope.world.name) {
		angular.extend($rootScope, {globalTitle: $scope.world.name});
	}
	map.loadBubble(data.world);
	getLandmark(data.world);
}, function(error) {
	console.log(error);
	$location.path('/404');
});

function goToWorld() {
	$location.path('/w/' + $routeParams.worldURL);
}

function getLandmark(world) {
	worldTree.getLandmark($scope.world._id, $routeParams.landmarkURL).then(function(landmark) {
		$scope.landmark = landmark;
		console.log(landmark); 
		goToMark();

		// add local maps for current floor
		addLocalMapsForCurrentFloor($scope.world, landmark);
	
		console.log($scope.style.widgets.presents);

		console.log($scope.landmark.category);

		//present collecting enabled and landmark has present
		if ($scope.style.widgets.presents && $scope.landmark.category){

			if ($scope.landmark.category.hiddenPresent && $scope.landmark.category.name){

				$scope.temp = {
					showInitialPresent: true,
					presentCollected: false,
					presentAlreadyCollected: false,
					showPresentCard: true
				}

				$http.get('/api/user/loggedin', {server: true}).success(function(user){
					if (user !== '0'){
						userManager.getUser().then(function(response) {

							$scope.user = response;

							if(!$scope.user.presents){
								$scope.user.presents = {
									collected:[]
								};
							}
							
							//check if present already collected
							var found = false;	
							for(var i = 0; i < $scope.user.presents.collected.length; i++) {
						    if ($scope.user.presents.collected[i].landmarkID == $scope.landmark._id || $scope.user.presents.collected[i].categoryname == $scope.landmark.category.name) {
						    	if ($scope.user.presents.collected[i].worldID == $scope.world._id){
						        found = true;
						        $scope.temp.presentAlreadyCollected = true;
						        $scope.temp.showInitialPresent = false;
						        break;						    		
						    	}
						    }
							}
							//new present
							if (!found){
								savePresent();
							}
							else {
								checkFinalState();
							}

							function savePresent(){
								$scope.user.presents.collected.unshift({
									avatar: $scope.landmark.category.avatar, 
									landmarkID: $scope.landmark._id,
									landmarkName: $scope.landmark.name,
									worldID: $scope.world._id,
									worldName: $scope.world.name,
									categoryname: $scope.landmark.category.name
								});
								userManager.saveUser($scope.user);
								// display card with avatar + name

								$scope.temp.presentCollected = true;
								$scope.temp.showIntialPresent = false;
								alerts.addAlert('success', 'You found a present!', true);

								checkFinalState();
							}

							//showing collected presents in this world
							for(var i = 0; i < $scope.user.presents.collected.length; i++) {
						    if ($scope.user.presents.collected[i].worldID == $scope.world._id){
								$scope.collectedPresents.push($scope.user.presents.collected[i].categoryname);
						    }
							}

							//to see if user reached world collect goal for final present
							function checkFinalState(){

								var numPresents = $scope.world.landmarkCategories.filter(function(x){return x.present == true}).length;
								var numCollected = $scope.user.presents.collected.filter(function(x){return x.worldID == $scope.world._id}).length;

								//are # of present user collected in the world == to number of presents available in the world?
								if (numPresents == numCollected){
									console.log('final state!');
									//DISPLAY THANK YOU MESSAGE TO USER, collected all
									$scope.temp.finalPresent = true;
									$scope.temp.showInitialPresent = false;
									$scope.temp.presentCollected = false;
									$scope.temp.presentAlreadyCollected = false;
								}
								else{
									$scope.presentsLeft = numPresents - numCollected;
									console.log('presents left '+ $scope.presentsLeft);
								}
							}	

						});
					}
					else {
						$scope.temp.signupCollect = true;
						
					}
				});

			}				
		}
	}, function(error) {
		console.log(error, 'redirecting to world');
		$location.path('/w/' + world.id);
	});
}

function goToMark() {
	map.setCenter($scope.landmark.loc.coordinates, null, 'aperture-third'); 
	map.removeAllMarkers();

	var markerOptions = {
		draggable: false,
		message: 'nolink',
		worldId: $scope.world.id
	};
	var mapMarker = mapManager.markerFromLandmark($scope.landmark, markerOptions);
	map.addMarkers(mapMarker);
	mapManager.newMarkerOverlay($scope.landmark);
	_.defer(function() {
		mapManager.turnOnOverlay(mapMarker.layer);
	});

	map.refresh();

};

function addLocalMapsForCurrentFloor(world, landmark) {
	if (!map.localMapArrayExists(world)) {
		return;
	}
	mapManager.findVisibleLayers().forEach(function(l) {
		mapManager.toggleOverlay(l.name);
	});

		var groupName = landmark.loc_info && landmark.loc_info.floor_num ? 
										landmark.loc_info.floor_num + '-maps' : '1-maps';

		if (mapManager.overlayExists(groupName)) {
			mapManager.toggleOverlay(groupName);
		} else {
			overlayGroup = findMapsOnThisFloor(world, landmark).map(function(thisMap) {
				if (thisMap.localMapID !== undefined && thisMap.localMapID.length > 0) {
					return map.addManyOverlays(thisMap.localMapID, thisMap.localMapName, thisMap.localMapOptions);
				}
			});
			map.addOverlayGroup(overlayGroup, groupName);
			mapManager.toggleOverlay(groupName);
		}
}

function findMapsOnThisFloor(world, landmark) {
	if (!map.localMapArrayExists(world)) {
		return;
	}
	var localMaps = $scope.world.style.maps.localMapArray;

	var currentFloor;
	if (landmark.loc_info && landmark.loc_info.floor_num) {
		currentFloor = landmark.loc_info.floor_num;
	} else {
		lowestFloor = _.chain(localMaps)
			.map(function(m) {
				return m.floor_num;
			})
			.sortBy(function(m) {
				return m;
			})
			.filter(function(m) {
				return m;
			})
			.value();

		currentFloor = lowestFloor[0] || 1;
	}

	var mapsOnThisFloor = localMaps.filter(function(localMap) {
		return localMap.floor_num === currentFloor;
	});
	return mapsOnThisFloor;
}
		
}]);