app.controller('SearchController', ['$scope', '$location', '$routeParams', '$timeout', '$http', 'apertureService', 'worldTree', 'mapManager', 'bubbleTypeService', 'worldBuilderService', 'bubbleSearchService', 'floorSelectorService', 'categoryWidgetService', 'styleManager', 'navService', 'geoService', 'encodeDotFilterFilter', 'analyticsService', 'dialogs', 'landmarkIsVisibleFilter', function($scope, $location, $routeParams, $timeout, $http, apertureService, worldTree, mapManager, bubbleTypeService, worldBuilderService, bubbleSearchService, floorSelectorService, categoryWidgetService, styleManager, navService, geoService, encodeDotFilterFilter, analyticsService, dialogs, landmarkIsVisibleFilter) {

	$scope.aperture = apertureService;
	$scope.bubbleTypeService = bubbleTypeService;
	$scope.dialogs = dialogs;
	$scope.geoService = geoService;
	$scope.currentFloor = floorSelectorService.currentFloor;
	$scope.populateSearchView = populateSearchView;
	$scope.populateCitySearchView = populateCitySearchView;
	$scope.apertureToggleThenCenterMap = apertureToggleThenCenterMap;
	$scope.go = go;
	$scope.citySearchResults = {};
	$scope.groups;
	$scope.loading = false; // for loading animation on searchbar
	$scope.world;
	$scope.style;
	$scope.searchBarText;
	$scope.show;
	
	var map = mapManager;
	var latLng = {};
	var defaultText;

	if ($scope.aperture.state !== 'aperture-full') {
		$scope.aperture.set('third');
	}

	if ($routeParams.worldURL) {
		navService.show('search');

		worldTree.getWorld($routeParams.worldURL).then(function(data) {
			$scope.world = data.world;
			$scope.style = data.style;
			defaultText = bubbleSearchService.defaultText.bubble;
			// set nav color using styleManager
			styleManager.navBG_color = $scope.style.navBG_color;

			worldBuilderService.loadWorld($scope.world);

			// call populateSearchView with the right parameters
			if ($routeParams.category) {
				populateSearchView($routeParams.category, 'category');
			} else if ($routeParams.text) {
				populateSearchView($routeParams.text, 'text');
			} else if ($location.path().slice(-3) === 'all') {
				populateSearchView('All', 'all');
			} else {
				populateSearchView(defaultText, 'generic');
			}
		
		});
	} else if ($routeParams.cityName) {
		apertureService.set('third');
		navService.show('search');
		defaultText = bubbleSearchService.defaultText.global;

		// reset nav bar color and default map
		styleManager.resetNavBG();
		mapManager.resetBaseLayer();
		mapManager.removeOverlays();

		latLng.lat = getLatLngFromURLString($routeParams.latLng).lat;
		latLng.lng = getLatLngFromURLString($routeParams.latLng).lng;
		$scope.cityName = $routeParams.cityName;

		if ($routeParams.category) {
			populateCitySearchView($routeParams.category, 'category', latLng);
		} else if ($routeParams.text) {
			populateCitySearchView($routeParams.text, 'text', latLng);
		} else {
			populateCitySearchView(defaultText, 'generic', latLng);
		}
	}

	$scope.$on('$destroy', function(ev) {
		categoryWidgetService.selectedIndex = null;
		floorSelectorService.showLandmarks = false;
	});

	$scope.apertureSet = function(newState) {
		adjustMapCenter();
		apertureService.set(newState);
	}

	$scope.apertureToggle = function(newState) {
		adjustMapCenter();
		apertureService.toggle(newState);
	}

	function apertureToggleThenCenterMap(newState) {
		// centers map on all markers including tracking marker, if it exists
		
		apertureService.toggle(newState);

		if (apertureService.state !== 'aperture-off') {
			var updated = false

			// don't watch forever
			$timeout(function() {
				if (!updated) {
					updateCenter(); // clear watch
				}
			}, 10*1000);

			// watch if we are tracking
			var updateCenter = $scope.$watch(function() {
				return geoService.tracking;
			}, function(newVal) {
				if (newVal) {
					mapManager.setCenterFromMarkers(_.toArray(mapManager.markers));
					updated = true;
					updateCenter(); // clear watch
				}
			});

			// center on other markers
			mapManager.setCenterFromMarkers(_.toArray(mapManager.markers));
		}
	}

	function getLatLngFromURLString(urlString) {
		var latLng = {};
		var startIndexLat = urlString.indexOf('lat') + 3;
		var endIndexLat = urlString.indexOf('&lng');
		var startIndexLng = endIndexLat + 4;
		var latString = urlString.slice(startIndexLat, endIndexLat);
		var lngString = urlString.slice(startIndexLng);
		latLng.lat = encodeDotFilterFilter(latString, 'decode', true);
		latLng.lng = encodeDotFilterFilter(lngString, 'decode', true);
		return latLng;
	}

	function adjustMapCenter() {
		if ($scope.aperture.state === 'aperture-third') {
			return;
		}
		mapManager._z = mapManager.center.zoom;
		mapManager._actualCenter = [mapManager.center.lng, mapManager.center.lat];
	}

	function logSearchClick(path) {
		analyticsService.log('search.bubble.clickthrough', {
			path: path,
			searchText: $scope.searchBarText || $('.search-bar').val()
		});
	}

	function go(path) {
		logSearchClick(path);
		$location.path(path);
	}

	function groupResults(data, searchType) {
		// groups array of landmarks correctly, such that they are sorted properly for the view (ng-repeat)
		if (searchType === 'all') {
			// group landmarks by category, then first letter, then sort
			var groups = _.chain(data)
				// group landmarks by category
				.groupBy(function(landmark) {
					return landmark.category || 'Other';
				})
				.each(function(value, key, list) {
					list[key] = _.chain(value)
						// 1st sort puts landmarks in order
						.sortBy(function(result) {
							return result.name.toLowerCase();
						})
						// group landmarks by first letter
						.groupBy(function(result) {
							var firstChar = result.name[0];
							if (firstChar.toUpperCase() !== firstChar.toLowerCase()) { // not a letter (regex might be better here)
								return firstChar.toUpperCase();
							} else { // number, #, ., etc...
								return '#';
							}
						})
						// map from object {A: [landmark1, landmark2], B: [landmark3, landmark4]} to array of objects [{letter: 'A', results: [landmark1, landmark2]}, {letter: 'B', results: [landmark3, landmark4]}], which enables sorting
						.map(function(group, key) {
							return {
								letter: key,
								results: group
							}
						})
						.sortBy('letter')
						.value();
				})
				.map(function(group, key) {
					return {
						catName: key,
						// avatar: _.findWhere($scope.world.landmarkCategories, {
						// 	name: key
						// }).avatar
						results: group
					}
				})
				.sortBy(function(result) {
					return result.catName.toLowerCase();
				})
				.value()
		} else {
			// group landmarks by first letter, then sort
			// same as above, without grouping by category
			var groups = _.chain(data)
				.sortBy(function(result) {
					return result.name.toLowerCase();
				})
				.groupBy(function(result) {
					var firstChar = result.name[0];
					if (firstChar.toUpperCase() !== firstChar.toLowerCase()) { 
						return firstChar.toUpperCase();
					} else { 
						return '#';
					}
				})
				.map(function(group, key) {
					return {
						letter: key,
						results: group
					}
				})
				.sortBy('letter')
				.value();
		}
		return groups;
	}

	function populateSearchView(input, searchType) {
		var decodedInput = decodeURIComponent(input);
		
		// set text in catSearchBar
		$scope.searchBarText = decodedInput;
		
		$scope.show = { // used for displaying different views
			all: false,
			category: false,
			text: false,
			generic: false
		};
		$scope.show[searchType] = true;
		if (!$scope.show.generic) { // don't call bubbleservice search when we aren't requesting any data
			
			// show loading animation if search query is taking a long time
			$scope.loading = 'delay';

			$timeout(function() {
				if ($scope.loading === 'delay') {
					$scope.loading = true;
				}
			}, 300);

			bubbleSearchService.search(searchType, $scope.world._id, decodedInput)
				.then(function(response) {
					var data = landmarkIsVisibleFilter(bubbleSearchService.data);
					$scope.groups = groupResults(data, searchType);
					$scope.loading = false;

					updateMap(data);
					if (data.length === 0) { // no results
						$scope.searchBarText = $scope.searchBarText + ' (' + bubbleSearchService.defaultText.none + ')';
					}
				});
		} else { // generic search
			map.removeAllMarkers();
		}
	}

	function populateCitySearchView(input, searchType, latLng) {

		var decodedInput = decodeURIComponent(input);
		
		// set text in catSearchBar
		$scope.searchBarText = decodedInput;

		if (latLng && latLng.cityName) $scope.cityName = latLng.cityName;

		$scope.cityShow = {
			category: false,
			text: false,
			generic: false
		};
		$scope.cityShow[searchType] = true;

		if (!$scope.cityShow.generic) {
			var data = {
				server: true,
				params: {
					textQuery: $scope.searchBarText,
					userLat: latLng.lat,
					userLng: latLng.lng,
					localTime: new Date()
				}
			};
			$http.get('/api/textsearch', data).
				success(function(result) {
					if (!result.err) {
						map.removeAllMarkers();
			
						// separate bubbles from landmarks
						result = _.groupBy(landmarkIsVisibleFilter(result), 'world');
						$scope.citySearchResults.bubbles = result.true;
						$scope.citySearchResults.landmarks = result.false;
						var markers = [];

						// bubble markers
						_.each($scope.citySearchResults.bubbles, function(bubble) {
							var marker = {
								lat: bubble.loc.coordinates[1],
								lng: bubble.loc.coordinates[0],
								draggable: false,
								message: '<a if-href="#/w/' + bubble.id + '"><div class="marker-popup-click"></div></a><a>' + bubble.name + '</a>',
								icon: {
									iconUrl: 'img/marker/bubbleMarker_30.png',
									iconSize: [24, 24],
									iconAnchor: [11, 11],
									popupAnchor: [0, -12]
								},
								_id: bubble._id
							};
							markers.push(marker);
						});

						// add markers and set aperture
						mapManager.addMarkers(markers);
						if (markers.length > 0) {
							mapManager.setCenterFromMarkersWithAperture(markers, apertureService.state);
						}

						if (!$scope.citySearchResults.bubbles || $scope.citySearchResults.bubbles.length === 0) {
							$scope.searchBarText = $scope.searchBarText + ' (' + bubbleSearchService.defaultText.none + ')';
						}

					} else {
						$scope.citySearchResults = [];
						if (!latLng) {
							latLng = {
								lat: geoService.location.lat,
								lng: geoService.location.lng
							};
						}
						if (latLng.lat) {
							map.setCenter([latLng.lng, latLng.lat], 14, apertureService.state);
						}
					}
					// loading stuff here
				}).
				error(function(err) {
					// loading stuff
				});

		} else {
			map.removeAllMarkers();
			if (!latLng) {
				latLng = {
					lat: geoService.location.lat,
					lng: geoService.location.lng
				};
			}
			if (latLng.lat) {
				map.setCenter([latLng.lng, latLng.lat], 14, apertureService.state);
			}
		}

	}

	function updateMap() {
		var landmarks = bubbleSearchService.data;

		// check if results on more than 1 floor and if so open selector
		if (floorSelectorService.landmarksToFloors(landmarks).length > 1) {
			floorSelectorService.showFloors = true;
		} else {
			floorSelectorService.showFloors = false;
		}

		// if no results, return
		if (!landmarks.length) {
			mapManager.removeAllMarkers();
			return;
		}

		mapManager.findVisibleLayers().forEach(function(l) {
			mapManager.toggleOverlay(l.name);			
		});
		// if no results on current floor, update floor map to nearest floor
		updateFloorMaps(landmarks);

		// create landmarks for all that match search, but only show landmarks on current floor
		updateLandmarks(landmarks);

		updateFloorIndicator(landmarks);

		// if we were already showing userLocation, continute showing (since updating map removes all markers, including userLocation marker)
		if (geoService.tracking) {
			geoService.trackStart();
		}
	}

	function updateFloorMaps(landmarks) {

		var floor = floorSelectorService.currentFloor.floor_num || floorSelectorService.currentFloor.loc_info.floor_num,
				resultFloors = floorSelectorService.landmarksToFloors(landmarks);

		if (resultFloors.indexOf(floor) < 0) {
			var sortedMarks = _.chain(landmarks)
				.filter(function(l) {
					return l.loc_info;
				})
				.sortBy(function(l) {
					return l.loc_info.floor_num;
				})
				.value();

			$scope.currentFloor = _.filter(floorSelectorService.floors, function(f) {
				return f[0].floor_num === sortedMarks[0].loc_info.floor_num;
			})[0][0];

			floorSelectorService.setCurrentFloor($scope.currentFloor);
			floor = floorSelectorService.currentFloor.floor_num;
		}
		mapManager.turnOnOverlay(String(floor).concat('-maps'));
	}

	function updateLandmarks(landmarks) {
		var markerOptions = {
			draggable: false,
			message: 'link',
			worldId: $scope.world.id
		};
		var markers = landmarks.map(function(l) {
			return mapManager.markerFromLandmark(l, markerOptions);
		});
		var floor = floorSelectorService.currentFloor.floor_num ? 
								String(floorSelectorService.currentFloor.floor_num) :
								String(floorSelectorService.currentFloor.loc_info.floor_num);

		landmarks.forEach(function(m) {
			mapManager.newMarkerOverlay(m);
		});
		
		mapManager.setCenterFromMarkersWithAperture(markers, $scope.aperture.state);

		mapManager.removeAllMarkers();

		// defer waits until call stack is empty so we won't run into leaflet bug
		// where adding a marker with the same key as an existing marker breaks the directive
		_.defer(function() {
			mapManager.setMarkers(markers);
		});

		mapManager.turnOnOverlay(floor.concat('-landmarks'));

	}

	function updateFloorIndicator(landmarks) {
		var floor = floorSelectorService.currentFloor.floor_num,
				resultFloors = floorSelectorService.landmarksToFloors(landmarks);
		var floors = floorSelectorService.floors.map(function(f) {
			return f[0].floor_num;
		})
		var i = floors.indexOf(floor);

		floorSelectorService.setSelectedIndex(i);
		floorSelectorService.updateIndicator(true);
	}

}]);
