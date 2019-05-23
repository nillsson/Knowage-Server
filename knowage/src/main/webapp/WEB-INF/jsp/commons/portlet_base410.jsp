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


<%@ page language="java" pageEncoding="utf-8" session="true"%>

<%-- ---------------------------------------------------------------------- --%>
<%-- ERROR PAGE																--%>
<%-- ---------------------------------------------------------------------- --%>
<%-- The following directive catches exceptions thrown by jsps.				--%>
<%-- must be commented in development environment.							--%>
<%-- ---------------------------------------------------------------------- --%>
<%@page errorPage="/WEB-INF/jsp/commons/genericError.jsp"%>

<%-- ---------------------------------------------------------------------- --%>
<%-- TAG LIBRARIES													--%>
<%-- ---------------------------------------------------------------------- --%>
<%@ taglib uri="/WEB-INF/tlds/spagobi.tld" prefix="spagobi"%>

<%-- ---------------------------------------------------------------------- --%>
<%-- JAVA IMPORTS															--%>
<%-- ---------------------------------------------------------------------- --%>
<%@page import="it.eng.spago.base.*"%>
<%@page import="it.eng.spagobi.commons.SingletonConfig"%>
<%@page import="it.eng.spagobi.commons.utilities.urls.IUrlBuilder"%>
<%@page
	import="it.eng.spagobi.commons.utilities.messages.IMessageBuilder"%>
<%@page import="it.eng.spagobi.commons.utilities.urls.WebUrlBuilder"%>
<%@page import="it.eng.spagobi.commons.utilities.urls.PortletUrlBuilder"%>
<%@page
	import="it.eng.spagobi.commons.utilities.messages.MessageBuilder"%>
<%@page
	import="it.eng.spagobi.commons.utilities.messages.MessageBuilderFactory"%>
<%@page import="it.eng.spagobi.commons.utilities.urls.UrlBuilderFactory"%>
<%@page import="java.util.Locale"%>
<%@page import="java.util.Map"%>
<%@page import="it.eng.spagobi.commons.constants.SpagoBIConstants"%>
<%@page import="it.eng.spago.security.IEngUserProfile"%>
<%@page import="java.util.Enumeration"%>
<%@page import="it.eng.spagobi.container.CoreContextManager"%>
<%@page import="it.eng.spagobi.container.SpagoBISessionContainer"%>
<%@page
	import="it.eng.spagobi.container.strategy.LightNavigatorContextRetrieverStrategy"%>
<%@page import="java.util.Iterator"%>
<%@page import="it.eng.spagobi.commons.utilities.GeneralUtilities"%>
<%@page import="it.eng.spagobi.commons.utilities.PortletUtilities"%>
<%@page import="it.eng.spagobi.commons.utilities.UserUtilities"%>
<%@page import="it.eng.spagobi.commons.bo.UserProfile"%>
<%@page import="it.eng.spagobi.utilities.themes.ThemesManager"%>
<%@page import="org.apache.commons.lang.StringEscapeUtils"%>
<%@page import="java.util.List"%>
<%@page import="java.util.ArrayList"%>
<%@page import="it.eng.spagobi.commons.bo.AccessibilityPreferences" %>


