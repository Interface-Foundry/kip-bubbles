app.factory('contest', ['$http', 'localStore', function($http, localStore) {
	// manages want this got this contest

	var isContest = false; // determines whether or not a process involves the wtgt contest
	var hashtag;
	var startTime;

	return {
		set: set,
		login: login,
		close: close
	}

	function set(setHashtag) {
		isContest = true;
		hashtag = setHashtag;
		startTime = new Date();
	}

	function login() {
		// call if user logs in after login prompt on photo upload (wtgt)
		// tracking login by logging in (userManager.login.login) or clicking "sign up" on splash
		if (isContest) {
			timeDuration = getTimeDuration(startTime, new Date);
			var data = {
				selectedUploadType: hashtag,
				signedUp: true,
				userTimeDuration: timeDuration
			};
			
			localStore.getID().then(function(id) {
				data.anonID = id;
			}).then(function() {
				$http.post('/api/anon_user/update', data, {server: true}).
					success(function(data) {
						// console.log('success: ', data);
					}).
					error(function(data) {
						// console.log('error: ', data);
					});
				reset();
			})
		}
	}

	function close() {
		// call if user closes splash after login prompt on photo upload (wtgt)
		if (isContest) {
			var response;
			timeDuration = getTimeDuration(startTime, new Date);
			var data = {
				selectedUploadType: hashtag,
				closedNoLogin: true,
				userTimeDuration: timeDuration
			}
			
			localStore.getID().then(function(id) {
				data.anonID = id;
			}).then(function() {
				$http.post('/api/anon_user/update', data, {server: true}).
					success(function(data, status, headers, config) {
						// console.log('response: ', response);
					}).
					error(function(data, status, headers, config) {
						// console.log('error: ', data);
					});
				reset();
			});
		}
	}

	function reset() {
		isContest = false;
		hashtag = null;
		startTime = null;
	}

	function getTimeDuration(start, end) {
		var start = start.getTime();
		var end = end.getTime();
		return end - start; // in ms
	}
}]);
