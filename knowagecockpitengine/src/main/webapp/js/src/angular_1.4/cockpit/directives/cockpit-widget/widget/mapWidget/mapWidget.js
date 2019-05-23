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
(function() {
	angular
		.module('cockpitModule')
		.directive('cockpitMapWidget',function(){
			return{
				templateUrl: baseScriptPath+ '/directives/cockpit-widget/widget/mapWidget/templates/mapWidgetTemplate.html',
				controller: cockpitMapWidgetControllerFunction,
				compile: function (tElement, tAttrs, transclude) {
					return {
						pre: function preLink(scope, element, attrs, ctrl, transclud) {
							//defines new id for clone widget action
							if (scope.ngModel.content.mapId){
				 	    		scope.ngModel.content.mapId =  'map-' + scope.ngModel.id;
				 	    	}
						},
						post: function postLink(scope, element, attrs, ctrl, transclud) {
							element.ready(function () {
								scope.initWidget();
								scope.createMap();
								scope.showWidgetSpinner();
							});
						}
					};
				}
			}
		})

	function cockpitMapWidgetControllerFunction(
			$scope,
			$mdDialog,
			$mdToast,
			$timeout,
			$interval,
			$mdPanel,
			$mdSidenav,
			$q,
			$sce,
			$filter,
			$location,
			sbiModule_translate,
			sbiModule_messaging,
			sbiModule_restServices,
			cockpitModule_mapServices,
			cockpitModule_mapThematizerServices,
			cockpitModule_datasetServices,
			cockpitModule_generalServices,
			cockpitModule_widgetConfigurator,
			cockpitModule_widgetServices,
			cockpitModule_widgetSelection,
			cockpitModule_properties){

		//ol objects
		$scope.popupContainer; 		//popup detail
		$scope.closer; 				//popup detail closer icon
		$scope.layers = [];  		//layers with features
		$scope.values = {};  		//layers with values
		$scope.savedValues = {};
		$scope.configs = {}; 		//layers with configuration
		$scope.columnsConfig = {} 	//layers with just columns definition

		$scope.realTimeSelections = cockpitModule_widgetServices.realtimeSelections;
		//set a watcher on a variable that can contains the associative selections for realtime dataset
		var realtimeSelectionsWatcher = $scope.$watchCollection('realTimeSelections',function(newValue,oldValue,scope){
			if(newValue != oldValue){
				if(scope.ngModel && scope.ngModel.dataset && scope.ngModel.dataset.dsId){
					var dataset = cockpitModule_datasetServices.getDatasetById(scope.ngModel.dataset.dsId);
					if(dataset.isRealtime && dataset.useCache){
						if(cockpitModule_properties.DS_IN_CACHE.indexOf(dataset.label)==-1){
							cockpitModule_properties.DS_IN_CACHE.push(dataset.label);
						}
						//get layer (by dataset label or by dataset name)
						var layer = $scope.getLayerByName(dataset.label);
						if (!layer)
							layer = $scope.getLayerByName(dataset.name);

						if(newValue.length > 0){
							// save unfiltered data if not already saved
							if(!$scope.savedValues[layer.name]){
								$scope.savedValues[layer.name] = {};
								angular.copy($scope.values[layer.name], $scope.savedValues[layer.name]);
							}

							// calc filtered data
							scope.filterDataset(scope.values[layer.name],scope.reformatSelections(newValue));

							// apply filtered data
							$scope.createLayerWithData(layer.name, scope.values[layer.name], false, false);
						}else{
							// restore unfiltered data
							angular.copy(scope.savedValues[layer.name], scope.values[layer.name]);
							delete scope.savedValues[layer.name];

							// apply unfiltered data
							$scope.createLayerWithData(layer.name, scope.values[layer.name], false, false);
						}
					}
				}
			}
		});

		//reformatting the selections to have the same model of the filters
		$scope.reformatSelections = function(realTimeSelections){
			if (realTimeSelections && $scope.ngModel && $scope.ngModel.dataset && $scope.ngModel.dataset.dsId){
				var widgetDatasetId = $scope.ngModel.dataset.dsId;
				var widgetDataset = cockpitModule_datasetServices.getDatasetById(widgetDatasetId)

				for (var i=0; i< realTimeSelections.length; i++){
					//search if there are selection on the widget's dataset
					if (realTimeSelections[i].datasetId == widgetDatasetId){
						var selections = realTimeSelections[i].selections;
						var formattedSelection = {};
						var datasetSelection = selections[widgetDataset.label];
						for(var s in datasetSelection){
							var columnObject = $scope.getColumnObjectFromName($scope.ngModel.content.columnSelectedOfDataset,s);
							if (!columnObject){
								columnObject = $scope.getColumnObjectFromName(widgetDataset.metadata.fieldsMeta,s);
							}

							formattedSelection[columnObject.aliasToShow || columnObject.alias] = {"values":[], "type": columnObject.fieldType};
							for(var k in datasetSelection[s]){
								// clean the value from the parenthesis ( )
								if (columnObject.fieldType == "SPATIAL_ATTRIBUTE") {
									//for spatial attribute doens't split value
									var x = datasetSelection[s][k].replace(/[()]/g, '').replace(/['']/g, '');
									formattedSelection[columnObject.aliasToShow || columnObject.alias].values.push(x);
								}else{
									var x = datasetSelection[s][k].replace(/[()]/g, '').replace(/['']/g, '').split(/[,]/g);
									for(var i=0; i<x.length; i++){
										formattedSelection[columnObject.aliasToShow || columnObject.alias].values.push(x[i]);
									}
								}
							}
						}
					}
				}
				return formattedSelection;
			}
		}

		/**
		 * Returns the column object that satisfy the original name (not aliasToShow) passed as argument
		 */
		$scope.getColumnObjectFromName = function(columnSelectedOfDataset, originalName){
			for (i = 0; i < columnSelectedOfDataset.length; i++){
				if (columnSelectedOfDataset[i].name === originalName){
					return columnSelectedOfDataset[i];
				}
			}
		}

		// filtering the table for realtime dataset
		$scope.filterDataset = function(datastore,selection){
			//using the reformatted filters
			var filters = selection ? selection : $scope.reformatSelections();
			for(var f in filters){
				for(var i = datastore.rows.length - 1; i>= 0; i--){
					var columnName;
					for(var j in datastore.metaData.fields){
						if(datastore.metaData.fields[j].header == f){
							columnName = datastore.metaData.fields[j].name;
							break;
						}
					}
					//if the column is an attribute check in filter
					if (filters[f].type == 'ATTRIBUTE'){
						var value = datastore.rows[i][columnName];
						if(typeof value == "number"){
							value = String(value);
						}
						if (filters[f].values.indexOf(value)==-1){
							datastore.rows.splice(i,1);
						}
					//if the column is a measure cast it to number and check in filter
					} else if (filters[f].type == 'MEASURE'){
						var columnValue = Number(datastore.rows[i][columnName]);
						var filterValue = filters[f].values.map(function (x) {
						    return Number(x);
						});
						//check operator
						var operator = String(filters[f].operator);
						if (operator == "="){
							operator = "==";
						}
						var leftOperand = String(columnValue);
						var rightOperand = String(filterValue[0]);
						var expression =  leftOperand + operator + rightOperand;

						//if (filterValue.indexOf(columnValue)==-1){
						if (eval(expression) == false){
							datastore.rows.splice(i,1);
						}
					}else if (filters[f].type == 'SPATIAL_ATTRIBUTE'){
						var value = datastore.rows[i][columnName];

						if (filters[f].values.indexOf(value)==-1){
							datastore.rows.splice(i,1);
						}
					}
				}
			}
			return datastore;
		}

		$scope.getTemplateUrl = function(template){
	  		return cockpitModule_generalServices.getTemplateUrl('mapWidget',template);
	  	}

	    $scope.reinit = function(){
	    	var isNew = ($scope.layers.length == 0);
	    	for (l in $scope.layers){
	    		//remove old layers
	    		var previousLayer = $scope.getLayerByName($scope.layers[l].name);
	    		if (previousLayer) 	$scope.map.removeLayer(previousLayer); //ol obj
	    	}
	    	$scope.removeLayers(); //clean internal obj
	    	$scope.getLayers();

	    	if (isNew) $scope.createMap();

	    	if (!$scope.map.getSize()){
    			$scope.map.setSize([cockpitModule_widgetConfigurator.map.initialDimension.width,
    							    cockpitModule_widgetConfigurator.map.initialDimension.height]);
    		}else{
    			$scope.map.setSize($scope.map.getSize());
    		}
			$scope.map.renderSync();
        }

	    $scope.optionsSidenavOpened = false;
		$scope.toggleSidenav = function(){
			$scope.optionsSidenavOpened = !$scope.optionsSidenavOpened;
			$timeout(function() {
				$scope.map.updateSize();
			}, 600);
		}

	    $scope.refresh = function(element,width,height, data, nature, associativeSelection, changedChartType, chartConf, options) {
	    	if (nature == 'fullExpand' || nature == 'resize'){
	    		$timeout(function() {
					$scope.map.updateSize();
				}, 500);
	    		return;
	    	}

			if (!options) options = {};
			var layerName = (Array.isArray(options.label)) ? options.label[0] : options.label; //on delete of selections options is an array !!!

    		// save unfiltered data
    		$scope.values[layerName] = data;

    		if($scope.realTimeSelections.length > 0){
    			// save unfiltered data
    			$scope.savedValues[layerName] = {};
    			angular.copy(data, $scope.savedValues[layerName]);

    			// calc & save filtered data
    			$scope.filterDataset($scope.values[layerName], $scope.reformatSelections($scope.realTimeSelections));
    		}

    		// apply (filtered) data
    		var tmpLayer = $scope.getLayerByName(layerName);
    		if (!tmpLayer){
    			tmpLayer = {};
    			tmpLayer.isCluster = false;
    			tmpLayer.isHeatmap = false;
    		}
    		$scope.createLayerWithData(layerName, $scope.values[layerName], tmpLayer.isCluster, tmpLayer.isHeatmap);
    		if(nature == 'init'){
    			$timeout(function(){
    				$scope.widgetIsInit=true;
    				cockpitModule_properties.INITIALIZED_WIDGETS.push($scope.ngModel.id);
    			},500);
    		}
	    }

	    $scope.getOptions =function(){
			var obj = {};
			var targetLayer = $scope.getTargetDataset();
			obj["type"] = $scope.ngModel.type;
			obj["label"] = (targetLayer) ? targetLayer.name : "";
			return obj;
		}

	    $scope.editWidget=function(index){
			var finishEdit=$q.defer();
			var config = {
					attachTo:  angular.element(document.body),
					controller: mapWidgetEditControllerFunction,
					disableParentScroll: true,
					templateUrl: $scope.getTemplateUrl('mapWidgetEditPropertyTemplate'),
					position: $mdPanel.newPanelPosition().absolute().center(),
					fullscreen :true,
					hasBackdrop: true,
					clickOutsideToClose: true,
					escapeToClose: false,
					focusOnOpen: true,
					preserveScope: false,
					locals: {finishEdit:finishEdit,model:$scope.ngModel},
			};
			$mdPanel.open(config);
			return finishEdit.promise;
		}

//############################################## SPECIFIC MAP WIDGET METHODS #########################################################################

	    $scope.getLegend = function(referenceId, alias){
	    	$scope.legend = cockpitModule_mapThematizerServices.getLegend(referenceId, alias);
	    }


	    $scope.getLayers = function () {
		    for (l in $scope.ngModel.content.layers){
		    	var layerDef =  $scope.ngModel.content.layers[l];
		    	var layerID = $scope.ngModel.id + "|" + layerDef.name;
		    	$scope.configs[layerID] = layerDef;
	    		if (layerDef.type === 'DATASET'){
	    			$scope.getFeaturesFromDataset(layerDef);
	    		}else if (layerDef.type === 'CATALOG'){
	    			//TODO implementare recupero layer da catalogo
	    		}else{
	    			sbiModule_messaging.showInfoMessage(sbiModule_translate.load('sbi.cockpit.map.typeLayerNotManaged'), 'Title', 3000);
	    			console.log("Layer with type ["+layerDef.type+"] not managed! ");
	    			$timeout(function() {
						$scope.hideWidgetSpinner();
					}, 3000);
	    		}
	    	}
	    }

	    $scope.initializeTemplate = function (){
	    	 return $q(function(resolve, reject) {
	    		if (!$scope.ngModel.content.currentView)  $scope.ngModel.content.currentView = {};
	 	    	if (!$scope.ngModel.content.layers) $scope.ngModel.content.layers = [];
	 	    	if (!$scope.ngModel.content.baseLayersConf) $scope.ngModel.content.baseLayersConf = [];
	 	    	if (!$scope.ngModel.content.columnSelectedOfDataset) $scope.ngModel.content.columnSelectedOfDataset = {} ;

	 	    	if (!$scope.ngModel.content.currentView.center) $scope.ngModel.content.currentView.center = [0,0];
	 	    	if (!$scope.ngModel.content.mapId){
	 	    		$scope.ngModel.content.mapId =  'map-' + $scope.ngModel.id;
	 	    	}
	 	    	//set default indicator (first one) for each layer
	 	    	for (l in $scope.ngModel.content.layers){
	 	    		var columns = $scope.getColumnSelectedOfDataset($scope.ngModel.content.layers[l].dsId);
	 	    		for ( c in columns){
	 	    			if (columns[c].properties.showMap){
	 	    				$scope.ngModel.content.layers[l].defaultIndicator = columns[c].name;
	 	    				break;
	 	    			}
	 	    		}
	 	    	}
	 	    	resolve('initialized');
	    	 })

	    }

	    $scope.createLayerWithData = function(label, data, isCluster, isHeatmap){
	    	//prepare object with metadata for desiderata dataset columns
	    	var geoColumn, selectedMeasure = null;
    		var columnsForData, isHeatmap;
    		var layerID = $scope.ngModel.id + "|" + label;
    		var layerDef =  $scope.configs[layerID];

    		if (!layerDef) return;

    		columnsForData = $scope.getColumnSelectedOfDataset(layerDef.dsId) || [];

    		//remove old layer
    		var previousLayer = $scope.getLayerByName(label);
    		if (previousLayer) $scope.map.removeLayer(previousLayer); //ol obj
    		$scope.removeLayer(label);

    		for (f in columnsForData){
    			var tmpField = columnsForData[f];
    			if (tmpField && tmpField.fieldType == "SPATIAL_ATTRIBUTE"){
    				geoColumn = tmpField.name;
    				break;
    			}
    		}

    		layerDef.layerID = layerID;
    		var featuresSource = cockpitModule_mapServices.getFeaturesDetails(geoColumn, selectedMeasure, layerDef, columnsForData, data);
    		if (featuresSource == null){
    			//creates a fake layer for internal object (becasue isn't the first loop anymore)
    			layer = {};
    			layer.name = layerDef.name;
    			layer.dsId = layerDef.dsId;
    			$scope.addLayer(layerDef.name, layer);	//add layer to internal object
				return;
			}

			cockpitModule_mapThematizerServices.setActiveConf($scope.ngModel.id + "|" + layerDef.name, layerDef);
			cockpitModule_mapThematizerServices.updateLegend($scope.ngModel.id + "|" + layerDef.name, data);
			if (layerDef.visualizationType == 'choropleth') $scope.getLegend($scope.ngModel.id, layerDef.alias);
			var layer;
			if (isCluster) {
				var clusterSource = new ol.source.Cluster({source: featuresSource
														  });
				layer =   new ol.layer.Vector({source: clusterSource,
										  	  style: cockpitModule_mapThematizerServices.layerStyle
										});
			} else if (isHeatmap) {
				layer = new ol.layer.Heatmap({source: featuresSource,
										      blur: layerDef.heatmapConf.blur,
										      radius: layerDef.heatmapConf.radius,
										      weight: cockpitModule_mapThematizerServices.setHeatmapWeight
//										      gradient:['#00f', '#0ff', '#0f0', '#ff0', '#ff8d10', '#ff10f5', '#f00', '#00f', '#0ff', '#0f0', '#ff0', '#ff8d10', '#ff10f5', '#f00']
										     });
			} else {
				layer = new ol.layer.Vector({source: featuresSource,
	    									 style: cockpitModule_mapThematizerServices.layerStyle
	    									});
			}

			//add decoration to layer element
			layer.name = layerDef.name;
			layer.dsId = layerDef.dsId;
			layer.setZIndex(layerDef.order*1000);
			layer.modalSelectionColumn = layerDef.modalSelectionColumn;
			layer.hasShownDetails = layerDef.hasShownDetails;
			layer.isHeatmap = isHeatmap;
			layer.isCluster = isCluster;

			if ($scope.map){
				$scope.map.addLayer(layer); 			//add layer to ol.Map
			}
			else{
//				sbiModule_messaging.showInfoMessage("The map object isn't available for adding layer, please reload the document.", 'Title', 3000);
//				$timeout(function() {
//					$scope.hideWidgetSpinner();
//				}, 3000)
				$timeout(function() {
					 console.log("Waiting 3000 ms for creation object map!");
					 if ($scope.map){
						$scope.map.addLayer(layer); 			//add layer to ol.Map
						$scope.hideWidgetSpinner();
					}
				}, 3000)


			}

			$scope.addLayer(layerDef.name, layer);	//add layer to internal object
			$scope.setLayerProperty (layerDef.name, 'geoColumn',geoColumn),
			$scope.values[layerDef.name] = data; //add values to internal object
			cockpitModule_mapServices.updateCoordinatesAndZoom($scope.ngModel, $scope.map, layer, true);
	    }


	    $scope.getColumnSelectedOfDataset = function(dsId) {
	    	for (di in $scope.ngModel.content.columnSelectedOfDataset){
	    		if (di == dsId){
	    			return $scope.ngModel.content.columnSelectedOfDataset[di];
	    		}
	    	}
	    	return null;
	    }

	    $scope.getTargetDataset = function() {
	    	for (l in $scope.ngModel.content.layers){
	    		if ($scope.ngModel.content.layers[l].targetDefault == true){
	    			return $scope.ngModel.content.layers[l];
	    		}
	    	}
	    	return null;
	    }

	    $scope.addViewEvents = function(){
	    	//view events
	    	var view = $scope.map.getView();
            view.on("change:resolution", function(e) {
            	//zoom action
        	    if (Number.isInteger(e.target.getZoom())) {
	            	var previousZoom = $scope.ngModel.content.currentView.zoom;
	            	var newZoom =  e.target.getZoom();
	            	if (previousZoom > newZoom ){
	            		for (l in $scope.ngModel.content.layers){
		    		    	var layerDef =  $scope.ngModel.content.layers[l];
		    		    	var isCluster = (layerDef.clusterConf && layerDef.clusterConf.enabled) ? true : false;
		    		    	var isHeatmap = (layerDef.heatmapConf && layerDef.heatmapConf.enabled) ? true : false;
		    		    	if (isCluster){
			    				var values = $scope.values[layerDef.name];
				        		$scope.createLayerWithData(layerDef.name, values, true, false); //return to cluster view
			    			}
			    			if (isHeatmap){
			    				var values = $scope.values[layerDef.name];
				        		$scope.createLayerWithData(layerDef.name, values, false, true); //return to cluster view
			    			}
	            		}
	            	}
        	    }
        	    $scope.ngModel.content.currentView.zoom = e.target.getZoom();
        	    $scope.ngModel.content.currentView.center = e.target.getCenter();
            });
	    }

	    $scope.addMapEvents = function (overlay){
	    	if ($scope.closer){
	            $scope.closer.onclick = function(){
	            	overlay.setPosition(undefined);
		              if ($scope.closer && $scope.closer.blur) $scope.closer.blur();
		              return false;
	            }
	    	}
            $scope.map.on('singleclick', function(evt) {
    			$scope.props = {};
    			$scope.clickOnFeature = false;

            	evt.map.forEachFeatureAtPixel(evt.pixel,
		            function(feature, layer) {
						$scope.selectedLayer = layer;
						$scope.selectedFeature = (Array.isArray(feature.get('features')) && feature.get('features').length == 1) ? feature.get('features')[0] : feature;
						$scope.props = $scope.selectedFeature.getProperties();
		                $scope.clickOnFeature = true;
	            });

            	//modal selection management
    	        if ($scope.clickOnFeature && $scope.selectedLayer.modalSelectionColumn){
    	        	$scope.doSelection($scope.selectedLayer.modalSelectionColumn, $scope.props[$scope.selectedLayer.modalSelectionColumn].value, null, null, null, null, $scope.selectedLayer.dsId);
    	        }

            	//popup isn't shown with cluster and heatmap
            	if ($scope.selectedLayer && ($scope.selectedLayer.isCluster || $scope.selectedLayer.isHeatmap  || !$scope.selectedLayer.hasShownDetails)){
            		$scope.closer.onclick();
            		return;
            	}
    	        if ($scope.clickOnFeature && $scope.selectedFeature) {
	        		if ($scope.props.features && Array.isArray($scope.props.features)) return;
	        		$scope.$apply()

	        		if (cockpitModule_properties.EDIT_MODE || !$scope.columnsConfig[$scope.selectedLayer.name]){
    	        		$scope.layerConfig = $scope.getColumnSelectedOfDataset($scope.selectedLayer.dsId);
	        			$scope.columnsConfig[$scope.selectedLayer.name] =  $scope.layerConfig;
    	        	}else{
    	        		$scope.layerConfig = $scope.columnsConfig[$scope.selectedLayer.name];
    	        	}

	        		$scope.layerConfig.dsId = $scope.selectedLayer.dsId;
	        		$scope.layerConfig.modalSelectionColumn = $scope.selectedLayer.modalSelectionColumn;
    	            var geometry = $scope.selectedFeature.getGeometry();
    	            var coordinate = evt.coordinate;
    	            overlay.setPosition(coordinate);
    	        }
             });

    		$scope.map.on('dblclick', function(evt) {
    			for (l in $scope.ngModel.content.layers){
    		    	var layerDef =  $scope.ngModel.content.layers[l];
    		    	var isCluster = (layerDef.clusterConf && layerDef.clusterConf.enabled) ? true : false;
    		    	var isHeatmap = (layerDef.heatmapConf && layerDef.heatmapConf.enabled) ? true : false;
	    			if (isCluster || isHeatmap){
	    				var values = $scope.values[layerDef.name];
		        		$scope.createLayerWithData(layerDef.name, values, false, false);
	    			}
    			}
    		});

    		// change mouse cursor when over marker
    	      $scope.map.on('pointermove', function(e) {
    	    	  var pixel = $scope.map.getEventPixel(e.originalEvent);
    	    	  var hit = $scope.map.hasFeatureAtPixel(pixel);
    	    	  $scope.map.getViewport().style.cursor = hit ? 'pointer' : '';
    	      });

    		$scope.map.on('moveend', function(evt){
    			var view = $scope.map.getView();
    			if (!$scope.ngModel.content.currentView) $scope.ngModel.content.currentView = {};
    			$scope.ngModel.content.currentView.center = view.getCenter();
    			$scope.ngModel.content.currentView.zoom = view.getZoom();
    		});
	    }

	    $scope.isDisplayableProp = function (p, config){
	    	for (c in config){
	    		if (p == config[c].name && config[c].properties.showDetails){
	    			return config[c];
	    		}
	    	}
	    	return null;
	    }

	    $scope.getFeaturesFromDataset = function(layerDef){
    		//prepare object with metadata for desiderata dataset columns
	    	var geoColumn = null;
    		var selectedMeasure = null;
    		var columnsForData = [];
    		var isCluster = (layerDef.clusterConf && layerDef.clusterConf.enabled) ? true : false;
    		var isHeatmap = (layerDef.heatmapConf && layerDef.heatmapConf.enabled) ? true : false;

    		var columnsForData = $scope.getColumnSelectedOfDataset(layerDef.dsId) || [];

    		for (f in columnsForData){
    			var tmpField = columnsForData[f];
    			if (tmpField.fieldType == "SPATIAL_ATTRIBUTE")
    				geoColumn = tmpField.name;
    			else if (tmpField.properties.showMap) 	{ //first measure
    				selectedMeasure = tmpField.aliasToShow;
    				if (!layerDef.defaultIndicator)  layerDef.defaultIndicator = selectedMeasure;
    			}

    		}

    		var model = {content: {columnSelectedOfDataset: columnsForData }};
    		var features = [];
    		var layer =  new ol.layer.Vector();

    		//get the dataset columns values
	    	cockpitModule_datasetServices.loadDatasetRecordsById(layerDef.dsId, undefined, undefined, undefined, undefined, model).then(
	    		function(allDatasetRecords){
	    			$scope.createLayerWithData(layerDef.name, allDatasetRecords, isCluster, isHeatmap);
	    			$scope.hideWidgetSpinner();
			},function(error){
				console.log("Error loading dataset with id [ "+layerDef.dsId+"] ");
				sbiModule_messaging.showInfoMessage($scope.translate.load('sbi.cockpit.map.datasetLoadingError').replace("{0}",layerDef.dsId), 'Title', 3000);
				$timeout(function() {
					$scope.hideWidgetSpinner();
				}, 3000);

			});
    	}

	    $scope.createMap = function (){
	    	$scope.initializeTemplate().then(function(){
	    		//create the base layer
	            $scope.baseLayer = cockpitModule_mapServices.getBaseLayer($scope.ngModel.content.baseLayersConf[0]);

	            if (!$scope.popupContainer){
	            	$scope.popupContainer = document.getElementById('popup-' + $scope.ngModel.id);
	            	$scope.closer = document.getElementById('popup-closer-' +$scope.ngModel.id);
	            }

	            //create overlayers (popup..)
	            var overlay = new ol.Overlay({
		              element: $scope.popupContainer,
		              autoPan: true,
		              autoPanAnimation: {
		                duration: 250
		              }
	            });

		    	//setting coordinates (from the first layer if they aren't set into the template)
	            if ($scope.ngModel.content.currentView.center[0] == 0 && $scope.ngModel.content.currentView.center[1] == 0 && $scope.layers.length > 0){
		    		var tmpLayer = $scope.layers[0].layer;
		    		cockpitModule_mapServices.updateCoordinatesAndZoom($scope.ngModel, $scope.map, tmpLayer, false);
	    		}
//	            alert("creata mappa con id ["+ 'map-' + $scope.ngModel.id +"]");
	    		$scope.map = new ol.Map({
	    		  target: 'map-' + $scope.ngModel.id,
	    		  layers: [ $scope.baseLayer ],
	    		  overlays: [overlay],
	    		  view: new ol.View({
	    		    center: $scope.ngModel.content.currentView.center,
	    		    zoom:  $scope.ngModel.content.currentView.zoom || 3
	    		  })

	    		});
	    		console.log("Created obj map with id [" + 'map-' + $scope.ngModel.id + "]", $scope.map);

	    		//just for refresh
	    		if (!$scope.map.getSize()){
	    			$scope.map.setSize([cockpitModule_widgetConfigurator.map.initialDimension.width,
	    							    cockpitModule_widgetConfigurator.map.initialDimension.height]);
	    		}else{
	    			$scope.map.setSize($scope.map.getSize());
	    		}

				$scope.map.renderSync();

				//add events methods
	    		$scope.addViewEvents();
	    		$scope.addMapEvents(overlay);
	    		$scope.loading = false;
	    	});
	    }

	    //control panel events
	    $scope.toggleLayer = function(e,n){
			e.stopPropagation();
			console.log($scope.ngModel.mutualExclusion);
			if($scope.ngModel.mutualExclusion === false) {
				console.log("Non mutual exclusion");
				var l = $scope.getLayerByName(n);
				if (!l) return; //do nothing
				var toggle = !l.getVisible();
				l.setVisible(!l.getVisible());
			} else {
				console.log("Mutual exclusion, layer selected: "+n);
				var l = $scope.getLayerByName(n);
				if (!l) return; //do nothing
				l.setVisible(true);
				for(var i in $scope.ngModel.content.layers) {
					var layerName = $scope.ngModel.content.layers[i].name;
					console.log(layerName);
					if(n !== layerName ) {
						console.log("setting to false");
						var l_tmp = $scope.getLayerByName(layerName);
						if (!l_tmp) return; //do nothing
						l_tmp.setVisible(false);
					}
				}
			}
	    }

	    $scope.toggleLayerExpanse = function(layer){
	    	layer.expandedNav = !layer.expandedNav;
	    }

	    $scope.getLayerVisibility = function(n){
	    	var l = $scope.getLayerByName(n);
	    	if (!l || !l.getVisible) return; //do nothing
	    	return l.getVisible();
	    }

	    $scope.getIndicatorVisibility = function(l,n){
	    	for (lpos in  $scope.ngModel.content.layers){
	    		if ( $scope.ngModel.content.layers[lpos].name == l)
		    	for (var i in $scope.ngModel.content.layers[lpos].indicators){
		    		if ($scope.ngModel.content.layers[lpos].indicators[i].label == n){
		    			return $scope.ngModel.content.layers[lpos].indicators[i].showMap || false;
		    		}
		    	}
	    	}
	    	return false;
	    }

	    //Thematization
	    $scope.thematizeMeasure = function (l, m){
	    	var layer = $scope.getLayerByName(l);
	    	var layerValues = $scope.values[l];
	    	var layerKeyColumn =  $scope.getLayerProperty(l, 'geoColumn');
	    	var layerConfig;
	    	for (var c=0; c<$scope.ngModel.content.layers.length;c++){
	    		if ($scope.ngModel.content.layers[c].name === l){
	    			layerConfig =$scope.ngModel.content.layers[c];
	    			break;
	    		}
	    	}
	    	var layerColumnConfig = $scope.getColumnSelectedOfDataset(layerConfig.dsId) || [];
	    	$scope.refreshStyle(layer, m, layerConfig, layerColumnConfig, layerValues, layerKeyColumn);
	    }

	  //thematizer functions
	    $scope.refreshStyle = function (layer, measure, config, configColumns, values, geoColumn){
			//prepare object for thematization
	    	var layerID = $scope.ngModel.id + "|" + config.name;
	    	var elem = cockpitModule_mapServices.getColumnConfigByProp(configColumns, 'aliasToShow', measure);
	    	if (elem){
		    	cockpitModule_mapThematizerServices.setActiveIndicator(elem.name);
		    	config.defaultIndicator = elem.name;

		    	cockpitModule_mapThematizerServices.loadIndicatorMaxMinVal(config.name +'|'+ elem.name, values);
		    	cockpitModule_mapThematizerServices.updateLegend(layerID, values);

		    	$scope.getLegend($scope.ngModel.id, config.alias );
	    	}

	    	config.layerID = layerID;
			var newSource = cockpitModule_mapServices.getFeaturesDetails(geoColumn, measure, config, configColumns,  values);
			if (config.clusterConf && config.clusterConf.enabled){
				var clusterSource = new ol.source.Cluster({ source: newSource });
				layer.setSource(clusterSource);
			}else{
				layer.setSource(newSource);
			}

			layer.getSource().refresh({force:true});
		}
//
//	    $scope.changeHeatmapValues = function(){
//    		for (l in $scope.ngModel.content.layers){
//		    	var layerDef =  $scope.ngModel.content.layers[l];
//				var data = $scope.getValuesLayer(layerDef.name);
//        		$scope.createLayerWithData(layerDef.name, data.values, false); //return to cluster view
//    		}
//
//	    }
	    //Utility functions
	    $scope.getLayerByName = function(n){
	    	var tmpName = n.split("|");
	    	if (tmpName.length > 1) n = tmpName[1];
	    	for (l in $scope.layers){
	    		if ($scope.layers[l].name === n)
	    			return $scope.layers[l].layer;
	    	}
	    	return null;
	    }

	    $scope.addLayer = function(n,l){
	    	$scope.layers.push({"name": n,"layer":l});
	    }

	    $scope.removeLayer = function(n){
	    	for (l in $scope.layers){
	    		if ($scope.layers[l].name == n)
	    			$scope.layers.splice(l,1);
	    	}
	    }

	    $scope.removeLayers = function(){
	    	$scope.layers = [];
	    	$scope.values = {};
	    	$scope.savedValues = {};
			$scope.configs = {};
			$scope.legend = [];
			cockpitModule_mapThematizerServices.removeLegends();

	    }

	    $scope.setLayerProperty = function(l, p, v){
	    	for (o in $scope.layers){
	    		if ($scope.layers[o].name === l)
	    			$scope.layers[o][p] = v;
	    	}
	    }

	    $scope.getLayerProperty = function(l, p){
	    	for (o in $scope.layers){
	    		if ($scope.layers[o].name === l)
	    			return $scope.layers[o][p] || null;
	    	}
	    }

	    $scope.setLayerProperty = function(l, p, v){
	    	for (o in $scope.layers){
	    		if ($scope.layers[o].name === l)
	    			$scope.layers[o][p] = v;
	    	}
	    }

	    $scope.selectPropValue = function(dsId, prop, modalSelectionColumn){
	    	if (!modalSelectionColumn && prop.fieldType !== "MEASURE"){
	    		$scope.doSelection(prop.alias, $scope.props[prop.name].value, null, null, null, null, dsId);
	    	}
	    }

	    //functions calls
		$scope.getLayers();
	}

	// this function register the widget in the cockpitModule_widgetConfigurator factory
	addWidgetFunctionality("map",{'initialDimension':{'width':20, 'height':20},'updateble':true,'cliccable':true});
})();