<%-- ---------------------------------------------------------------------- --%>
<%-- JAVA CODE 																--%>
<%-- ---------------------------------------------------------------------- --%>
<%
	//Enumeration headers = request.getHeaderNames();
	//while (headers.hasMoreElements()) {
	//	String headerName = (String) headers.nextElement();
	//	String header = request.getHeader(headerName);
	//	System.out.println(header + ": ");
	//}

	RequestContainer aRequestContainer = null;
	ResponseContainer aResponseContainer = null;
	SessionContainer aSessionContainer = null;
	IUrlBuilder urlBuilder = null;
	IMessageBuilder msgBuilder = null;
	
	String sbiMode = null;
		
	// case of portlet mode
	aRequestContainer = RequestContainerPortletAccess.getRequestContainer(request);
	aResponseContainer = ResponseContainerPortletAccess.getResponseContainer(request);
	if (aRequestContainer == null) {
		// case of web mode
		//aRequestContainer = RequestContainerAccess.getRequestContainer(request);
		aRequestContainer = RequestContainer.getRequestContainer();
		if(aRequestContainer == null){
			//case of REST 
			aRequestContainer = RequestContainerAccess.getRequestContainer(request);
		}
		
		//aResponseContainer = ResponseContainerAccess.getResponseContainer(request);
		aResponseContainer = ResponseContainer.getResponseContainer();
		if(aResponseContainer == null){
			//case of REST
			aResponseContainer = ResponseContainerAccess.getResponseContainer(request);
		}
	}
	
	String channelType = aRequestContainer.getChannelType();
	if ("PORTLET".equalsIgnoreCase(channelType)) sbiMode = "PORTLET";
	else sbiMode = "WEB";
	
	boolean forceIE8Compatibility = true;

    // = (String)sessionContainer.getAttribute(Constants.USER_LANGUAGE);
    //country = (String)sessionContainer.getAttribute(Constants.USER_COUNTRY);
	
	// create url builder 
	urlBuilder = UrlBuilderFactory.getUrlBuilder(sbiMode);

	// create message builder
	msgBuilder = MessageBuilderFactory.getMessageBuilder();
	
	// get other spago object
	SourceBean aServiceRequest = aRequestContainer.getServiceRequest();
	SourceBean aServiceResponse = aResponseContainer.getServiceResponse();
	aSessionContainer = aRequestContainer.getSessionContainer();
	
	
	//get session access control object
	CoreContextManager contextManager = new CoreContextManager(new SpagoBISessionContainer(aSessionContainer), 
				new LightNavigatorContextRetrieverStrategy(aServiceRequest));
	
	// urls for resources
	String linkSbijs = urlBuilder.getResourceLink(request, "/js/spagobi.js");
	//String linkProto = urlBuilder.getResourceLink(request, "/js/prototype/javascripts/prototype.js");
	//String linkProtoWin = urlBuilder.getResourceLink(request, "/js/prototype/javascripts/window.js");
	//String linkProtoEff = urlBuilder.getResourceLink(request, "/js/prototype/javascripts/effects.js");
	//String linkProtoDefThem = urlBuilder.getResourceLink(request, "/js/prototype/themes/default.css");
	//String linkProtoAlphaThem = urlBuilder.getResourceLink(request, "/js/prototype/themes/alphacube.css");

	SessionContainer permanentSession = aSessionContainer.getPermanentContainer();
	

	// If Language is alredy defined keep it
	
	String curr_language=(String)permanentSession.getAttribute(SpagoBIConstants.AF_LANGUAGE);
	String curr_country=(String)permanentSession.getAttribute(SpagoBIConstants.AF_COUNTRY);
	Locale locale = null;
	

	if(curr_language!=null && curr_country!=null && !curr_language.equals("") && !curr_country.equals("")){
		locale=new Locale(curr_language, curr_country, "");
	}
	else {	
	if (sbiMode.equals("PORTLET")) {
		locale = PortletUtilities.getLocaleForMessage();
	} else {
		locale = MessageBuilder.getBrowserLocaleFromSpago();
	}
	// updates locale information on permanent container for Spago messages mechanism
	if (locale != null) {
		permanentSession.setAttribute(Constants.USER_LANGUAGE, locale.getLanguage());
		permanentSession.setAttribute(Constants.USER_COUNTRY, locale.getCountry());
	}
	}
	
	IEngUserProfile userProfile = (IEngUserProfile)permanentSession.getAttribute(IEngUserProfile.ENG_USER_PROFILE);
	
	String userUniqueIdentifier="";
	String userId="";
	String userName="";
	String defaultRole="";
	List userRoles = new ArrayList();
	 AccessibilityPreferences ap = null;
	 
	 boolean enableUIO = false;
	 boolean enableRobobraille = false;
	 boolean enableVoice = false;
	 boolean enableGraphSonification = false;
	 
	//if (userProfile!=null) userId=(String)userProfile.getUserUniqueIdentifier();
	if (userProfile!=null){
		userId=(String)((UserProfile)userProfile).getUserId();
		userUniqueIdentifier=(String)userProfile.getUserUniqueIdentifier();
		userName=(String)((UserProfile)userProfile).getUserName();
		userRoles = (ArrayList)userProfile.getRoles();
		defaultRole = ((UserProfile)userProfile).getDefaultRole();		
		
	    ap =  UserUtilities.readAccessibilityPreferencesByUser((UserProfile)userProfile);
	    
	    if(ap != null){
	    	 enableUIO = ap.isEnableUio();
	    	 enableRobobraille = ap.isEnableRobobraille();
	    	 enableVoice = ap.isEnableVoice();
	    	 enableGraphSonification = ap.isEnableGraphSonification(); 	
	    }
	}
	
	// Set Theme
	String currTheme=ThemesManager.getCurrentTheme(aRequestContainer);
	if(currTheme==null)currTheme=ThemesManager.getDefaultTheme();
	
	String currViewThemeName = ThemesManager.getCurrentThemeName(currTheme);
	
	String parametersStatePersistenceEnabled = SingletonConfig.getInstance().getConfigValue("SPAGOBI.EXECUTION.PARAMETERS.statePersistenceEnabled");
	String parameterStatePersistenceScope = SingletonConfig.getInstance().getConfigValue("SPAGOBI.EXECUTION.PARAMETERS.statePersistenceScope");
	// to ensure back compatibility
	if(parametersStatePersistenceEnabled == null) {
		parametersStatePersistenceEnabled = SingletonConfig.getInstance().getConfigValue("SPAGOBI.SESSION_PARAMETERS_MANAGER.enabled");
	}
	String parametersMementoPersistenceEnabled= SingletonConfig.getInstance().getConfigValue("SPAGOBI.EXECUTION.PARAMETERS.mementoPersistenceEnabled");
	String parameterMementoPersistenceScope = SingletonConfig.getInstance().getConfigValue("SPAGOBI.EXECUTION.PARAMETERS.mementoPersistenceScope");
	String parameterMementoPersistenceDepth = SingletonConfig.getInstance().getConfigValue("SPAGOBI.EXECUTION.PARAMETERS.mementoPersistenceDepth");
	
	

	//  TO USE THE REST CALLS
	request.getSession().setAttribute(IEngUserProfile.ENG_USER_PROFILE, userProfile);
	request.getSession().setAttribute(Constants.USER_LANGUAGE, locale.getLanguage());
	request.getSession().setAttribute(Constants.USER_COUNTRY, locale.getCountry());
