/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor.components.expressions;

import java.util.Map;

public interface GroovyScriptBuilderService {
  String build(Map<String, Object> scriptValue);

  String buildExpression(Map<String, Object> expression);
}
