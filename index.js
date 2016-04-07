var app = angular.module("app", ["ui.router"]);

app.config(function($urlRouterProvider, $stateProvider) {
	$stateProvider.state("StartScreen", {url:"", templateUrl:"startScreen.html"})
	$stateProvider.state("gameScreen", {url:"/play", templateUrl:"gameScreen.html"})
});

app.controller("appController", ["$scope", function($scope, $location){
	$scope.squares = [{state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}, {state: ""}];
	$scope.player = "fa fa-times";

	$scope.editSquare = function(index){
		if ($scope.squares[index].state == "") {
			$scope.squares[index].state = $scope.player;
			if ($scope.player == "fa fa-times") {
				$scope.player = "fa fa-circle-o";
			} else {
				$scope.player = "fa fa-times";
			}
		}
	};

	$scope.checkWinner = function() {

	};

}]);