%>

<%-- ---------------------------------------------------------------------- --%>
<%-- HTML	 																--%>
<%-- ---------------------------------------------------------------------- --%>

<!-- based on ecexution mode include initial html  -->
<% if (sbiMode.equalsIgnoreCase("WEB")){ %>
<html
	lang="<%=locale != null ? locale.getLanguage() : GeneralUtilities.getDefaultLocale().getLanguage()%>">
<head>
<title>Knowage</title>
<meta name="viewport" content="initial-scale=1" />
<% if (forceIE8Compatibility == true){ %>
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta http-equiv="Content-Type" content="text/html;charset=utf-8">

<%} %>
<link rel="shortcut icon"
	href="<%=urlBuilder.getResourceLinkByTheme(request, "img/favicon.ico", currTheme)%>" />
</head>

<!--[if IE 8]>
	        <body class="lte-8 ie-8">
	    <![endif]-->
<!--[if lte IE 7]>
	        <body class="lte-8 lte-7">
	    <![endif]-->
<!--[if gt IE 8]>
	        <body class="ie-9">
	    <![endif]-->
<!--[if !IE]><!-->
<body class="kn-main-body">
	<script>  
			if (/*@cc_on!@*/false) {  
				document.documentElement.className+=' ie10';  
			}  
		</script>
	<!--<![endif]-->
	<%} %>




	<script type="text/javascript">

    Sbi = new Object();
    Sbi.config = function () {
        return {
       		// login url, used when session is expired
        	loginUrl: '<%= GeneralUtilities.getSpagoBiContext() %>',
        	currTheme: '<%= currTheme %>',
        	curr_country: '<%= curr_country %>',
        	curr_language: '<%= curr_language%>',
        	contextName: '<%= GeneralUtilities.getSpagoBiContext() %>',
        	adapterPath: '<%= GeneralUtilities.getSpagoBiContext() + GeneralUtilities.getSpagoAdapterHttpUrl() %>',
        	supportedLocales: <%= GeneralUtilities.getSupportedLocalesAsJSONArray().toString() %>,
            // the date format localized according to user language and country
            localizedDateFormat: '<%= GeneralUtilities.getLocaleDateFormatForExtJs(permanentSession) %>',
            // the timestamp format localized according to user language and country
            localizedTimestampFormat: '<%= GeneralUtilities.getLocaleDateFormatForExtJs(permanentSession) %> H:i:s',
            // the date format to be used when communicating with server
            clientServerDateFormat: '<%= GeneralUtilities.getServerDateFormatExtJs() %>',
            // the timestamp format to be used when communicating with server
            clientServerTimestampFormat: '<%= GeneralUtilities.getServerTimestampFormatExtJs() %>',
         	<%if(parametersStatePersistenceEnabled != null) {%>
        	isParametersStatePersistenceEnabled: <%= Boolean.valueOf(parametersStatePersistenceEnabled) %>,
        	<%}%>
        	
        	<%if(parameterStatePersistenceScope != null) {%>
        	parameterStatePersistenceScope: '<%= parameterStatePersistenceScope.toUpperCase() %>',
        	<%}%>
        	
        	<%if(parametersMementoPersistenceEnabled != null) {%>
        	isParametersMementoPersistenceEnabled: <%= Boolean.valueOf(parametersMementoPersistenceEnabled) %>,
        	<%}%>
        	
        	<%if(parameterMementoPersistenceScope != null) {%>
        	parameterMementoPersistenceScope: '<%= parameterMementoPersistenceScope.toUpperCase() %>',
        	<%}%>
        	
        	<%if(parameterMementoPersistenceDepth != null) {%>
        	parameterMementoPersistenceDepth: <%= parameterMementoPersistenceDepth %>,
        	<%}%>
        	
        	isSSOEnabled: <%= GeneralUtilities.isSSOEnabled() %>
        };
    }();


    // javascript-side user profile object
    
    Sbi.user = new Object();
    Sbi.user.userUniqueIdentifier = '<%= StringEscapeUtils.escapeJavaScript(userUniqueIdentifier) %>';
    Sbi.user.userId = '<%= StringEscapeUtils.escapeJavaScript(userId) %>';
    Sbi.user.userName = '<%= StringEscapeUtils.escapeJavaScript(userName) %>';    
    Sbi.user.ismodeweb = <%= sbiMode.equals("WEB")? "true" : "false"%>;
    Sbi.user.isSuperAdmin = '<%= userProfile != null && ((UserProfile)userProfile).getIsSuperadmin() %>';
	Sbi.user.roles = new Array();
	Sbi.user.defaultRole = '<%= defaultRole != null ? StringEscapeUtils.escapeJavaScript(defaultRole)  : ""%>';
	
	<%
	StringBuffer buffer = new StringBuffer("[");
	if (userProfile != null && userProfile.getFunctionalities() != null && !userProfile.getFunctionalities().isEmpty()) {
		Iterator it = userProfile.getFunctionalities().iterator();
		while (it.hasNext()) {
			String functionalityName = (String) it.next();
			buffer.append("'" + functionalityName + "'");
			if (it.hasNext()) {
				buffer.append(",");
			}
		}
	}
	buffer.append("]");
	%>
	
	<%
	// Set roles
	Integer indexRoles = Integer.valueOf(0);
	for(Iterator it = userRoles.iterator();it.hasNext();)
	{
		String aRole = (String)it.next();
	%>
		Sbi.user.roles[<%=indexRoles.toString()%>] = '<%=StringEscapeUtils.escapeJavaScript(aRole)%>';
	<%
	indexRoles = Integer.valueOf( indexRoles.intValue()+1 );
	}
	%>
	
	
	// Sbi.user.functionalities is a javascript array containing all user functionalities' names
	Sbi.user.functionalities = <%= buffer.toString() %>;
	
