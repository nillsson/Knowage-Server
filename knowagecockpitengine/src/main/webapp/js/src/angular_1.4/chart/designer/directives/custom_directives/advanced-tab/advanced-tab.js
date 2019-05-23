/**
 * Knowage, Open Source Business Intelligence suite
 * Copyright (C) 2016 Engineering Ingegneria Informatica S.p.A.
 *
 * Knowage is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Knowage is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

angular.module('advanced-tab', [])
.directive('advancedTab', function(sbiModule_config) {
	return {
		restrict: 'AE',
		replace:true,
		templateUrl: function(){
		      return sbiModule_config.dynamicResourcesEnginePath + '/angular_1.4/chart/designer/directives/custom_directives/advanced-tab/advanced-tab.html'
	      },
		controller: advancedTabControllerFunction
	}

});

function advancedTabControllerFunction($scope,sbiModule_translate){


 $scope.translate = sbiModule_translate;

 $scope.variable = "testtest"//izmena
 $scope.advancedObject = {}

 $scope.deleteAdvancedProperty = function (key){
	delete $scope.chartTemplate.advanced[key]
 }
 $scope.addProperty = function (){
	if(!$scope.chartTemplate.advanced){
		$scope.chartTemplate.advanced ={};
	}
	$scope.chartTemplate.advanced[$scope.input.key] = $scope.input.value;
 $scope.input.key = "";
 $scope.input.value = "";
 }//izmena


 }