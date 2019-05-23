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

var app =angular.module('chartDesignerManager', ['chart-directives','ChartDesignerService', 'chartengine.settings'])

app.config(['$mdThemingProvider', function($mdThemingProvider) {
    $mdThemingProvider.theme('knowage')
    $mdThemingProvider.setDefaultTheme('knowage');
}]);

app.controller("ChartDesignerController", ["sbiModule_translate","channelMessaging","$scope","sbiModule_config", "sbiModule_restServices", "sbiModule_messaging", "PreviewService","sbiModule_logger", "$mdToast","$mdDialog","sbiModule_user","$httpParamSerializer",ChartDesignerFunction]);

function ChartDesignerFunction(sbiModule_translate,channelMessaging,$scope,sbiModule_config, sbiModule_restServices, sbiModule_messaging,PreviewService,sbiModule_logger,$mdToast,$mdDialog,sbiModule_user,$httpParamSerializer) {

	$scope.previewChartEnable =( sbiModule_user.functionalities.indexOf("PreviewChart")>-1)? true:false;
	if(parent.angular.element(window.frameElement).scope().isCockpitEng){
		$scope.isCockpitEng = parent.angular.element(window.frameElement).scope().isCockpitEng;
	}else{
		$scope.isCockpitEng = false;
	}

	console.log($scope.isCockpitEng);
	//sbiModule_logger.disableConsole();
	$scope.translate = sbiModule_translate;
	$scope.httpParamSerializer = $httpParamSerializer;
	$scope.showimg = false;
	$scope.previewButtonEnabled = false;
	$scope.selectedChartType = "";

	var urlForDataset="";

	var findInArray = function(array, attr, value) {
	    for(var i = 0; i < array.length; i += 1) {
	        if(array[i][attr] === value) {
	            return i;
	        }
	    }
	    return -1;
	}

	if($scope.isCockpitEng){
		urlForDataset = "../api/1.0/chart/jsonChartTemplate/usedDataset/"+parent.angular.element(window.frameElement).scope().datasetId;
	}else{
		urlForDataset = "../api/1.0/chart/jsonChartTemplate/usedDataset";
	}
	sbiModule_restServices.promiseGet(urlForDataset, "")
		.then(function(response) {

			$scope.isRealTimeDataset = response.data;

		}, function(response) {

			var message = "";

			if (response.status==500) {
				message = response.statusText;
			}
			else {
				message = response.data.errors[0].message;
			}

			sbiModule_messaging.showErrorMessage(message, 'Error');

		});
	$scope.disableHtmlElementForChartJs = function() {
		if($scope.libInUse=='chartJs') {
			return false;
		} else return true;
	}
	$scope.saveChartTemplate = function(saving) {//izmena
		if(saving){

			$scope.attachCategoriesToTemplate();
			if($scope.selectedChartType == 'scatter'){
				$scope.attachSeriesToTemplate();
			}

			$scope.chartTemplate.COLORPALETTE.COLOR = $scope.colors;
			if($scope.chartTemplate.hasOwnProperty("COLORPALETTE")){
				var color = $scope.chartTemplate.COLORPALETTE.COLOR;
				for (var i = 0; i < color.length; i++) {
					if(color[i].hasOwnProperty("$$hashKey")){
						delete color[i].$$hashKey;
					}
				}
			}
			prepareTemplate();
			if(!checkChartSettings()){
				if($scope.chartTemplate.type.toUpperCase()=="SCATTER"){
					showAction($scope.translate.load('sbi.cockpit.select.no.aggregation.for.all.series'));
				}
				if ($scope.chartTemplate.type.toUpperCase()=="BAR" || $scope.chartTemplate.type.toUpperCase()=="LINE" ) {
					showAction($scope.translate.load('sbi.chartengine.validation.addserie.arearange.parLowHigh'));
				}

			}
			else {
				var temp = {"CHART":$scope.chartTemplate}
				if(temp.CHART.VALUES.CATEGORY){
					if(temp.CHART.VALUES.CATEGORY.name=="" || temp.CHART.VALUES.CATEGORY.name==null || temp.CHART.VALUES.CATEGORY.name==undefined){
						temp.CHART.VALUES.CATEGORY.name=temp.CHART.VALUES.CATEGORY.column
					}
				}

				var toSend = {}
				toSend.jsonTemplate = angular.toJson(temp);
				toSend.docLabel = docLabel;
				sbiModule_restServices.promisePost('../api/1.0/chart/template/save','',$scope.httpParamSerializer(toSend) , {
					transformRequest:angular.identity,
					headers:{'Content-Type': ' application/x-www-form-urlencoded; charset=utf-8'}
				})
				.then(function(response) {
					console.log("[POST]: SUCCESS!");
					sbiModule_messaging.showSuccessMessage(sbiModule_translate.load("sbi.chartengine.designer.savetemplate.success"), sbiModule_translate.load("sbi.generic.success"));
				}, function(response) {
					sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');
				});
			}//izmena

		}

	}
	var showAction = function(text) {
		var toast = $mdToast.simple()
		.content(text)
		.action('OK')
		.highlightAction(false)
		.hideDelay(3000)
		.position('top')
		$mdToast.show(toast).then(function(response) {
			if ( response == 'ok' ) {
			}
		});
	}

	$scope.goBackFromDesigner = function() {
		channelMessaging.sendMessage();
	}

	// The chart template (beneath the CHART tag, i.e. property)


/*	var templateObj = angular.fromJson(template);
	$scope.chartTemplate = templateObj.CHART;
	console.log("chart template: ",$scope.chartTemplate);
	*/





	//$scope.nik = {"a":"b","c":"d","e":"f"}

	// Needed for the preview of the chart (calling the Highcharts exporter
	$scope.exporterContextName = exporterContextName;

	$scope.allMeasures = [];
	$scope.allAttributes = [];

	$scope.categoriesExist = false;

	$scope.categoriesContainer = [];
	$scope.seriesContainer = [];

	$scope.checkChanged = function() {
		$scope.changedArray = [];
		console.log($scope.configurationForm);
		angular.forEach($scope.configurationForm, function(value, key) {
			 if(key[0] == '$'){
				 return;
			 }
			 if(value.$pristine == false){
				 var changedObj = {};

				 changedObj.name = key;
				 changedObj.value = value.$modelValue;

				 $scope.changedArray.push(changedObj);
			 }
			});
		if($scope.changedArray.length == 0){
			return -1;
		}else{
			return $scope.changedArray;
		}
	}

	/*$scope.testChart = function() {
		//$scope.chartTemplate.COLORPALETTE.COLOR = $scope.colors;
		prepareTemplate();
		//sbiModule_logger.clearConsole(); // only for dev
		console.log($scope.chartTemplate);
		console.log($scope.chartTemplate.VALUES.SERIE);
		console.log($scope.chartTemplate.AXES_LIST.AXIS);

	}*/



	window.attachCategories = function() {
		$scope.attachCategoriesToTemplate();
		if($scope.selectedChartType == 'scatter'){
			$scope.attachSeriesToTemplate();
		}

		$scope.chartTemplate.COLORPALETTE.COLOR = $scope.colors;
		var chartObj = angular.copy($scope.chartTemplate);
		var chartTemp = {}
		chartTemp.CHART = chartObj;
		angular.copy(chartTemp, $scope.chartTemplate);
	}

	window.validateForm = function() {
		if(!$scope.userForm.$valid){
			sbiModule_messaging.showErrorMessage(sbiModule_translate.load("sbi.data.editor.association.AssociationEditor.warning.message"), sbiModule_translate.load("sbi.data.editor.association.AssociationEditor.warning"));
		}
		return $scope.userForm.$valid;
	}

	$scope.refreshJsonTree = function() {
		$scope.attachCategoriesToTemplate(true);

	}

	$scope.attachSeriesToTemplate = function() {

		var valueSeries = $scope.chartTemplate.VALUES.SERIE;
		var totalSeries = $scope.allMeasures;

		for(var i = 0; i < totalSeries.length; i++){

			if(findInArray(valueSeries,'column',totalSeries[i].alias) == -1){

				valueSeries.push({axis:"Y",color:"",column:totalSeries[i].alias,groupingFunction:"NONE", name:totalSeries[i].alias,orderType:"",postfixChar:"",
					precision:2,prefixChar:"",scaleFactor:"empty",showAbsValue:"false",showPercentage:false, showValue: "",type:"",fakeSerie:true})

			}

		}

	}

	$scope.attachCategoriesToTemplate = function(advancedTrue) {
		var chartType = $scope.selectedChartType;
		//attach categories to template for chart types that have an array for categories
		if (chartType.toUpperCase() == "SUNBURST" || chartType.toUpperCase() == "WORDCLOUD" ||
				chartType.toUpperCase() == "TREEMAP" || chartType.toUpperCase() == "PARALLEL" ||
				chartType.toUpperCase() == "HEATMAP" || chartType.toUpperCase() == "CHORD"
					||
				chartType.toUpperCase() == "SCATTER"
					) {
			$scope.chartTemplate.VALUES.CATEGORY = angular.copy($scope.categories);

			if(chartType.toUpperCase() == "SCATTER" && !advancedTrue){

				var valueCategories = $scope.chartTemplate.VALUES.CATEGORY
				var totalAttributes = $scope.allAttributes;

				for(var i = 0; i < totalAttributes.length; i++){
					if(valueCategories[0].column != totalAttributes[i].alias){

						valueCategories.push({column:totalAttributes[i].alias,
												groupby:"",
												groupbyNames:"",
												name:totalAttributes[i].alias,
												orderColumn:"",
												orderType:"",
												stacked:"",
												stackedType:"",
												fakeCategory:true});
					}
				}

			}

		//attach categories to template for chart types that have an object for categories
		} else if (chartType.toUpperCase() != "GAUGE"){
			if($scope.chartTemplate.VALUES.CATEGORY.drillOrder){
				var tempDrillOrder = $scope.chartTemplate.VALUES.CATEGORY.drillOrder;
			}

			$scope.chartTemplate.VALUES.CATEGORY = {
							column:"",
							groupby:"",
							groupbyNames:"",
							name:"",
							orderColumn:"",
							orderType:"",
							stacked:"",
							stackedType:""
					};
			for (var i = 0; i < $scope.categories.length; i++) {
				if(i==0){
					$scope.chartTemplate.VALUES.CATEGORY.column = $scope.categories[i].column;
					$scope.chartTemplate.VALUES.CATEGORY.name = $scope.categories[i].name;
					if($scope.chartTemplate.VALUES.CATEGORY.orderColumn==""){
						if(tempDrillOrder)
						$scope.chartTemplate.VALUES.CATEGORY.orderColumn = tempDrillOrder[$scope.categories[i].column] ? tempDrillOrder[$scope.categories[i].column].orderColumn : $scope.categories[i].orderColumn;
					}

					if($scope.chartTemplate.VALUES.CATEGORY.orderType==""){
						if(tempDrillOrder)
						$scope.chartTemplate.VALUES.CATEGORY.orderType =  tempDrillOrder[$scope.categories[i].column] ? tempDrillOrder[$scope.categories[i].column].orderType : $scope.categories[i].orderType;
					}
					if($scope.chartTemplate.VALUES.CATEGORY.stacked==""){
						$scope.chartTemplate.VALUES.CATEGORY.stacked = $scope.categories[i].stacked;
					}
					if($scope.chartTemplate.VALUES.CATEGORY.stackedType==""){
						$scope.chartTemplate.VALUES.CATEGORY.stackedType = $scope.categories[i].stackedType;
					}
				} else {
					if($scope.chartTemplate.VALUES.CATEGORY.groupby==""){
						$scope.chartTemplate.VALUES.CATEGORY.groupby = $scope.categories[i].column;
					} else {
						$scope.chartTemplate.VALUES.CATEGORY.groupby = $scope.chartTemplate.VALUES.CATEGORY.groupby +", "+ $scope.categories[i].column;
					}
					if($scope.chartTemplate.VALUES.CATEGORY.groupbyNames=="") {
						if($scope.categories[i].name!="") {
							$scope.chartTemplate.VALUES.CATEGORY.groupbyNames = $scope.categories[i].column;
						}
					} else {
						if($scope.categories[i].name!="") {
							$scope.chartTemplate.VALUES.CATEGORY.groupbyNames = $scope.chartTemplate.VALUES.CATEGORY.groupbyNames + ", " + $scope.categories[i].column;
						}
					}
				}
			}
			if(tempDrillOrder)
			$scope.chartTemplate.VALUES.CATEGORY.drillOrder = tempDrillOrder;
		}
	}

	$scope.clearStyleTag = function(style) {
		if(style == "default"){
			return "default";
		}else{
			return style;
		}
	}

	var prepareTemplate = function() {

		if( $scope.selectedChartType.toUpperCase() == "GAUGE"){

			for (var i = 0; i < $scope.chartTemplate.AXES_LIST.AXIS.length; i++) {

				if($scope.chartTemplate.AXES_LIST.AXIS[i].type == 'Category'){
					$scope.chartTemplate.AXES_LIST.AXIS.splice(i,1);
				}
			}
			if($scope.chartTemplate.AXES_LIST.AXIS[0].PLOTBANDS == ""){
				$scope.chartTemplate.AXES_LIST.AXIS[0].PLOTBANDS = {};
				$scope.chartTemplate.AXES_LIST.AXIS[0].PLOTBANDS.PLOT = [];
			}
			$scope.chartTemplate.styleName = $scope.clearStyleTag($scope.chartTemplate.styleName);

		} else {
			if(checkChartSettings()){
				$scope.attachCategoriesToTemplate();
				$scope.chartTemplate.styleName = $scope.clearStyleTag($scope.chartTemplate.styleName);
			}
		}
		if($scope.chartTemplate.type == "SCATTER" || $scope.chartTemplate.type == "BAR" || $scope.chartTemplate.type == "LINE"){
	    	  for (var i = 0; i < $scope.chartTemplate.VALUES.SERIE.length; i++) {
	    		  for (var j = 0; j < $scope.chartTemplate.AXES_LIST.AXIS.length; j++) {
						if($scope.chartTemplate.VALUES.SERIE[i].axis == $scope.chartTemplate.AXES_LIST.AXIS[j].alias && $scope.chartTemplate.AXES_LIST.AXIS[j].labels){
							$scope.chartTemplate.VALUES.SERIE[i].scaleFactor = $scope.chartTemplate.AXES_LIST.AXIS[j].labels.scaleFactor
						}
		    	  }
	    	  }
		}

	}
	var checkChartSettings = function (){
		var f = true;
		if( $scope.selectedChartType.toUpperCase() == "SCATTER" && $scope.chartTemplate.VALUES.SERIE.length>1){

			var allSeries = $scope.chartTemplate.VALUES.SERIE;
			var counter = 0;

			for (var i = 0; i < allSeries.length; i++) {
				if(allSeries[i].groupingFunction=="NONE"){
					counter++
				};
			}
			console.log(counter);
			if(counter<$scope.chartTemplate.VALUES.SERIE.length){
				f  = false;
			}
			if(counter ==0 ) f = true;

		}  else if (($scope.selectedChartType.toUpperCase() == "BAR" || $scope.selectedChartType.toUpperCase() == "LINE") &&  $scope.chartTemplate.VALUES.SERIE.length>0) {
			  var allSeries =  $scope.chartTemplate.VALUES.SERIE;
				var counterlow = 0;
				var counterhigh = 0;
				for (var i = 0; i < allSeries.length; i++) {
					if(allSeries[i].type=="arearangelow"){
						counterlow++
					};
				}
				for (var i = 0; i < allSeries.length; i++) {
					if(allSeries[i].type=="arearangehigh"){
						counterhigh++
					};
				}
				if(counterlow!=counterhigh){
					f=false;
				}
		  }
		return f;
	}
	$scope.previewChart = function () {
		$scope.openPreviewPanel = true;
		$scope.hideStructureDetails();
		$scope.chartTemplate.COLORPALETTE.COLOR = $scope.colors;
		prepareTemplate();

		if(!checkChartSettings()){
			if($scope.chartTemplate.type.toUpperCase()=="SCATTER"){
				showAction($scope.translate.load('sbi.cockpit.select.no.aggregation.for.all.series'));
			}
			if ($scope.chartTemplate.type.toUpperCase()=="BAR" || $scope.chartTemplate.type.toUpperCase()=="LINE" ) {
				showAction($scope.translate.load('sbi.chartengine.validation.addserie.arearange.parLowHigh'));
			}

		}
		else {
			$scope.showimg = false;
			$scope.showEl = true;
			PreviewService.run($scope.chartTemplate).then(
					function successPreviewUrl (response) {
						$scope.showEl = false;
						$scope.showimg = true;
						$scope.previewUrl = sbiHost + '/highcharts-export-web/' + response.data;
					}, function errorPreviewUrl (response) {
						sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');
					});
		}
	}

}