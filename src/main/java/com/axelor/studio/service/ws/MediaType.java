/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.ws;

import jakarta.ws.rs.core.Response;
import java.io.IOException;

public interface MediaType {

  Object parseResponse(Response wsResponse) throws IOException;
}