</script>



	<% // get the current ext theme
String extTheme=ThemesManager.getTheExtTheme(currTheme);
%>


	<script>
	document.onselectstart = function() { return true; }
	
	 var enableUIO = <%=enableUIO%>;
	 var enableRobobraille = <%=enableRobobraille%>;
	 var enableVoice =<%=enableVoice%>;
	 var enableGraphSonification = <%=enableGraphSonification%>;
	
</script>

<style>
	#pleaserotate-graphic{
        fill: #fff;
    }

    #pleaserotate-backdrop {
        color: #fff;
        background-color: #000;
    }
</style>
<script>
var PleaseRotateOptions = {
	    message: "Please Rotate Your Device",
	    subMessage: "For a better mobile experience",
	    allowClickBypass: false,
	    onlyMobile: false,
	    zIndex: 9999
	};
	
</script>

<script type="text/javascript" src="<%=urlBuilder.getResourceLink(request, "node_modules/pleaserotate.js/pleaserotate.min.js")%>"></script>

<%-- ---------------------------------------------------------------------- --%>
<%-- INCLUDE Angular JS														--%>
<%-- ---------------------------------------------------------------------- --%>
	<%@include file="/WEB-INF/jsp/commons/angular/angularImport.jsp"%>
	<script type="text/javascript" src="<%=urlBuilder.getResourceLink(request, "/node_modules/jquery/dist/jquery.min.js")%>"></script> 
	<link rel="stylesheet" href="<%=urlBuilder.getResourceLink(request,"/js/lib/bootstrap/css/bootstrap.min.css")%>">
	<link id="spagobi-angular" rel="styleSheet"	href="<%=urlBuilder.getResourceLink(request,"/themes/sbi_default/css/menuBar/style.css")%>" type="text/css" />
	<link id="spagobi-angular" rel="styleSheet"	href="<%=urlBuilder.getResourceLink(request,"/themes/commons/css/customStyle.css")%>" type="text/css" />

<%-- ---------------------------------------------------------------------- --%>
<%-- INCLUDE Bootstrap														--%>
<%-- ---------------------------------------------------------------------- --%>		

<script src="<%=urlBuilder.getResourceLink(request,"/js/lib/bootstrap/bootstrap.min.js")%>"></script>


<%@ include file="/WEB-INF/jsp/commons/includeMessageResource.jspf" %>
