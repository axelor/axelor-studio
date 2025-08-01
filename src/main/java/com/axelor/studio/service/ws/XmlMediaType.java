package com.axelor.studio.service.ws;

import com.axelor.utils.helpers.ExceptionHelper;
import jakarta.ws.rs.core.Response;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;
import org.json.JSONObject;
import org.json.XML;

public class XmlMediaType implements MediaType {
  @Override
  public Object parseResponse(Response wsResponse) {
    try {
      if (wsResponse.getHeaderString("Content-Encoding") != null
          && wsResponse.getHeaderString("Content-Encoding").equalsIgnoreCase("gzip")) {
        InputStream inputStream = wsResponse.readEntity(InputStream.class);
        GZIPInputStream gzipInputStream = new GZIPInputStream(inputStream);
        StringBuilder uncompressedResponse = new StringBuilder();
        byte[] buffer = new byte[1024];
        int length;
        while ((length = gzipInputStream.read(buffer)) != -1) {
          uncompressedResponse.append(new String(buffer, 0, length, StandardCharsets.UTF_8));
        }
        String uncompressedResponseString = uncompressedResponse.toString();
        JSONObject jsonObject = XML.toJSONObject(uncompressedResponseString);
        return jsonObject;
      } else {
        String responseString = wsResponse.readEntity(String.class);
        JSONObject jsonObject = XML.toJSONObject(responseString);
        return jsonObject;
      }
    } catch (Exception e) {
      ExceptionHelper.error(e);
      return wsResponse.readEntity(String.class);
    }
  }
}
