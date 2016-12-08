/**********************************************************************
 * Login controller
 **********************************************************************/
app.controller('LoginCtrl', ['$scope', '$rootScope', '$http', '$location', 'apertureService', 'alertManager', function ($scope, $rootScope, $http, $location, apertureService, alertManager) {
	
  //if already logged in
  if ($rootScope.showLogout){
    $location.url('/profile');
  }

  $scope.alerts = alertManager;
  $scope.aperture = apertureService;  

  $scope.aperture.set('off');

  // This object will be filled by the form
  $scope.user = {};


  //fire socialLogin
$scope.socialLogin = function(type){

    console.log(type);

    $location.url('/auth/'+type);

    $http.post('/auth/'+type, {}, {server: true}).
      success(function(user){
  
      }).
      error(function(err){
        if (err){
          $scope.alerts.addAlert('danger',err);
        }
      });
  };

  // Register the login() function
  $scope.login = function(){

    var data = {
      email: $scope.user.email,
      password: $scope.user.password
    }

    $http.post('/api/user/login', data, {server: true}).
      success(function(user){
          if (user){
            $location.url('/profile');
          }
      }).
      error(function(err){
        if (err){
          $scope.alerts.addAlert('danger',err);
        }
      });
  };

}]);

app.controller('SignupCtrl', ['$scope', '$rootScope', '$http', '$location', 'apertureService', 'alertManager', 
function ($scope, $rootScope, $http, $location, apertureService, alertManager) {
  $scope.alerts = alertManager;
  $scope.aperture = apertureService;  
  $scope.aperture.set('off');

  // This object will be filled by the form
  $scope.user = {};

  if ($routeParams.incoming == 'messages'){
    $scope.showMessages = true;
  }

  // Register the login() function
  $scope.signup = function(){

    var data = {
      email: $scope.user.email,
      password: $scope.user.password
    }

    $http.post('/api/user/signup', data, {server: true}).
      success(function(user){
          if (user){

              //if incoming from chat sign up, then go back to chat
              if ($routeParams.incoming == 'messages'){
                window.history.back();
              }
              //otherwise go to profile
              else {
                $location.url('/profile');
              } 
          }
      }).
      error(function(err){
        if (err){
          $scope.alerts.addAlert('danger',err);
        }
      });
  }

  $scope.goBack = function() {
    window.history.back();
  }
}]);

app.controller('ForgotCtrl', ['$scope', '$http', '$location', 'apertureService', 'alertManager', function ($scope, $http, $location, apertureService, alertManager) {

  $scope.alerts = alertManager;
  $scope.aperture = apertureService;  

  $scope.aperture.set('off');

  // This object will be filled by the form
  $scope.user = {};

  $scope.sendForgot = function(){

    var data = {
      email: $scope.user.email
    }

    $http.post('/forgot', data, {server: true}).
      success(function(data){
          // console.log(data);
          $scope.alerts.addAlert('success','Instructions for resetting your password were emailed to you');
          $scope.user.email = '';
          // if (user){
          //   $location.url('/profile');
          // }
      }).
      error(function(err){
        if (err){
          $scope.alerts.addAlert('danger',err);
        }
      });
  };

}]);


app.controller('ResetCtrl', ['$scope', '$http', '$location', 'apertureService', 'alertManager', '$routeParams', function ($scope, $http, $location, apertureService, alertManager, $routeParams) {
  $scope.alerts = alertManager;
  $scope.aperture = apertureService;  

  $scope.aperture.set('off');

  $http.post('/resetConfirm/'+$routeParams.token, {}, {server: true}).
    success(function(data){
        
    }).
    error(function(err){
      if (err){
        //$scope.alerts.addAlert('danger',err);
        $location.path('/forgot');
      }
    });


  $scope.sendUpdatePassword = function(){

    var data = {
      password: $scope.user.password
    }

    $http.post('/reset/'+$routeParams.token, data, {server: true}).
      success(function(data){
        $location.path('/profile');
      }).
      error(function(err){
        if (err){
          $scope.alerts.addAlert('danger',err);
        }
      });
  };

}]);


app.controller('resolveAuth', ['$scope', '$rootScope', 'welcomeService', function ($scope, $rootScope, welcomeService) {

  angular.extend($rootScope, {loading: true});
  welcomeService.needsWelcome = true;
  location.reload(true);

}]); 
