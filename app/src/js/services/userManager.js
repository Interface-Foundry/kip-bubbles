angular.module('tidepoolsServices')
    .factory('userManager', ['$rootScope', '$http', '$resource', '$q', '$location', '$route', 'dialogs', 'alertManager', 'lockerManager', 'ifGlobals', 'worldTree', 'contest', 'navService',
        function($rootScope, $http, $resource, $q, $location, $route, dialogs, alertManager, lockerManager, ifGlobals, worldTree, contest, navService) {
            var alerts = alertManager;

            //@IFDEF PHONEGAP 
            // window.handleOpenURL = function() {};
            //@ENDIF

            //deals with loading, saving, managing user info. 

            var userManager = {
                //@IFDEF WEB
                userRes: $resource('/api/updateuser'),
                //@ENDIF
                //@IFDEF PHONEGAP
                userRes: $resource('/api/updateuser'), // why wouldn't this work on phonegap?
                //@ENDIF
                adminStatus: false,
                loginStatus: false,
                login: {},
                signup: {}
            }



            userManager.getUser = function() { //gets the user object
                var deferred = $q.defer();
                // console.log('getUser called, user is:', userManager._user)
                var user = userManager._user; //user cached in memory 
                if (!(_.isEmpty(user))) {
                    deferred.resolve(user);
                } else {
                    $http.get('/api/user/loggedin', {
                        server: true
                    }).
                    success(function(user) {
                        if (user && user != 0) {
                            console.log(user);
                            userManager._user = user;
                            deferred.resolve(user);
                        } else {
                            deferred.reject(0);
                        }
                    }).
                    error(function(data, status, header, config) {
                        //failure
                        deferred.reject(data);
                    });
                }
                return deferred.promise;
            }

            userManager.saveUser = function(user) { //saves user object then updates memory cache
                userManager.userRes.save(user, function() {
                    console.log('saveUser() succeeded');
                    userManager._user = user;
                });
            }

            userManager.getDisplayName = function() { //gets a first name to display in the UI from wherever.
                if (userManager._user) {
                    var user = userManager._user;
                    if (user.name) {
                        displayName = user.name
                    } else if (user.facebook && user.facebook.name) {
                        displayName = user.facebook.name
                    } else if (user.twitter && user.twitter.displayName) {
                        displayName = user.twitter.displayName
                    } else if (user.meetup && user.meetup.displayName) {
                        displayName = user.meetup.displayName
                    } else if (user.local && user.local.email) {
                        displayName = user.local.email.substring(0, user.local.email.indexOf("@"))
                    } else {
                        displayName = "Me";
                        console.log("how did this happen???");
                    }

                    var i = displayName.indexOf(" ");
                    if (i > -1) {
                        var _displayName = displayName.substring(0, i);
                    } else {
                        var _displayName = displayName;
                    }

                    return _displayName;
                } else {
                    return undefined;
                }
            }

            userManager.checkLogin = function() { //checks if user is logged in with side effects. would be better to redesign.
                var deferred = $q.defer();

                userManager.getUser().then(function(user) {
                    userManager.loginStatus = true;
                    userManager.adminStatus = user.admin ? true : false;
                    $rootScope.user = user;
                    if (user._id) {
                        $rootScope.userID = user._id;
                        userManager._user = user;
                          console.log('checkLogin:', userManager._user);
                    }
                    worldTree.getUserWorlds();
                    deferred.resolve(1);
                }, function(reason) {
                        console.log('checkLogin failed', reason);
                    userManager.loginStatus = false;
                    userManager.adminStatus = false;
                    deferred.reject(0);
                });

                $rootScope.$broadcast('loginSuccess');

                return deferred.promise;
            };

            userManager.signin = function(username, password) { //given a username and password, sign in 
                // console.log('signin');
                var deferred = $q.defer();
                var data = {
                    email: username,
                    password: password
                }

                //@IFDEF WEB
                $http.post('/api/user/login', data, {
                        server: true
                    })
                    .success(function(data) {
                        userManager._user = data;
                        userManager.loginStatus = true;
                        userManager.adminStatus = data.admin ? true : false;
                        deferred.resolve(data);
                    })
                    .error(function(data, status, headers, config) {
                        console.error(data, status, headers, config);
                        deferred.reject(data);
                    })
                    //@ENDIF

                //@IFDEF PHONEGAP
                ifGlobals.username = username;
                ifGlobals.password = password;

                console.log(ifGlobals.username);
                console.log(ifGlobals.password);
                $http.post('/api/user/login-basic', data, {
                        server: true
                    })
                    .success(function(data) {
                        lockerManager.saveCredentials(username, password);
                        // console.log('successful signin, credentials saved:', username, password)
                        // console.log('SUCCESS data is: ', data);
                        userManager._user = data;
                         // console.log('userManager signin success', userManager._user);
                        userManager.loginStatus = true;
                        userManager.adminStatus = data.admin ? true : false;
                        ifGlobals.loginStatus = true;
                        deferred.resolve(data);

                    }).error(function(error) {
                             // console.log('userManager signin failed', error);
                        usertype = 'local';
                        lockerManager.removeCredentials(usertype);
                        deferred.reject(error);
                    })
                    //@ENDIF

                return deferred.promise;
            }

            userManager.fbLogin = function(state) {
                var deferred = $q.defer();
                console.log('State in which fbLogin is called is: ', state)
                facebookConnectPlugin.getLoginStatus(function(success) {
                    console.log('Success variable is:', success)
                        //SITUATION: User loads app but has never logged in via FB before
                        if (!success.authResponse && state == 'onLoad') {
                            console.log('SITUATION: User loads app but has never logged in via FB before', success)
                            deferred.reject();
                        } //SITUATION: User loads app AND HAS logged in via FB before
                        else if (success.authResponse && state == 'onLoad') {
                            console.log('SITUATION: User loads app AND HAS logged in via FB before', success)
                            var fbToken = success.authResponse.accessToken;
                            //@IFDEF PHONEGAP
                            var data = {
                                userId: success.authResponse.userID,
                                accessToken: success.authResponse.accessToken
                            };
                            $http.post('/auth/facebook/mobile_signin', data, {
                                server: true
                            }).then(function(res) {
                                    lockerManager.saveFBToken(fbToken);
                                    ifGlobals.fbToken = fbToken;
                                    userManager._user = res.data;
                                    userManager.loginStatus = true;
                                    //userManager.adminStatus = data.admin ? true : false;
                                    ifGlobals.loginStatus = true;
                                    return deferred.resolve(res);
                                },
                                function(err) {
                                    console.log('fb login failed, removing fb credentials')
                                    usertype = 'facebook';
                                    lockerManager.removeCredentials(usertype);
                                    return deferred.reject();
                                });
                            //@ENDIF
                            return deferred.promise;

                            //SITUATION: User clicks CONNECT WITH FACEBOOK on SIGNIN page for the FIRST TIME
                        } else if (!success.authResponse && state == 'onSignIn') {

                            console.log('SITUATION: User clicks CONNECT WITH FACEBOOK on SIGNIN page for the FIRST TIME', success)
                            facebookConnectPlugin.login(['public_profile', 'email'],
                                function(success) {
                                    console.log('fbconnect login success')
                                    var fbToken = success.authResponse.accessToken;
                                    //@IFDEF PHONEGAP
                                    var data = {
                                        userId: success.authResponse.userID,
                                        accessToken: success.authResponse.accessToken
                                    };
                                    $http.post('/auth/facebook/mobile_signin', data, {
                                        server: true
                                    }).then(function(res) {
                                            console.log('mobile_signin successful', state)
                                            lockerManager.saveFBToken(fbToken);
                                            ifGlobals.fbToken = fbToken;
                                            userManager._user = res.data;
                                            userManager.loginStatus = true;
                                            //userManager.adminStatus = data.admin ? true : false;
                                            ifGlobals.loginStatus = true;
                                            return deferred.resolve(res);
                                        },
                                        function(res) {
                                            console.log('mobile_signin UNsuccessful', state)
                                            usertype = 'facebook';
                                            lockerManager.removeCredentials(usertype);
                                            return deferred.reject();
                                        });
                                    //@ENDIF
                                },
                                function(failure) {
                                    // console.log('fbconnect login failed')
                                    alerts.addAlert('warning', "Please allow access to Facebook. If you see this error often please email hello@interfacefoundry.com", true);
                                    deferred.reject(failure);
                                })
                            return deferred.promise;



                            //SITUATION: User clicks CONNECT WITH FACEBOOK on SIGNIN page and has signed in FB before
                        } else if (success.authResponse.accessToken && state == 'onSignIn') {
                            console.log('User clicks CONNECT WITH FACEBOOK on SIGNIN page and has signed in FB before', success)
                            var fbToken = success.authResponse.accessToken;
                            //@IFDEF PHONEGAP
                            var data = {
                                userId: success.authResponse.userID,
                                accessToken: success.authResponse.accessToken
                            };
                            $http.post('/auth/facebook/mobile_signin', data, {
                                server: true
                            }).then(function(res) {
                                    console.log('AHOY ', res)

                                    lockerManager.saveFBToken(fbToken);
                                    ifGlobals.fbToken = fbToken;
                                    userManager._user = res.data;
                                    userManager.loginStatus = true;
                                    //userManager.adminStatus = data.admin ? true : false;
                                    ifGlobals.loginStatus = true;
                                    return deferred.resolve(res);
                                },
                                function(err) {
                                    console.log('fb login failed, removing fb credentials')
                                    usertype = 'facebook';
                                    lockerManager.removeCredentials(usertype);
                                    return deferred.reject();
                                });
                            //@ENDIF
                        }
                        console.log('before the final return of promise: ', deferred.promise)
                        return deferred.promise;

                    },
                    function() {

                        // console.log('fbconnect login using cache failed, now trying regular login..')
                        facebookConnectPlugin.login(['public_profile', 'email'],
                                function(success) {
                                    // console.log('fbconnect login success')
                                    var fbToken = success.authResponse.accessToken;

                                    //@IFDEF PHONEGAP
                                    var data = {
                                        userId: success.authResponse.userID,
                                        accessToken: success.authResponse.accessToken
                                    };
                                    $http.post('/auth/facebook/mobile_signin', data, {
                                        server: true
                                    }).then(
                                        function(res) {
                                            //lockerManager.saveFBToken(success.authResponse.accessToken);
                                            lockerManager.saveFBToken(fbToken);
                                            ifGlobals.fbToken = fbToken;

                                            userManager._user = res.data;
                                            // console.log('fbLogin: userManager._user: ', userManager._user)

                                            userManager.loginStatus = true;
                                            //userManager.adminStatus = data.admin ? true : false;
                                            ifGlobals.loginStatus = true;
                                            deferred.resolve(success);
                                        },
                                        function(res) {
                                            // console.log('fb login failed, removing fb credentials')
                                            usertype = 'facebook';
                                            lockerManager.removeCredentials(usertype);
                                            deferred.reject(failure);
                                        }
                                    );
                                    //@ENDIF
                                },
                                function(failure) {
                                    // console.log('fbconnect login failed')
                                    alerts.addAlert('warning', "Please allow access to Facebook. If you see this error often please email hello@interfacefoundry.com", true);
                                    deferred.reject(failure);
                                })
                            // console.log('is it returning final promise?', deferred.promise)
                        return deferred.promise;
                    },true)

                return deferred.promise;
            }


            userManager.logout = function() {
                // console.log('logging out, userManager._user is: ', userManager._user)
                //@IFDEF KEYCHAIN
                var usertype = '';

                if (userManager._user.facebook) {
                    // console.log('removing fb credentials')
                    usertype = 'facebook';
                    lockerManager.removeCredentials(usertype);
                } else {
                    // console.log('removing local credentials')
                    usertype = 'local';
                    lockerManager.removeCredentials(usertype);
                }
                //@ENDIF


                $http.get('/api/user/logout', {
                    server: true
                });
                userManager.loginStatus = false;
                userManager.adminStatus = false;
                userManager._user = {};
                $rootScope.user = {};
                worldTree.submissionCache.removeAll();
                $location.path('/');
                navService.reset();
                alerts.addAlert('success', "You're signed out!", true);


            }

            userManager.login.login = function() { //login based on login form
                console.log('login');
                var data = {
                    email: userManager.login.email,
                    password: userManager.login.password
                }
                userManager.signin(data.email, data.password).then(function(success) {
                    console.log(success);
                    userManager.checkLogin();
                    alerts.addAlert('success', "You're signed in!", true);
                    userManager.login.error = false;

                    //@IFDEF WEB
                    dialogs.show = false;
                    //@ENDIF

                    //@IFDEF KEYCHAIN
                    //dialogs.showDialog('keychainDialog.html');
                    //alert('saved to keychain');
                    userManager.saveToKeychain();
                    dialogs.show = false;
                    //@ENDIF
                    contest.login(); // for wtgt contest
                    $route.reload();
                }, function(err) {
                    if (err) {
                        console.log('failure', err);
                    }
                    userManager.login.error = true;
                });
            }

            userManager.signup.signup = function() { //signup based on signup form 
                var data = {
                    email: userManager.signup.email,
                    password: userManager.signup.password
                }

                $http.post('/api/user/signup', data, {
                        server: true
                    })
                    .success(function(user) {
                        dialogs.show = false;
                        userManager.checkLogin();
                        // alertManager.addAlert('success', "You're logged in!", true);
                        userManager.signup.error = false;

                        console.log('emailtoLocker', data.email);
                        console.log('passwordtoLocker', data.password);

                        //@IFDEF KEYCHAIN
                        lockerManager.saveCredentials(data.email, data.password);
                        //@ENDIF

                        // send confirmation email
                        $http.post('/email/confirm', {}, {
                            server: true
                        }).then(function(success) {
                            console.log('confirmation email sent');
                        }, function(error) {
                            console.log('error :', error);
                        });
                    })
                    .error(function(err) {
                        if (err) {
                            userManager.signup.error = err || "Error signing up!";
                            // alertManager.addAlert('danger',err, true);
                        }
                    });
            }

            userManager.saveToKeychain = function() {
                lockerManager.saveCredentials(userManager.login.email, userManager.login.password);
            }

            userManager.checkAdminStatus = function() {
                var deferred = $q.defer();

                userManager.getUser().then(function(user) {
                    if (user.admin) {
                        deferred.resolve(true);
                        userManager.adminStatus = true;
                    } else {
                        deferred.reject(false);
                    }
                }, function(error) {
                    deferred.reject(false);
                });

                return deferred.promise;
            }

            return userManager;
        }
    ]);