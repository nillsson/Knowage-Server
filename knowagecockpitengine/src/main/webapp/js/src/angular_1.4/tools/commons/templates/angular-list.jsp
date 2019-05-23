<div  layout="column"  layout-fill class="angularListTemplate kn-list-tree"> 
		<md-input-container ng-show="showSearchBar==true" md-no-float class="searchBarList">
			<md-icon md-font-icon="fa fa-search"></md-icon> 
			<input ng-if="!localSearch" ng-model="searchVal"
					ng-keyup="searchItem(searchVal)" type="text" placeholder="Search ">
			<input ng-if="localSearch" ng-model="searchVal"
					ng-keyup="searchItem(searchVal)" type="text"
					placeholder="Search here "> 
			<md-icon md-font-icon="fa fa-filter" ng-click="searchVal='';searchItem(searchVal);" 
					class="filter-icon" ng-class="{ 'not_empty' : (searchVal.length !== 0 && searchVal!=undefined)  }"></md-icon>
		</md-input-container> 
		<md-progress-circular md-diameter="20" ng-show="showSearchPreloader==true" class="md-hue-2" md-mode="indeterminate"></md-progress-circular>
		<p ng-if="ngModel.length==0 || ngModel==undefined">
			{{translate.load("sbi.widgets.datastorepanel.grid.emptymsg");}}</p>

		<div flex id="{{id}}Tree" class="listItemContainer" ui-tree="dragDropOptions"
				data-drag-enabled="dragAndDropEnabled" data-drag-delay="200"
				data-clone-enabled={{enableClone==true}}
				data-empty-placeholder-enabled={{showEmptyPlaceholder==true}}
				ng-style="{overflow : !paginate==true? 'auto':'' }">
	
			<ol ui-tree-nodes ng-model="ngModel" class="angularListRowItem">
				<li ng-if='SyncPagination && paginate' id="listItemTemplate"
						dir-paginate="item in ngModel | filterBySpecificColumnAngularList:searchFastVal:itemName:localSearch |  itemsPerPage:	itemsPerPage "
						pagination-id='id+"Pagination"' total-items='totalItemCount'
						current-page=currentPageNumber style="border: none;"
						ng-include="'<%=urlBuilder.getResourcePath(cockpitEngineContext,"/js/src/angular_1.4/tools/commons/templates/angular-list-item.html")%>'"></li>
	
				<li ng-if='!SyncPagination && paginate' id="listItemTemplate"
						dir-paginate="item in ngModel | filterBySpecificColumnAngularList:searchFastVal:itemName:localSearch |  itemsPerPage:	itemsPerPage "
						pagination-id='id+"Pagination"' current-page=currentPageNumber style="border: none;"
						ng-include="'<%=urlBuilder.getResourcePath(cockpitEngineContext,"/js/src/angular_1.4/tools/commons/templates/angular-list-item.html")%>'"></li>
	
				<li ng-if='!paginate' ng-repeat="item in ngModel | filterBySpecificColumnAngularList:searchFastVal:itemName:localSearch"
						style="border: none;"
						ng-include="'<%=urlBuilder.getResourcePath(cockpitEngineContext,"/js/src/angular_1.4/tools/commons/templates/angular-list-item.html")%>'"></li>
			</ol>
		</div>

		<div class="box_pagination_list" layout="row" layout-align="center end">
			<dir-pagination-controls ng-if='SyncPagination && paginate '
					max-size="5" pagination-id='id+"Pagination"'
					on-page-change="pageCangedFunction({newPageNumber:newPageNumber,itemsPerPage:itemsPerPage,searchValue:prevSearch})">
			</dir-pagination-controls>
			<dir-pagination-controls ng-if='!SyncPagination && paginate'
					max-size="5" pagination-id='id+"Pagination"'>
			</dir-pagination-controls>
		</div>

</div>
