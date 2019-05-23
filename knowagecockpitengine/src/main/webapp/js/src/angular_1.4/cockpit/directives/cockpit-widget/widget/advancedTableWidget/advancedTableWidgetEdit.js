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
angular
	.module('cockpitModule')
	.controller('advancedTableWidgetEditControllerFunction',advancedTableWidgetEditControllerFunction)

function advancedTableWidgetEditControllerFunction($scope,finishEdit,$q,model,sbiModule_translate,$mdDialog,mdPanelRef,$mdToast,cockpitModule_datasetServices,cockpitModule_generalOptions, cockpitModule_analyticalDrivers){
	$scope.translate=sbiModule_translate;
	$scope.newModel = angular.copy(model);
	$scope.cockpitModule_generalOptions = cockpitModule_generalOptions;
	$scope.availableAggregations = ["NONE","SUM","AVG","MAX","MIN","COUNT","COUNT_DISTINCT"];
	$scope.typesMap = cockpitModule_generalOptions.typesMap;
	
	$scope.changeDS = function(id){
	    $scope.newModel.content.columnSelectedOfDataset = cockpitModule_datasetServices.getDatasetById(id).metadata.fieldsMeta;
		for(var c in $scope.newModel.content.columnSelectedOfDataset){
			if(!$scope.newModel.content.columnSelectedOfDataset[c].aliasToShow) $scope.newModel.content.columnSelectedOfDataset[c].aliasToShow = $scope.newModel.content.columnSelectedOfDataset[c].alias;
			if($scope.newModel.content.columnSelectedOfDataset[c].fieldType == 'MEASURE' && !$scope.newModel.content.columnSelectedOfDataset[c].aggregationSelected) $scope.newModel.content.columnSelectedOfDataset[c].aggregationSelected = 'NONE';
			if($scope.newModel.content.columnSelectedOfDataset[c].fieldType == 'MEASURE' && !$scope.newModel.content.columnSelectedOfDataset[c].funcSummary) $scope.newModel.content.columnSelectedOfDataset[c].funcSummary = 'SUM';
		}
		$scope.columnsGrid.api.setRowData($scope.newModel.content.columnSelectedOfDataset);
	}
	
	function moveInArray(arr, fromIndex, toIndex) {
        var element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    }
	
	$scope.columnsDefition = [
    	{headerName: 'Name', field:'alias',"editable":isInputEditable,cellRenderer:editableCell, cellClass: 'editableCell',rowDrag: true},
    	{headerName: $scope.translate.load('sbi.cockpit.widgets.table.column.alias'), field:'aliasToShow',"editable":true,cellRenderer:editableCell, cellClass: 'editableCell'},
    	{headerName: $scope.translate.load('sbi.cockpit.widgets.table.column.type'), field: 'fieldType',"editable":true,cellRenderer:editableCell, cellClass: 'editableCell',cellEditor:"agSelectCellEditor",
    		cellEditorParams: {values: ['ATTRIBUTE','MEASURE']}},{headerName: 'Data Type', field: 'type',cellRenderer:typeCell},
    	{headerName: $scope.translate.load('sbi.cockpit.widgets.table.column.aggregation'), field: 'aggregationSelected', cellRenderer: aggregationRenderer,"editable":isAggregationEditable, cellClass: 'editableCell',
    		cellEditor:"agSelectCellEditor",cellEditorParams: {values: $scope.availableAggregations}},
    	{headerName:"",cellRenderer: buttonRenderer,"field":"valueId","cellStyle":{"border":"none !important","text-align": "right","display":"inline-flex","justify-content":"flex-end"},width: 150,suppressSizeToFit:true, tooltip: false}];
	
	$scope.columnsGrid = {
		angularCompileRows: true,
		animateRows: true,
		domLayout:'autoHeight',
        enableColResize: false,
        enableFilter: false,
        enableSorting: false,
        rowDragManaged: true,
        onRowDragEnter: rowDragEnter,
        onRowDragEnd: onRowDragEnd,
        onGridReady : resizeColumns,
        onCellEditingStopped: refreshRow,
        singleClickEdit: true,
        stopEditingWhenGridLosesFocus: true,
        columnDefs: $scope.columnsDefition,
		rowData: $scope.newModel.content.columnSelectedOfDataset
	}
	
	function rowDragEnter(event){
		$scope.startingDragRow = event.overIndex;
	}
	function onRowDragEnd(event){
		moveInArray($scope.newModel.content.columnSelectedOfDataset, $scope.startingDragRow, event.overIndex);
	}
	
	function resizeColumns(){
		$scope.columnsGrid.api.sizeColumnsToFit();
	}
	
	function editableCell(params){
		return typeof(params.value) !== 'undefined' ? '<i class="fa fa-edit"></i> <i>'+params.value+'<md-tooltip>'+params.value+'</md-tooltip></i>' : '';
	}
	function typeCell(params){
		return "<i class='"+$scope.typesMap[params.value].icon+"'></i> "+$scope.typesMap[params.value].label;
	}
	function isInputEditable(params) {
		return typeof(params.data.name) !== 'undefined'; 
	}
	function isAggregationEditable(params) {
		return params.data.fieldType == "MEASURE" ? true : false;
	}
	
	function aggregationRenderer(params) {
		var aggregation = '<i class="fa fa-edit"></i> <i>'+params.value+'</i>';
		return params.data.fieldType == "MEASURE" ? aggregation : '';
	}
	
	function buttonRenderer(params){
		var calculator = '';
		if(params.data.isCalculated){
			calculator = '<calculated-field ng-model="newModel" selected-item="'+params.rowIndex+'"></calculated-field>';
		}
		
		return 	calculator +
				'<md-button class="md-icon-button" ng-click="toggleColumnVisibility(\''+params.rowIndex+'\')">'+
				'   <md-tooltip md-delay="500">Hide/show Column</md-tooltip>'+
				'	<md-icon ng-if="newModel.content.columnSelectedOfDataset['+params.rowIndex+'].style.hiddenColumn" md-font-icon="fa fa-ban fa-stack-2x text-danger"></md-icon>'+
				'	<md-icon md-font-icon="fa fa-eye"></md-icon>'+
				'</md-button>'+
				'<md-button class="md-icon-button noMargin" ng-click="draw(\''+params.data.alias+'\')" ng-style="{\'background-color\':newModel.content.columnSelectedOfDataset['+params.rowIndex+'].style[\'background-color\']}">'+
				'   <md-tooltip md-delay="500">{{::translate.load("sbi.cockpit.widgets.table.columnstyle.icon")}}</md-tooltip>'+
				'	<md-icon ng-style="{\'color\':newModel.content.columnSelectedOfDataset['+params.rowIndex+'].style.color}" md-font-icon="fa fa-paint-brush" aria-label="Paint brush"></md-icon>'+
				'</md-button>'+
				'<md-button class="md-icon-button" ng-click="deleteColumn(\''+params.data.alias+'\',$event)"><md-icon md-font-icon="fa fa-trash"></md-icon><md-tooltip md-delay="500">{{::translate.load("sbi.cockpit.widgets.table.column.delete")}}</md-tooltip></md-button>';
	}
	
	function refreshRow(cell){
		if(cell.data.fieldType == 'MEASURE' && !cell.data.aggregationSelected) cell.data.aggregationSelected = 'NONE';
		if(cell.data.fieldType == 'MEASURE' && !cell.data.funcSummary) cell.data.funcSummary = 'SUM';
		$scope.columnsGrid.api.redrawRows({rowNodes: [$scope.columnsGrid.api.getDisplayedRowAtIndex(cell.rowIndex)]});
	}
	
	$scope.colorPickerPropertyTh = {
			format:'rgb', 
			placeholder:sbiModule_translate.load('sbi.cockpit.color.select'), 
			disabled:($scope.newModel.style.th && $scope.newModel.style.th.enabled === false)
	};
	
	$scope.colorPickerMultiselection = {
			format:'rgb', 
			placeholder:sbiModule_translate.load('sbi.cockpit.color.select'), 
			disabled: !$scope.newModel.settings.multiselectable
	}
	$scope.enableMultiselect = function(){
		$scope.colorPickerMultiselection.disabled = $scope.newModel.settings.multiselectable;
	}
	
	$scope.toggleTh = function(){
		$scope.colorPickerPropertyTh.disabled = $scope.newModel.style.th.enabled;
	}
  	
  	$scope.initTh = function(){
  		return typeof($scope.newModel.style.th.enabled) != 'undefined' ? $scope.newModel.style.th.enabled : true;
  	}
  	
  	$scope.toggleColumnVisibility = function(rowIndex){
  		if($scope.newModel.content.columnSelectedOfDataset[rowIndex].style) $scope.newModel.content.columnSelectedOfDataset[rowIndex].style.hiddenColumn = !$scope.newModel.content.columnSelectedOfDataset[rowIndex].style.hiddenColumn;
  		else $scope.newModel.content.columnSelectedOfDataset[rowIndex].style = {'hiddenColumn': true};
  	}
	
	$scope.draw = function(rowName) {
		for(var k in $scope.newModel.content.columnSelectedOfDataset){
			if($scope.newModel.content.columnSelectedOfDataset[k].alias == rowName) $scope.selectedColumn = $scope.newModel.content.columnSelectedOfDataset[k];
		}
		
		$mdDialog.show({
			templateUrl:  baseScriptPath+ '/directives/cockpit-columns-configurator/templates/cockpitColumnStyle.html',
			parent : angular.element(document.body),
			clickOutsideToClose:true,
			escapeToClose :true,
			preserveScope: false,
			autoWrap:false,
			fullscreen: true,
			locals:{model:$scope.newModel, selectedColumn : $scope.selectedColumn},
			controller: cockpitStyleColumnFunction
		}).then(function(answer) {
			console.log("Selected column:", $scope.selectedColumn);
		}, function() {
			console.log("Selected column:", $scope.selectedColumn);
		});
	},
	
	$scope.openListColumn = function(){
		if($scope.newModel.dataset == undefined || $scope.newModel.dataset.dsId == undefined){
			$scope.showAction($scope.translate.load("sbi.cockpit.table.missingdataset"));
		}else{
			$mdDialog.show({
				templateUrl:  baseScriptPath+ '/directives/cockpit-columns-configurator/templates/cockpitColumnsOfDataset.html',
				parent : angular.element(document.body),
				clickOutsideToClose:true,
				escapeToClose :true,
				preserveScope: true,
				autoWrap:false,
				locals: {model:$scope.newModel},
				fullscreen: true,
				controller: controllerCockpitColumnsConfigurator
			}).then(function(answer) {
			}, function() {
			});
		}
	}
	
	function controllerCockpitColumnsConfigurator($scope,sbiModule_translate,$mdDialog,model,cockpitModule_datasetServices,cockpitModule_generalOptions){
		$scope.translate=sbiModule_translate;

		$scope.cockpitModule_generalOptions=cockpitModule_generalOptions;
		$scope.model = model;
		$scope.columnSelected = [];
		$scope.localDataset = {};
		if($scope.model.dataset && $scope.model.dataset.dsId){
			angular.copy(cockpitModule_datasetServices.getDatasetById($scope.model.dataset.dsId), $scope.localDataset);
		} else{
			$scope.model.dataset= {};
			angular.copy([], $scope.model.dataset.metadata.fieldsMeta);
		}
		$scope.saveColumnConfiguration=function(){
			model = $scope.model;

			if(model.content.columnSelectedOfDataset == undefined){
				model.content.columnSelectedOfDataset = [];
			}

			for(var i=0;i<$scope.columnSelected.length;i++){
				var obj = $scope.columnSelected[i];
				obj.aggregationSelected = 'NONE';
				obj.typeSelected = $scope.columnSelected[i].type;
				obj.label = $scope.columnSelected[i].alias;
				obj.aliasToShow = $scope.columnSelected[i].alias;
				model.content.columnSelectedOfDataset.push(obj);
			}

			$mdDialog.hide();
		}

		$scope.cancelConfiguration=function(){
			$mdDialog.cancel();
		}
	}
	
	$scope.deleteColumn = function(rowName,event) {
		for(var k in $scope.newModel.content.columnSelectedOfDataset){
			if($scope.newModel.content.columnSelectedOfDataset[k].alias == rowName) var item = $scope.newModel.content.columnSelectedOfDataset[k];
		}
  		  var index=$scope.newModel.content.columnSelectedOfDataset.indexOf(item);
		  $scope.newModel.content.columnSelectedOfDataset.splice(index,1);
		  if($scope.newModel.settings.sortingColumn == item.aliasToShow){
			  $scope.newModel.settings.sortingColumn = null;
		  }
	  }

	$scope.$watchCollection('newModel.content.columnSelectedOfDataset',function(newValue,oldValue){
		if($scope.columnsGrid.api && newValue){
			$scope.columnsGrid.api.setRowData(newValue);
			$scope.columnsGrid.api.sizeColumnsToFit();
		}
	})
	
	$scope.saveConfiguration=function(){
	    if($scope.newModel.dataset == undefined || $scope.newModel.dataset.dsId == undefined ){
            $scope.showAction($scope.translate.load('sbi.cockpit.table.missingdataset'));
            return;
        }
        if($scope.newModel.content.columnSelectedOfDataset == undefined || $scope.newModel.content.columnSelectedOfDataset.length==0){
            $scope.showAction($scope.translate.load('sbi.cockpit.table.nocolumns'));
            return;
        }
        if(!$scope.checkAggregation()){
            $scope.showAction($scope.translate.load('sbi.cockpit.table.erroraggregation'));
            return;
        }
        if(!$scope.checkAliases()){
            $scope.showAction($scope.translate.load('sbi.cockpit.table.erroraliases'));
            return;
        }
        if(!$scope.checkSolrRequirements()){
            $scope.showAction($scope.translate.load('sbi.cockpit.table.errorsolr'));
            return;
        }
        mdPanelRef.close();
        angular.copy($scope.newModel,model);
        $scope.$destroy();
        finishEdit.resolve();
  	}

  	$scope.cancelConfiguration=function(){
  		mdPanelRef.close();
  		$scope.$destroy();
  		finishEdit.reject();
  	}

    $scope.checkAggregation = function(){
        var measures = 0;
        var noneAggr = 0;
        for(var i=0;i<$scope.newModel.content.columnSelectedOfDataset.length;i++){
            var column = $scope.newModel.content.columnSelectedOfDataset[i];
            if(column.fieldType == 'MEASURE'){
                measures++;
                if(column.aggregationSelected == 'NONE'){
                    noneAggr++;
                }
            }
        }
        if(noneAggr != 0 && noneAggr != measures){
            return false;
        }
        return true;
    }

    $scope.checkAliases = function(){
        var columns = $scope.newModel.content.columnSelectedOfDataset;
        for(var i = 0; i < columns.length - 1; i++){
            for(var j = i + 1; j < columns.length; j++){
                if(columns[i].aliasToShow == columns[j].aliasToShow){
                    return false;
                }
            }
        }
        return true;
    }

    $scope.checkSolrRequirements = function(){
        if(cockpitModule_datasetServices.getDatasetById($scope.newModel.dataset.dsId).type == 'SbiSolrDataSet'){
            for(var i=0;i<$scope.newModel.content.columnSelectedOfDataset.length;i++){
                var column = $scope.newModel.content.columnSelectedOfDataset[i];
                if(column.fieldType == 'MEASURE' && column.aggregationSelected != 'NONE'){
                    return !$scope.newModel.settings.pagination.enabled || $scope.newModel.settings.pagination.frontEnd;
                }
            }
        }
        return true;
    }

    $scope.showAction = function(text) {
        var toast = $mdToast.simple()
                .content(text)
                .action('OK')
                .highlightAction(false)
                .hideDelay(3000)
                .position('top')

        $mdToast.show(toast);
    }

}