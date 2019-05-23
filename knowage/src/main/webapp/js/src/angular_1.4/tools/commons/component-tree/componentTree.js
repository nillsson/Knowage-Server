/**
 * @authors Alessio Conese (alessio.conese@eng.it)
 * @authors Benedetto Milazzo (benedetto.milazzo@eng.it)
 *
 * N.B. Component in WIP
 */

(function() {
	var scripts = document.getElementsByTagName('script')
	var componentTreePath = scripts[scripts.length-1].src;
	componentTreePath = componentTreePath.substring(0, componentTreePath.lastIndexOf('/') + 1);

//	debugger;

	angular.module('componentTreeModule', [ 'ngMaterial', 'ui.tree'])
	.directive('componentTree', function($compile) {
		return {
			templateUrl: componentTreePath + 'template/component-tree.html',
			transclude : true,
			priority: 1000,
			scope: {
				ngModel : '='
				, id : '@'
				, createTree: '=?' //if true, the ngModel data will be parsed, if not the JSON is already in correct form
				, clickFunction : '&?' //function to call when click into element list
				, selectedItem : '=?' //optional to get the selected item value
				, showFiles : '=?' //boolean value
				, multiSelect : '=?' //boolean value
				, textSearch : '=?' //text to search // TODO
				, fieldsSearch : '=?' //array of the fields on which apply the filter // TODO
				, orderBy : '=?' //field on which order the array // TODO
				, menuOption : '=?' //menu to show on hover // TODO
				, keys : '=?' //object of the keys
				, enableDrag: '=?' // TODO
				, optionsDragDrop: '=?' // TODO
				, enableClone: '=?' // TODO
				, showEmptyPlaceholder: '=?' // TODO
				, noDropEnabled: '=?' // TODO
				, subnodeKey : '@?'
				, leafKey : '@?'
				, textToShowKey : '@?'
				, leafIconCls : '@?'
				, leafIconFn : '&?'
				, folderIconFn : '&?'
				, openFolderIconFn : '&?'
				, isFolderFn : '&?'
				, isOpenFolderFn : '&?'
				, isLeafFn : '&?'
				, showNodeCheckboxFn : '&?'
				, dynamicTree : '@?'
				, staticTree : '@?'
				, hideProgress : '=?'
				, notHideOnLoad : "=?"
				, interceptor : "=?"
				, expandOnClick :"=?"
				, removeEmptyFolder :  '='
				, serverLoading : "=?"
				, isInternalSelectionAllowed: "=?"
				, forceVisibility: "=?" //boolean value
				, checkChildren: '=?'	//boolean value
			},
			controller: componentTreeControllerFunction,
			controllerAs: 'ctrl',

			compile: function (tElement, tAttrs, transclude) {
				return {
					pre: function (scope, element, attrs, ctrl, transclud) {},

					post: function (scope, element, attrs, ctrl, transclud) {
//						debugger;

						//Customize the keys to use different JSON
						var elementId = scope.keys !== undefined && scope.keys.id !==undefined && scope.keys.id.length > 0 ? scope.keys.id : 'id' ;
						var parentId = scope.keys !== undefined && scope.keys.parentId !==undefined && scope.keys.parentId.length > 0 ? scope.keys.parentId : 'parentId' ;
						var subfoldersId = (attrs.subnodeKey &&  attrs.subnodeKey.trim() != '')? attrs.subnodeKey.trim() : 'subfolders' ;
						var leafKey = (attrs.leafKey &&  attrs.leafKey.trim() != '')? attrs.leafKey.trim() : 'biObjects' ;
						var label = (attrs.textToShowKey &&  attrs.textToShowKey.trim() != '')? attrs.textToShowKey.trim() : 'name' ;

						var leafIconCls = (attrs.leafIconCls &&  attrs.leafIconCls != '')? attrs.leafIconCls : 'fa fa-file';
						
						scope.stateCode = "stateCode";

						scope.label = label;
						scope.subfoldersId = subfoldersId;
						scope.leafKey = leafKey;

//						scope.iconFolder = 'fa fa-folder';
//						scope.iconFolderOpen = 'fa fa-folder-open';
						scope.iconFolder = 'fa fa-folder-o';
						scope.iconFolderOpen = 'fa fa-folder-open-o';
				    	scope.multiFolders= 'fa fa-folder';
				    	scope.multiFoldersOpen= 'fa fa-folder-open';
//						scope.iconLeaf = iconLeafCls;
						scope.leafIcon = leafIconCls;

						scope.seeTree = false;

						if (scope.checkChildren == undefined) {
							scope.checkChildren = true;
						}
						
						scope.createTreeStructure = function (folders) {
							if (attrs.createTree !== undefined  && (attrs.createTree == true || attrs.createTree == 'true')) {
								if (folders !== undefined && folders.length > 0 && folders[0][subfoldersId] === undefined) {
									var mapFolder = {};

									for (var i = 0 ; i < folders.length; i ++ ) {
										folders[i][subfoldersId] = [];
										mapFolder[folders[i][elementId]] = folders[i];
									}

									var treeFolders = [];
									for (var i = 0 ; i < folders.length; i ++ ) {
										//if folder has not father, is a root folder
										if (folders[i][parentId] == null || folders[i][parentId] == 'null') {
											treeFolders.push(folders[i]);
										}
										else{
											//search parent folder with hasmap and attach the son
											mapFolder[folders[i][parentId]][subfoldersId].push(folders[i]);
										}
										//update linear structure with tree structure
									}
									folders = treeFolders;
								}
							}
							return folders;
						};

						scope.initializeFolders = function (folders, parent) {
							for (var i = 0 ; i < folders.length; i ++ ) {
								var folder = folders[i];

								folder.checked = folder.checked === undefined ? false : folder.checked;
								folder.expanded = folder.expanded === undefined ? false : folder.expanded;
								folder.type = folder.type === undefined ? 'folder' : folder.type;
								folder.visible = folder.visible === undefined ? true : folder.visible;
								if(scope.dynamicTree == false || scope.dynamicTree == 'false') {
									folder.$parent = parent;
								}

								if (folder[subfoldersId] !== undefined && folder[subfoldersId].length > 0) {
									scope.initializeFolders(folder[subfoldersId], folder);
									if (attrs.orderBy) {
										folder.sortDirection = folder.sortDirection === undefined ? 'desc' : folder.sortDirection;
									}
								}
//								for (var j = 0; folder.biObjects !== undefined && j < folder.biObjects.length ; j++) {
								for (var j = 0; folder[scope.leafKey] !== undefined && j < folder[scope.leafKey].length ; j++) {
//									var folderBiObject = folder.biObjects[j];
									var folderBiObject = folder[scope.leafKey][j];

									folderBiObject.type = folderBiObject.type == undefined ?  'biObject' : folderBiObject.type;
									folderBiObject.checked = folderBiObject.checked == undefined ? false : folderBiObject.checked;
									folderBiObject.visible = folderBiObject.visible == undefined ?  true : folderBiObject.visible;
									if(scope.dynamicTree == false || scope.dynamicTree == 'false') {
										folderBiObject.$parent = parent;
									}
								}
							}
						};

						scope.showFolder = function(node){
							if(scope.removeEmptyFolder){
								if(node[subfoldersId].length==0 && node.biObjects.length==0){
									return false;
								}else{
									if(node.biObjects.length>0){
										return true;
									}else{
										for(var i=0;i<node[subfoldersId].length;i++){
											if(scope.showFolder(node[subfoldersId][i])){
												return true;
											}
										}
										return false;
									}
								}
							}else
								return true;
						}
						scope.initializeFolders(scope.ngModel, null);
						scope.ngModel = scope.createTreeStructure(scope.ngModel);
						scope.folders = scope.ngModel;

						var id = 'dcTree';
						if(attrs.id) {
							id = attrs.id;
						}

						var treeElement = angular.element(element[0].querySelector('#tree-container'));
						if (scope.enableClone == true) {
							treeElement.attr('data-clone-enabled','true');
						}
						if (scope.showEmptyPlaceholder == true) {
							treeElement.attr('data-empty-placeholder-enabled','true');
						}
						if (scope.noDropEnabled == true) {
							treeElement.attr('data-nodrop-enabled','true');
						}
						if (scope.optionsDragDrop) {
							//treeElement.attr('ui-tree','optionsDragDrop');
						}

						if(scope.multiSelect && (scope.multiSelect == true || scope.multiSelect == 'true')) {
							if (!attrs.selecteditem) {
								scope.selectedItem = [];
							}
						}

						scope.isFolder = function(node) {
							if(scope.isFolderFn && (typeof scope.isFolderFn == 'function')) {
								return scope.isFolderFn({node : node, item : node});
							} else {

								var isFolder = (!node.expanded && node[subfoldersId] !== undefined);

								return isFolder;
							}
						};

						scope.isOpenFolder = function(node) {
							if(scope.isOpenFolderFn && (typeof scope.isOpenFolderFn == 'function')) {
								return scope.isOpenFolderFn({node : node, item : node});
							} else {

								var isOpenFolder = (node.expanded && node[subfoldersId] !== undefined);

								return isOpenFolder;
							}
						};

						scope.isLeaf = function(node) {
							if(scope.isLeafFn && (typeof scope.isLeafFn == 'function')) {
								return scope.isLeafFn({node : node, item : node});
							} else {

								var isLeaf = (
										node.type !== 'folder' &&
										(
											(node[scope.subfoldersId] === undefined)
											|| (
												(Array.isArray(node[scope.subfoldersId])
													&& node[scope.subfoldersId].length == 0 )
//													|| (node.biObjects != undefined
//															&& node.biObjects.length == 0)
												|| (node[scope.leafKey] != undefined
													&& node[scope.leafKey].length == 0)
											)
										)
								);

//								debugger;

								return isLeaf;
							}
						};

						scope.folderIcon = function(node) {
							if(scope.folderIconFn && (typeof scope.folderIconFn == 'function')) {
								return scope.folderIconFn({node : node, item : node});
							} else {
								var folderIcon =
									(node[scope.subfoldersId] && node[scope.subfoldersId].length != 0)?
											scope.multiFolders : scope.iconFolder;

								return folderIcon;
							}
						};

						scope.openFolderIcon = function(node) {
							if(scope.openFolderIconFn && (typeof scope.openFolderIconFn == 'function')) {
								return scope.openFolderIconFn({node : node, item : node});
							} else {
								var openFolderIcon =
									(node[scope.subfoldersId] && node[scope.subfoldersId].length != 0) ?
											scope.multiFoldersOpen : scope.iconFolder;

								return openFolderIcon;
							}
						};

						scope.getLeafIcon = function(node) {
							if(scope.leafIconFn && (typeof scope.leafIconFn == 'function')) {
								return scope.leafIconFn({node : node, item : node});
							} else {
								var leafIcon = scope.leafIcon

								return leafIcon;
							}
						};

						scope.showNodeCheckbox = function(node) {
							if(scope.showNodeCheckboxFn && (typeof scope.showNodeCheckboxFn == 'function')) {
								return scope.showNodeCheckboxFn({node : node, item : node});
							} else {
								return scope.multiSelect;
							}
						};

						scope.showLeafSubNodes = function(node) {
							var showLeafNode =
//								((scope.showFiles && scope != false)
//										&& $parent.folder.biObjects !== undefined
//										&& $parent.folder.biObjects.length > 0);
								(scope.showFiles
									&& scope.showFiles != false
									&& node.type != 'folder'
									&& !node[scope.subfoldersId]
//									&& node[scope.subfoldersId].length > 0
									);

							return showLeafNode;
						};


						scope.seeTree = true;

						if(scope.interceptor!=undefined){
							scope.interceptor.refreshTree=function(){
								scope.refreshTree();
							}
						}
					}
				};
			}
		};
	});

	function componentTreeControllerFunction($scope,$timeout,$mdDialog) {
//		debugger;

		$scope.toogleSelected = function(element, parent) {
			if (element !== undefined && $scope.multiSelect) {
				//check the element as the parent. If not the parent doesn't exist, toggle the element check
//				element.checked = parent === undefined ? !element.checked : parent.checked;
				if(parent !== undefined && $scope.checkChildren) {
					element.checked = parent.checked;
				}

				//different insertion if the multi-selection is allowed
				if ( element.checked ) { //if the element is just checked, insert into selectedItem, else remove it
					$scope.selectedItem.push(element);
				}else{
					var idx = $scope.selectedItem.indexOf(element);
					$scope.selectedItem.splice(idx, 1);
				}

				if (element.type == 'folder') {
					for (var i = 0; element[$scope.subfoldersId] && i < element[$scope.subfoldersId].length; i++) {
						$scope.toogleSelected(element[$scope.subfoldersId][i], element);
					}
//					for (var j = 0; element.biObjects !== undefined && j < element.biObjects.length ; j++ ) {
//						$scope.toogleSelected(element.biObjects[j],element);
//					}
					for (var j = 0; element[$scope.leafKey] !== undefined && j < element[$scope.leafKey].length ; j++ ) {
						$scope.toogleSelected(element[$scope.leafKey][j], element);
					}
				}
			}
		};

		$scope.openFolder = function (node,doClickAction) {
			if(($scope.expandOnClick!=false && $scope.expandOnClick!='false') || doClickAction==false ){
				node.expanded = !node.expanded;
			}

			if((doClickAction || $scope.serverLoading)){
				$scope.setSelected(node);
			}

		};

		$scope.setSelected = function (item) {
			var selectableNodes = ($scope.isInternalSelectionAllowed || item.leaf);
			if (!$scope.multiSelect && selectableNodes) {
				$scope.selectedItem = item;
			}

			//if present a click function, use it
			if (typeof $scope.clickFunction == 'function') {
				item.selectableNodes = selectableNodes;
				$scope.clickFunction({node : item, item : item});
			}

//			console.log("clicked item: ", item);
		};

		$scope.toogleSort = function(element) {
			if(element.sortDirection && element[$scope.subfoldersId]) {
				element.sortDirection = element.sortDirection == 'asc' ? 'desc' : 'asc';
				var field = $scope.orderBy;
				element[$scope.subfoldersId].sort($scope.orderFunction(field,element.sortDirection));
			}
		};

		$scope.orderFunction = function(key,direction) {
			return function(a,b) {
				var x = a[key]; var y = b[key];
				var val = ((x < y) ? -1 : ((x > y) ? 1 : 0));
				return direction =='asc' ? val : -val;
			};
		};

		//call each time that the orederBy value changes
		$scope.$watch('orderBy', function () {
			if ($scope.orderBy !== undefined && $scope.orderBy.length > 0) {
				var field = $scope.orderBy;
				if ($scope.selectedItem !== undefined) {
					//take the parent
					$scope.toogleSort($scope.selectedItem.$parent);
				}else{
					$scope.toogleSort($scope.ngModel);
				}
			}
		});

		$scope.$watch('textSearch', function() {
			if ($scope.textSearch !== undefined && $scope.textSearch.length > 0) {
				for (var i = 0; i < $scope.ngModel.length; i++) {
					$scope.filterString($scope.ngModel[i]);
				}
			}
			if ($scope.textSearch !== undefined && $scope.textSearch.length == 0) {
				for (var i = 0; i < $scope.ngModel.length; i++) {
					$scope.resetVisible($scope.ngModel[i]);
				}
			};
		});


		$scope.dynamicTree =
			($scope.dynamicTree != undefined
			&& ($scope.dynamicTree == true
				|| $scope.dynamicTree.trim() == ""
				|| $scope.dynamicTree.toLowerCase() != 'false'));


		var checkIgnoreDeepObjectChange = function(newValue, oldValue) {
			var flagToReturn = false;

			if(newValue === oldValue) {
				flagToReturn = true;
			} else {
				if(Array.isArray(newValue) && Array.isArray(oldValue) && newValue.length == oldValue.length) {
					for(var i = 0; i < newValue.length; i++) {
						var newValueArrayItem = newValue[i];
						var oldValueArrayItem = oldValue[i];

						if((newValueArrayItem.checked != oldValueArrayItem.checked)
								|| (newValueArrayItem.expanded != oldValueArrayItem.expanded)) {

							flagToReturn = true;
						}

						if(!flagToReturn) {
							var newValueArrayItemChildren = newValueArrayItem[$scope.subfoldersId];
							var oldValueArrayItemChildren = oldValueArrayItem[$scope.subfoldersId];

							if(newValueArrayItemChildren
									&& newValueArrayItemChildren.length > 0
									&& oldValueArrayItemChildren
									&& oldValueArrayItemChildren.length > 0
									&& newValueArrayItemChildren.length == oldValueArrayItemChildren.length) {

								flagToReturn = flagToReturn || checkIgnoreDeepObjectChange(newValueArrayItemChildren, oldValueArrayItemChildren);
							}
						}
					}
				}
			}

			return flagToReturn;
		};

		var watchedNgModel = function() { return $scope.ngModel;};

		var updateWatchedItemFn = function(newValue, oldValue) {
			if(checkIgnoreDeepObjectChange(newValue, oldValue)) {
				return;
			} else {
				$scope.refreshTree();
			}
		};

		$scope.refreshTree=function(){
			$scope.seeTree = false;

			$scope.initializeFolders($scope.ngModel, null);
			$scope.ngModel = $scope.createTreeStructure($scope.ngModel);
			$scope.folders = $scope.ngModel;

			$timeout(function() {
				$scope.seeTree = true;
			},400,true);
		}

		if($scope.staticTree!='true'){
			if($scope.dynamicTree) {
				$scope.$watch( watchedNgModel, updateWatchedItemFn, true);
			} else {
				$scope.$watchCollection( watchedNgModel, updateWatchedItemFn, true);
			}
		}

		$scope.resetVisible = function(element) {
			element.visible = true;
			if (element[$scope.subfoldersId] !== undefined) {
				for (var i =0 ;i < element[$scope.subfoldersId].length; i++) {
					$scope.resetVisible(element[$scope.subfoldersId][i]);
				}
//				for (var j = 0; element.biObjects !== undefined && j < element.biObjects.length; j++ ) {
//					$scope.resetVisible(element.biObjects[j]);
				for (var j = 0; element[$scope.leafKey] !== undefined && j < element[$scope.leafKey].length; j++ ) {
					$scope.resetVisible(element[$scope.leafKey][j]);
				}
			}
		};

		$scope.filterString = function(element) {
			var visible = true;
			if ($scope.textSearch && $scope.fieldsSearch) {
				//if the filters is empty, visible = true, else start with visible = false
				visible = $scope.fieldsSearch.length == 0 || $scope.textSearch.length == 0;
				//search the text filter in each fields specify in filterBy object, until visible == false
				for (var i =0; visible == false && i < $scope.fieldsSearch.length;i++) {
					if(element[$scope.fieldsSearch[i]])
						visible = $scope.textSearch.toUpperCase().indexOf(element[$scope.fieldsSearch[i]].toUpperCase()) > -1;
				}

				if (element.type == 'folder' && element[$scope.subfoldersId] !==undefined ) {
					for (var i =0 ; i < element[$scope.subfoldersId].length; i++) {
						if ($scope.filterString(element[$scope.subfoldersId][i]) == true ) {
							visible = true;
						}
					}
//					for (var j = 0; element.biObjects !==undefined && j < element.biObjects.length ; j++ ) {
//						if ($scope.filterString(element.biObjects[j]) == true) {
//							visible = true;
//						}
//					}
					for (var j = 0; element[$scope.leafKey] !== undefined && j < element[$scope.leafKey].length ; j++ ) {
						if ($scope.filterString(element[$scope.leafKey][j]) == true) {
							visible = true;
						}
					}
				}
			}
			element.visible = visible;
			return visible;
		};

		$scope.detectBrowser = function() {
			var userAgent = window.navigator.userAgent;
			var browsers = {
					chrome: /chrome/i,
					safari: /safari/i,
					firefox: /firefox/i,
					ie: /internet explorer/i
			};

			for(var key in browsers) {
				if (browsers[key].test(userAgent)) {
					return key;
				}
			};
			return 'unknown';
		};

		$scope.checkSeeTree = function() {
			return $scope.seeTree;
		};

		$scope.browser = $scope.detectBrowser();

		if ($scope.browser == 'firefox') {
			$scope.classLayout='layout-padding';
		}else{
//			$scope.classLayout='layout-fill';
		}
	};
})();