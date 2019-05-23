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

angular
	.module('datasets_view_workspace', ['driversExecutionModule','tagsModule'])

	/**
	 * The HTML content of the Recent view (recent documents).
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	.directive('datasetsViewWorkspace', function () {
	 	return {
	      	restrict: 'E',
	      	replace: 'true',
	      	templateUrl: currentScriptPath + '../../../templates/datasetsViewWorkspace.html',
	      	controller: datasetsController
	  	};
	})

function datasetsController($scope, sbiModule_restServices, sbiModule_translate, $mdDialog, sbiModule_config, $window, $mdSidenav,
		sbiModule_user, sbiModule_helpOnLine, $qbeViewer, toastr, sbiModule_i18n, kn_regex,driversExecutionService,sbiModule_urlBuilderService, $httpParamSerializer, sbiModule_download,$sce, tagsHandlerService){

	var urlBuilderService = sbiModule_urlBuilderService;
	$scope.maxSizeStr = maxSizeStr;
	$scope.location = "workspace";
	$scope.translate = sbiModule_translate;
	$scope.i18n = sbiModule_i18n;
	$scope.urlBuilder = urlBuilderService
	$scope.restServices = sbiModule_restServices;
	$scope.showCkanIntegration = sbiModule_user.functionalities.indexOf("CkanIntegrationFunctionality")>-1;

	$scope.selectedDataset = undefined;
	//$scope.lastDocumentSelected = null;
	$scope.showDatasettInfo = false;
	$scope.currentTab = "myDataSet";
    $scope.previewDatasetModel=[];
    $scope.previewDatasetColumns=[];
    $scope.startPreviewIndex=0;
    $scope.endPreviewIndex=0;
    $scope.totalItemsInPreview=-1;	// modified by: danristo
    $scope.previewPaginationEnabled=true;
    $scope.paginationDisabled = null;
    $scope.ckanFilter = "";
    $scope.newOffset=0;
    $scope.allTags = [];
    $scope.itemsPerPage=15;
    $scope.datasetInPreview=undefined;

    $scope.showExportDriverPanel = false;

    /**
     * Flag that will tell us if we are entering the Dataset wizard from the Editing or from Creating phase (changing or adding a new dataset, respectively).
     * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
     */
    $scope.editingDatasetFile = false;

    $scope.datasetsInitial=[];  //all
	$scope.myDatasetsInitial= [];
	$scope.enterpriseDatasetsInitial=[];
	$scope.sharedDatasetsInitial=[];

	/**
	 * STEP 3
	 */
	$scope.allHeadersForStep3Preview = [];
	$scope.allRowsForStep3Preview = [];

	/**
	 * The validation status after submitting the Step 2.
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	$scope.validationStatus = false;

	/**
	 * An indicator if the user previously (already) uploaded an XLS/CSV file, in the case of re-browsing for a new one (this one needs to be uploaded, as well).
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	$scope.prevUploadedFile = null;

	$scope.datasetSavedFromQbe = false;

	$scope.datasetTemp = null;

	function createSourceNameOnDataset(datasetsArray) {
		for(var i=0; i < datasetsArray.length; i++) {
			var index = datasetsArray.indexOf(datasetsArray[i]);
			if(datasetsArray[i].hasOwnProperty("qbeDatamarts")) {
				datasetsArray[index].sourceName = datasetsArray[i].qbeDatamarts;
			} else if(datasetsArray[i].hasOwnProperty("federationName")) {
				datasetsArray[index].sourceName = datasetsArray[i].federationName;
			}
		}
	}

    $scope.markNotDerived = function(datasets){

    	for(i=0;i<datasets.length;i++){

    		if($scope.notDerivedDatasets.indexOf(datasets[i].label)>-1){

    			datasets[i].derivated=false;

    		}else{
    			datasets[i].derivated=true;
    		}
    	}
    }

	/**
	 * load all datasets
	 */
	$scope.loadDatasets = function(){

		/**
		 * 'functionsToCall' - array of functions in this scope (that load different dataset types) that we expect to
		 * load after the one that loads all not derived datasets.
		 * 'indexForNextFn' - index of the one that should be loaded next (if there is one - if not, array item on this
		 * index should be undefined).
		 *
		 * NOTE: This goes for all subsequent functions in this scope, for loading other dataset types.
		 *
		 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
		 */
		var functionsToCall = arguments[0][0];
		var indexForNextFn = arguments[0][1];

		sbiModule_restServices.promiseGet("1.0/datasets/mydata", "")
		.then(function(response) {
			angular.copy(response.data.root,$scope.datasets);
			tagsHandlerService.setAllDS(response.data.root)
			createSourceNameOnDataset($scope.datasets);

			$scope.markNotDerived($scope.datasets);
			angular.copy($scope.datasets,$scope.datasetsInitial);
			console.info("[LOAD END]: Loading of All datasets is finished.");

			/**
			 * After this REST call (loading all datasets), call the next one (the one with the index
			 * of indexForNextFn+1 in the array of all functions that are expected to be called after
			 * this. If there are no other datasets that should be loaded (after this one), do nothing.
			 *
			 * NOTE: This goes for all subsequent functions in this scope, for loading other dataset types.
			 *
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */
			functionsToCall[indexForNextFn] ? $scope[functionsToCall[indexForNextFn]]([functionsToCall,indexForNextFn+1]) : null;

		},function(response){

			/*
			 * TEMPORARY SOLUTION: show toast instead of the popup, in order to prevent stopping of the potential
			 * further execution of REST services.
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(sbiModule_translate.load("sbi.ds.alldatasets.loading.error.msg"),
					sbiModule_translate.load('sbi.generic.error'), $scope.toasterConfig);

			/**
			 * Even if the REST call of this one was unsuccessful, call the next one (the one with the index
			 * of indexForNextFn+1 in the array of all functions that are expected to be called after this.
			 * If there are no other datasets that should be loaded (after this one), do nothing.
			 *
			 * NOTE: This goes for all subsequent functions in this scope, for loading other dataset types.
			 *
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */
			functionsToCall[indexForNextFn] ? $scope[functionsToCall[indexForNextFn]]([functionsToCall,indexForNextFn+1]) : null;
		});

	}

	$scope.loadMyDatasets = function(){

		var functionsToCall = arguments[0][0];
		var indexForNextFn = arguments[0][1];

		sbiModule_restServices.promiseGet("1.0/datasets/owned", "")
		.then(function(response) {
			angular.copy(response.data.root,$scope.myDatasets);
			tagsHandlerService.setOwnedDS(response.data.root)
			createSourceNameOnDataset($scope.myDatasets);
			$scope.markNotDerived($scope.myDatasets);
			angular.copy($scope.myDatasets,$scope.myDatasetsInitial);
			console.info("[LOAD END]: Loading of My datasets is finished.");

			functionsToCall[indexForNextFn] ? $scope[functionsToCall[indexForNextFn]]([functionsToCall,indexForNextFn+1]) : null;

		},function(response){

			/*
			 * TEMPORARY SOLUTION: show toast instead of the popup, in order to prevent stopping of the potential
			 * further execution of REST services.
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(sbiModule_translate.load("sbi.ds.mydatasets.loading.error.msg"),
					sbiModule_translate.load('sbi.generic.error'), $scope.toasterConfig);

			functionsToCall[indexForNextFn] ? $scope[functionsToCall[indexForNextFn]]([functionsToCall,indexForNextFn+1]) : null;

		});
	}

	$scope.loadEnterpriseDatasets = function(){

		var functionsToCall = arguments[0][0];
		var indexForNextFn = arguments[0][1];

		sbiModule_restServices.promiseGet("1.0/datasets/enterprise", "")
		.then(function(response) {
			var enterpriseDatasetsWithParams = [];
			angular.copy(response.data.root,enterpriseDatasetsWithParams);

			for (var i = 0; i < enterpriseDatasetsWithParams.length; i++) {
				if(enterpriseDatasetsWithParams[i].pars.length==0){
					$scope.enterpriseDatasets.push(enterpriseDatasetsWithParams[i]);
				}
			}
			//angular.copy(response.data.root,$scope.enterpriseDatasets);
			createSourceNameOnDataset($scope.enterpriseDatasets);
			$scope.markNotDerived($scope.enterpriseDatasets);

			angular.copy($scope.enterpriseDatasets,$scope.enterpriseDatasetsInitial);
			tagsHandlerService.setEnterpriseDS($scope.enterpriseDatasets)
			console.info("[LOAD END]: Loading of Enterprised datasets is finished.");
			functionsToCall[indexForNextFn] ? $scope[functionsToCall[indexForNextFn]]([functionsToCall,indexForNextFn+1]) : null;

		},function(response){

			/*
			 * TEMPORARY SOLUTION: show toast instead of the popup, in order to prevent stopping of the potential
			 * further execution of REST services.
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */
			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(sbiModule_translate.load("sbi.ds.enterprisedatasets.loading.error.msg"),
					sbiModule_translate.load('sbi.generic.error'), $scope.toasterConfig);

			functionsToCall[indexForNextFn] ? $scope[functionsToCall[indexForNextFn]]([functionsToCall,indexForNextFn+1]) : null;

		});
	}

	$scope.loadSharedDatasets = function(){

		var functionsToCall = arguments[0][0];
		var indexForNextFn = arguments[0][1];

		sbiModule_restServices.promiseGet("1.0/datasets/shared", "")
		.then(function(response) {
			//angular.copy(response.data.root,$scope.sharedDatasets);
			var sharedDatasetsWithParams = [];
			angular.copy(response.data.root,sharedDatasetsWithParams);
			for (var i = 0; i < sharedDatasetsWithParams.length; i++) {
				if(sharedDatasetsWithParams[i].pars.length==0){
					$scope.sharedDatasets.push(sharedDatasetsWithParams[i]);
				}
			}
			createSourceNameOnDataset($scope.sharedDatasets);
			$scope.markNotDerived($scope.sharedDatasets);
		    angular.copy($scope.sharedDatasets,$scope.sharedDatasetsInitial);
		    tagsHandlerService.setSharedDS($scope.sharedDatasets)
			console.info("[LOAD END]: Loading of Shared datasets is finished.");

			functionsToCall[indexForNextFn] ? $scope[functionsToCall[indexForNextFn]]([functionsToCall,indexForNextFn+1]) : null;

		},function(response){

			/*
			 * TEMPORARY SOLUTION: show toast instead of the popup, in order to prevent stopping of the potential
			 * further execution of REST services.
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */
			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(sbiModule_translate.load("sbi.ds.shareddatasets.loading.error.msg"),
					sbiModule_translate.load('sbi.generic.error'), $scope.toasterConfig);

			functionsToCall[indexForNextFn] ? $scope[functionsToCall[indexForNextFn]]([functionsToCall,indexForNextFn+1]) : null;

		});
	}

	$scope.loadNotDerivedDatasets = function(){

		/**
		 * We are getting names of all functions in this scope that we need to call after loading not
		 * derived datasets. These names are sent in a form of an array of strings, where each of these
		 * strings represent the name of the function that should be called. At the same time, the order
		 * of those strings is set appropriately. This way we will call RETS services for loading specific
		 * dataset type(s) in cascade, instead of their almost simultaneous call.
		 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
		 */
		var functionsToCall = arguments;

		sbiModule_restServices.promiseGet("2.0/datasets", "", "includeDerived=no")
		.then(function(response) {

			//angular.copy(response.data,$scope.notDerivedDatasets);
			$scope.extractNotDerivedLabels(response.data);
			console.info("[LOAD END]: Loading of Not derived datasets is finished.");

			/**
			 * After this REST call (loading all not derived datasets), call the next one (the one
			 * with the index of 1 in the array of all functions that are expected to be called after
			 * this. If there are no other datasets that should be loaded (after this one), do nothing.
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */
			functionsToCall[0] ? $scope[functionsToCall[0]]([functionsToCall,1]) : null;

		},function(response){

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(response.data, sbiModule_translate.load('sbi.workspace.dataset.load.error'), $scope.toasterConfig);

			/**
			 * Even if the REST call of this one was unsuccessful, call the next one (the one
			 * with the index of 1 in the array of all functions that are expected to be called after
			 * this. If there are no other datasets that should be loaded (after this one), do nothing.
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */
			functionsToCall[0] ? $scope[functionsToCall[0]]([functionsToCall,1]) : null;

		});
	}

	$scope.loadInitialForDatasets=function(){
		angular.copy($scope.datasets,$scope.datasetsInitial);
		angular.copy($scope.myDatasets,$scope.myDatasetsInitial);
		angular.copy($scope.enterpriseDatasets,$scope.enterpriseDatasetsInitial);
		angular.copy($scope.sharedDatasets,$scope.sharedDatasetsInitial);
	};


	$scope.deleteDataset=function(dataset, $event){

		var label = dataset.label;

		sbiModule_restServices.promiseGet("2.0/federateddataset/dataset", dataset.id)
			.then(function(response){
				var federationModels = response.data;
				
				if (federationModels.length > 0) {
					$mdDialog.show(
						      $mdDialog.alert()
						        .parent(angular.element(document.body))
						        .clickOutsideToClose(true)
						        .title(sbiModule_translate.load("sbi.ds.deletedataset")) 
						        .textContent(sbiModule_translate.load("sbi.federationdefinition.cant.delete.dataset")) 
						        .ariaLabel('Delete dataset info')
						        .ok(sbiModule_translate.load("sbi.general.close"))
						        .targetEvent(event)
						    ).then(function(){
						    	// dialog closed
						    });
				} else {
					var confirm = $mdDialog.confirm()
					.title(sbiModule_translate.load("sbi.workspace.delete.confirm.title"))
					.content(sbiModule_translate.load("sbi.workspace.dataset.delete.confirm"))
					.ariaLabel('delete Document')
					.ok(sbiModule_translate.load("sbi.general.yes"))
					.cancel(sbiModule_translate.load("sbi.general.No"));
				
					$mdDialog.show(confirm).then(function() {
	
						sbiModule_restServices.promiseDelete("1.0/datasets",label)
						.then(function(response) {
	
							// Take the toaster duration set inside the main controller of the Workspace. (danristo)
							toastr.success(sbiModule_translate.load("sbi.workspace.dataset.delete.success"),
									sbiModule_translate.load('sbi.workspace.dataset.success'), $scope.toasterConfig);
	
							$scope.reloadMyDataFn();
							$scope.selectDataset(undefined);
							
							/**
							 * If some dataset is removed from the filtered set of datasets, clear the search input, since all datasets are refreshed.
							 *  @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
							 */
							$scope.searchInput = "";
						},function(response) {
	
							// Take the toaster duration set inside the main controller of the Workspace. (danristo)
							toastr.error(response.data.errors[0].message,
				        			  sbiModule_translate.load('sbi.generic.error'), $scope.toasterConfig);
	
						});
					});
				}
				
			}, function(response){
				toastr.error(response.data.errors[0].message,
	        			  sbiModule_translate.load('sbi.generic.error'), $scope.toasterConfig);
			});
		
	}

	$scope.downloadDatasetFile = function(dataset) {
		var params = {};
		params.fileName = dataset.fileName;
		params.type = dataset.fileType.toLowerCase();
		var requestParams = '?' + $httpParamSerializer(params);
		var config = {"responseType": "arraybuffer"};
		sbiModule_restServices.promiseGet('2.0/datasets', 'download/file' + requestParams, undefined, config)
			.then(function(response){
				var mimeType = response.headers("Content-type");
				var paramsString = response.headers("Content-Disposition");
				if (mimeType == 'application/octet-stream' || paramsString == null) {
					toastr.error('', sbiModule_translate.load("sbi.workspace.dataset.download.error"), $scope.toasterConfig);
				} else {
					var arrayParam = paramsString.split(';');
					var fileName = "";
					var fileType = "";
					var extensionFile = "";
					for (var i = 0; i< arrayParam.length; i++){
						var p = arrayParam[i].toLowerCase();
						if (p.includes("filename")){
							fileName = arrayParam[i].split("=")[1];
						}else if (p.includes("filetype")){
							fileType = arrayParam[i].split("=")[1];
						}else if (p.includes("extensionfile")){
							extensionFile = arrayParam[i].split("=")[1];
						}
					}
					if (fileName && fileName.endsWith("." + extensionFile)){
						fileName = fileName.split("." + extensionFile)[0];
					}
					sbiModule_download.getBlob(response.data, fileName, fileType, extensionFile);
				}
			}, function(response){
				toastr.error(response.data, sbiModule_translate.load("sbi.generic.error"), $scope.toasterConfig);
			});
	}

	$scope.showDatasetDetails = function() {
		return $scope.showDatasetInfo && $scope.isSelectedDatasetValid() && !$scope.showExportDriverPanel;
	};


	$scope.isSelectedDatasetValid = function() {
		return $scope.selectedDataset !== undefined;
	};

	$scope.setDetailOpen = function(isOpen) {
		if($scope.showDriversForExport) $scope.showDriversForExport = false;
		if (isOpen && !$mdSidenav('rightDs').isLockedOpen() && !$mdSidenav('rightDs').isOpen()) {
			$scope.toggleDatasetDetail();
		}

		$scope.showDatasetInfo = isOpen;
	};

	$scope.toggleDatasetDetail = function() {
		$mdSidenav('rightDs').toggle();
	};

	$scope.selectDataset= function ( dataset ) {
		if (dataset !== undefined) {
			//$scope.lastDatasetSelected = dataset;
		}
		var alreadySelected = (dataset !== undefined && $scope.selectedDataset === dataset);
		$scope.selectedDataset = dataset;

		if (alreadySelected) {
			$scope.selectedDataset=undefined;
			$scope.setDetailOpen(!$scope.showDatasetDetail);
		} else {
			$scope.setDetailOpen(dataset !== undefined);
		}
	};

	$scope.shareDatasetWithCategories = function(dataset){
		$scope.loadDsCategoriesAndHandleEvent(dataset);
		$scope.dataset = dataset;
	}

	 $scope.showAlert = function() {
		    $mdDialog.show(
		      $mdDialog.alert()
		        .clickOutsideToClose(true)
		        .title(sbiModule_translate.load('sbi.workspace.categories.alert.dialog'))
		        .textContent(sbiModule_translate.load('sbi.workspace.categories.alert.msg'))
		        .ariaLabel('Alert Dialog Categories')
		        .ok(sbiModule_translate.load('sbi.general.ok'))
		    );
		  };


	$scope.showCategoriesDialog = function() {
		$mdDialog.show({
			  scope:$scope,
			  preserveScope: true,
		      controller: DialogShareDatasetController,
		      templateUrl: sbiModule_config.dynamicResourcesBasePath+'/angular_1.4/tools/workspace/templates/shareDatasetDialogTemplate.html',
		      clickOutsideToClose:false,
		      escapeToClose :false,
		      locals:{
		      }
		    });
	}

	$scope.applySelectedCategory = function(dataset) {
		$scope.shareDataset($scope.dataset)
		$mdDialog.cancel();
	}

	$scope.loadDsCategoriesAndHandleEvent = function(dataset) {
    	sbiModule_restServices.promiseGet("domainsforfinaluser","ds-categories")
		.then(function(response) {
			$scope.datasetCategoryType = [];
			angular.copy(response.data,$scope.datasetCategoryType);
			if(dataset.hasOwnProperty('catTypeId')&&$scope.datasetCategoryType.length==0){
				$scope.unshareDataset(dataset);
			} else if($scope.datasetCategoryType.length==0&&!dataset.hasOwnProperty('catTypeId')){
				$scope.showAlert();
			} else if($scope.datasetCategoryType.length==1){
				$scope.shareDataset(dataset);
			} else {
				$scope.showCategoriesDialog();
			}
		},function(response){

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(response.data, sbiModule_translate.load("sbi.generic.error"), $scope.toasterConfig);

		});
	}

    function DialogShareDatasetController($scope,$mdDialog){

    	$scope.closeShareDialog=function(){
    		$mdDialog.cancel();
    	}
    }

    $scope.shareDataset=function(dataset){
    	var dsCatType = $scope.datasetCategoryType;
    	if(dsCatType.length==1&&dataset.catTypeId!=undefined){
    		$scope.unshareDataset(dataset);
    		return;
    	}
    	var id=dataset.id;
    	var catTypeId = null;
    	var catTypeCd = null;
    	if(dsCatType.length==1){
    		catTypeId = dsCatType[0].VALUE_ID;
    		catTypeCd =  dsCatType[0].VALUE_CD;
    	} else {
    		for (var i = 0; i < dsCatType.length; i++) {
				if($scope.datasetTemp.catTypeId==dsCatType[i].VALUE_ID){
					catTypeCd=dsCatType[i].VALUE_CD;
					catTypeId=dsCatType[i].VALUE_ID;
					break;
				}
			}
    	}

        params={};
    	params.id=id;
    	params.catTypeId = catTypeId;
    	params.catTypeCd = catTypeCd;
    	config={};
    	config.params=params;

    	sbiModule_restServices.promisePost("selfservicedataset/share","","",config)
		.then(function(response) {
			 dataset.catTypeId=response.data.catTypeId;
			 dataset.catTypeCd=response.data.catTypeCd;

	          if(response.data.catTypeId!=null){

	        	  // Take the toaster duration set inside the main controller of the Workspace. (danristo)
	        	  toastr.success(sbiModule_translate.load("sbi.workspace.dataset.share.success"),
							sbiModule_translate.load('sbi.workspace.dataset.success'), $scope.toasterConfig);

	          }
	          else {

	        	  // Take the toaster duration set inside the main controller of the Workspace. (danristo)
	        	  toastr.success(sbiModule_translate.load("sbi.workspace.dataset.unshare.success"),
							sbiModule_translate.load('sbi.workspace.dataset.success'), $scope.toasterConfig);

	          }

		},function(response){

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(response.data, sbiModule_translate.load('sbi.workspace.dataset.fail'), $scope.toasterConfig);

		});

    }

    $scope.unshareDataset = function(dataset){
    	var id=dataset.id;
    	var catTypeId = null;
    	var catTypeCd = null;
    	params={};
    	params.id=id;
    	params.catTypeId = catTypeId;
    	params.catTypeCd = catTypeCd;
    	config={};
    	config.params=params;

    	sbiModule_restServices.promisePost("selfservicedataset/share","","",config)
		.then(function(response) {
			 dataset.catTypeId=response.data.catTypeId;
			 dataset.catTypeCd=response.data.catTypeCd;
	          if(response.data.catTypeId==null){

	        	  // Take the toaster duration set inside the main controller of the Workspace. (danristo)
	        	  toastr.success(sbiModule_translate.load("sbi.workspace.dataset.unshare.success"),
							sbiModule_translate.load('sbi.workspace.dataset.success'), $scope.toasterConfig);

	          }else{

	        	// Take the toaster duration set inside the main controller of the Workspace. (danristo)
				toastr.error(response.data, sbiModule_translate.load('sbi.workspace.dataset.fail'), $scope.toasterConfig);

	          }
		},function(response){

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(response.data, sbiModule_translate.load('sbi.workspace.dataset.fail'), $scope.toasterConfig);

		});
    	$mdDialog.cancel();
    }

    $scope.showQbeDataset= function(dataset){

		var label= dataset.label;

		var url= datasetParameters.qbeFromDataSetServiceUrl
		       +'&dataset_label='+label
		       + (isTechnicalUser != undefined ? '&isTechnicalUser=' + isTechnicalUser : '');

		 //$window.location.href=url;
		$scope.getDatasetParametersFromBusinessModel(dataset).then(function(){
			$qbeViewer.openQbeInterfaceDSet($scope, false, url, true);
		})
    }

    $scope.extractNotDerivedLabels= function(datasets){

    	for(i=0;i<datasets.length;i++){
    		$scope.notDerivedDatasets.push(datasets[i].label);
    	}

    }

    $scope.creationDatasetEnabled= function(){

    return datasetParameters.CAN_CREATE_DATASET_AS_FINAL_USER==="true";

    }

    $scope.showHelpOnline= function(dataset){

    	sbiModule_helpOnLine.show(dataset.label);
    }

    $scope.isSharingEnabled=function(){
        return $scope.currentTab==="myDataSet";
    }



    $scope.exportDataset= function(dataset,format){
    	$scope.showExportDriverPanel = true;
    	$scope.dataset = dataset;
    	$scope.formatValueForExport = format;
    	$scope.getDatasetParametersFromBusinessModel($scope.selectedDataset).then(function(){
    		if($scope.drivers && $scope.drivers.length > 0){
    			$scope.dataset.parametersData = {};
    			$scope.dataset.parametersData.documentParameters = $scope.drivers;
    			$scope.showDriversForExport = true;
    		}else{
    			 $scope.exportDatasetWithDrivers(dataset,format);
    		}
    	})

    }
    $scope.exportDatasetWithDrivers = function(dataset){
    	$scope.showExportDriverPanel = false;
    	var format = $scope.formatValueForExport;
    	var id=dataset.id;
       	if(isNaN(id)){
       		id=id.dsId;
       	}
    	if(format == 'CSV') {
       		var url= sbiModule_restServices.getBaseUrl("1.0/datasets/" + id + "/export");
       		console.info("[EXPORT]: Exporting dataset with id " + id + " to CSV");
       		if($scope.drivers.length>0){
       			urlBuilderService.setBaseUrl(url);
       			queryDriverObj = {}
       			queryDriverObj.DRIVERS = driversExecutionService.prepareDriversForSending($scope.drivers);
       			urlBuilderService.addQueryParams(queryDriverObj);
       			url = urlBuilderService.build();
       			$window.open(url);
       		}else{
       			$window.open(url);
       		}

       	} else if (format == 'XLSX') {
       		var actionName='EXPORT_EXCEL_DATASET_ACTION';
       		var url= sbiModule_config.adapterPath;
       		urlBuilderService.setBaseUrl(url);
       		var urlBaseObject = {}
       		urlBaseObject["ACTION_NAME"] = actionName;
       		urlBaseObject["SBI_EXECUTION_ID"] = -1;
       		urlBaseObject["LIGHT_NAVIGATOR_DISABLED"] = "TRUE";
       		urlBaseObject["id"] = id;
       		urlBuilderService.addQueryParams(urlBaseObject);

       		if($scope.drivers && $scope.drivers.length>0){
       			queryDriverObj = {}
       			queryDriverObj.DRIVERS = driversExecutionService.prepareDriversForSending($scope.drivers);
       			urlBuilderService.addQueryParams(queryDriverObj);
       			url = urlBuilderService.build();
       			$window.location.href = url;
       		}else{
       			$window.location.href=urlBuilderService.build();;
       		}
       		console.info("[EXPORT]: Exporting dataset with id " + id + " to XLSX");

       		$window.location.href=url;
       	} else {
       		console.info("Format " + format + " not supported");
       	}
    	$scope.showDriversForExport = false;
    }

    $scope.previewDataset = function(dataset){

    	console.info("DATASET FOR PREVIEW: ",dataset);

    	$scope.datasetInPreview=dataset;
    	$scope.disableBack=true;
    	$scope.getDatasetParametersFromBusinessModel(dataset).then(function(){
    	/**
    	 * Variable that serves as indicator if the dataset metadata exists and if it contains the 'resultNumber'
    	 * property (e.g. Query datasets).
    	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
    	 */
    	var dsRespHasResultNumb = dataset.meta.dataset.length>0 && dataset.meta.dataset[0].pname=="resultNumber";

    	/**
    	 * The paginated dataset preview should contain the 'resultNumber' inside the 'dataset' property. If not, disable the
    	 * pagination in the toolbar of the preview dataset dialog.
    	 * @modifiedBy Danilo Ristovski (danristo, danilo.ristovski@mht.net)
    	 */
    	if(dataset.meta.dataset.length>0 && dataset.meta.dataset[0].pname=="resultNumber"){
    		$scope.totalItemsInPreview=dataset.meta.dataset[0].pvalue;
    		$scope.previewPaginationEnabled=true;
    	}
    	else{
    		$scope.previewPaginationEnabled=false;
    	}

    	if(!($scope.datasetInPreview.pars.length > 0 || driversExecutionService.hasMandatoryDrivers($scope.drivers)))
    	$scope.getPreviewSet($scope.datasetInPreview);

    	/**
    	 * Execute this if-else block only if there is already an information about the total amount of rows in the dataset metadata.
    	 * In other words, it should be executed for the e.g. Query dataset, since it has this property in its meta.
    	 * @modifiedBy Danilo Ristovski (danristo, danilo.ristovski@mht.net)
    	 */
    	if (dsRespHasResultNumb) {

    		if($scope.totalItemsInPreview < $scope.itemsPerPage) {
    			$scope.endPreviewIndex = $scope.totalItemsInPreview;
    			$scope.disableNext = true;
    		}
    		else {
    		 	$scope.endPreviewIndex = $scope.itemsPerPage;
    		 	$scope.disableNext = false;
    		}

    	}

     	$mdDialog.show({
			  scope:$scope,
			  preserveScope: true,
		      controller: DatasetPreviewController,
		      templateUrl: sbiModule_config.dynamicResourcesBasePath+'/angular_1.4/tools/workspace/templates/datasetPreviewDialogTemplateWorkspace.html',
		      clickOutsideToClose:false,
		      escapeToClose :false,
		      //fullscreen: true,
		      locals:{
		    	 // previewDatasetModel:$scope.previewDatasetModel,
		         // previewDatasetColumns:$scope.previewDatasetColumns
		      }
		    });
    	})
    }

    $scope.editQbeDataset = function(dataset) {
    	$scope.selectedDataSet = dataset;
    	var url = null;
	     if(dataset.dsTypeCd=='Federated'){
	      url = datasetParameters.qbeEditFederatedDataSetServiceUrl
	         +'&FEDERATION_ID='+dataset.federationId
	         +'&DATA_SOURCE_ID='+ dataset.qbeDataSourceId;
	     } else {
	      var modelName= dataset.qbeDatamarts;
	   var dataSource=dataset.qbeDataSource;
	      url = datasetParameters.buildQbeDataSetServiceUrl
	           +'&DATAMART_NAME='+modelName
	           +'&DATASOURCE_LABEL='+ dataSource
	           +'&DATA_SOURCE_ID='+ dataset.qbeDataSourceId;
	     }
	     $scope.getDatasetParametersFromBusinessModel($scope.selectedDataSet).then(function(){
	  //url = "http://localhost:8080/knowageqbeengine/servlet/AdapterHTTP?ACTION_NAME=BUILD_QBE_DATASET_START_ACTION&user_id=biadmin&NEW_SESSION=TRUE&SBI_LANGUAGE=en&SBI_COUNTRY=US&DATASOURCE_LABEL=foodmart&DATAMART_NAME=foodmart";
	  // $window.location.href=url;
			  $scope.isFromDataSetCatalogue = false;
			  $qbeViewer.openQbeInterfaceDSet($scope, true, url);
	     });
    }

    $scope.editFileDataset = function (arg) {

  	  $scope.initializeDatasetWizard(arg);

  	  // Set the flag for editing the current dataaset (file)
  	  $scope.editingDatasetFile = true;

        $mdDialog.show({
  		  scope:$scope,
  		  preserveScope: true,
  	      controller: DatasetCreateController,
  	      templateUrl: sbiModule_config.dynamicResourcesBasePath+'/angular_1.4/tools/workspace/templates/datasetCreateDialogTemplate.html',
  	      clickOutsideToClose: false,
  	      escapeToClose :true,
  	      //fullscreen: true,
  	      locals:{
  	    	 // previewDatasetModel:$scope.previewDatasetModel,
  	         // previewDatasetColumns:$scope.previewDatasetColumns
  	      }
  	    });
    }


    $scope.tableDatasets = [
    	{"label":"Label","name":"label","type":"text"},
    	{"label":"Name","name":"name","type":"text"},
    	{"label":"BM/F", "name": "sourceName","type":"text"},
    	{"type": "buttons", "buttons": [
    		{"name": "Preview Dataset", "icon": "fa fa-eye", "action":$scope.previewDataset, "visible": function(){return true;} },
    		{"name": "Show dataset details", "icon": "fa fa-pencil-square-o", "action": $scope.editFileDataset, "visible": function(ds){ return (ds.fileType) && (ds.dsTypeCd=='File')} },
    		{"name": "Edit dataset", "icon": "fa fa-pencil-square-o", "action": $scope.editQbeDataset, "visible": function(ds){ return ds.dsTypeCd == 'Qbe'} },
    		{"name": "Open dataset in QBE", "icon": "fa fa-search", "action": $scope.showQbeDataset, "visible": function(ds){return !ds.derivated && ds.pars.length == 0}}
    	]}
    ];

    $scope.getPreviewSet = function(dataset){

    	var datasetType = dataset.dsTypeCd.toUpperCase();

    	/**
    	 * If the type of the dataset is File, set these flags so the pagination toolbar on the Preview dataset panel
    	 * is hidden and the pagination is performed on the client-side. Other dataset types should have the server-side
    	 * pagination (else-branch).
    	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
    	 */
    	if (datasetType!="FILE") {
    		 $scope.paginationDisabled = true;
    		 $scope.previewPaginationEnabled = true;
    	}
    	else {
    		$scope.paginationDisabled = false;
    		$scope.previewPaginationEnabled = true;
    	}
    	if (datasetType == "QBE") {

    	}
    	params={};
    	params.start = $scope.startPreviewIndex;
    	params.limit = $scope.itemsPerPage;
    	params.page = 0;
    	params.dataSetParameters=null;
    	params.sort=null;
    	params.valueFilter=null;
    	params.columnsFilter=null;
    	params.columnsFilterDescription=null;
    	params.typeValueFilter=null;
    	params.typeFilter=null;
    	params.DRIVERS = driversExecutionService.prepareDriversForSending($scope.drivers);
    	$scope.previewUrl = '';
    	config={};
    	config.params=params;


    	sbiModule_restServices.promiseGet("selfservicedatasetpreview/values", dataset.label,"",config)
			.then(function(response) {

				var totalItemsInPreviewInit = angular.copy($scope.totalItemsInPreview);

				/**
				 * If the responded dataset does not possess a metadata information (total amount of rows in the result)
				 * take this property if provided.
				 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
				 */
				if (response.data.results) {
					$scope.totalItemsInPreview = response.data.results;
				}

		    	/**
		    	 * If the the initial 'totalItemsInPreview' value is -1, that means that this property is not set yet or there is no this property in the response
		    	 * (total number of results - rows). This serves just to initialize the indicators used in the if-else block (such as 'endPreviewIndex'), in order
		    	 * to initialize the preview of the dataset types that do not have 'resultNumber' property in their 'meta'. This temporary variable should be -1
		    	 * only on the first call of this function.
		    	 * @modifiedBy Danilo Ristovski (danristo, danilo.ristovski@mht.net)
		    	 */
				if(totalItemsInPreviewInit==-1) {

					if ($scope.totalItemsInPreview < $scope.itemsPerPage) {
		   		 		$scope.endPreviewIndex = $scope.totalItemsInPreview
		   		 		$scope.disableNext = true;
					}
					else {
			   		 	$scope.endPreviewIndex = $scope.itemsPerPage;
			   		 	$scope.disableNext = false;
			       	}

		       	}

			    angular.copy(response.data.rows,$scope.previewDatasetModel);

			    if( $scope.previewDatasetColumns.length==0){
			    	$scope.createColumnsForPreview(response.data.metaData.fields);
			    }

			//$scope.startPreviewIndex=$scope.startPreviewIndex=0+20;

		},

		function(response){

			/**
			 * Handling the error while trying to preview the dataset.
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */
			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(sbiModule_translate.load(response.data.errors[0].message),
					sbiModule_translate.load('sbi.generic.error'), $scope.toasterConfig);

		});

    }

    $scope.createColumnsForPreview=function(fields){

    	for(i=1;i<fields.length;i++){
    	 var column={};
    	 column.label=fields[i].header;
    	 column.name=fields[i].name;

    	 $scope.previewDatasetColumns.push(column);
    	}

    }

    $scope.cloneDataset = function(dataset) {
    	var clonedDataset = angular.copy(dataset);

    	clonedDataset.id = "";
    	clonedDataset.dsVersions = [];
    	clonedDataset.usedByNDocs = 0;

		clonedDataset.name = "CLONE_" + clonedDataset.name;
		clonedDataset.label = "CLONE_" + clonedDataset.label;
		clonedDataset.description = "CLONED " + clonedDataset.description;

		clonedDataset.scopeCd = "USER";

    	if(sbiModule_user.userId != clonedDataset.owner){
    		clonedDataset.owner = sbiModule_user.userId;
    	}

    	if(clonedDataset.catTypeId)
    		delete clonedDataset.catTypeId;

    	$mdDialog.show({
    		controller: cloneQbeDatasetDialogController,
			templateUrl: sbiModule_config.dynamicResourcesBasePath + '/angular_1.4/tools/workspace/templates/cloneDatasetDialogTemplate.html',
			parent: angular.element(document.body),
			locals: {
				clonedLabel: clonedDataset.label,
				clonedName: clonedDataset.name,
				clonedDescription: clonedDataset.description
			},
			clickOutsideToClose: false
    	}).then(function(result){
    		clonedDataset.name = result.name;
    		clonedDataset.label = result.label;
    		clonedDataset.description = result.description;

    		sbiModule_restServices.promisePost('1.0/datasets', '', clonedDataset)
    		.then(function(response){
    			clonedDataset.id = response.data.id;
				toastr.success(sbiModule_translate.load("sbi.ds.saved"),
						sbiModule_translate.load('sbi.workspace.dataset.success'), $scope.toasterConfig);
				$scope.activateMyDatasetsTab = true;
	    		$scope.myDatasets.push(clonedDataset);
	    		$scope.datasets.push(clonedDataset);
    		}, function(postErr){
    			toastr.error(postErr.data, sbiModule_translate.load("sbi.generic.error"), $scope.toasterConfig);
    		});
    	}, function(response){
    		// canceled mdDialog
    	});

    }

    function cloneQbeDatasetDialogController($scope, $mdDialog, sbiModule_translate, kn_regex, clonedLabel, clonedName, clonedDescription) {
    	 $scope.translate = sbiModule_translate;
    	 $scope.regex = kn_regex;

    	 $scope.dataset = {
			 label: clonedLabel,
			 name: clonedName,
			 description: clonedDescription
    	 };

    	 $scope.cancel = function() {
    		 $mdDialog.cancel();
    	 }

    	 $scope.save = function(result){
    		 $mdDialog.hide(result);
    	 }
    }

    $scope.addNewFileDataset=function(){

      console.info("[ADD NEW DATASET]: Opening the Dataset wizard for creation of a new Dataset in the Workspace.");

      $scope.editingDatasetFile = false;

      /**
       * Initialize all the data needed for the 'dataset' object that we are sending towards the server when going to the Step 2 and ones that we are using
       * internally (such as 'limitPreviewChecked'). This initialization should be done whenever we are opening the Dataset wizard, since the behavior should
       * be the reseting of all fields on the Step 1.
       * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
       */
      $scope.initializeDatasetWizard(undefined);

      $mdDialog.show({
		  scope:$scope,
		  preserveScope: true,
	      controller: DatasetCreateController,
	      templateUrl: sbiModule_config.dynamicResourcesBasePath+'/angular_1.4/tools/workspace/templates/datasetCreateDialogTemplate.html',
	      clickOutsideToClose: false,
	      escapeToClose :true,
	      fullscreen: false,
	      locals:{
	    	 // previewDatasetModel:$scope.previewDatasetModel,
	         // previewDatasetColumns:$scope.previewDatasetColumns
	      }
	    });
    }


    /**
	 * Set the currently active Datasets tab. Initially, the 'My Data Set' tab is selected (active).
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	$scope.currentDatasetsTab = "myDataSet";

    $scope.switchDatasetsTab = function(datasetsTab) {
    	var oldTab = angular.copy($scope.currentDatasetsTab);
    	$scope.currentDatasetsTab = datasetsTab;

    	if($scope.selectedDataset !== undefined){
    		$scope.selectDataset(undefined);
         }

    	if($scope.selectedCkan !== undefined){
    		$scope.selectCkan(undefined);
         }

    	$scope.ckanDatasetsList=[];
    	$scope.selectedCkanRepo={};
    	$scope.ckanDatasetsListInitial=[];

    	switch(oldTab){
		case "myDataSet":
			$scope.myDatasets = angular.copy(tagsHandlerService.restore($scope.allTags,oldTab));
			break;
		case "sharedDataSet":
			$scope.sharedDatasets = angular.copy(tagsHandlerService.restore($scope.allTags,oldTab));
			break;
		case "enterpriseDataSet":
			$scope.enterpriseDatasets = angular.copy(tagsHandlerService.restore($scope.allTags,oldTab));
			break;
		case "ckanDataSet":
			break;
		case "allDataSet":
			$scope.datasets = angular.copy( tagsHandlerService.restore($scope.allTags,oldTab));
			break;
		}

    }

    $scope.isAbleToEditQbeDataset = function(selectedDataset) {
    	if(selectedDataset !== undefined) {
	    	var toReturn = (selectedDataset.dsTypeCd == 'Federated' || selectedDataset.dsTypeCd == 'Qbe') && sbiModule_user.userName == selectedDataset.owner;
	    	return toReturn;
    	}
    };

    $scope.getBackPreviewSet=function(){

    	 if($scope.startPreviewIndex-$scope.itemsPerPage < 0){
    		 $scope.startPreviewIndex=0;
    		 $scope.endPreviewIndex=$scope.itemsPerPage;
    		 $scope.disableBack=true;
    		 $scope.disableNext=false;
    	 }
    	 else{
    		 $scope.endPreviewIndex=$scope.startPreviewIndex;
             $scope.startPreviewIndex= $scope.startPreviewIndex-$scope.itemsPerPage;
             if($scope.startPreviewIndex-$scope.itemsPerPage < 0){
            	 $scope.startPreviewIndex=0;
        		 $scope.endPreviewIndex=$scope.itemsPerPage;
        		 $scope.disableBack=true;
        		 $scope.disableNext=false;
             }else{
             $scope.disableBack=false;
             $scope.disableNext=false;
             }
    	 }

    	 $scope.getPreviewSet($scope.datasetInPreview);

    }

    $scope.getNextPreviewSet= function(){

    	 if($scope.startPreviewIndex+$scope.itemsPerPage > $scope.totalItemsInPreview){

    		 $scope.startPreviewIndex=$scope.totalItemsInPreview-($scope.totalItemsInPreview%$scope.itemsPerPage);
    		 $scope.endPreviewIndex=$scope.totalItemsInPreview;
    		 $scope.disableNext=true;
    		 $scope.disableBack=false;
    	 }else if($scope.startPreviewIndex+$scope.itemsPerPage == $scope.totalItemsInPreview){
    		 $scope.startPreviewIndex=$scope.totalItemsInPreview-$scope.itemsPerPage;
    		 $scope.endPreviewIndex=$scope.totalItemsInPreview;
    		 $scope.disableNext=true;
    		 $scope.disableBack=false;
    	 } else{
              $scope.startPreviewIndex= $scope.startPreviewIndex+$scope.itemsPerPage;
              $scope.endPreviewIndex=$scope.endPreviewIndex+$scope.itemsPerPage;

              if($scope.endPreviewIndex >= $scope.totalItemsInPreview){
            	  if($scope.endPreviewIndex == $scope.totalItemsInPreview){
            		  $scope.startPreviewIndex=$scope.totalItemsInPreview-$scope.itemsPerPage;
            	  }else{
            	  $scope.startPreviewIndex=$scope.totalItemsInPreview-($scope.totalItemsInPreview%$scope.itemsPerPage);
            	  }
         		 $scope.endPreviewIndex=$scope.totalItemsInPreview;
         		 $scope.disableNext=true;
         		 $scope.disableBack=false;
         	 }else{


              $scope.disableNext=false;
              $scope.disableBack=false;
         	 }
    	 }

    	 $scope.getPreviewSet($scope.datasetInPreview);

    }

    /**
     * function that is called after adding new dataset, to syncronize model
     */
    $scope.reloadMyDataFn = function() {

//    	$scope.loadNotDerivedDatasets("loadDatasets","loadMyDatasets");

    	if ($scope.datasetsDocumentsLoaded == true) {
//    		$scope.loadDatasets();
//        	$scope.loadMyDatasets();
    		$scope.loadNotDerivedDatasets("loadDatasets","loadMyDatasets");
    	}
    	else {
    		$scope.loadNotDerivedDatasets();
    	}

    }

    function parseCkanRepository(){
    	var ckanUrls= datasetParameters.CKAN_URLS;
    	var repos=[];
    	if(ckanUrls){
	    	var ckanUrlsSplitted= ckanUrls.split("|");

	    	for(i=0;i<ckanUrlsSplitted.length-1;i+=2){
	    		repo={};
	    		repo.url=ckanUrlsSplitted[i];
	    		repo.name=ckanUrlsSplitted[i+1];
	    		repos.push(repo);
	    	}
    	}
    	return repos;
    }
    //CKAN

    $scope.ckanRepos=parseCkanRepository();
    $scope.selectedCkanRepo={};
    $scope.ckanDatasetsList=[];
    $scope.ckanDatasetsListInitial=[];

    $scope.loadMoreCkanDatasets = function () {
    	if($scope.selectedCkanRepo.hasOwnProperty("name")&&$scope.selectedCkanRepo.hasOwnProperty("url")){
    		$scope.loadCkanDatasets($scope.selectedCkanRepo, $scope.newOffset);
    	}
    }

    /**
     * If the CKAN repository is picked by simple clicking on the combobox that contains repository targets, then we need to send
     * an information about that repository - the picked repository itself. For that reason and for that case, the input parameter
     * is provided. Instead, if the Load button is about to be returned back, we would not need this input parameter anymore. We will
     * get it from our scope.
     * @modifiedBy Danilo Ristovski (danristo, danilo.ristovski@mht.net)
     */
	$scope.loadCkanDatasets=function(selectedCkanRepo, offset) {
		if(offset==0){
			$scope.ckanDatasetsList = [];
			 $scope.newOffset = 0;
		}
		$scope.ckanOffset = offset;
		$scope.selectedCkanRepo = selectedCkanRepo;
		var repo = selectedCkanRepo;

		// The implementation when the Load button is present and clicked. (danristo)
//		var repo=$scope.selectedCkanRepo;

		if(repo.url==undefined){

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.warning(sbiModule_translate.load('sbi.workspace.dataset.ckan.selectRepo'),
					sbiModule_translate.load('sbi.workspace.dataset.ckan.noRepository'), $scope.toasterConfig);

		}else{
		params={};
		params.isTech=false;
		params.showDerivedDataset=false;
		params.ckanDs=true;
		if($scope.ckanFilter!=undefined && $scope.ckanFilter.length>0 ){
			params.ckanFilter=$scope.ckanFilter;
		} else {
			params.ckanFilter="NOFILTER";
		}

		params.showOnlyOwner=true;
		params.ckanOffset=offset;
		params.ckanRepository=repo.url;

		config={};
		config.params=params;
		sbiModule_restServices.promiseGet("certificateddatasets", "","",config)
		.then(function(response) {
			if($scope.ckanDatasetsList.length==0){
				angular.copy(response.data.root,$scope.ckanDatasetsList);
			} else {
				if(response.data.root.length==$scope.ckanDatasetsList.length){
					$mdDialog.show(
						      $mdDialog.alert()
						        .clickOutsideToClose(true)
						        .title(sbiModule_translate.load("sbi.generic.info"))
						        .textContent(sbiModule_translate.load("sbi.mydata.ckandataset.repo.loaded"))
						        .ariaLabel('Alert Dialog repo is loaded')
						        .ok('OK')
						    );
				} else {
					for (var i = 0; i < response.data.root.length; i++) {
						$scope.ckanDatasetsList.push(response.data.root[i]);
					}
				}

			}
            $scope.newOffset = $scope.newOffset + 200;
            angular.copy($scope.ckanDatasetsList,$scope.ckanDatasetsListInitial);
		},function(response){

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(response.data, sbiModule_translate.load("sbi.generic.error"), $scope.toasterConfig);

		});


	}
	}

	$scope.clearFilteredCKANDatasets = function () {
		$scope.ckanFilter = "";
		$scope.loadFilteredCkanDatasets("NOFILTER");
	}



	$scope.loadFilteredCkanDatasets=function(filter) {
		if($scope.selectedCkanRepo.hasOwnProperty("name")&&$scope.selectedCkanRepo.hasOwnProperty("url")){



		var repo = $scope.selectedCkanRepo

		// The implementation when the Load button is present and clicked. (danristo)
//		var repo=$scope.selectedCkanRepo;

		if(repo.url==undefined){

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.warning(sbiModule_translate.load('sbi.workspace.dataset.ckan.selectRepo'),
					sbiModule_translate.load('sbi.workspace.dataset.ckan.noRepository'), $scope.toasterConfig);

		}else{
		params={};
		params.isTech=false;
		params.showDerivedDataset=false;
		params.ckanDs=true;
		params.ckanFilter=filter;

		//params.ckanFilter="USA";
		params.showOnlyOwner=true;
		params.ckanOffset=$scope.ckanOffset;
		params.ckanRepository=repo.url;

		config={};
		config.params=params;
		sbiModule_restServices.promiseGet("certificateddatasets", "","",config)
		.then(function(response) {
			//console.log(response.data);
            angular.copy(response.data.root,$scope.ckanDatasetsList);
            angular.copy($scope.ckanDatasetsList,$scope.ckanDatasetsListInitial);
		},function(response){

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(response.data, sbiModule_translate.load("sbi.generic.error"), $scope.toasterConfig);

		});


		}
	} else {
		if(filter!=""){
			$mdDialog.show(
				      $mdDialog.alert()
				        .clickOutsideToClose(true)
				        .title(sbiModule_translate.load("sbi.generic.error"))
				        .textContent(sbiModule_translate.load("sbi.mydata.ckandataset.select.repo"))
				        .ariaLabel('Alert Dialog Select a CKAN Repo')
				        .ok('OK')
				    );
		}
	}
	}

	$scope.showCkanDetails = function() {
		return $scope.showCkanInfo && $scope.isSelectedCkanValid();
	};


	$scope.isSelectedCkanValid = function() {
		return $scope.selectedCkan !== undefined;
	};

	$scope.setCkanDetailOpen = function(isOpen) {
		if (isOpen && !$mdSidenav('rightCkan').isLockedOpen() && !$mdSidenav('rightCkan').isOpen()) {
			$scope.toggleCkanDetail();
		}

		$scope.showCkanInfo = isOpen;
	};

	$scope.toggleCkanDetail = function() {
		$mdSidenav('rightCkan').toggle();
	};

	$scope.selectCkan= function ( dataset ) {
		if (dataset !== undefined) {
			//$scope.lastDatasetSelected = dataset;
		}
		var alreadySelected = (dataset !== undefined && $scope.selectedCkan === dataset);
		$scope.selectedCkan = dataset;
		if (alreadySelected) {
			$scope.selectedCkan=undefined;
			$scope.setCkanDetailOpen(!$scope.showCkanDetail);
		} else {
			$scope.setCkanDetailOpen(dataset !== undefined);
		}
	};

	$scope.showDetailCkan=function(ckan){

		$mdDialog.show({
  		  scope:$scope,
			  preserveScope: true,
		      controller: DialogCkanController,
		      templateUrl: sbiModule_config.dynamicResourcesBasePath+'/angular_1.4/tools/workspace/templates/ckanDetailTemplate.html',
		      clickOutsideToClose:false,
		      escapeToClose :false,
		      fullscreen: true,
		      locals:{ckan:ckan }
		    })
	}

	$scope.editCkan=function(ckan){
		//console.log(ckan);
		config={};
		params={};
        params.url=ckan.configuration.Resource.url;
        params.format=ckan.configuration.Resource.format;
        params.id=ckan.configuration.ckanId;
        params.showOnlyOwner=true;
        params.showDerivedDataset=false;
        config.params=params;
		sbiModule_restServices.promiseGet("ckan-management/download", "","",config)
		.then(function(response) {
			//console.log(response.data);
			var data=response.data;
			var ckanObj=createCkanForWizard(data,ckan);
			$scope.initializeDatasetWizard(ckanObj);
			 $scope.fileObj={};
			 $scope.dataset.fileUploaded=true;
			 $scope.ckanInWizard=true;
			 $mdDialog.show({
	    		  scope:$scope,
	    		  preserveScope: true,
	    	      controller: DatasetCreateController,
	    	      templateUrl: sbiModule_config.dynamicResourcesBasePath+'/angular_1.4/tools/workspace/templates/datasetCreateDialogTemplate.html',
	    	      clickOutsideToClose: false,
	    	      escapeToClose :true,
	    	      //fullscreen: true,
	    	      locals:{

	    	      }
	    	    });


		},function(response){

			// Take the toaster duration set inside the main controller of the Workspace. (danristo)
			toastr.error(response.data, sbiModule_translate.load("sbi.generic.error"), $scope.toasterConfig);

		});
	}

	function createCkanForWizard(data, ckan){

		var toReturn={
			fileType: data.filetype,
		    fileName: data.filename,
		    csvEncoding:"UTF-8",
		    csvDelimiter:",",
		    csvQuote:"\"",
		    skipRows:0,
		    limitRows:0,
		    xslSheetNumber:0,
		    catTypeVn:'',
		    catTypeId:null,
		    id:'',
		    label:'',
		    name:'',
		    description:'',
		    meta:[]
		};

		return toReturn;
	}

	var prevScope = $scope;
	 $scope.getDatasetParametersFromBusinessModel = function (selectedDataset){
		var promise = sbiModule_restServices.post("dataset","drivers/",selectedDataset.qbeDatamarts).then(function(response){
				$scope.drivers = response.data.filterStatus;
				selectedDataset.drivers = $scope.drivers;
			})
			return promise;
		}
    function DatasetPreviewController($scope,$mdDialog,$http,$sce){
    	if($scope.datasetInPreview && $scope.datasetInPreview.dsTypeCd.toLowerCase() == "qbe"){

	    	$scope.dataset = $scope.datasetInPreview;
	    	$scope.executeParameter = function(){
				$scope.showDrivers = false;
				$scope.dataset.executed = true;
				$scope.dataset["DRIVERS"] =  driversExecutionService.prepareDriversForSending($scope.drivers);
				$scope.getPreviewSet($scope.datasetInPreview);
			}

			$scope.showDrivers = driversExecutionService.hasMandatoryDrivers($scope.drivers) || $scope.dataset.pars.length > 0;
			$scope.dataset.executed = !$scope.showDrivers;

			$scope.hideDrivers =function(){
				$scope.showDrivers = !$scope.showDrivers;
				$scope.dataset.executed = true;
			}

    	}else{
    		$scope.urlParams = 'datasetLabel=' + $scope.datasetInPreview.label;
        	if(Object.keys($scope.datasetInPreview.pars).length === 0 && $scope.datasetInPreview.pars.constructor === Object) {
        		$scope.urlParams += '&parameters=' + encodeURIComponent(JSON.stringify($scope.datasetInPreview.pars));
        	}
        	if(true){
        		var exports = ['CSV','XLSX'];
        		$scope.urlParams += '&options=' + encodeURIComponent(JSON.stringify({exports:exports}));
        	}

        	$scope.previewUrl = $sce.trustAsResourceUrl(sbiModule_config.contextName + '/restful-services/2.0/datasets/preview?'+ $scope.urlParams);
			$scope.dataset = {}
			$scope.dataset.executed = true;
		}
		$scope.closeDatasetPreviewDialog=function(){
			 $scope.previewDatasetModel=[];
			 $scope.previewDatasetColumns=[];
			 $scope.startPreviewIndex=0;
			 $scope.endPreviewIndex=0;
			 $scope.totalItemsInPreview=-1;	// modified by: danristo
			 $scope.datasetInPreview=undefined;
			 $scope.counter = 0;
			 $mdDialog.cancel();
	    }



	}

    function DialogCkanController($scope,$mdDialog,ckan){
    	$scope.ckan=ckan;
    	$scope.closeCkanDetail=function(){
    		$mdDialog.cancel();
    	}

    }

	if(initialOptionMainMenu){
		if(initialOptionMainMenu.toLowerCase() == 'datasets'){
			var selectedMenu = $scope.getMenuFromName('datasets');
			$scope.leftMenuItemPicked(selectedMenu,true);
		}
	}
	var getAllTags = function(){
		sbiModule_restServices.promiseGet("2.0/tags","")
		.then(function(response) {
			$scope.allTags = response.data;
		});
	}
    getAllTags();
}
})();