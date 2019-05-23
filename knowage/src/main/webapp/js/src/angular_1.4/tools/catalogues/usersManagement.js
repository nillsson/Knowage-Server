var app = angular.module("UsersManagementModule", ["ngMaterial", "angular_list", "angular_table", "sbiModule", "angular_2_col","angular-list-detail"]);
app.config(['$mdThemingProvider', function($mdThemingProvider) {
    $mdThemingProvider.theme('knowage')
    $mdThemingProvider.setDefaultTheme('knowage');
 }]);

app.controller("UsersManagementController", ["sbiModule_translate", "sbiModule_restServices", "$scope", "$mdDialog", "$mdToast", "$timeout","sbiModule_messaging", "sbiModule_config", UsersManagementFunction]);

function UsersManagementFunction(sbiModule_translate, sbiModule_restServices, $scope, $mdDialog, $mdToast, $timeout,sbiModule_messaging, sbiModule_config) {

    //VARIABLES

    $scope.showme = false; // flag for showing right side
    $scope.dirtyForm = false; // flag to check for modification
    $scope.translate = sbiModule_translate;
    $scope.selectedUser = {}; // main item
    $scope.usersList = []; // array that hold list of users
    $scope.usersRoles = []; // array that hold list of roles
    $scope.usersAttributes = [];
    $scope.tempAttributes = [];
    $scope.role = [];
    $scope.attributeIdAndColumns = [];
    $scope.lovColumns = [];
    $scope.umSpeedMenu = [{
        label: sbiModule_translate.load("sbi.generic.delete"),
        icon: 'fa fa-trash',
        //icon: 'fa fa-trash-o fa-lg',
        //color: '#153E7E',
        action: function (item, event) {

        	$scope.confirmDelete(item,event);
        }
    }];


    $scope.confirm = $mdDialog
        .confirm()
        .title(sbiModule_translate.load("sbi.catalogues.generic.modify"))
        .content(
            sbiModule_translate
            .load("sbi.catalogues.generic.modify.msg"))
        .ariaLabel('toast').ok(
            sbiModule_translate.load("sbi.general.continue")).cancel(
            sbiModule_translate.load("sbi.general.cancel"));


    $scope.confirmDelete = function(item,ev) {
	    var confirm = $mdDialog.confirm()
	          .title(sbiModule_translate.load("sbi.catalogues.toast.confirm.title"))
	          .content(sbiModule_translate.load("sbi.catalogues.toast.confirm.content"))
	          .ariaLabel("confirm_delete")
	          .targetEvent(ev)
	          .ok(sbiModule_translate.load("sbi.general.continue"))
	          .cancel(sbiModule_translate.load("sbi.general.cancel"));
	    $mdDialog.show(confirm).then(function() {
	    	$scope.deleteUser(item);
	    }, function() {

	    });
	  };

    //FUNCTIONS

    angular.element(document).ready(function () { // on page load function
        $scope.getUsers();
        $scope.getRoles();
        $scope.getAttributes();
    });

    $scope.setDirty = function () {
        $scope.dirtyForm = true;
    }

    /*
     * 	this function is used to properly fill
     *  attributes table with attributes from
     *  selected user
     */
    $scope.setAttributes = function () {
        $scope.tempAttributes = [];


        for (i = 0; i < $scope.usersAttributes.length; i++) {
        	var attributeIdAndColumns = {}
        	var columns = []
            var obj = {};
            obj.id = $scope.usersAttributes[i].attributeId;
            obj.name = $scope.usersAttributes[i].attributeName;
            obj.lovId = $scope.usersAttributes[i].lovId;
            obj.multivalue = $scope.usersAttributes[i].multivalue;
            obj.allowUser = $scope.usersAttributes[i].allowUser;
            obj.syntax = $scope.usersAttributes[i].syntax;


            if($scope.usersAttributes[i].lovId){
            	$scope.getLovsValues(obj)
            }

            if ($scope.selectedUser.hasOwnProperty("sbiUserAttributeses")) {
            	var value = ""
            	if($scope.selectedUser.sbiUserAttributeses.hasOwnProperty($scope.usersAttributes[i].attributeId) ){
            		value =$scope.selectedUser.sbiUserAttributeses[$scope.usersAttributes[i].attributeId][$scope.usersAttributes[i].attributeName];
            		obj.value = value;
            	}
            } else {
                obj.value = "";
            }
            $scope.tempAttributes.push(obj);
        }

    }

    $scope.openLovs = function(ev,attribute) {

        $mdDialog.show({
                controller: lovsDialogController,
                templateUrl: sbiModule_config.dynamicResourcesBasePath + '/angular_1.4/tools/catalogues/templates/lovValues.html',
                targetEvent: ev,
                clickOutsideToClose: true,
               // fullscreen: true,
                locals: {
                	attribute: attribute,
                }
            })
            .then(
                function(answer) {},
                function() {});
    };

    function lovsDialogController($scope,attribute , $mdDialog) {
    	$scope.attribute = attribute;
    	if(attribute.multivalue){
    	$scope.columnsSelected =[];
    	}else $scope.columnsSelected = {}
    	$scope.lovObjects = [];
    	$scope.lovColumns = attribute.lovColumns;
    	if(attribute.lovColumns && attribute.lovColumns.length > 0){
	    	for(var i = 0; i < attribute.lovColumns.length;i++){
	    		var columnObject = {}
	    		columnObject.column = attribute.lovColumns[i];
	    		if (attribute.value && attribute.value.indexOf(attribute.lovColumns[i]) != -1)
	    			if(attribute.multivalue){
	    			$scope.columnsSelected.push(columnObject)
	    			}else $scope.columnsSelected = columnObject;

	    		$scope.lovObjects.push(columnObject);
	    	}
    	}

        $scope.close = function() {
        	$mdDialog.cancel(); }
        $scope.hide = function() {
        	var values = [];
        	if(angular.isArray($scope.columnsSelected)){
	        	for(var i =0; i< $scope.columnsSelected.length;i++){
	        			values.push($scope.columnsSelected[i].column)
	        	}
        	}else values.push($scope.columnsSelected.column);
        	$scope.attribute.value = values;
        	$mdDialog.hide(); }

    }



    $scope.getLovsValues = function(obj){
		var lovIdAndColumns = {}
		var columns = []
		sbiModule_restServices.promiseGet("2.0/lovs", obj.lovId+'/preview')
		.then(function(response){
			if(response.data[0] && response.data[0].value){
				for(var i = 0; i< response.data.length;i++){
						columns.push(response.data[i].value)
				}
				obj.lovColumns = columns;
			}else
			obj.lovColumns = response.data;
		})
	}
    /*
     * 	this function is used to properly fill
     *  roles table with roles from
     *  selected user
     */
    $scope.setRoles = function () {
        $scope.role = [];
        for (var i = 0; i < $scope.usersRoles.length; i++) {
            for (var j = 0; j < $scope.selectedUser.sbiExtUserRoleses.length; j++) {
                if ($scope.selectedUser.sbiExtUserRoleses[j] == $scope.usersRoles[i].id) {
                    $scope.role.push($scope.usersRoles[i]);
                }
            }
        }
    }
    /*
     * 	this function is used to properly format
     *  selected users roles and attributes
     *  for adding or updating.
     *
     */
    $scope.formatUser = function () {
        var tmpR = [];
        var tmpA = {};
        for (var i = 0; i < $scope.role.length; i++) {
            tmpR.push($scope.role[i].id);
        }
        $scope.selectedUser.sbiExtUserRoleses = tmpR;
        for (var i = 0; i < $scope.tempAttributes.length; i++) {
            if ($scope.tempAttributes[i].hasOwnProperty("value") && $scope.tempAttributes[i].value != "") {
                tmpA[$scope.tempAttributes[i].id] = {};
                if(Array.isArray($scope.tempAttributes[i].value) && $scope.tempAttributes[i].multivalue && $scope.tempAttributes[i].syntax == false){
                	var arrayToSimpleSyntax = "";
                	for(var j = 0; j<$scope.tempAttributes[i].value.length; j++){
                		$scope.tempAttributes[i].value[j] = "'" + $scope.tempAttributes[i].value[j] + "'";
                	 }
                	$scope.tempAttributes[i].value = $scope.tempAttributes[i].value.toString();
                }else if(Array.isArray($scope.tempAttributes[i].value) && $scope.tempAttributes[i].multivalue && $scope.tempAttributes[i].syntax == true){
                	var arrayToComplexSyntax = "";
                		$scope.tempAttributes[i].value = $scope.tempAttributes[i].value.toString();
                		$scope.tempAttributes[i].value = "{,{" + $scope.tempAttributes[i].value + "}}";
                		$scope.tempAttributes[i].value = $scope.tempAttributes[i].value.replace(/,/g,';')

                }else if(Array.isArray($scope.tempAttributes[i].value)){
                	$scope.tempAttributes[i].value = $scope.tempAttributes[i].value.toString();
                }
                tmpA[$scope.tempAttributes[i].id][$scope.tempAttributes[i].name] = $scope.tempAttributes[i].value;
            }else if($scope.tempAttributes[i].value == ""){
            	console.log("skip");
            }
        }
        $scope.selectedUser.sbiUserAttributeses = tmpA;
        delete $scope.selectedUser.confirm;
    }

    /*
     * 	this function is used to add
     *  temporary confirm property to
     *  user object
     *
     */
    $scope.addConfirmPwdProp = function() {
   	 for ( var l in $scope.usersList) {
   		$scope.usersList[l].confirm = null;
		}
	}

    $scope.loadUser = function (item) { // this function is called when item from custom table is clicked

        if ($scope.dirtyForm) {
            $mdDialog.show($scope.confirm).then(function () {
            	$scope.showme = true;
                $scope.dirtyForm = false;
                $scope.selectedUser = angular.copy(item);
                $scope.setRoles();
                $scope.setAttributes();
                $scope.selectedUser.confirm = $scope.selectedUser.password;


            }, function () {
                $scope.showme = true;
                $scope.selectedUser.confirm = $scope.selectedUser.password;


            });

        } else {

            $scope.selectedUser = angular.copy(item);
            $scope.setRoles();
            $scope.setAttributes();
            $scope.showme = true;
            $scope.selectedUser.confirm = $scope.selectedUser.password;

        }
    }

    $scope.cancel = function () { // on cancel button
        $scope.selectedUser = {};
        $scope.showme = false;
        $scope.dirtyForm = false;
        $scope.tempAttributes = [];
        $scope.role = [];
    }



    $scope.createUser = function () { // this function is called when clicking on plus button
        $scope.setAttributes();
        if ($scope.dirtyForm) {
            $mdDialog.show($scope.confirm).then(function () {

                $scope.dirtyForm = false;
                $scope.selectedUser = {};
                $scope.showme = true;
                $scope.role = [];
                $scope.setAttributes();


            }, function () {

                $scope.showme = true;

            });

        } else {
                $scope.selectedUser = {};
	            $scope.showme = true;
	            $scope.role = [];
	            $scope.setAttributes();
        }

    }

    $scope.saveUser = function () { // this function is called when clicking on save button
        $scope.formatUser();
        if($scope.selectedUser.hasOwnProperty("id")){ // if item already exists do update PUT

        	sbiModule_restServices.promisePut("2.0/users",$scope.selectedUser.id,$scope.selectedUser)
    		.then(function(response) {
    			$scope.usersList=[];
				$timeout(function(){
					$scope.getUsers();
				}, 1000);
				sbiModule_messaging.showSuccessMessage(sbiModule_translate.load("sbi.catalogues.toast.updated"), 'Success!');
				$scope.cancel();

    		}, function(response) {
    			sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');

    		});

		}else{ // create new item in database POST

			sbiModule_restServices.promisePost("2.0/users","",angular.toJson($scope.selectedUser, true))
    		.then(function(response) {
    			$scope.usersList=[];
				$timeout(function(){
					$scope.getUsers();
				}, 1000);
				sbiModule_messaging.showSuccessMessage(sbiModule_translate.load("sbi.catalogues.toast.created"), 'Success!');
				$scope.cancel();

    		}, function(response) {
    			sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');

    		});
		}
    }

    $scope.getUsers = function () { // service that gets list of users GET
    	sbiModule_restServices.promiseGet("2.0", "users")
		.then(function(response) {
			$scope.usersList = response.data;
            $scope.addConfirmPwdProp();

		}, function(response) {
			sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');

		});
    }

    $scope.getRoles = function () { // service that gets list of roles GET
    	sbiModule_restServices.promiseGet("2.0", "roles")
		.then(function(response) {
			$scope.usersRoles = response.data;
		}, function(response) {
			sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');

		});
    }

    $scope.getAttributes = function () { // service that gets list of roles GET
    	sbiModule_restServices.promiseGet("2.0", "attributes")
		.then(function(response) {
			if(response.data.length != 0){
				$scope.usersAttributes = response.data;
			}else{
				sbiModule_messaging.showWarningMessage('No user attributes defined', 'Warning');
			}
		}, function(response) {
			sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');
		});
    }

    $scope.deleteUser = function (item) { // this function is called when clicking on delete button

    	sbiModule_restServices.promiseDelete("2.0/users", item.id)
		.then(function(response) {
			 $scope.usersList = [];
             $timeout(function () {
                 $scope.getUsers();
             }, 1000);
             sbiModule_messaging.showSuccessMessage(sbiModule_translate.load("sbi.catalogues.toast.deleted"), 'Success!');
             $scope.selectedUser = {};
             $scope.showme = false;
             $scope.dirtyForm = false;

		}, function(response) {
			sbiModule_messaging.showErrorMessage(response.data.errors[0].message, 'Error');

		});
    }
};

/*
 * 	this directive is used for
 *  password fields matching.
 *  its not my code found this
 *  snippet on internet and it
 *  worked best
 *
 */
app.directive('nxEqualEx', function() {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, model) {
            if (!attrs.nxEqualEx) {
                console.error('nxEqualEx expects a model as an argument!');
                return;
            }
            scope.$watch(attrs.nxEqualEx, function (value) {
                // Only compare values if the second ctrl has a value.
                if (model.$viewValue !== undefined && model.$viewValue !== '') {
                    model.$setValidity('nxEqualEx', value === model.$viewValue);
                }
            });
            model.$parsers.push(function (value) {
                // Mute the nxEqual error if the second ctrl is empty.
                if (value === undefined || value === '') {
                    model.$setValidity('nxEqualEx', true);
                    return value;
                }
                var isValid = value === scope.$eval(attrs.nxEqualEx);
                model.$setValidity('nxEqualEx', isValid);
                return isValid ? value : undefined;
            });
        }
    };
});