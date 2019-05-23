<%-- ---------------------------------------------------------------------- --%>
<%-- JAVA IMPORTS															--%>
<%-- ---------------------------------------------------------------------- --%>

<!-- this imports are used for language controls  -->
<%@page import="it.eng.knowage.engine.kpi.KpiEngineInstance"%>
<%@page import="java.util.Locale"%>
<%@page import="java.util.List"%>
<%@page import="java.util.ArrayList"%>
<%@page import="java.util.Map"%>
<%@page import="java.util.HashMap"%>
<%@page import="it.eng.spagobi.utilities.engines.EngineConstants"%>
<%@page import="org.apache.commons.lang.StringEscapeUtils"%>
<%@page import="it.eng.spago.security.IEngUserProfile"%>
<%@page import="it.eng.spagobi.commons.utilities.ChannelUtilities"%>
<%@page import="it.eng.spagobi.commons.constants.SpagoBIConstants"%>
<%@page import="java.util.Iterator"%>
<%@page import="com.fasterxml.jackson.databind.ObjectMapper"%>
<%@page import="org.json.JSONObject"%>
<%@page import="it.eng.knowage.commons.utilities.urls.UrlBuilder"%>

<%
/*
*/
KpiEngineInstance engineInstance;
IEngUserProfile profile;
String profileJSONStr;
Map env;
String contextName;
String environment;
String executionRole;
Locale locale;
String template;
String docLabel;
String docVersion;
String docAuthor;
String docName;
String docDescription;
String docIsPublic;
String docIsVisible;
String docPreviewFile;
String[] docCommunities;
String docCommunity;
List docFunctionalities;
String userId;
String isTechnicalUser;
List<String> includes;
String datasetLabel;
String kpiValue = "";
//from cockpit
boolean isCockpit = false;
String aggregations = "";
String selections = "";
String associations = "";
String widgetId = "";
String metaData = "";

// Dynamic Url Builder - Caching Management
String spagoBiContext = GeneralUtilities.getSpagoBiContext();							//  /knowage
String kpiEngineContext = request.getContextPath(); 									//  /kpiengine
UrlBuilder urlBuilder = new UrlBuilder(spagoBiContext, kpiEngineContext);
String dynamicResourcesBasePath = urlBuilder.getDynamicResorucesBasePath();  			//  /knowage/js/src
String dynamicResourcesEnginePath = urlBuilder.getDynamicResourcesEnginePath();  		//  /kpiengine/js/src
	
engineInstance = (KpiEngineInstance)request.getSession().getAttribute(EngineConstants.ENGINE_INSTANCE);
env = engineInstance.getEnv();

locale = engineInstance.getLocale();
profile = engineInstance.getUserProfile();
// profile = (IEngUserProfile) request.getSession().getAttribute(IEngUserProfile.ENG_USER_PROFILE);
profileJSONStr = new ObjectMapper().writeValueAsString(profile);
// locale = engineInstance.getLocale();

contextName = request.getParameter(SpagoBIConstants.SBI_CONTEXT); 
environment = request.getParameter("SBI_ENVIRONMENT"); 
executionRole = (String)env.get(EngineConstants.ENV_EXECUTION_ROLE);
userId = (engineInstance.getDocumentUser()==null)?"":engineInstance.getDocumentUser().toString();
isTechnicalUser = (engineInstance.isTechnicalUser()==null)?"":engineInstance.isTechnicalUser().toString();
template = engineInstance.getTemplate().toString(0);
if(env.get("KPI_VALUE")!=null){
	kpiValue = env.get("KPI_VALUE").toString();
}

if(env.get("EXECUTE_COCKPIT") != null){
	isCockpit = true;
	datasetLabel = env.get(EngineConstants.ENV_DATASET_LABEL)!=null?(String)env.get(EngineConstants.ENV_DATASET_LABEL):"";
	aggregations = env.get("AGGREGATIONS")!=null?(String)env.get("AGGREGATIONS"):"";
	selections = env.get("SELECTIONS")!=null?(String)env.get("SELECTIONS"):"";
	associations = env.get("ASSOCIATIONS")!=null?(String)env.get("ASSOCIATIONS"):"";
	metaData = env.get("METADATA")!=null?(String)env.get("METADATA"):"";
	widgetId = env.get("WIDGETID")!=null?(String)env.get("WIDGETID"):"";
} else {
	datasetLabel = (engineInstance.getDataSet() != null )?
			engineInstance.getDataSet().getLabel() : "" ;
}

/*
*/	
docLabel = (engineInstance.getDocumentLabel()==null)?"":engineInstance.getDocumentLabel().toString();
docVersion = (engineInstance.getDocumentVersion()==null)?"":engineInstance.getDocumentVersion().toString();
docAuthor = (engineInstance.getDocumentAuthor()==null)?"":engineInstance.getDocumentAuthor().toString();
docName = (engineInstance.getDocumentName()==null)?"":engineInstance.getDocumentName().toString();
docDescription = (engineInstance.getDocumentDescription()==null)?"":engineInstance.getDocumentDescription().toString();
docIsPublic= (engineInstance.getDocumentIsPublic()==null)?"":engineInstance.getDocumentIsPublic().toString();
docIsVisible= (engineInstance.getDocumentIsVisible()==null)?"":engineInstance.getDocumentIsVisible().toString();
docPreviewFile= (engineInstance.getDocumentPreviewFile()==null)?"":engineInstance.getDocumentPreviewFile().toString();	
docCommunities= (engineInstance.getDocumentCommunities()==null)?null:engineInstance.getDocumentCommunities();
docCommunity = (docCommunities == null || docCommunities.length == 0) ? "": docCommunities[0];
docFunctionalities= (engineInstance.getDocumentFunctionalities()==null)?new ArrayList():engineInstance.getDocumentFunctionalities();

boolean fromMyAnalysis = false;
if(request.getParameter("MYANALYSIS") != null && request.getParameter("MYANALYSIS").equalsIgnoreCase("TRUE")){
	fromMyAnalysis = true;
}else{
	if (request.getParameter("SBI_ENVIRONMENT") != null && request.getParameter("SBI_ENVIRONMENT").equalsIgnoreCase("MYANALYSIS")){
		fromMyAnalysis = true;
	}
}

Map analyticalDrivers  = engineInstance.getAnalyticalDrivers();
Map driverParamsMap = new HashMap();
for(Object key : engineInstance.getAnalyticalDrivers().keySet()){
	if(key instanceof String && !key.equals("widgetData")){
		String value = request.getParameter((String)key);
		if(value!=null){
			driverParamsMap.put(key, value);
		}
	}
}
String driverParams = new JSONObject(driverParamsMap).toString(0).replaceAll("'", "\\\\'");
String uuidO=request.getParameter("SBI_EXECUTION_ID")!=null? request.getParameter("SBI_EXECUTION_ID"): "null";
%>



<%@include file="../../commons/includeMessageResource.jspf"%>
