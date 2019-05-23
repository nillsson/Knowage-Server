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
 * @authors Giovanni Luca Ulivo (GiovanniLuca.Ulivo@eng.it)
 * v0.0.1
 *
 */
(function() {

angular.module('cockpitModule')
.directive('cockpitToolbar',function(){
	   return{
		   templateUrl: baseScriptPath+ '/directives/cockpit-toolbar/templates/cockpitToolbar.html',
		   controller: cockpitToolbarControllerFunction,
		   scope: {
			   config: '='
		   	},
		   	compile: function (tElement, tAttrs, transclude) {
                return {
                    pre: function preLink(scope, element, attrs, ctrl, transclud) {
                    },
                    post: function postLink(scope, element, attrs, ctrl, transclud) {
                    }
                };
		   	}
	   }
});

function cockpitToolbarControllerFunction($scope,$timeout,$q,windowCommunicationService,cockpitModule_datasetServices,cockpitModule_widgetServices,cockpitModule_properties,cockpitModule_template,$mdDialog,sbiModule_translate,sbiModule_restServices,cockpitModule_gridsterOptions,$mdPanel,cockpitModule_widgetConfigurator,$mdToast,cockpitModule_generalServices,cockpitModule_widgetSelection,$rootScope){
	$scope.translate = sbiModule_translate;
	$scope.cockpitModule_properties=cockpitModule_properties;
	$scope.cockpitModule_template=cockpitModule_template;
	$scope.cockpitModule_widgetServices=cockpitModule_widgetServices;

	$scope.openGeneralConfigurationDialog=function(){
		cockpitModule_generalServices.openGeneralConfiguration();
	}

	$scope.openDataConfigurationDialog=function(){
		cockpitModule_generalServices.openDataConfiguration();
	}

	$scope.fabSpeed = {
			isOpen : false
	}


	$scope.saveCockpit=function(event){
		var haveSel=false;
		for(var i=0;i<cockpitModule_template.configuration.aggregations.length;i++){
			if(Object.keys(cockpitModule_template.configuration.aggregations[i].selection).length>0){
				haveSel=true;
				break;
			}
		}
		if(Object.keys(cockpitModule_template.configuration.filters).length>0){
			haveSel=true;
		}
		if(haveSel){
			var confirm = $mdDialog.confirm()
			.title(sbiModule_translate.load('sbi.cockpit.widgets.save.keepselections'))
			.textContent('')
			.ariaLabel('save cockpit')
			.ok(sbiModule_translate.load('sbi.qbe.messagewin.yes'))
			.cancel(sbiModule_translate.load('sbi.qbe.messagewin.no'));
			$mdDialog.show(confirm).then(function() {
				cockpitModule_generalServices.saveCockpit(event);
			}, function() {
				for(var i=0;i<cockpitModule_template.configuration.aggregations.length;i++){
					cockpitModule_template.configuration.aggregations[i].selection = {};
				}
				cockpitModule_template.configuration.filters={};
				cockpitModule_generalServices.saveCockpit(event);
			});
		}else{
			cockpitModule_generalServices.saveCockpit(event);
		}
	};

	$scope.cleanCache = function(){
		cockpitModule_generalServices.cleanCache();
	}

	$scope.openSelections = function(){
		$mdDialog.show({
		      templateUrl: baseScriptPath+ '/directives/cockpit-toolbar/templates/selectionsList.html',
		      parent: angular.element(document.body),
		      clickOutsideToClose:true,
		      escapeToClose :true,
	          preserveScope: true,
		      fullscreen: true,
		      controller: cockpitSelectionControllerFunction

		});
	}

	$scope.addWidget=function(){
		$mdDialog.show({
		      templateUrl: baseScriptPath+ '/directives/cockpit-toolbar/templates/addWidget.html',
		      parent: angular.element(document.body),
		      clickOutsideToClose:true,
		      escapeToClose :true,
	          preserveScope: true,
		      fullscreen: true,
		      controller: function($scope,sbiModule_translate,cockpitModule_template,cockpitModule_properties,cockpitModule_widgetServices){
		    	  $scope.translate=sbiModule_translate;
		    	  $scope.addWidget=function(type){
		    		  var tmpWidget={
		    				  id:(new Date()).getTime(),
		    				  sizeX	:6,
		    				  sizeY:6,
		    				  content:{name:"new "+type+" Widget"},
		    				  type:type,
		    				  isNew : true,
		    				  updateble : true,
		    				  cliccable : true
		    		  }
		    		  if(cockpitModule_widgetConfigurator[type].initialDimension !=undefined){
		    			  if(cockpitModule_widgetConfigurator[type].initialDimension.width != undefined){
			    			  tmpWidget.sizeX = cockpitModule_widgetConfigurator[type].initialDimension.width;

		    			  }
		    			  if(cockpitModule_widgetConfigurator[type].initialDimension.height != undefined){
			    			  tmpWidget.sizeY = cockpitModule_widgetConfigurator[type].initialDimension.height;

		    			  }
		    		  }
		    		  cockpitModule_widgetServices.addWidget(cockpitModule_properties.CURRENT_SHEET,tmpWidget);
		    		  $mdDialog.hide();

		    	  };
		    	  
		    	  $scope.showWidgetType = function(w){
		    		  if(w.datasetRequirement){
		    			  var datasetList = cockpitModule_datasetServices.getAvaiableDatasets();
		    			  for(var k in datasetList){
		    				  if(datasetList[k].type == w.datasetRequirement) return true;
		    			  }
		    			  return false
		    		  }else return true;
		    	  }

		    	  $scope.widgetType=[{
						name:"Text",
						description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.text"),
						tags : ["text"],
						img : "1.png",
						class: "fa fa-font",
						type : "text"
					},{
						name:"Image",
						description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.image"),
						tags : ["image"],
						img : "2.png",
						class: "fa fa-picture-o",
						type : "image"
					},{
						name:"Chart",
						description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.chart"),
						tags : ["chart"],
						img : "4.png",
						class: "fa fa-bar-chart",
						type : "chart"
					},{
						name:"Html",
						description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.html"),
						tags : ["html"],
						img : "4.png",
						class: "fa fa-code",
						type : "html"
					},{
						name:"Table",
						description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.table"),
						tags : ["table"],
						img : "5.png",
						class: "fa fa-table",
						type : "table"
					},{
						name:"Advanced Table",
						description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.table"),
						tags : ["advanced"],
						img : "5.png",
						class: "fa fa-table",
						beta: true,
						type : "advanced-table"
					},{
						name:"Cross Table",
						description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.cross"),
						tags : ["table","pivot","cross"],
						img : "6.png",
						class: "fa fa-table",
						type : "static-pivot-table"
					},{
						name:"Document",
						description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.document"),
						tags : ["document","datasource"],
						img : "7.png",
						class: "fa fa-file",
						type : "document"
					},{
	                    name:"Map",
	                    description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.map"),
	                    tags : ["map"],
	                    img : "7.png",
	                    class: "fa fa-map",
	                    type : "map"
	                },{
						name:"Active Selections",
						description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.selection"),
						tags : ["selection"],
						class: "fa fa-check-square-o",
						img : "8.png",
						type : "selection"
					},{
						name:"Selector",
						description: $scope.translate.load("sbi.cockpit.editor.newwidget.description.selector"),
						tags : ["selector"],
						class: "fa fa-caret-square-o-down",
						img : "9.png",
						type : "selector"
					},{
						name:"Discovery",
						description: 'discovery',
						tags : ["discovery"],
						class: "fa fa-rocket",
						type : "discovery",
						datasetRequirement: 'SbiSolrDataSet'
				  }];

		    	  $scope.saveConfiguration=function(){
		    		  $mdDialog.hide();
		    	  }
		    	  $scope.cancelConfiguration=function(){
		    		  $mdDialog.cancel();
		    	  }


		      }
		    })
	};

	$scope.closeNewCockpit=function(){
		cockpitModule_generalServices.closeNewCockpit();
	}
	$scope.isFromNewCockpit= cockpitModule_generalServices.isFromNewCockpit();
	
	var handler = {};
	handler.handleMessage = function(message){
		if(message == 'pdfExport') $scope.exportPdf();
	}

	windowCommunicationService.addMessageHandler(handler);
	
	$scope.exportPdf = function(){
		
		return $q(function(resolve, reject) {
			cockpitModule_properties.LOADING_SCREENSHOT = true;
			$mdDialog.show({
				controller: function($scope,cockpitModule_properties,cockpitModule_template, sbiModule_translate){
					$scope.translate = sbiModule_translate;
					$scope.cockpitModule_properties = cockpitModule_properties;
					$scope.cockpitModule_template = cockpitModule_template;
				 },
				 templateUrl: baseScriptPath+ '/directives/cockpit-toolbar/templates/exportPdfDialogTemplate.html',
				 parent: angular.element(document.body),
				 hasBackdrop: false,
				 clickOutsideToClose:false
				 })
				 
				 function closeOrContinue(sheet){
					if(sheet.index + 1 == cockpitModule_template.sheets.length) {
		 				doc.save(cockpitModule_properties.DOCUMENT_LABEL+'.pdf');
		 				$mdDialog.hide();
		 				cockpitModule_properties.LOADING_SCREENSHOT = false;
		 				resolve();
		 			}
		 			else {
		 				document.querySelector(".sheetPageButton-"+(sheet.index+1)).parentNode.click();
		 				for(var y in cockpitModule_template.sheets){
		 					if(cockpitModule_template.sheets[y].index == sheet.index + 1){
		 						getScreenshot(cockpitModule_template.sheets[y]);
		 						break;
		 					}
		 				}
		 				
		 			}
				}
				          
				 function getScreenshot(sheet){
				 $scope.sheetsWidgets = cockpitModule_properties.INITIALIZED_WIDGETS;
				 	function getPage(sheet){
				 		var heightToUse;
				 		var exportSheetBar = false;
				 		var element = document.getElementById('kn-cockpit');
				 		var gridsterElement = document.querySelector('#gridsterSheet-'+sheet.index+' #gridsterContainer');
				 		
				 		if(element.scrollHeight < gridsterElement.scrollHeight){
				 			element = gridsterElement;
				 			heightToUse = gridsterElement.scrollHeight + 32;
				 			exportSheetBar = true;
				 		}
				 		else heightToUse = element.scrollHeight;
			 			
			 			if(sheet.index != 0) doc.addPage([element.clientWidth,heightToUse],heightToUse>element.clientWidth? 'p':'l');
			 			$timeout(function(){
			 				html2canvas(element,{
					 			allowTaint: true,
					 			useCORS: true,
					 			width: element.clientWidth,
					 			height: element.scrollHeight,
					 			scale : 1.5
					 		}).then(function(canvas) {
					 			doc.addImage(canvas, 'PNG', 0, 0, element.clientWidth/2.835, element.scrollHeight/2.835);
					 			if(exportSheetBar){
					 				html2canvas(document.querySelector('#sheetTabs md-tabs-wrapper'),{width: element.clientWidth,height: 32}).then(function(sheetCanvas){
					 					doc.addImage(sheetCanvas, 'PNG', 0, element.scrollHeight/2.835, element.clientWidth/2.835, 11.287);
					 					closeOrContinue(sheet);
					 				})
					 			}else{
					 				closeOrContinue(sheet);
					 			}
					 		});
			 			},300);

				 	}
				 	
					 	if($scope.sheetsWidgets.length == $scope.cockpitModule_widgetServices.getAllWidgets().length){
					 		$timeout(function(){
					 			getPage(sheet);
					 		},1000)    
					 	}else{
					 		$scope.sheetWatcher = $scope.$watchCollection('sheetsWidgets',function(newValue,oldValue){
					 			var tempIds = [];
					 			for(var w in sheet.widgets){
					 				if(newValue.indexOf(sheet.widgets[w].id) != -1) tempIds.push(sheet.widgets[w].id);
					 			}
					 			if(tempIds.length == sheet.widgets.length){
					 				$timeout(function(){
					 					getPage(sheet);
					 					$scope.sheetWatcher();    
					 				},3000)        
					 			}
					 		})    
					 	}
			 		}
			
					for(var s in cockpitModule_template.sheets){
						if(cockpitModule_template.sheets[s].index == 0) {
							if(cockpitModule_properties.CURRENT_SHEET != 0) document.querySelector(".sheetPageButton-0").parentNode.click();
							var tempElement = document.getElementById('kn-cockpit');
					 		var gridsterElement = document.querySelector('#gridsterSheet-0 #gridsterContainer');
					 		var sheetBarHeight = cockpitModule_template.sheets.length == 1 ? 0 : 32;
					 		if(tempElement.scrollHeight < gridsterElement.scrollHeight) var heightToUse = gridsterElement.scrollHeight + sheetBarHeight;
							var doc = new jsPDF({
								orientation: (heightToUse || tempElement.scrollHeight) > tempElement.clientWidth ? 'p' : 'l',
								unit: 'mm',
								format: [tempElement.clientWidth, heightToUse || tempElement.scrollHeight]
							});
							
							getScreenshot(cockpitModule_template.sheets[s]);
							break;
						}
					}
		})
	}


	
	$scope.captureScreenShot = function(ev){
		
		function getSheetFromCurrent(current){
			for(var i in cockpitModule_template.sheets){
				if(cockpitModule_template.sheets[i].index == current) return i;
			}
		}
		
		$scope.loadingScreenshot = true;
		//var element = document.querySelector('#gridsterSheet-'+cockpitModule_properties.CURRENT_SHEET+' #gridsterContainer');
		var element = document.getElementById('kn-cockpit');
		html2canvas(element,{
			allowTaint: true,
 			useCORS: true,
			width: element.clientWidth,
		    height: element.clientHeight
		    }
		).then(function(canvas) {
			canvas.toBlob(function(blob) {
		        saveAs(blob, cockpitModule_template.sheets[getSheetFromCurrent(cockpitModule_properties.CURRENT_SHEET)].label+'.png');
		        $scope.loadingScreenshot = false;
		    },function(error){$scope.loadingScreenshot = false;});
		});
	};
};



function cockpitSelectionControllerFunction($scope,cockpitModule_template,cockpitModule_datasetServices,$mdDialog,sbiModule_translate,$q,sbiModule_messaging,cockpitModule_documentServices,cockpitModule_widgetSelection,cockpitModule_properties){
	$scope.selection = [];
	$scope.translate = sbiModule_translate;
	$scope.tmpSelection = [];

	angular.copy(cockpitModule_template.configuration.aggregations,$scope.tmpSelection);
	$scope.tmpFilters = {};
	angular.copy(cockpitModule_template.configuration.filters,$scope.tmpFilters);

	$scope.filterForInitialSelection=function(obj){
		if(!cockpitModule_properties.EDIT_MODE){
			for(var i=0;i<cockpitModule_properties.STARTING_SELECTIONS.length;i++){
				if(angular.equals(cockpitModule_properties.STARTING_SELECTIONS[i],obj)){
					return true;
				}
			}
		}
		return false;
	}
	$scope.filterForInitialFilter=function(obj){
		if(!cockpitModule_properties.EDIT_MODE){
			for(var i=0;i<cockpitModule_properties.STARTING_FILTERS.length;i++){
				if(angular.equals(cockpitModule_properties.STARTING_FILTERS[i],obj)){
					return true;
				}
			}
		}
		return false;
	}

	if($scope.tmpSelection.length >0){
		for(var i=0;i<$scope.tmpSelection.length;i++){
			var selection = $scope.tmpSelection[i].selection;
			for(var key in selection){
				var string = key.split(".");

				var obj = {
						ds : string[0],
						columnName : string[1],
						value : selection[key],
						aggregated:true
				};
				if(!$scope.filterForInitialSelection(obj)){
					$scope.selection.push(obj);
				}
			}
		}
	}

	for(var ds in $scope.tmpFilters){
		var currentDs = cockpitModule_datasetServices.getDatasetByLabel(ds).metadata.fieldsMeta;
		for(var col in $scope.tmpFilters[ds]){
			var aliasColumnName;
			for(var a in cockpitModule_template.configuration.aliases){
				if(cockpitModule_template.configuration.aliases[a].column == col){
					aliasColumnName = cockpitModule_template.configuration.aliases[a].alias;
				}
			}
			var tmpObj={
					ds :ds,
					columnName : aliasColumnName,
					column	: col,
					value : $scope.tmpFilters[ds][col],
					aggregated:false
			}

			if(!$scope.filterForInitialFilter(tmpObj)){
				$scope.selection.push(tmpObj);
			}
		}
	}
	
	$scope.selectionsGrid = {
		angularCompileRows: true,
		domLayout :'autoHeight',
        enableColResize: false,
        enableFilter: false,
        enableSorting: false,
        pagination: false,
        onGridSizeChanged: resizeColumns,
        columnDefs : [{headerName: $scope.translate.load('sbi.cockpit.dataset'), field:'ds'},
        	{headerName: $scope.translate.load('sbi.cockpit.dataset.columnname'), field:'columnName'},
        	{headerName: $scope.translate.load('sbi.cockpit.core.selections.list.columnValues'), field:'value'},
        	{headerName:"",cellRenderer: buttonRenderer,"field":"id","cellStyle":{"text-align": "right","display":"inline-flex","justify-content":"flex-end","border":"none"},width: 50,suppressSizeToFit:true, tooltip: false}],
        defaultColDef: {
        	suppressMovable: true,
        	suppressSorting:true,
        	suppressFilter:true,
        	tooltip: function (params) {
                return params.value;
            },
        },
        rowData: $scope.selection
	};
	
	function resizeColumns(){
		$scope.selectionsGrid.api.sizeColumnsToFit();
	}
	
	function buttonRenderer(params){
		return 	'<md-button class="md-icon-button" ng-click="deleteSelection(\''+params.rowIndex+'\')"><md-icon md-font-icon="fa fa-trash"></md-icon></md-button>';
	}

	$scope.deleteSelection=function(rowIndex){
		var item = $scope.selection[rowIndex];
		if(item.aggregated){
			var key = item.ds + "." + item.columnName;

			for(var i=0;i<$scope.tmpSelection.length;i++){
				if($scope.tmpSelection[i].datasets.indexOf(item.ds) !=-1){
					var selection  = $scope.tmpSelection[i].selection;
					delete selection[key];
				}
			}

			var index=$scope.selection.indexOf(item);
			$scope.selection.splice(index,1);
		}else{
			delete $scope.tmpFilters[item.ds][item.column];
			if(Object.keys($scope.tmpFilters[item.ds]).length==0){
				delete $scope.tmpFilters[item.ds];
			}
			var index=$scope.selection.indexOf(item);
			$scope.selection.splice(index,1);
		}
		$scope.selectionsGrid.api.setRowData($scope.selection)

	}

	$scope.clearAllSelection = function(){
		while($scope.selection.length!=0){
			$scope.deleteSelection(0);
		}
	}

	$scope.cancelConfiguration=function(){
		$mdDialog.cancel();
	}

	$scope.saveConfiguration = function(){
	    cockpitModule_widgetSelection.updateSelections($scope.tmpSelection, $scope.tmpFilters);
	    $mdDialog.cancel();
	}

}
})();