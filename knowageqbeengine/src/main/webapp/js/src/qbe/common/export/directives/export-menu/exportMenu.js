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

(function(){

	var scripts = document.getElementsByTagName("script");
	var currentScriptPath = scripts[scripts.length - 1].src;
	currentScriptPath = currentScriptPath.substring(0, currentScriptPath.lastIndexOf('/') + 1);

	angular.module('exportModule')
	.directive('exportMenu', function($mdDialog, $mdMenu) {
		 return {
		        restrict: 'E',
		        controller: exportMenuController,
		        scope: {},
		        templateUrl: currentScriptPath + 'export.menu.tmpl.html',
		        link: function link(scope, element, attrs) {

		        	scope.$on('editQueryObj', function (event, data) {
		        		console.log("editQueryObj");
		    			console.log(data);
		    			scope.query = data;
		    		});

		        	scope.$on('bodySend', function (event, data) {
		        		console.log("bodySend");
		    			console.log(data);
		    			scope.bodySend = data;
		    		});
		        }
		    };


	})

	function exportMenuController($scope,exportService,sbiModule_translate){
		$scope.exportService = exportService;
		$scope.translate = sbiModule_translate;

		$scope.openMenu = function(menu, e){
			e.stopPropagation();
			menu(e);
		}


	}

})();