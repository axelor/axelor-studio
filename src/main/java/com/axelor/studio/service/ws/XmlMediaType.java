package com.axelor.studio.service.ws;

import com.axelor.utils.ExceptionTool;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import java.util.HashMap;

public class XmlMediaType implements MediaType {
  @Override
  public Object parseResponse(byte[] responseByte) {
    try {
      return (new XmlMapper())
          .readValue(responseByte, (new TypeReference<HashMap<String, Object>>() {}));
    } catch (Exception e) {
      ExceptionTool.trace(e);
      return responseByte;
    }
  }
}
