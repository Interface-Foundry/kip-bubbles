app.controller('WelcomeController', ['$scope', '$window', '$location', 'styleManager', '$rootScope', 'dialogs', 'newWindowService', function ($scope, $window, $location, styleManager, $rootScope, dialogs, newWindowService) {
	var style = styleManager;

	style.setNavBG("#ed4023")

	angular.element('#view').bind("scroll", function () {
		console.log(this.scrollTop);
	});
	
	angular.element('#wrap').scroll(
	_.debounce(function() {
		console.log(this.scrollTop);
		$scope.scroll = this.scrollTop;
		$scope.$apply();
	}, 20));

	$scope.openSignup = function(){
		$scope.setShowSplashReset();
	}
	// $scope.loadmeetup = function() {
	// 	$location.path('/auth/meetup');
	// }

	$scope.newWorld = function() {			
		$scope.world = {};
		$scope.world.newStatus = true; //new
		db.worlds.create($scope.world, function(response){
			console.log('##Create##');
			console.log('response', response);
			$location.path('/edit/walkthrough/'+response[0].worldID);
		});
	}

  $scope.newWindowGo = function(path) {
  	newWindowService.go(path);
  }


}]);