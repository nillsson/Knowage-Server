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
(function() {
	var scripts = document.getElementsByTagName("script");
	var currentScriptPath = scripts[scripts.length - 1].src;
	currentScriptPath = currentScriptPath.substring(0, currentScriptPath.lastIndexOf('/') + 1);

angular.module('qbe_filter', ['ngMaterial','angular_table' ])
.directive('qbeFilter', function() {
	return {

		templateUrl:  currentScriptPath +'filter.html',
		controller: qbeFilter,

		scope: {
			 ngModel: '='
		},
		link: function (scope, elem, attrs) {

		}
	}
});

function qbeFilter($scope,$rootScope, sbiModule_user,filters_service , sbiModule_inputParams, sbiModule_translate, $http, sbiModule_config,$mdPanel, $mdDialog, $httpParamSerializer, sbiModule_restServices, entity_service){
	$scope.spatial = sbiModule_user.functionalities.indexOf("SpatialFilter")>-1;
	$scope.filters=angular.copy($scope.ngModel.queryFilters);
	$scope.advancedFilters=angular.copy($scope.ngModel.advancedFilters);
	$scope.field=$scope.ngModel.field;
	$scope.tree=$scope.ngModel.tree.entities;
	$scope.pars=angular.copy($scope.ngModel.pars);
	$scope.subqueries = $scope.ngModel.subqueries;
	$scope.targetOption="default";
	$scope.translate = sbiModule_translate;
	$scope.openMenu = function($mdOpenMenu, ev) {
	      originatorEv = ev;
	      $mdOpenMenu(ev);
	};
	$scope.selectedTemporalFilter = {};
	$scope.temporalFilters = [];
	$scope.fieldFilter = function (item) {
		if(item.leftOperandValue==$scope.field.id) return item
	}

	$scope.targetTypes = angular.copy(filters_service.getTargetTypes);
	if($scope.pars.length>0){
		$scope.targetTypes.push({name:sbiModule_translate.load("kn.qbe.filters.target.types.param"),value:"parameter"})
	}
	if($scope.subqueries.length>0){
		$scope.targetTypes.push({name:sbiModule_translate.load("kn.qbe.filters.target.types.subquery"),value:"subquery"})

	}
	$scope.params=false;
	$scope.targetAF = {};
	var checkForIndex = function(){
		var arrayOfIndex = [];
		if($scope.filters.length==0){
			return 1;
		} else {

			for (var m = 0; m < $scope.filters.length; m++) {
				var num = $scope.filters[m].filterId.substring(6);
				arrayOfIndex.push(parseInt(num));
			}
			function sortNumber(a,b) {
			    return a - b;
			}

		    arrayOfIndex.sort(sortNumber);
		    return arrayOfIndex[arrayOfIndex.length-1]+1;
		}
	}

	$scope.loadTemporalFilters = function () {

		var query = {
				types: ["DAY_OF_WEEK", "DAY_OF_WEEK", "DAY_OF_WEEK"]
		}

		sbiModule_restServices.promiseGet("/../../../knowage/restful-services/1.0/timespan/listTimespan", "", $httpParamSerializer(query))
		.then(function(response) {
			$scope.temporalFilters = response.data.data;
		}, function(response) {
			sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');

		});

		$mdDialog.show({
			  scope: $scope,
			  preserveScope: true,
		      templateUrl: sbiModule_config.dynamicResourcesEnginePath + '/qbe/templates/temporalFilters.html',
		      clickOutsideToClose:true
		    })
		    .then(function(answer) {
		      $scope.status = 'You said the information was "' + answer + '".';
		    }, function() {
		      $scope.status = 'You cancelled the dialog.';
		    });
	}

	$scope.addSelectedFilter = function () {
		console.log($scope.selectedTemporalFilter);
		var entities = [];
		var temporalFilter = {};

		entity_service.getEntitiyTree(sbiModule_inputParams.modelName).then(function(response){
			entities = response.data.entities;
			for (var i = 0; i < entities.length; i++) {
				if(entities[i].iconCls=='temporal_dimension'){
					for (var j = 0; j < entities[i].children.length; j++) {
						if(entities[i].children[j].iconCls=='the_date'){
							temporalFilter.id=entities[i].children[j].id;
							temporalFilter.ld=entities[i].children[j].attributes.longDescription;
						}
					}
				}
		}
		$scope.filterIndex = checkForIndex();
		$scope.showTable = false;
		$scope.targetOption = "default";
		var object = {
				"filterId": "Filter"+$scope.filterIndex,
				"filterDescripion": "Filter"+$scope.filterIndex,
				"filterInd": $scope.filterIndex,
				"promptable": false,
				"leftOperandValue": temporalFilter.id,
				"leftOperandDescription": temporalFilter.ld,
				"leftOperandLongDescription": temporalFilter.ld,
				"leftOperandType": "Field Content",
				"leftOperandDefaultValue": null,
				"leftOperandLastValue": null,
				"leftOperandAlias": null,
				"leftOperandDataType": "",
				"operator": "BETWEEN",
				"rightOperandValue": [$scope.selectedTemporalFilter.definition[0].from, $scope.selectedTemporalFilter.definition[0].to],
				"rightOperandDescription": $scope.selectedTemporalFilter.definition[0].from+" 00:00:00 "+"---- "+$scope.selectedTemporalFilter.definition[0].to+" 00:00:00",
				"rightOperandLongDescription": $scope.selectedTemporalFilter.definition[0].from+" 00:00:00 "+"---- "+$scope.selectedTemporalFilter.definition[0].to+" 00:00:00",
				"rightOperandType": "Static Content",
				"rightOperandDefaultValue": [""],
				"rightOperandLastValue": [""],
				"rightOperandAlias": null,
				"rightOperandDataType": "",
				"booleanConnector": "AND",
				"deleteButton": false
			}
		$scope.filters.push(object);
		console.log($scope.filters);
		$mdDialog.cancel();

		});
	}

	$scope.addNewFilter= function (){
		$scope.filterIndex = checkForIndex();
		$scope.showTable = false;
		$scope.targetOption = "default";
		var object = {
				"filterId": "Filter"+$scope.filterIndex,
				"filterDescripion": "Filter"+$scope.filterIndex,
				"filterInd": $scope.filterIndex,
				"promptable": false,
				"leftOperandValue": $scope.ngModel.field.id,
				"leftOperandDescription": $scope.ngModel.field.entity+ " : " + $scope.ngModel.field.name,
				"leftOperandLongDescription": $scope.ngModel.field.entity+ " : " + $scope.ngModel.field.name,
				"leftOperandType": "Field Content",
				"leftOperandDefaultValue": null,
				"leftOperandLastValue": null,
				"leftOperandAlias": $scope.ngModel.field.name,
				"leftOperandDataType": "",
				"operator": "EQUALS TO",
				"rightOperandValue": [],
				"rightOperandDescription": "",
				"rightOperandLongDescription": "",
				"rightOperandType": "",
				"rightType" : "manual",
				"rightOperandDefaultValue": [""],
				"rightOperandLastValue": [""],
				"rightOperandAlias": null,
				"rightOperandDataType": "",
				"booleanConnector": "AND",
				"deleteButton": false,
				"color": $scope.ngModel.field.color,
				"entity": $scope.ngModel.field.entity
			}
		$scope.filters.push(object);
	}

	$scope.deleteFilter = function (filter){

		filters_service.deleteFilter($scope.filters,filter,$scope.ngModel.expression,$scope.ngModel.advancedFilters);
	}

	$scope.entitiesField=[];
	for (var i = 0; i < $scope.tree.length; i++) {
		if($scope.tree[i].qtip==$scope.field.entity  ){
			for (var j = 0; j < $scope.tree[i].children.length; j++) {
				if($scope.tree[i].children[j].iconCls!="relation")
					$scope.entitiesField.push($scope.tree[i].children[j])
			}

			break;
		}
	}

	$scope.booleanConnectors = filters_service.booleanConnectors;
	$scope.getConditionOptions = filters_service.getOperators;

	$scope.entityTypes = entity_service.getEntityTypes();
	$scope.getConditionOptions = function() {
		if($scope.spatial && $scope.entityTypes.indexOf("geographical dimension")>-1){
			return filters_service.getOperators.concat(filters_service.getSpatialOperators);
		} else {
			return filters_service.getOperators;
		}
	}

	$scope.getConditionOptionsbyField = function(fieldId){

		if($scope.spatial && entity_service.isEntityType($scope.tree,fieldId,"geographic_dimension")){
			return filters_service.getOperators.concat(filters_service.getSpatialOperators);
		} else {
			return filters_service.getOperators;
		}

	}








	$scope.fillInput = function (filter, type, value){
		switch (value) {
		case "subquery":
			setRight(filter, type, value);
			break;
		case "field":
			setRight(filter, type, value);
			break;
		case "parameter":
			setRight(filter, type, value);
			break;
		default:

			break;
		}
	}
	var setRight = function (filter, type, value){
		if(value=='field'){
			filter.rightOperandValue=[];
			filter.rightOperandValue.push(type.id) ;
			filter.rightOperandType="Field Content";
			filter.rightOperandDescription=type.attributes.entity+" "+": "+type.text;
			filter.rightOperandLongDescription=type.attributes.entity+" "+": "+type.text;
			filter.rightOperandAlias=type.text;
		} else if(value=='subquery'){
			filter.rightOperandValue.push(type.id);
			filter.rightOperandDescription=type.name;
			filter.rightOperandLongDescription="Subquery "+type.name;
			filter.rightOperandType="Subquery";
		} else if(value=='parameter'){
			filter.hasParam = true;
			filter.paramName = type.name;
			filter.rightOperandValue.length = 0;
			filter.rightOperandValue.push("$P{"+type.name+"}")
			filter.rightOperandDescription="$P{"+type.name+"}";
			filter.rightOperandLongDescription="Static Content "+ "$P{"+type.name+"}";
			filter.rightOperandType="Static Content";
		} else {
			filter.rightOperandType="Static Content";
		}

	};
	$scope.changeTarget = function (option, filter){
		$scope.showTable = false;
		switch (option) {
		case "valueOfField":
			filter.rightOperandType="Static Content";
			$scope.currentFilter = filter;
			$scope.showTable = true;
			openTableWithValues($scope.currentFilter);
			break;
		case "anotherEntity":
			filter.rightOperandType="Field Content";
			break;
		case "subquery":
			filter.rightOperandType="Subquery";
			break;
		case "parameter":
			filter.rightOperandType="Static Content";
			break;
		default:
			filter.rightOperandType="Static Content";
			break;
		}
	}
	$scope.showTable = false;
	$scope.listOfValues = [];
	var openTableWithValues = function (filter){
		//$scope.selected.length=filter.rightOperandValue.length;
		$scope.showTable = true;
		filters_service.getFieldsValue($scope.ngModel.field.id).then(function(response){
			$scope.listOfValues = response.data.rows;
			$scope.valuesGrid.api.setRowData($scope.listOfValues);
			$scope.valuesGrid.api.forEachNode( function (node) {
				for (var i = 0; i < filter.rightOperandValue.length; i++) {
					if (node.data.column_1 === filter.rightOperandValue[i]) {
						$scope.valuesGrid.api.selectNode(node, true);

			        }

				}

		    });

		});

	}

	$scope.left = null;
	$scope.setLeftValue= function (value,filter){
		$scope.left = value.id;
		filter.leftOperandValue = value.id;
		filter.leftOperandDescription = $scope.ngModel.field.entity+ " : "+value.text;
		filter.leftOperandLongDescription = $scope.ngModel.field.entity+ " : "+value.text;
		filter.leftOperandAlias = value.text;
	}

	$scope.selectChanged = function (entity){

		$scope.targetAF = entity;
		$scope.entitiesChildren=[];
		for (var i = 0; i < $scope.targetAF.children.length; i++) {
			if($scope.targetAF.children[i].iconCls!="relation") {
				$scope.entitiesChildren.push($scope.targetAF.children[i])
			}
		}
	}

	$scope.edit = function (filter){
		filter.rightOperandValue.length = 0;
		manageSpecOperators (filter)
		filter.rightOperandType="Static Content";
	}
	$scope.saveFilters=function(){
		var countParam = 0;
		for (var i = 0; i < $scope.filters.length; i++) {
			if($scope.filters[i].hasParam){
				countParam++;
			}
			manageSpecOperators($scope.filters[i]);
		}

		if($scope.pars.length>0 && countParam>0){
			$scope.params=true;
		} else {
			$scope.ngModel.queryFilters.length = 0;
			$scope.ngModel.advancedFilters.length = 0;
			Array.prototype.push.apply($scope.ngModel.queryFilters, $scope.filters);
			angular.copy(filters_service.generateExpressions ($scope.filters,$scope.ngModel.expression) ,$scope.ngModel.expression);
			Array.prototype.push.apply($scope.ngModel.advancedFilters, $scope.advancedFilters);
			$scope.ngModel.mdPanelRef.close();
		}
	}
	var manageSpecOperators = function (filter) {
		if(filter.rightType == "manual" || filter.rightType == "valueOfField" ) {
			if (filter.operator == 'BETWEEN' || filter.operator == 'NOT BETWEEN' ||
					filter.operator == 'IN' || filter.operator == 'NOT IN' || filter.rightOperandDescription.indexOf(" ---- ")>-1) {
				var splitted = filter.rightOperandDescription.split(" ---- ");
				filter.rightOperandValue.length = 0;
				Array.prototype.push.apply(filter.rightOperandValue, splitted);
			} else {
				filter.rightOperandValue.length = 0;
				filter.rightOperandValue.push(filter.rightOperandDescription);
			}
		}

	}
	$scope.closeFilters=function(){
		$scope.ngModel.mdPanelRef.close();
	}


	$scope.parametersPreviewColumns = [
		{"headerName":$scope.translate.load("kn.qbe.params.name"),"field":"name"},
		{"headerName":$scope.translate.load("kn.qbe.params.value"),"field":"value",  editable: true},
		{"headerName":$scope.translate.load("kn.qbe.params.value"),"field":"defaultValue",hide:true},


	];

	$scope.applyParams = function (){
		$scope.ngModel.queryFilters.length = 0;
		$scope.ngModel.pars.length = 0;
		Array.prototype.push.apply($scope.ngModel.pars, $scope.pars);
		Array.prototype.push.apply($scope.ngModel.queryFilters, $scope.filters);
		angular.copy(filters_service.generateExpressions ($scope.filters,$scope.ngModel.expression) ,$scope.ngModel.expression);
		$scope.ngModel.mdPanelRef.close();
	};

	$scope.columns = [
		{"headerName":"Valori","field":"column_1",checkboxSelection:true,rowMultiSelectWithClick:true}
	];

	$scope.valuesGrid = {
			rowData: null,
			angularCompileRows: true,
	        enableColResize: false,
	        enableFilter: true,
	        enableSorting: true,
	        pagination: true,
	        suppressRowClickSelection: true,
	        paginationAutoPageSize: true,
	        columnDefs:$scope.columns,
	        rowSelection:"multiple",
	        onRowSelected: rowSelected,
	        onGridSizeChanged: resizeColumns,
	        onGridReady: resizeColumns

	};
	function resizeColumns(){
	    $scope.valuesGrid.api.sizeColumnsToFit();
	};
	function rowSelected(){
	    $scope.selected = $scope.valuesGrid.api.getSelectedRows();
	    $scope.forInput = '';
		for (var i = 0; i < $scope.selected.length; i++) {
			$scope.forInput += $scope.selected[i].column_1;
			if(i+1!=$scope.selected.length) 	$scope.forInput += " ---- "
		}
		if($scope.currentFilter) {
			$scope.currentFilter.rightOperandDescription = angular.copy($scope.forInput);
			/*$scope.currentFilter.rightOperandValue=[];
			for (var i = 0; i < $scope.selected.length; i++) {
				$scope.currentFilter.rightOperandValue.push($scope.selected[i].column_1)
			}*/
			$scope.currentFilter.rightOperandType="Static Content";
			$scope.currentFilter.rightOperandLongDescription=$scope.currentFilter.rightOperandDescription;
		}
	};

	$scope.paramsPreviewGrid = {
			rowData: $scope.pars,
			angularCompileRows: true,
			stopEditingWhenGridLosesFocus:true,
	        enableColResize: false,
	        enableFilter: true,
	        enableSorting: true,
	        pagination: true,
	        suppressRowClickSelection: true,
	        paginationAutoPageSize: true,
	        columnDefs:$scope.parametersPreviewColumns,
	        onGridSizeChanged: resizeColumnsParams,
	        onGridReady: resizeColumnsParams,
	        editType: 'fullRow',
	        onRowValueChanged: function(event,a) {
	        	if(!event.data.value) {
	        		event.data["value"] = event.data.defaultValue;
	        	}

	        },

	};

	function resizeColumnsParams(){
	    $scope.paramsPreviewGrid.api.sizeColumnsToFit();
	}

}
})();