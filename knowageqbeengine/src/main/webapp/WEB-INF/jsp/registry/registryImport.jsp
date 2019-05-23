<%--
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
--%>

<!-- --------------------------------------------------------------------------------------
	urlBuilder - for dynamically getting the full URL path to the specific resource.
	spagoBiContext - context path of core engine: /knowage
	qbeEngineContext - context name of particular engine, in this case: /qbeengine  
  --------------------------------------------------------------------------------------- -->

<script type="text/javascript" src="<%=urlBuilder.getResourcePath(qbeEngineContext, "js/src/registry/registry.controller.js")%>"></script>
<script type="text/javascript" src="<%=urlBuilder.getResourcePath(qbeEngineContext, "js/src/registry/services/registryCRUDService.js")%>"></script>
<script type="text/javascript" src="<%=urlBuilder.getResourcePath(qbeEngineContext, "js/src/registry/services/registryFilterGetData.js")%>"></script>
<script type="text/javascript" src="<%=urlBuilder.getResourcePath(qbeEngineContext, "js/src/registry/services/interceptors/httpInterceptor.js")%>"></script>
<script type="text/javascript" src="<%=urlBuilder.getResourcePath(qbeEngineContext, "js/src/registry/services/paginationService.js")%>"></script>
<script type="text/javascript" src="<%=urlBuilder.getResourcePath(qbeEngineContext, "js/src/registry/filters/registryDecimalFormatFilter.js")%>"></script>


<%@include file="/WEB-INF/jsp/registry/registryConfig/registryConfigModule.jspf"%>
<link rel="stylesheet" href="<%=urlBuilder.getResourcePath(qbeEngineContext, "js/src/registry/css/registry.css")%>">