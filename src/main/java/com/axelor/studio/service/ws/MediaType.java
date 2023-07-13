package com.axelor.studio.service.ws;

import java.io.IOException;
import javax.ws.rs.core.Response;

public interface MediaType {

  Object parseResponse(Response wsResponse) throws IOException;
}
