var app = angular.module("app", ["ui.router", "toastr"]);

app.config(function($urlRouterProvider, $stateProvider) {
	// $stateProvider.state("StartScreen", {url:"", templateUrl:"startScreen.html"})
	$stateProvider.state("gameScreen", {url:"", templateUrl:"gameScreen.html"})
});

app.factory("peerService", function() {
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
				thisRef.connected = true;
				connectedPeerId = peerId;

				fn(connectedId > connectedPeerId)
			} else {
				connectedId = peerId;
			}

		});
	}

	return thisRef;
})

app.controller("appController", ["$scope", "toastr", "peerService", function($scope, toastr, peerService){
	$scope.peerService = peerService;
	$scope.squares = [{state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}];
	var players = [{symbol: "X", class: "fa fa-times"}, {symbol: "O", class: "fa fa-circle-o"}];
	var player;
	var myTurn;

	$scope.turnMessage = "It's your opponnents turn";

	peerService.onJoin(function(isHigher) {
		if (isHigher === true) {
			player = players[0]
			myTurn = true;
			$scope.turnMessage = "It's your turn";
		} else {
			player = players[1]
			myTurn = false;
			$scope.turnMessage = "It's your opponnents turn";
		}

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
				$scope.turnMessage = "It's your opponnents turn";
				$scope.$evalAsync();
			}
		}
	};

	peerService.onMessage(function(message) {
		if (angular.isString(message) === true){
			setWinner(message);
			myTurn = false;
			setTimeout(function() {
				$scope.squares = [{state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}];
				$scope.$evalAsync();
			}, 1000);
		} else {
			$scope.squares = message;
			$scope.$evalAsync();
			myTurn = true;
			$scope.turnMessage = "It's your turn";
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
				return {isWinner: true, name: winName};
			}
		} else {
			toastr.success("HAHA YOU LOST TO PLAYER " + playerWinner + "!");
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
