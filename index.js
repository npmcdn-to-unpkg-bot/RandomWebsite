var app = angular.module("app", ["ui.router", "toastr"]);

var players = [{symbol: "X", class: "fa fa-times"}, {symbol: "O", class: "fa fa-circle-o"}];
var player;
var myTurn;
var turnMessage = "It's your opponnents turn";

app.config(function($urlRouterProvider, $stateProvider) {
	// $stateProvider.state("StartScreen", {url:"", templateUrl:"startScreen.html"})
	$stateProvider.state("gameScreen", {url:"/gameScreen", templateUrl:"gameScreen.html", controller:"gameController"})
	$stateProvider.state("startScreen", {url:"", templateUrl:"startScreen.html"})
});

app.factory("peerService", function($rootScope) {
	var skylink = new Skylink();
	var connectedId;
	var connectedPeerId;
	var thisRef = this;
	thisRef.connected = false;
	skylink.init({
		apiKey: '9d1fc96f-fa91-468a-ae03-851ffb89eb59',
		defaultRoom: 'test'
	}, function() {
		skylink.joinRoom({
		});
	});

	thisRef.onMessage = function(fn) {
		skylink.on('incomingMessage', function(messageData, unknown, sender, isSelf) {
			if (!isSelf) {
				fn((messageData.content))
			}
		});
	}

	thisRef.send = function(message) {
		skylink.sendMessage(message, connectedPeerId);
	}

	thisRef.onJoin = function(fn) {
		skylink.on('peerJoined', function(peerId, peerInfo, isSelf) {
			if (!isSelf) {
				connectedPeerId = peerId;
				fn(connectedId > connectedPeerId, isSelf)
			} else {
				connectedId = peerId;
				thisRef.connected = true;
			}

			$rootScope.$evalAsync();
		});
	}

	return thisRef;
})

app.factory("messageService", function($rootScope) {
	var thisRef = this;
	var messageStore  = [{message: "Connecting to Server...", relTimeOut: -1}, {message: undefined, relTimeOut: undefined}, {message: undefined, relTimeOut: undefined}];
	thisRef.priorityMessage = "Connecting to Server...";
	thisRef.message = function(message, priority, isConstant, relTimeOut) {
		if (isConstant) {
			messageStore[priority].message = message;
		} else {
			messageStore[priority].message = message;
			messageStore[priority].relTimeOut = relTimeOut;
		}
	}

	thisRef
	var priorityList = {type: "loadingMessage"}
	setInterval(function() {
		var priorityMessage;
		for (var i in messageStore) {
			var relTimeOut = messageStore[i].relTimeOut;
			var message = messageStore[i].message;
			if (relTimeOut > 0) {
				messageStore[i].relTimeOut = relTimeOut - 1;
			} else if (relTimeOut === 0) {
				message = null;
			}

			if (message) {
				priorityMessage = message;
			}
		}

		thisRef.priorityMessage = priorityMessage;
		$rootScope.$evalAsync();
	}, 500);

	return thisRef;
})

app.controller("appController", ["$scope", "peerService", "messageService", function($scope, peerService, messageService){
	$scope.messageService = messageService;
	messageService.message("Connecting to Server...", 0, true);s
	peerService.onJoin(function(isHigher){
		if (isHigher === true) {
			player = players[0]
			myTurn = true;
			turnMessage = "It's your turn";
		} else {
			player = players[1]
			myTurn = false;
			turnMessage = "It's your opponnents turn";
		}
	});

	if (peerService) {
		messageService.message("When your ready join a game!", 0, true);
		messageService.message("Connected to Server", 1, false, 4);
	}

	// I was working over here ----------------------------------------------------------------------------------------------------------------------------- <<<<<<<<<<<<<<<<<<<<
	$scope.isPlaying = function() {
		var url = window.location.href.toString().split(window.location.host)[1];
		var playing;
		if (url == "/randomWebsite/") {
			playing = false;
		} else {
			playing = true;
		}

		console.log(playing);
	}
}]);

app.controller("gameController", ["$scope", "toastr", "peerService", function($scope, toastr, peerService){
	$scope.peerService = peerService;

	$scope.squares = [{state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}];

	$scope.messageService.message(turnMessage, 0, true);

	peerService.onJoin(function(isHigher) {
		if (isHigher === true) {
			player = players[0]
			myTurn = true;
			turnMessage = "It's your turn";
		} else {
			player = players[1]
			myTurn = false;
			turnMessage = "It's your opponnents turn";
		}

		$scope.messageService.message(turnMessage, 0, true);
		$scope.$evalAsync();
	});

	$scope.editSquare = function(index){
		if (myTurn) {
			if ($scope.squares[index].state === "") {
				$scope.squares[index].state = player.class;

				peerService.send($scope.squares);
				var winner = setWinner()
				if (winner.isWinner === true) {
					peerService.send(winner.name);
					setTimeout(function() {
						$scope.squares = [{state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}];
						$scope.$evalAsync();
					}, 1000);
				}

				myTurn = false;
				turnMessage = "It's your opponnents turn";
				$scope.messageService.message(turnMessage, 0, true);
				$scope.$evalAsync();
			}
		}
	};

	peerService.onMessage(function(message) {
		if (angular.isString(message) === true){
			setWinner(message);
			setTimeout(function() {
				$scope.squares = [{state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}];
				$scope.$evalAsync();
			}, 1000);
		} else {
			$scope.squares = message;
			$scope.$evalAsync();
			myTurn = true;
			turnMessage = "It's your turn";
			$scope.messageService.message(turnMessage, 0, true);
		}

		$scope.$evalAsync();
	});

	var setWinner = function(playerWinner) {
		if (playerWinner === undefined) {
			var winner = checkWinner();
			if (winner.isWinner) {
				var winName;
				if (winner.winner == "fa fa-times") {
					winName = "X";
				} else {
					winName = "O"
				}

				toastr.success("Good job " + winName, "Player " + winName + " has won!")
				$scope.messageService.message("Good job " + winName + "Player " + winName + " has won!", 2, false, 6);
				return {isWinner: true, name: winName};
			}
		} else {
			toastr.success("HAHA YOU LOST TO PLAYER " + playerWinner + "!");
			$scope.messageService.message("HAHA YOU LOST TO PLAYER ", 2, false, 6);
		}

		return {isWinner: false};
	}

	var checkWinner = function() {
		var squares = $scope.squares;
		for (i = 0; i < 3; i++) {
			if (checkEqual(i, i + 3, i + 6)) {
				return {isWinner: true, winner: squares[i].state};
			}
		}

		for (i = 0; i < 9; i += 3) {
			if (checkEqual(i, i + 1, i + 2)) {
				return {isWinner: true, winner: squares[i].state};
			}
		}

		if (checkEqual(2, 4, 6)) {
			return {isWinner: true, winner: squares[2].state};
		}

		if (checkEqual(0, 4, 8)) {
			return {isWinner: true, winner: squares[0].state};

		}

		return {isWinner: false, winner: ""};
	};

	var checkEqual = function(a, b, c) {
		var squares = $scope.squares;
		if (squares[a].state !== "" && squares[a].state == squares[b].state && squares[a].state == squares[c].state) {
			return true
		}

		return false
	}

}]);
