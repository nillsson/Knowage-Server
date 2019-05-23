/*
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
package it.eng.spagobi.analiticalmodel.documentsbrowser.service;

import it.eng.spagobi.analiticalmodel.document.bo.BIObject;
import it.eng.spagobi.analiticalmodel.document.dao.IBIObjectDAO;
import it.eng.spagobi.commons.bo.UserProfile;
import it.eng.spagobi.commons.constants.SpagoBIConstants;
import it.eng.spagobi.commons.dao.DAOFactory;
import it.eng.spagobi.commons.serializer.DocumentsJSONSerializer;
import it.eng.spagobi.commons.serializer.SerializerFactory;
import it.eng.spagobi.commons.services.AbstractSpagoBIAction;
import it.eng.spagobi.commons.utilities.ObjectsAccessVerifier;
import it.eng.spagobi.commons.utilities.messages.MessageBuilder;
import it.eng.spagobi.utilities.exceptions.SpagoBIException;
import it.eng.spagobi.utilities.service.JSONSuccess;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * @author Antonella Giachino (antonella.giachino@eng.it)
 *
 */
public class SearchContentAction extends AbstractSpagoBIAction {

	// REQUEST PARAMETERS
	private static final String ATTRIBUTES = "attributes";

	// logger component
	private static Logger logger = Logger.getLogger(SearchContentAction.class);

	@Override
	public void doService() {

		List objects;

		logger.debug("IN");

		try {
			UserProfile profile = (UserProfile) getUserProfile();

			String valueFilter = getAttributeAsString(SpagoBIConstants.VALUE_FILTER);
			logger.debug("Parameter [" + SpagoBIConstants.VALUE_FILTER + "] is equal to [" + valueFilter + "]");

			String attributes = getAttributeAsString(ATTRIBUTES);
			logger.debug("Parameter [" + ATTRIBUTES + "] is equal to [" + attributes + "]");

			IBIObjectDAO documentsDao = DAOFactory.getBIObjectDAO();
			List<BIObject> biObjects = documentsDao.loadAllBIObjectsBySearchKey(valueFilter, attributes);

			objects = new ArrayList();
			if (biObjects != null) {
				for (BIObject biObject : biObjects) {
					Integer id = biObject.getId();
					BIObject obj = DAOFactory.getBIObjectDAO().loadBIObjectForDetail(id);
					if (obj != null) {
						boolean canSee = ObjectsAccessVerifier.canSee(obj, profile);
						if (canSee) {
							objects.add(obj);
						}
					}
				}
			}

			JSONArray documentsJSON = (JSONArray) SerializerFactory.getSerializer("application/json").serialize(objects, null);

			Collection func = profile.getFunctionalities();
			if (func.contains("SeeMetadataFunctionality")) {
				JSONObject showmetadataAction = new JSONObject();
				showmetadataAction.put("name", "showmetadata");
				showmetadataAction.put("description", "Show Metadata");
				for (int i = 0; i < documentsJSON.length(); i++) {
					JSONObject documentJSON = documentsJSON.getJSONObject(i);
					documentJSON.getJSONArray(DocumentsJSONSerializer.ACTIONS).put(showmetadataAction);
				}
			}
			// add detail functionality when user has
			if (func.contains("DocumentDetailManagement")) {
				JSONObject detailAction = new JSONObject();
				MessageBuilder msgBuild = new MessageBuilder();
				detailAction.put("name", "detail");
				detailAction.put("description", msgBuild.getMessage("sbiobjects.actions.detail.description", getLocale()));
				for (int i = 0; i < documentsJSON.length(); i++) {
					JSONObject documentJSON = documentsJSON.getJSONObject(i);
					// check user can dev on this object
					if (ObjectsAccessVerifier.canDevBIObject(documentJSON.getInt(DocumentsJSONSerializer.ID), profile)) {
						documentJSON.getJSONArray(DocumentsJSONSerializer.ACTIONS).put(detailAction);
					}
				}
			}
			JSONObject documentsResponseJSON = createJSONResponseDocuments(documentsJSON);

			try {
				writeBackToClient(new JSONSuccess(createJSONResponse(documentsResponseJSON)));
			} catch (IOException e) {
				logger.error(e.getMessage(), e);
				throw new SpagoBIException("Impossible to write back the responce to the client", e);
			}

		} catch (Exception e) {
			logger.error("Excepiton", e);
		} finally {
			logger.debug("OUT");
		}
	}

	/**
	 * Creates a json array with children document informations
	 *
	 * @param rows
	 * @return
	 * @throws JSONException
	 */
	private JSONObject createJSONResponseDocuments(JSONArray rows) throws JSONException {
		JSONObject results;

		results = new JSONObject();
		results.put("title", "Documents");
		results.put("icon", "document.png");
		results.put("samples", rows);
		return results;
	}

	/**
	 * Creates a json array with children document informations
	 *
	 * @param documents
	 * @return
	 * @throws JSONException
	 */
	private JSONObject createJSONResponse(JSONObject documents) throws JSONException {
		JSONObject results = new JSONObject();
		JSONArray folderContent = new JSONArray();

		folderContent.put(documents);
		results.put("folderContent", folderContent);

		return results;
	}

}
