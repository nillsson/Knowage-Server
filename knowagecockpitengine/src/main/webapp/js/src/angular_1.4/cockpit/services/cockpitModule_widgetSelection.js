angular.module("cockpitModule").service("cockpitModule_widgetSelection",function(sbiModule_translate,sbiModule_restServices,cockpitModule_template,$q,$mdPanel,$rootScope,cockpitModule_properties,cockpitModule_widgetSelectionUtils,cockpitModule_templateServices,cockpitModule_nearRealtimeServices,sbiModule_messaging,cockpitModule_utilstServices){
	var ws=this;

	this.getSelectionLoadAssociative = function(){
		return cockpitModule_template.configuration.aggregations;
	}
	this.getCurrentSelections = function(datasetLabel){
		for(var i=0;i< cockpitModule_widgetSelectionUtils.responseCurrentSelection.length;i++){
			if(cockpitModule_widgetSelectionUtils.responseCurrentSelection[i].hasOwnProperty(datasetLabel)){
				return cockpitModule_widgetSelectionUtils.responseCurrentSelection[i];
			}
		}
		return {};
	}
	this.getCurrentFilters = function(datasetLabel){
		var toRet={};
		if(cockpitModule_template.configuration.filters[datasetLabel]!=undefined && Object.keys(cockpitModule_template.configuration.filters[datasetLabel]).length>0){
			toRet[datasetLabel]={};
			for(col in cockpitModule_template.configuration.filters[datasetLabel]){
				var values = cockpitModule_template.configuration.filters[datasetLabel][col];
				if(values){
					if(values.constructor === Array) {
						toRet[datasetLabel][col]=["('"+values.join("','")+"')"];
					} else {
						toRet[datasetLabel][col]=["('"+values+"')"];
					}
				}else{
					toRet[datasetLabel][col]=[];
				}
			}
		}
		return toRet;
	}
	this.getAggregation = function(ngModel,dataset,columnOrdering, reverseOrdering){
		var measures = [];
		var categories = [];
		var ds = dataset.label;

//		var columns = ngModel==undefined ? undefined : ngModel.content.columnSelectedOfDataset;
		var columns = (ngModel==undefined || !ngModel.content.columnSelectedOfDataset) ? undefined :(Array.isArray(ngModel.content.columnSelectedOfDataset) ) ? ngModel.content.columnSelectedOfDataset : ngModel.content.columnSelectedOfDataset[dataset.id.dsId] ;
		if(columns != undefined){
			//create aggregation
			for(var i=0;i<columns.length;i++){
				var col = columns[i];
				var obj = {};
				obj["id"] = col.alias;
				obj["alias"] = (ngModel.type == "table" ? col.aliasToShow : col.alias);

				if(col.isCalculated == true){
					obj["columnName"] = col.formula;
				}else{
					obj["columnName"] = col.name;
				}

				obj["orderType"] = "";
				if(columnOrdering !=undefined){
					if(columnOrdering.name == (ngModel.type == "table" ? col.aliasToShow : col.name)){
						obj["orderType"] = reverseOrdering==true ? 'ASC' : 'DESC';
					}
				}
				var newCategArray = [];
				if(ngModel.content.chartTemplate && ngModel.content.chartTemplate.CHART){
					var category = ngModel.content.chartTemplate.CHART.VALUES.CATEGORY;

					if(category){
						if(Array.isArray(category)){
							for (var j = 0; j < category.length; j++) {
								if(category[j].column == col.name){
									obj["orderType"] = col.orderType;
									obj["orderColumn"] = col.orderColumn;
									newCategArray.push(obj)
								}
								}
                        }else{
							if(col.fieldType == "ATTRIBUTE" && ngModel.content.chartTemplate.CHART.groupCategories){
								obj["orderColumn"] = col.name;
								obj["orderType"] = "asc";
							} else {
								obj["orderColumn"] = col.orderColumn;
								obj["orderType"] = col.orderColumn!="" && col.orderType=="" ? "ASC" : col.orderType;
							}
						}
					}
				}

				// SUM is default but for attribute is meaningless
				if(ngModel.type != "discovery" && (col.fieldType=="ATTRIBUTE" || col.fieldType=="SPATIAL_ATTRIBUTE") && col.aggregationSelected && col.aggregationSelected === 'SUM'){
					obj["funct"] = 'NONE';
				}else{
					// add aggregation for measures and attributes
					if (col.aggregationSelected && col.facet != false){
						if(col.aggregationSelected instanceof Array){
							for(var z = 0; z<col.aggregationSelected.length;z++){
								col.aggregationSelected[z] = col.aggregationSelected[z].toUpperCase();
							}
							obj["funct"] = col.aggregationSelected;
						}else{
							obj["funct"] = col.aggregationSelected.toUpperCase();
						}
					}else{
						obj["funct"] = 'NONE';
					}
				}

				if(col.fieldType=="ATTRIBUTE" || col.fieldType=="SPATIAL_ATTRIBUTE"){
					if(newCategArray.length >0 ){
						for (var m = 0; m < newCategArray.length; m++) {
							categories.push(newCategArray[m])
						}
					}else{
						if(col.aggregationColumn) obj.functColumn = col.aggregationColumn;
						categories.push(obj)
					}
				}else if (col.fieldType=="MEASURE"){
					//it is measure
					if(col.aggregationColumn) obj.functColumn = col.aggregationColumn;
					obj["orderColumn"] = col.name;
					measures.push(obj);
				}
			}

			if(ngModel.type && ngModel.type.toUpperCase()=="CHART"){
				if(!ngModel.content.chartTemplate.hasOwnProperty("CHART")){
					ngModel.content.chartTemplate = {"CHART":ngModel.content.chartTemplate};
				}
				var arrayOfSeries = ngModel.content.chartTemplate.CHART.VALUES.SERIE;
				for (var i = 0; i < arrayOfSeries.length; i++) {
					for (var j = 0; j < measures.length; j++) {
						if(arrayOfSeries[i].column == measures[j].columnName){
							measures[j].orderType = arrayOfSeries[i].orderType;

						}
					}
				}
			}
		}

		var crosstabDef = ngModel==undefined ? undefined : ngModel.content.crosstabDefinition;
		if(crosstabDef != undefined){
			// create aggregations from columns
			for(var i=0;i<crosstabDef.columns.length;i++){
				var col = crosstabDef.columns[i];
				var obj = {};
				obj["id"] = col.id;
				obj["alias"] = col.alias;
				obj["columnName"] = col.id;

				obj["orderType"] = "";
				if(columnOrdering !=undefined){
					if(columnOrdering.name == col.name){
						obj["orderType"] = reverseOrdering==true ? 'ASC' : 'DESC';
					}
				}

				categories.push(obj);
				//add associate column for sorting (if set)
				if (col.sortingId && col.sortingId != ""){
					var sortObj = this.createSortingCategory(col.sortingId, obj["orderType"]);
					categories.push(sortObj);
				}
			}

			// create aggregations from rows
			for(var i=0;i<crosstabDef.rows.length;i++){
				var row = crosstabDef.rows[i];
				var obj = {};
				obj["id"] = row.id;
				obj["alias"] = row.alias;
				obj["columnName"] = row.id;

				obj["orderType"] = "";
				if(columnOrdering !=undefined){
					if(columnOrdering.name == row.name){
						obj["orderType"] = reverseOrdering==true ? 'ASC' : 'DESC';
					}
				}

				categories.push(obj);
				//add associate column for sorting (if set)
				if (row.sortingId && row.sortingId != ""){
					var sortObj = this.createSortingCategory(row.sortingId, obj["orderType"]);
					categories.push(sortObj);
				}
			}

			// create aggregations from measures
			for(var i=0;i<crosstabDef.measures.length;i++){
				var measure = crosstabDef.measures[i];
				var obj = {};
				obj["id"] = measure.id;
				obj["alias"] = measure.alias;
				obj["columnName"] = measure.id;
				obj["funct"] = measure.funct;

				obj["orderType"] = "";
				if(columnOrdering !=undefined){
					if(columnOrdering.name == measure.name){
						obj["orderType"] = reverseOrdering==true ? 'ASC' : 'DESC';
					}
				}

				measures.push(obj);
			}
		}

		var result = {};
		result["measures"] = measures;
		result["categories"] = categories;
		result["dataset"] = ds;

		return result;

	}

	this.createSortingCategory=function(id, orderType){
		var obj = {};
		obj["id"] = id;
		obj["alias"] = id;
		obj["columnName"] = id;
		obj["orderType"] = orderType;
		return obj;
	}

	this.getAssociations=function(reloadSelection,tmpObj,deferred,associatedDatasets){
		var payload = {};
		payload["items"] = tmpObj==undefined ? cockpitModule_template.configuration.associations: tmpObj.associations;

		sbiModule_restServices.promisePost("1.0/associations","", payload)
		.then(function(response){
			if(tmpObj!=undefined){
				ws.updateAggregation(response.data,tmpObj.tmpAggregations,tmpObj.currentDsList,false);
				angular.copy(response.data,tmpObj.tmpAggregations);
			}else{
				angular.copy(response.data,cockpitModule_widgetSelectionUtils.associations);
				var someDel= ws.updateAggregation(response.data,cockpitModule_template.configuration.aggregations,cockpitModule_template.configuration.datasets,true);
				angular.copy(response.data,cockpitModule_template.configuration.aggregations);
				if(reloadSelection || (!reloadSelection && someDel)){
					cockpitModule_widgetSelectionUtils.responseCurrentSelection = [];
					ws.refreshAllAssociations(associatedDatasets);
				}
			}
			if(deferred!=undefined){
				deferred.resolve();
			}
		},function(response){
			sbiModule_restServices.errorHandler(response.data,"");
			if(deferred!=undefined){
				deferred.reject();
			}
		})
	}

	this.removeDatasetFromFilters=function(dsList){
		var someDelete=false;
		angular.forEach(dsList,function(ds){
			if(cockpitModule_template.configuration.filters.hasOwnProperty(ds)){
				someDelete=true;
				delete cockpitModule_template.configuration.filters[ds];
			}
		})
		//return true if some filters are deleted
		return someDelete;
	}
	this.updateAggregation=function(newAggr,oldAggr,dsList,updateFilters){
		var someDelete=false;

		angular.forEach(newAggr,function(newItem){
			if(updateFilters){
				var dl=ws.removeDatasetFromFilters(newItem.datasets);
				if(dl){
					someDelete=true;
				}
			}
			//get the old value
			for(var i=0;i<oldAggr.length;i++){
				if(ws.arrayContainsAll(oldAggr[i].datasets,newItem.datasets)){
					newItem.frequency=oldAggr[i].frequency;
					newItem.selection=oldAggr[i].selection;
					break;
				}
			}

			//create new val if not exist
			if(newItem.selection==undefined){
				newItem.selection={};
			}
			if(newItem.frequency==undefined){
				var minFreq={value:-1};
				angular.forEach(newItem.datasets,function(ds){
					var dsF=ws.getNearRealTimeFrequency(ds,dsList)
					if(this.value==-1){
						if(dsF>-1){
							this.value=dsF;
						}
					}else{
						if(dsF!=-1 && dsF<this.value){
							this.value=dsF;
						}
					}

				},minFreq)
				if(minFreq.value!=-1){
					newItem.frequency=minFreq.value;
				}
			}

		})
		return someDelete;
	}

	this.arrayContainsAll=function(arr1,arr2){
		if(arr1.length!=arr2.length){
			return false;
		}
		for(var i=0;i<arr1.length;i++){
			if(arr2.indexOf(arr1[i])==-1){
				return false;
			}
		}
		return true;
	}

	this.getNearRealTimeFrequency=function(dsLabel,dsList){
		for(var i=0;i<dsList.length;i++){
			//dsList can be the dataset of template or the dataset of cockpitModule_datasetServices.getAvaiableDatasets()
			if(angular.equals(dsList[i].dsLabel,dsLabel) || angular.equals(dsList[i].label,dsLabel)){
				return !dsList[i].useCache ?  (dsList[i].frequency || -1) : -1;
			}
		}
		return -1;
	}

	this.haveSelection=function(){
		for(var i=0;i<cockpitModule_template.configuration.aggregations.length;i++){
			if(cockpitModule_template.configuration.aggregations[i].selection!=undefined && Object.keys(cockpitModule_template.configuration.aggregations[i].selection).length>0){
				return true;
			}
		}
		return false;
	}

	this.haveFilters=function(){
		return (cockpitModule_template.configuration.filters!=undefined && Object.keys(cockpitModule_template.configuration.filters).length>0);
	}

	cockpitModule_properties.HAVE_SELECTIONS_OR_FILTERS=(this.haveSelection() || this.haveFilters());
	if(cockpitModule_properties.EDIT_MODE && cockpitModule_properties.HAVE_SELECTIONS_OR_FILTERS){
		//save the actual selection for associated dataset
		angular.forEach(cockpitModule_template.configuration.aggregations,function(aggr){
			angular.forEach(aggr.selection,function(selVal,selKey){
				var selSplit = selKey.split(".");
					cockpitModule_properties.STARTING_SELECTIONS.push({
						ds : selSplit[0],
						columnName : selSplit[1],
						value : selVal,
						aggregated:true
				});

			})
		});

		//save the actual filters of dataset
		angular.forEach(cockpitModule_template.configuration.filters,function(dsVal,dsLab){
			angular.forEach(dsVal,function(colVal,colLab){
				cockpitModule_properties.STARTING_FILTERS.push({
					ds : dsLab,
					columnName : colLab,
					value : colVal,
					aggregated:false
			});
			})
		});


	}



	this.getAssociativeSelections = function(column,columnName,datasetLabel,originalColumnName){
		var defer = $q.defer();

		//check if all associated widget are loaded
		var assoc=ws.getDatasetAssociation(datasetLabel);
		if(assoc!=undefined){

			//check if dataset is associated via not parameters only
			var isColumnPresent = false;
			for(var i=0; i<assoc.associations.length; i++){
				var association = assoc.associations[i];
				for(var j=0; j<association.fields.length; j++){
					var field = association.fields[j];
					if(field.store == datasetLabel){
						if(!field.column.startsWith("$P{") && !field.column.endsWith("}")){
							isColumnPresent = true;
							break;
						}
					}
					if(isColumnPresent){
						break;
					}
				}
			}
			if(!isColumnPresent){
				return "noAssoc";
			}

			var assDs=assoc.datasets
			var originalDSInCache=angular.copy(cockpitModule_properties.DS_IN_CACHE);
			var tmpSplittedDSInCache=angular.copy(cockpitModule_properties.DS_IN_CACHE);
			var naDSW= cockpitModule_templateServices.getDatasetAssociatedNotUsedByWidget();
			for(var i=0;i<assDs.length;i++){
				var dsIndex=tmpSplittedDSInCache.indexOf(assDs[i]);
				var isDoc=false;
				if(dsIndex==-1){
					//check if is not used by widget
//					if(!found && naDSW.indexOf(assDs[i])!=-1){
					if(naDSW.indexOf(assDs[i])!=-1){
						break;
					}
					//check if is document
					var found=false;
					for(var x=0;x<assoc.associations.length;x++){
						 for(var y=0;y<assoc.associations[x].fields.length;y++){
							if(angular.equals(assoc.associations[x].fields[y].store,assDs[i]) && angular.equals(assoc.associations[x].fields[y].type,"document")){
								found=true;
								isDoc=true;
								break;
							}
						}
						if(found){
							break;
						}
					}
					//if(!found){
					//	sbiModule_messaging.showWarningMessage(sbiModule_translate.load("sbi.cockpit.wait.loading.association.group"));
					//	return
					//}

				}
				if(!isDoc){
					tmpSplittedDSInCache.splice(dsIndex,1);
				}
			}
			//remove the dataset from the DS_IN_CACHE variable
			angular.copy(tmpSplittedDSInCache,cockpitModule_properties.DS_IN_CACHE);
		}else{
			return "noAssoc";
		}

		//converts parameters in array for simulate multiselection management
		var arColumnName = [];
		var arOriginalColumnName =[];
		var arColumn = [];
		if (!Array.isArray(columnName)){
			arColumnName.push(columnName);
			arOriginalColumnName.push(originalColumnName);
			arColumn.push(column);
		}else{
			arColumnName = columnName;
			arOriginalColumnName = originalColumnName;
			arColumn = column;
		}

		for (var c=0; c<arColumnName.length; c++){
			var key = datasetLabel+"."+arColumnName[c];
			var originalKey = datasetLabel+"."+arOriginalColumnName[c];
			var array = Array.isArray(arColumn[c]) ? arColumn[c] : [arColumn[c]];
			ws.addValueToSelection(key , array, datasetLabel, originalKey);
		}
//		var key = datasetLabel+"."+columnName;
//		var originalKey = datasetLabel+"."+originalColumnName;
//		var array = [];
//		array.push(column);
//		ws.addValueToSelection(key , array, datasetLabel, originalKey);
		this.loadAssociativeSelection(defer,ws.getDatasetAssociation(datasetLabel));
		defer.promise.then(function(){

		},function(){
			if(assoc!=undefined){
				angular.copy(originalDSInCache,cockpitModule_properties.DS_IN_CACHE);
			}
		})

		return defer.promise;

	}

	this.addValueToSelection = function(key, value, dsLabel,originalKey){
		for(var i=0;i<cockpitModule_template.configuration.aggregations.length ; i++){
			if(cockpitModule_template.configuration.aggregations[i].datasets.indexOf(dsLabel)!=-1){
				var copyOfValue = angular.copy(value);
				var selection = cockpitModule_template.configuration.aggregations[i].selection;
				if(selection.hasOwnProperty(key)){
					delete selection[key]; // force creation of new key in order to get it as last key during iteration
			}
				selection[key] = copyOfValue;
		}
	}
	}

	this.refreshAllWidgetWhithSameDataset=function(dsLabel){
		$rootScope.$broadcast('WIDGET_EVENT','UPDATE_FROM_DATASET_FILTER',{label:dsLabel});
	}

	this.refreshAllAssociatedWidget = function(isInit,data){
		$rootScope.$broadcast('WIDGET_EVENT','UPDATE_FROM_SELECTION',{isInit:isInit,data:data});
	}

	this.execRefreshAllAssociations = function(isInit,associatedDatasets){
		console.log("in: execRefreshAllAssociations",(new Date()).getTime());
		var  assRefCount=0;
		angular.forEach(cockpitModule_widgetSelectionUtils.associations, function(item,index){
			var defer = $q.defer();
			ws.loadAssociativeSelection(defer, item);
			defer.promise.then(function(){
                assRefCount++;
                if(angular.equals(assRefCount,cockpitModule_widgetSelectionUtils.associations.length)){
                    if(associatedDatasets){
                        var allAssociatedDatasets = []
                        for(var i in associatedDatasets){
                            var obj = ws.getDatasetAssociation(associatedDatasets[i]);
                            if(obj && obj.datasets){
                                for(var d in obj.datasets){
                                    var ds = obj.datasets[d];
                                    if(allAssociatedDatasets.indexOf(ds) == -1){
                                        allAssociatedDatasets.push(ds);
                                    }
                                }
                            }
                        }
                        for(var i in allAssociatedDatasets){
                            ws.refreshAllWidgetWhithSameDataset(allAssociatedDatasets[i]);
                        }
                    }else{
                        ws.refreshAllAssociatedWidget(isInit);
                    }
                }
            });
        })
	}

	this.refreshAllAssociations = function(associatedDatasets){
		console.log("in: refreshAllAssociation",(new Date()).getTime());
		if(cockpitModule_properties.all_widget_initialized==true){
			ws.execRefreshAllAssociations(false,associatedDatasets);
		}else{
			var AWI=$rootScope.$on('ALL_WIDGET_INITIALIZED',function(){
				ws.execRefreshAllAssociations(true,associatedDatasets);
				AWI();
			});
		}
	}

	this.clearAllSelections = function(){
		angular.forEach(cockpitModule_template.configuration.filters,function(value, key){
			delete cockpitModule_template.configuration.filters[key];
		});
	}



	this.loadCurrentSelections = function(dsLabel){
		var defer = $q.defer();
		if(cockpitModule_template.configuration.aggregations == undefined){
			defer.resolve({});
			return defer.promise;
		}

//		var associationsEncoded=encodeURIComponent(JSON.stringify(associations[0]))
		this.loadAssociativeSelection(defer,ws.getDatasetAssociation(dsLabel));
		return defer.promise;
	}

	this.getParameterFromDataset=function(dsList){
		var toret={};
		for(var i=0;i<cockpitModule_template.configuration.datasets.length;i++){
			var dsLabel = cockpitModule_template.configuration.datasets[i].dsLabel;
			var params={};
			angular.forEach(cockpitModule_template.configuration.datasets[i].parameters,function(item,key){
				this[key]=cockpitModule_utilstServices.getParameterValue(item);
				},params);
			toret[dsLabel] = params;
		}
		return toret;
	}
	this.widgetOfType = "";

	this.setWidgetOfType = function (type){
		this.widgetOfType = type;
	}
	this.columnName = "";

	this.setColumnName = function (columnName){
		this.columnName = columnName;
	}
	this.widgetID= "";

	this.setWidgetID= function (widgetID){
		this.widgetID = widgetID;
	}
	this.checkIfDatasetAreLoaded = function(){
		cockpitModule_templateServices.getDatasetNotInCache();

		for(var i=0;i<cockpitModule_properties.DS_NOT_IN_CACHE.length;i++){
			var dsLabel = cockpitModule_properties.DS_NOT_IN_CACHE[i];

		}
	}

	this.loadAssociativeSelection = function(defer,ass){

		if(ass==undefined){
			defer.reject();
			return;
		}

		var dsSel=ws.getUnaliasedSelection(ass.datasets);
		if(dsSel!=undefined && Object.keys(dsSel).length>0){
			var body = {};
			body["associationGroup"] = ass;
			body["selections"] = dsSel;
			body["datasets"] = ws.getParameterFromDataset(ass.datasets);
			body["nearRealtime"] = cockpitModule_nearRealtimeServices.getNearRealTimeDatasetFromList(ass.datasets);

			sbiModule_restServices.restToRootProject();
			sbiModule_restServices.promisePost("2.0/associativeSelections","",body)
			.then(function(response){
				var index = ws.currentSelectionContainsAss(response.data);
				if(index==-1){
					cockpitModule_widgetSelectionUtils.responseCurrentSelection.push(response.data);
				}else{
					cockpitModule_widgetSelectionUtils.responseCurrentSelection[index] = response.data;
				}
				cockpitModule_properties.HAVE_SELECTIONS_OR_FILTERS=true;
				defer.resolve(response.data);
			},function(response){
				sbiModule_restServices.errorHandler(response.data,"");
				defer.reject();
			})
		}else{
			var objDS={};
			angular.forEach(ass.datasets,function(item){
				this[item]={};
			},objDS)
			angular.copy([],cockpitModule_widgetSelectionUtils.responseCurrentSelection);
			defer.resolve(objDS);
		}


	}

	this.currentSelectionContainsAss = function(data){
		for(var i=0;i<cockpitModule_widgetSelectionUtils.responseCurrentSelection.length;i++){
			if(angular.equals(Object.keys(data), Object.keys(cockpitModule_widgetSelectionUtils.responseCurrentSelection[i]))){
				return i;
			}
		}
		return -1;
	}

	this.getSelectionByDsLabel =function(label){
		for(var j=0;j<cockpitModule_widgetSelectionUtils.associations.length;j++){
			if(cockpitModule_widgetSelectionUtils.associations[j].datasets.indexOf(label) != -1){
				this.getSelection(cockpitModule_widgetSelectionUtils.associations[j].datasets);
			}
		}
		return {};
	}

	this.getSelection = function(associations){
		for(var i = 0;i<cockpitModule_template.configuration.aggregations.length;i++){
			if(angular.equals(cockpitModule_template.configuration.aggregations[i].datasets, associations)){
				return cockpitModule_template.configuration.aggregations[i].selection;
			}
		}
		return {};
	}

	this.getUnaliasedSelection = function(datasets){
		for(var aggregationIndex in cockpitModule_template.configuration.aggregations){
			var aggregation = cockpitModule_template.configuration.aggregations[aggregationIndex];
			if(angular.equals(cockpitModule_template.configuration.aggregations[aggregationIndex].datasets, datasets)){
				var selections = angular.copy(aggregation.selection);

                var dsLabels = Object.keys(cockpitModule_template.configuration.filters);
				for(i in dsLabels){
				    var dsLabel = dsLabels[i]
				    var sel = cockpitModule_template.configuration.filters[dsLabel];
				    var columns = Object.keys(sel);
				    for (j in columns){
				        var column = columns[j]
				        selections[dsLabel + "." + column] = sel[column];
				    }
				}

				ws.resolveAliasesOnSelections(selections);
				return selections;
			}
		}
		return {};
	}

	this.resolveAliasesOnSelections = function(selections){
		var datasetMap = {};
		for(var datasetIndex in cockpitModule_template.configuration.datasets){
			var dataset = cockpitModule_template.configuration.datasets[datasetIndex];
			datasetMap["" + dataset.dsId] = dataset.dsLabel;
		}

		var aliasMap = {};
		var columnSet = new Set();

		for(var sheetIndex in cockpitModule_template.sheets){
			var sheet = cockpitModule_template.sheets[sheetIndex];
			for(var widgetIndex in sheet.widgets){
				var widget = sheet.widgets[widgetIndex];
				if(widget.dataset && widget.dataset.dsId){
					var datasetLabel = datasetMap[""+widget.dataset.dsId];
					if(datasetLabel != undefined){
					    var columns;
					    var columnNameProp;
					    var columnAliasProp;
					    if(widget.type=="static-pivot-table"){
					        columns = widget.content.crosstabDefinition.columns;
					        columns.concat(widget.content.crosstabDefinition.rows);
					        columns.concat(widget.content.crosstabDefinition.measures);
					        columnNameProp = "id";
					        columnAliasProp = "alias";
					    }else{
					        columns = (Array.isArray(widget.content.columnSelectedOfDataset) && widget.content.columnSelectedOfDataset[widget.dataset.dsId]) ?  widget.content.columnSelectedOfDataset[widget.dataset.dsId] : widget.content.columnSelectedOfDataset ;
					        columnNameProp = "name";
                            columnAliasProp = "aliasToShow";
					    }
						for(var widgetColumnIndex in columns){
						    var widgetColumn =columns[widgetColumnIndex];
							if(widgetColumn && widgetColumn[columnNameProp]){
								var columnName = widgetColumn[columnNameProp];
								var colonIndex = columnName.indexOf(":");
								if(colonIndex == -1){
									if(columnName == widgetColumn[columnAliasProp]){
										columnSet.add(datasetLabel + "." + columnName);
									}else{
										aliasMap[datasetLabel + "." + widgetColumn[columnAliasProp]] = datasetLabel + "." + columnName;
									}
								}
							}
						}
					}
				}
			}
		}

		for(var selection in selections){
			var alias = aliasMap[selection];
			if(alias!=undefined && !columnSet.has(selection)){
				var value = selections[selection];
				delete selections[selection];
				selections[alias] = value;
			}
		}
	}

	this.getDatasetAssociation=function(dsLabel){
		for(var i=0;i<cockpitModule_widgetSelectionUtils.associations.length;i++){
			if(cockpitModule_widgetSelectionUtils.associations[i].datasets.indexOf(dsLabel)!=-1){
				return cockpitModule_widgetSelectionUtils.associations[i];
			}
		}
	}

	this.updateSelections = function (tmpSelection, tmpFilters){
        var reloadAss = false;
        var associatedDatasets = [];
        var reloadFilt = [];

        if(!angular.equals(tmpSelection, cockpitModule_template.configuration.aggregations)){
            for(var i in cockpitModule_template.configuration.aggregations){
                var oldSelections = Object.keys(cockpitModule_template.configuration.aggregations[i].selection);
                var newSelections = Object.keys(tmpSelection[i].selection);
                var removedSelections = oldSelections.filter(function(x) {return newSelections.indexOf(x) < 0;});
                for(i in removedSelections){
                    var s = removedSelections[i].split(".");
                    ws.removeTimestampedSelection(s[0], s[1]);
                    associatedDatasets.push(s[0]);
                }
            }

            angular.copy(tmpSelection, cockpitModule_template.configuration.aggregations);
            reloadAss = true;
        }

        if(!angular.equals(tmpFilters, cockpitModule_template.configuration.filters )){
            var oldDsLabels = Object.keys(cockpitModule_template.configuration.filters);
            var newDsLabels = Object.keys(tmpFilters);
            var removedDsLabels = oldDsLabels.filter(function(x) {return newDsLabels.indexOf(x) < 0;});
            for(i in removedDsLabels){
                var removedDsLabel = removedDsLabels[i];
                var removedColNames = Object.keys(cockpitModule_template.configuration.filters[removedDsLabel]);
                for(j in removedColNames){
                    ws.removeTimestampedSelection(removedDsLabel, removedColNames[j]);
                }
            }
            var dsLabels = oldDsLabels.filter(function(x) {return newDsLabels.indexOf(x) >= 0;});
            for(i in dsLabels){
                var dsLabel = dsLabels[i];
                var removedColNames =
                        Object.keys(cockpitModule_template.configuration.filters[dsLabel]).filter(function(x) {
                            return Object.keys(tmpFilters[dsLabel]).indexOf(x) < 0;
                        });
                for(j in removedColNames){
                    ws.removeTimestampedSelection(dsLabel, removedColNames[j]);
                }
            }

            angular.forEach(cockpitModule_template.configuration.filters, function(val,dsLabel){
                if(tmpFilters[dsLabel] == undefined || !angular.equals(tmpFilters[dsLabel],val)){
                    if(reloadFilt.indexOf(dsLabel) == -1){
                        reloadFilt.push(dsLabel)
                    }
                }
            });
            angular.copy(tmpFilters, cockpitModule_template.configuration.filters);
        }

        if(reloadAss){
            ws.getAssociations(true,undefined,undefined,associatedDatasets);
        }

        var hs=false;
        for(var i=0; i<tmpSelection.length; i++){
            if(Object.keys(tmpSelection[i].selection).length > 0){
                hs = true;
                break;
            }
        }

        if(hs == false && Object.keys(tmpFilters).length == 0){
            cockpitModule_properties.HAVE_SELECTIONS_OR_FILTERS = false;
        }

        setTimeout(function() {
            for(var i in reloadFilt){
                ws.refreshAllWidgetWhithSameDataset(reloadFilt[i]);
            }
        }, 0);
	}

	this.getSelectionValues = function(datasetLabel, columnName){
		var result = null;

		var aggregations = cockpitModule_template.configuration.aggregations;
		for(var i=0; i<aggregations.length; i++){
			var selections = aggregations[i].selection;
			if(selections!=undefined){
				var datasetLabelAndColumnNames = Object.keys(selections);
				for(var j in datasetLabelAndColumnNames){
					var datasetLabelAndColumnName = datasetLabelAndColumnNames[j];
					var split = datasetLabelAndColumnName.split(".");
					if(split[0]==datasetLabel && split[1]==columnName){
						result = selections[datasetLabelAndColumnName]
						break;
					}
				}
			}
		}

        if(result == undefined){
            selections = cockpitModule_template.configuration.filters;
            if(selections && selections[datasetLabel]){
                if(selections[datasetLabel][columnName]){
                    result = selections[datasetLabel][columnName];
                }
            }
        }

		if(result){
			return Array.isArray(result) ? result : [result];
		}
		return null;
	}

	this.timestampedSelections = [];

    this.addTimestampedSelection = function(dsLabel, colName, values, widgetId){
        var selection = {
            creationTime: new Date().getTime(),
            dsLabel: dsLabel,
            colName: colName,
            values: values,
            widgetId: widgetId
        };
        var i = getTimestampedSelectionIndex(dsLabel, colName);
        if(i > -1){
            ws.timestampedSelections[i] = selection;
        }else{
            ws.timestampedSelections.push(selection);
        }
        ws.timestampedSelections.sort(function(x,y){return x.creationTime - y.creationTime});

        ws.setDirtyFlagOnWidgetsByDataset(dsLabel);
    }

    this.removeTimestampedSelection = function(dsLabel, colName){
        var i = getTimestampedSelectionIndex(dsLabel, colName);
        if(i > -1){
            ws.timestampedSelections.splice(i, 1);
            ws.setDirtyFlagOnWidgetsByDataset(dsLabel);
        }
    }

    var getTimestampedSelectionIndex = function(dsLabel, colName){
        for(i in ws.timestampedSelections){
            var selection = ws.timestampedSelections[i]
            if(selection.dsLabel == dsLabel && selection.colName == colName){
                return i;
            }
        }
        return -1;
    }

    this.getLastTimestampedSelection = function(){
        return ws.timestampedSelections.length > 0 ? ws.timestampedSelections[ws.timestampedSelections.length - 1] : null;
    }

    this.isLastTimestampedSelection = function(dsLabel, colName){
        var last = ws.getLastTimestampedSelection();
        return last && last.dsLabel == dsLabel && last.colName == colName;
    }

    this.setDirtyFlagOnWidgetsByDataset = function(dsLabel){
        var obj = ws.getDatasetAssociation(dsLabel);
        if(obj && obj.datasets){
            for(var d in obj.datasets){
                var ds = obj.datasets[d];
                ws.setDirtyFlagOnWidgets(ds);
            }
        }else{
            ws.setDirtyFlagOnWidgets(dsLabel);
        }
    }

    this.setDirtyFlagOnWidgets = function(dsLabel){
        for(var i in cockpitModule_template.sheets){
            var sheet = cockpitModule_template.sheets[i];
            for(var j in sheet.widgets){
                var widget = sheet.widgets[j];
                if(widget.dataset){
                    for(var k in cockpitModule_template.configuration.datasets){
                        var ds = cockpitModule_template.configuration.datasets[k];
                        if(ds.dsLabel == dsLabel && ds.dsId == widget.dataset.dsId){
                            cockpitModule_properties.DIRTY_WIDGETS.push(widget.id);
                            break;
                        }
                    }
                }
            }
        }
    }

})