/*
Knowage, Open Source Business Intelligence suite
Copyright (C) 2016 Engineering Ingegneria Informatica S.p.A.

Knowage is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

Knowage is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * @authors Giulio Gavardi (Giulio.Gavardi@eng.it)
 * v0.0.1
 *
 */
(function() {
angular.module('cockpitModule').directive('cockpitCrossConfigurator',function($compile){
	   return{
		   templateUrl: baseScriptPath+ '/directives/cockpit-cross-configurator/template/cockpitCrossConfigurator.html',
		   controller: cockpitCrossConfiguratorControllerFunction,
		   transclude: true,
		   scope: true,

		   	compile: function (tElement, tAttrs, transclude) {
                return {
                    pre: function preLink(scope, element, attrs, ctrl, transclud) {
                    },
                    post: function postLink(scope, element, attrs, ctrl, transclud) {

                    	scope.ngModel = scope.$parent.$eval(attrs.ngModel);

                    	if(scope.ngModel==undefined){
                    		scope.$parent.$eval(attrs.ngModel+"={}");
                    		scope.ngModel = scope.$parent.$eval(attrs.ngModel);
                    	}

                    	if(attrs.widget!=undefined){
                    		scope.isWidget=true;
                    		scope.initModel();
                    	}else{
                    		scope.isWidget=false;
                    	}

                    	 transclude(scope, function (clone, scope) {
                             angular.element(element[0].querySelector("md-content")).prepend(clone);
                         });

                    }
                };
		   	}
	   }
});

angular.module('cockpitModule').directive('cockpitCrossCustomWidgetConfigurator',function($compile){
	   return{
		   templateUrl: baseScriptPath+ '/directives/cockpit-cross-configurator/template/cockpitCrossCustomWidgetConfigurator.html',
		   transclude: true,
		   replace: true,
		   controller: function(){},
		   controllerAs : "cscwc_controller",
		   scope: true,
		   compile: function (tElement, tAttrs, transclude) {
             return {
                 pre: function preLink(scope, element, attrs,ctrl, transclud) {
                 },
                 post: function postLink(scope, element, attrs,ctrl, transclud) {

                	ctrl.labelWidget = scope.$parent.$eval(attrs.label);
                	ctrl.layoutType = attrs.layout;
                	 if(ctrl.layoutType==undefined){
                		 ctrl.layoutType="row";
                	 }
                	 transclude(scope, function (clone, scope) {
                         angular.element(element[0].querySelector("md-card>md-card-content")).append(clone);
                     });
                 }
             };
		   	}
	   }
});

function cockpitCrossConfiguratorControllerFunction($scope,sbiModule_translate,cockpitModule_template,cockpitModule_generalServices,knModule_fontIconsService,
		cockpitModule_generalOptions,cockpitModule_datasetServices, cockpitModule_properties, cockpitModule_documentServices, cockpitModule_crossServices, $filter){
	$scope.translate=sbiModule_translate;
	$scope.cockpitModule_generalOptions=cockpitModule_generalOptions;
	$scope.cockpitModule_properties=cockpitModule_properties;
	$scope.angular=angular;
	$scope.cockpitCross={};
	$scope.localDataset = {};
	$scope.crossNavigations = cockpitModule_crossServices.getCrossList();
	$scope.chartProperties=[];
	$scope.widgetAvailableColumns = [];
	$scope.availableIcons = knModule_fontIconsService.icons;
	$scope.outputParametersType=
		[{"value": "static", "label" : $scope.translate.load("sbi.cockpit.cross.outputParameters.type.static")},
		{"value": "dynamic", "label" : $scope.translate.load("sbi.cockpit.cross.outputParameters.type.dynamic")},
		{"value": "selection", "label" : $scope.translate.load("sbi.cockpit.cross.outputParameters.type.selection")}
		];
	
	$scope.previewParametersType=
		[{"value": "static", "label" : $scope.translate.load("sbi.cockpit.cross.outputParameters.type.static")},
		{"value": "driver", "label":'Analytical Driver'},
		{"value": "selection", "label" : $scope.translate.load("sbi.cockpit.cross.outputParameters.type.selection")},
		{"value": "dataset", "label":'Dataset Value'},
		];
	
	//$scope.cockpitDatasets = cockpitModule_template.configuration.datasets;
	$scope.cockpitDatasets = cockpitModule_datasetServices.datasetList;
	if($scope.cockpitDatasets == undefined) $scope.cockpitDatasets = [];
	$scope.allCockpitDatasetsColumns = {};
	for(var i = 0; i < $scope.cockpitDatasets.length;i++){
		var meta = $scope.cockpitDatasets[i].metadata.fieldsMeta;
		$scope.allCockpitDatasetsColumns[$scope.cockpitDatasets[i].label] = meta;
	}
	
	$scope.getTemplateUrl = function(template){
		return cockpitModule_generalServices.getTemplateUrl('tableWidget',template)
	}

	$scope.chooseIcon = function(type){
		if($scope.iconOpened == type) $scope.iconOpened = false;
		else $scope.iconOpened = type;
	}
	
	$scope.setIcon = function(family,icon){
		$scope.ngModel[$scope.iconOpened].icon = family.className+' '+icon.className;
		$scope.iconOpened = false;
	}
	
	$scope.changePreviewDataset = function(dsId){
		$scope.ngModel.preview.parameters = cockpitModule_datasetServices.getDatasetById(dsId).parameters;
	}
	$scope.outputParametersList = [];

	var docOutParList = cockpitModule_properties.OUTPUT_PARAMETERS;
	if($scope.cockpitCross.outputParametersList == undefined){
		$scope.cockpitCross.outputParametersList = [];
	}
	
	for(var propt in docOutParList){
		var dataType = docOutParList[propt];
		var typeToPut="text";
		if(dataType.includes(".date")){
			typeToPut = "date";
		}
		else if(dataType.includes(".num")){
			typeToPut = "number";
		}

		var par = {"name" : propt, "enabled" : false, "type" : undefined, "dataset" : undefined, "column" : undefined, "dataType": typeToPut};
		$scope.outputParametersList.push(par);

	}
	
	$scope.crossTable = $scope.model != undefined && $scope.model.type === 'table';
	
	$scope.crossChart = $scope.localModel != undefined && $scope.localModel.wtype === 'chart';
	
	$scope.toggleEnabled = function(type){
		
		if($scope.crossTable){
			if(type=='preview' && $scope.ngModel.cross && $scope.ngModel.cross.enable) {
				$scope.model.cross.enable = $scope.ngModel.cross.enable = false;
			}
			if(type=='cross' && $scope.ngModel.preview && $scope.ngModel.preview.enable) {
				$scope.model.preview.enable = $scope.ngModel.preview.enable = false;
			}
		}else{
			if(type=='preview' && $scope.ngModel.cross && $scope.ngModel.cross.enable) {
				$scope.localModel.cross.enable = $scope.ngModel.cross.enable = false;
			}
			if(type=='cross' && $scope.ngModel.preview && $scope.ngModel.preview.enable) {
				$scope.localModel.preview.enable = $scope.ngModel.preview.enable = false;
			}
		}
		
	}
	
	$scope.$watchCollection('ngModel.preview.dataset',function(newValue,oldValue){
		var newPreviewingDSLabel = cockpitModule_datasetServices.getDatasetLabelById(newValue);
		if ($scope.allCockpitDatasetsColumns[newPreviewingDSLabel] == undefined) {
			var foundDs = $filter('filter')($scope.cockpitDatasets, {label: newPreviewingDSLabel}, true);
			if (foundDs.length > 0)					
			$scope.allCockpitDatasetsColumns[newPreviewingDSLabel] = foundDs[0].metadata.fieldsMeta;
		} 
		$scope.previewDatasetColumns = $scope.allCockpitDatasetsColumns[newPreviewingDSLabel];
	});

	if($scope.crossChart){
		$scope.localModel.cross = $scope.localModel.cross || {};
		$scope.localModel.preview = $scope.localModel.preview || {};
		var chart = $scope.localModel.chartTemplate.CHART;
		if(!chart){
			chart = $scope.localModel.chartTemplate;
		}
		$scope.chartProperties=cockpitModule_crossServices.getChartParameters(chart.type, chart);
	}else {
		if($scope.model){
			$scope.model.cross = $scope.model.cross || {};
			$scope.model.preview = $scope.model.preview || {};
		   if($scope.model.dataset!=undefined && $scope.model.dataset.dsId != undefined){
			   
			   angular.copy(cockpitModule_datasetServices.getDatasetById($scope.model.dataset.dsId), $scope.localDataset);
		   }else{
			   $scope.model.dataset= {};
			   //angular.copy([], $scope.model.dataset.metadata.fieldsMeta);
		   }
		}
	}
	angular.copy(cockpitModule_template.configuration.cross,$scope.cockpitCross);

	$scope.initModel=function(){
		angular.copy(angular.merge({},$scope.cockpitCross,$scope.ngModel),$scope.ngModel)
	}

	$scope.resetCross=function(){
		$scope.ngModel.cross=$scope.cockpitCross;
		angular.copy($scope.cockpitCross,$scope.ngModel.cross);
	}

	$scope.resetOutputParameterCross = function(outputParameter){
		var outputParametersList = $scope.ngModel.cross.outputParametersList;
		var outPar = outputParametersList[outputParameter.name];
		if(outPar != undefined){
			outPar.column="";
			outPar.dataset="";
			outPar.type="";
			outPar.value="";
			outPar.enabled=false;
		}
	}

//	$scope.changeCurrentDatasetColumns=function(dataset){
//		var meta = $scope.allCockpitDatasetsColumns[dataset.ds];
//		$scope.currentDatasetsColumns = meta;
//	}



}

})();