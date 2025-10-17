/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.baml.service;

import com.axelor.db.Model;
import com.axelor.studio.db.BamlModel;
import java.util.Map;

public interface BamlService {

  String generateGroovyCode(String xml);

  Model execute(BamlModel bamlModel, Model entity);

  String extractBamlXml(String xml);

  Model execute(BamlModel bamlModel, Map<String, Object> context);
}
