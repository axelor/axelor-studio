package com.axelor.studio.service.ws;

import java.io.IOException;

public interface MediaType {

  Object parseResponse(byte[] responseByte) throws IOException;
}
