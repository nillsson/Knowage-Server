angular.module('alertDefinitionManager').controller('alertKpiDefinitionController', ['$scope','sbiModule_translate', 'sbiModule_restServices','sbiModule_config','$mdDialog','$window','$timeout','alertDefinition_actions',alertKpiDefinitionControllerFunction ]);

function alertKpiDefinitionControllerFunction($scope,sbiModule_translate,sbiModule_restServices,sbiModule_config,$mdDialog,$window,$timeout,alertDefinition_actions){
 $scope.translate=sbiModule_translate;
 $scope.kpiList=[];

 	$scope.initNgModel=function(){
 		if($scope.ngModel.kpiId != undefined && $scope.ngModel.kpiVersion != undefined){
 			$scope.loadKpi($scope.ngModel.kpiId,$scope.ngModel.kpiVersion);
 		}
 	}
 
	if(!$scope.ngModel.hasOwnProperty("actions")){
		$scope.ngModel.actions=[];
	} 
	
	 
	
	$scope.loadKpiList=function(loadFullSelectedKpi){
		sbiModule_restServices.promiseGet('1.0/kpi','listKpi')
		.then(
				function(response){
					$scope.kpiList=response.data;
					
					if(loadFullSelectedKpi==true){ 
						for(var i=0;i<$scope.kpiList.length;i++){
							if(angular.equals($scope.kpiList[i].id,$scope.ngModel.kpiId)){
								angular.extend($scope.kpiList[i],$scope.kpi);
								break;
							}
						}
					}
					},
				function(response){
						sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load("sbi.kpi.list.load.error"))
						}
					);
	}
	//if is an alter of saved alert, load the information of the kpi
	$scope.loadKpiList($scope.hasOwnProperty("kpi"));
	
	
	
	$scope.validate=function(){ 
		return ($scope.ngModel.actions!=undefined && $scope.ngModel.actions.length>0);
	}
	 
	$scope.getActionLabel=function(idAction){
		for(var i=0;i<alertDefinition_actions.length;i++){
			if(alertDefinition_actions[i].id==idAction){
				return alertDefinition_actions[i].name;
			}
		}
		return "";
	}
	
	$scope.loadKpi=function(kpiId,kpiVersion){
		sbiModule_restServices.promiseGet('1.0/kpi',kpiId+"/"+kpiVersion+"/loadKpi")
		.then(
				function(response){
					$scope.kpi = response.data;
				},
				function(response){
						sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load("sbi.kpi.load.error"));
					}
				);
	}
	
	$scope.loadSelectedKpi=function(oldKpi,kpi){
		if($scope.ngModel.actions.length>0){
			 var confirm = $mdDialog.confirm()
	          .title(sbiModule_translate.load("sbi.alert.listener.kpi.edit.title"))
	          .content(sbiModule_translate.load("sbi.alert.listener.kpi.edit.messagge"))
	          .ariaLabel('change kpi') 
	          .ok(sbiModule_translate.load("sbi.general.continue"))
	          .cancel(sbiModule_translate.load("sbi.general.cancel"));
	    $mdDialog.show(confirm).then(function() {
	    	$scope.loadKpi(kpi.id,kpi.version);
	    	$scope.ngModel.actions=[];
	    	$scope.ngModel.kpiId=kpi.id;
	    	$scope.ngModel.kpiVersion=kpi.version;
	    	$scope.oldkpi=$scope.kpi;
	    }, function() {
	    	$scope.kpi=oldKpi;
	    });
		}else{
			$scope.loadKpi(kpi.id,kpi.version);
			$scope.ngModel.kpiId=kpi.id;
	    	$scope.ngModel.kpiVersion=kpi.version;
	    	$scope.oldkpi=$scope.kpi;
		}
	}
	
	
	$scope.deleteAction=function(item,index){
		 var confirm = $mdDialog.confirm()
         .title(sbiModule_translate.load("sbi.alert.listener.kpi.action.delete.title"))
         .content(sbiModule_translate.load("sbi.alert.listener.kpi.action.delete.messagge"))
         .ariaLabel('cancel action') 
         .ok(sbiModule_translate.load("sbi.general.continue"))
         .cancel(sbiModule_translate.load("sbi.general.cancel"));
		   $mdDialog.show(confirm).then(function() {
			   $scope.ngModel.actions.splice(index,1);
		   }, function() { 
		   });
		   
	}
	
	$scope.addAction=function(item){   
		$mdDialog.show({ 
		      controller: addActionDialogController, 
		      templateUrl: sbiModule_config.dynamicResourcesBasePath+'/angular_1.4/tools/alert/listeners/kpiListener/templates/addKpiActionTemplate.html',  
		      clickOutsideToClose:false,
		      preserveScope:true, 
		      locals:{
		    	  translate: sbiModule_translate,
		    	  kpi:$scope.kpi,
		    	  actionToEdit:item
		    	  }
		    })
		    .then(function(act) {
		    	if(item!=undefined){
		    		angular.copy(act,item);
		    	}else{
		    		$scope.ngModel.actions.push(act); 
		    	}
		    }, function() { 
		    });
		 
	}
	
	$scope.getThresholdItem=function(Tarr){
		var TObjArr=[];
		for(var i=0;i<$scope.kpi.threshold.thresholdValues.length;i++){
			if(Tarr.indexOf(""+$scope.kpi.threshold.thresholdValues[i].id)!=-1){
				TObjArr.push($scope.kpi.threshold.thresholdValues[i]);
			}
		}
		return TObjArr;
	}
	
	function addActionDialogController($scope,translate,kpi,$mdDialog,alertDefinition_actions,actionToEdit){
	 	$scope.translate=translate;
		$scope.kpi=kpi;
		$scope.currentAction={};
		$scope.currentActionType={};

		$scope.changeCurrentActionType = function(actionType){
			$scope.currentActionType=actionType;
		} 
		
		if(actionToEdit!=undefined){
			angular.copy(actionToEdit,$scope.currentAction);
			//load action
			for(var i=0;i<alertDefinition_actions.length;i++){
				if(angular.equals($scope.currentAction.idAction,""+alertDefinition_actions[i].id)){
					$scope.changeCurrentActionType(alertDefinition_actions[i]);
					break;
				}
			}
		}else{
			$scope.currentAction.jsonActionParameters={};
		}
		$scope.actionType=alertDefinition_actions;
		$scope.isValidAction={status:false};
  
		
		
		$scope.cancel = function() {
		    $mdDialog.cancel();
		  };
	  $scope.save = function() {
	    $mdDialog.hide($scope.currentAction);
	  };
		  
	}
	
}

