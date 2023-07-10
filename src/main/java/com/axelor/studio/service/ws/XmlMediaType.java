package com.axelor.studio.service.ws;

import com.axelor.utils.ExceptionTool;
import javax.ws.rs.core.Response;
import org.json.JSONObject;
import org.json.XML;

public class XmlMediaType implements MediaType {
  @Override
  public Object parseResponse(Response wsResponse) {
    String responseString = wsResponse.readEntity(String.class);
    try {
      JSONObject jsonObject = XML.toJSONObject(responseString);
      return jsonObject;
    } catch (Exception e) {
      ExceptionTool.trace(e);
      return responseString;
    }
  }
}
