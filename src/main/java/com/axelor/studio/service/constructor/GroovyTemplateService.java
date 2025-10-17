/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor;

import java.util.Map;

public interface GroovyTemplateService {
  String createXmlWithGroovyTemplate(String templatePath, Map<String, Object> binding);
}
