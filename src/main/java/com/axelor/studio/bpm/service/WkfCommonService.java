/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service;

import com.axelor.db.Model;
import com.axelor.studio.db.WkfInstance;
import com.axelor.studio.db.WkfProcessConfig;
import java.util.Map;
import org.camunda.bpm.model.xml.instance.ModelElementInstance;

public interface WkfCommonService {

  WkfProcessConfig findCurrentProcessConfig(Model model);

  WkfProcessConfig findOldProcessConfig(Model model);

  Object evalExpression(Map<String, Object> varMap, String expr);

  Map<String, Object> createVariables(Map<String, Object> modelMap);

  String getVarName(Object model);

  Object findRelatedRecord(Model model, String path);

  Model addProperties(Map<String, String> propertyMap, Model model, ModelElementInstance element);

  Map<String, Object> getContext(WkfInstance instance, Model model) throws ClassNotFoundException;
}
