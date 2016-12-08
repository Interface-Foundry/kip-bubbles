app.controller('SplashController', ['$scope', '$rootScope', '$location', '$http', '$timeout', '$window', 'userManager', 'alertManager', 'dialogs', 'welcomeService', 'contest', 'lockerManager', 'ifGlobals', 'styleManager', 'newWindowService', function($scope, $rootScope, $location, $http, $timeout, $window, userManager, alertManager, dialogs, welcomeService, contest, lockerManager, ifGlobals, styleManager, newWindowService) {

    $scope.contest = contest;
    $scope.userManager = userManager;
    $scope.setShowSplash = setShowSplash;
    $scope.setShowSplashFalse = setShowSplashFalse;
    $scope.setShowSplashReset = setShowSplashReset;
    $scope.splashNext = splashNext;
    $scope.resendEmail = resendEmail;
    $scope.sendPasswordForgot = sendPasswordForgot;
    $scope.sendPasswordReset = sendPasswordReset;
    $scope.newWindowGo = newWindowGo;
    $scope.show = {
        /**
         * splash: for general splash
         * confirm: for confirm dialog
         * confirmThanks: for confirmThanks dialog
         * close: for close button
         * signin: for sign in dialog
         * register: for register dialog
         * passwordForgot: for forgot password dialog
         * passwordReset: for reset password dialog
         */
    };
    $scope.user = {};
    $scope.confirmThanksText;
    $scope.errorMsg;
    $scope.fbSignIn = fbSignIn;

    init();

    function init() {
            // REMOVE AICP
            if ($location.path().indexOf('aicp_2015') > -1) {
                $scope.show.splash = false;
                return;
            }

            if ($location.path().indexOf('email/confirm') > -1) { // check if user is confirming email

                createShowSplash('confirmThanks');

                // get token from url
                var token = $location.path().slice(15);

                $http.post('/email/request_confirm/' + token, {}, {
                    server: true
                }).
                success(function(data) {
                    $scope.confirmThanksText = data.err ? 'There was a problem confirming your email' : 'Thanks for confirming your email!';
                }).
                error(function(err) {
                    $scope.confirmThanksText = 'There was a problem confirming your email';
                });

                // redirect to home page
                $location.path('/');
            } else if ($location.path().indexOf('/reset/') > -1) { // user is resetting password

                createShowSplash('passwordReset');

                // get token from url
                var token = $location.path().slice(7);

                $http.post('/resetConfirm/' + token, {}, {
                    server: true
                }).
                success(function(data) {}).
                error(function(err) {
                    if (err) {
                        console.log('err: ', err);
                    }
                });
            } else {
                // @IFDEF WEB
                // only show splash on home page
                if ($location.path() === '/') {
                    userManager.getUser().then(function(success) {
                        createShowSplash(true);
                    }, function(err) {
                        createShowSplash(false);
                    });
                } else {
                    $scope.show.splash = false;
                }
                //@ENDIF

                // use keychain and facebook to set splash on phonegap. use login status to set splash on web
                //@IFDEF KEYCHAIN
                //On Phonegap startup, try to login with either saved username/pw or facebook

                var localuser = false;
                var fbuser = false;
                lockerManager.getCredentials().then(function(credentials) {
                    if (credentials.username && credentials.password) {
                        userManager.signin(credentials.username, credentials.password).then(function(success) {
                            console.log('SplashController: userManager.signin success:', userManager._user);
                            localuser = true;
                            userManager.checkLogin().then(function(success) {
                                console.log('SplashController: userManager.checkin success:', userManager._user);

                                return createShowSplash(true);
                            }, function(error) {
                                console.log('SplashController: userManager.signin faulire:', error);
                                return createShowSplash(false);
                            });
                        }, function(err) {
                            console.log('SplashController: lockerManager getCredentials faulire:', err);
                            createShowSplash(false);
                        })
                    }
                }, function(err) {
                    // createShowSplash(false);
                }); //END OF GET LOCAL CREDENTIALS

                //GET FB CREDENTIALS
                if (!localuser) {
                    // console.log('trying fb keychain login')
                    lockerManager.getFBCredentials().then(function(credentials) {
                            // console.log('Hitting fblogin')
                            ifGlobals.fbToken = credentials.fbToken;
                            userManager.fbLogin('onLoad').then(function(data) {
                                // console.log('HITTING FB LOGIN SUCCESS', data)
                                fbuser = true;
                                return createShowSplash(true);
                                // console.log('loaded facebook user: ', userManager._user);
                            }, function(err) {
                                // console.log('FBLOGIN ERROR OMGGGGG', $scope.show.signin);
                                // hack for now
                                if ($scope.show.signin) {
                                    alertManager.addAlert('info', 'facebook login unsuccessful');
                                }

                                return createShowSplash(false);
                            });
                        },
                        function(err) {
                            // console.log('fbcredential error', err);
                            return createShowSplash(false);
                        })
                } else {
                    // console.log('NO VALID CREDNEITALS');
                    createShowSplash(false);
                }

                StatusBar.styleDefault();
                StatusBar.backgroundColorByHexString(styleManager.splashStatusBarColor);
                // @ENDIF
            } //END OF OUTER ELSE

        } //END OF INIT

    function fbSignIn() {
        userManager.fbLogin('onSignIn').then(function(data) {
            console.log('fbLogin success', data)
            fbuser = true;
            return createShowSplash(true);
            // console.log('loaded facebook user: ', userManager._user);
        }, function(err) {
            console.log('fbLogin error', $scope.show.signin);
            // hack for now
            if ($scope.show.signin) {
                alertManager.addAlert('info', 'facebook login unsuccessful');
            }
            return createShowSplash(false);
        });
    }



    function createShowSplash(condition) {
        // alertManager.addAlert('info', condition);
        // $scope.show controls the logic for the splash pages

        if (condition === 'confirmThanks') {
            $scope.show.splash = true;
            $scope.show.confirm = false;
            $scope.show.confirmThanks = true;
        } else if (condition == 'passwordReset') {
            $scope.show.splash = true;
            $scope.show.passwordReset = true;
        } else if (condition) { // logged in
            // don't show confirm dialog for fb authenticated users
            // console.log('hitting splashcontroller loggedin')
            // console.log('SPLASH CONDITION ', condition);
            // console.log('facebook ', userManager._user.facebook);
            // console.log('userManager._user', userManager._user);

            if (userManager._user.facebook) {
                console.log(userManager._user.facebook);

                $scope.show.splash = false;
                $scope.show.confirm = false;
            } else {
                $scope.show.splash = !userManager._user.local.confirmedEmail;
                $scope.show.confirm = !userManager._user.local.confirmedEmail;
            }

            $scope.show.confirmThanks = false;
            $scope.user.newEmail = userManager._user.local.email;
        } else { // not logged in
            // console.log('hitting splashcontroller not loggedin')
            $scope.show.splash = true;
            $scope.show.confirm = false;
            $scope.show.confirmThanks = false;
        }

        // @IFDEF WEB
        $scope.show.close = true; // only show close button (home, not confirm) on web
        // @ENDIF

        $scope.show.signin = false;
        $scope.show.register = false;
    }

    function setShowSplash(property, bool) {
        if (property instanceof Array) {
            _.each(property, function(prop) {
                $scope.show[prop] = bool;
            });
        } else {
            $scope.show[property] = bool;
        }
    }

    function setShowSplashFalse() {
        // sets all $scope.show to false
        _.each($scope.show, function(value, key) {
            $scope.show[key] = false;
        });
    }

    function setShowSplashReset() {
        // sets all $scope.show to false, except $scope.show.splash
        _.each($scope.show, function(value, key) {
            $scope.show[key] = false;
        });
        $scope.show.splash = true;
        if ($rootScope.if_web) $scope.show.close = true;
    }


    function splashNext() {
        // login or create account, depending on context
        userManager.signup.error = undefined;
        if ($scope.show.signin) {
            userManager.signin(userManager.login.email, userManager.login.password).then(function(success) {
                $scope.show.signin = false;
                $scope.show.splash = false;
            }, function(err) {
                alertManager.addAlert('danger', 'Incorrect username or password', true);
            })

        } else if ($scope.show.register) {
            var watchSignupError = $scope.$watch('userManager.signup.error', function(newValue) {
                if (newValue === false) { // signup success
                    $scope.show.register = false;
                    $scope.show.splash = false;
                    watchSignupError(); // clear watch
                    alertManager.addAlert('info', 'Welcome to Kip!', true);
                    welcomeService.needsWelcome = true;
                } else if (newValue) { // signup error
                    alertManager.addAlert('danger', newValue, false);
                    watchSignupError(); // clear watch
                }
            });
            userManager.signup.signup();
        }
    }

    function resendEmail() {
        if ($scope.user.newEmail === userManager._user.local.email) {
            sendEmailConfirmation();
            $scope.show.splash = false;
            $scope.show.confirm = false;
            alertManager.addAlert('info', 'Confirmation email sent', true);
        } else {
            // update email 1st (user just edited email)
            var data = {
                updatedEmail: $scope.user.newEmail
            };
            $http.post('/api/user/emailUpdate', data, {
                server: true
            }).
            success(function(data) {
                if (data.err) {
                    addErrorMsg(data.err, 3000);
                } else {
                    sendEmailConfirmation();
                    $scope.show.splash = false;
                    $scope.show.confirm = false;
                    alertManager.addAlert('info', 'Email updated. Confirmation email sent', true);
                }
            });
        }
    }

    function sendEmailConfirmation() {
        $http.post('/email/confirm', {}, {
            server: true
        }).then(function(sucess) {}, function(error) {});
    }

    function sendPasswordForgot() {
        var data = {
            email: $scope.user.email
        };

        $http.post('/forgot', data, {
            server: true
        }).
        success(function(data) {
            alertManager.addAlert('info', 'Instructions have been sent to ' + $scope.user.email, 3000);
            $scope.user.email = '';
        }).
        error(function(err) {
            if (err) {
                addErrorMsg(err, 3000);
            }
        });
    }

    function sendPasswordReset() {
        var data = {
            password: $scope.user.newPassword
        }

        $http.post('/reset/' + $location.path().slice(7), data, {
            server: true
        }).
        success(function(data) {
            if (data.err) {
                addErrorMsg(data.err, 3000);
            } else {
                $location.path('/');
                $timeout(function() {
                    setShowSplashFalse();
                }, 500);
                alertManager.addAlert('info', 'Password changed successfully', true);
            }
        }).
        error(function(err) {
            console.log('err: ', err);
        });
    }

    function addErrorMsg(message, time) {
        $scope.errorMsg = message;
        if (time) {
            $timeout(function() {
                $scope.errorMsg = '';
            }, time);
        }
    }

    function newWindowGo(path) {
        newWindowService.go(path);
    }


}]);