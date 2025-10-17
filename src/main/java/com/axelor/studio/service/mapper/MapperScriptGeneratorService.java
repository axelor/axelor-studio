/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.mapper;

import com.axelor.meta.CallMethod;
import com.fasterxml.jackson.databind.module.SimpleModule;

public interface MapperScriptGeneratorService {

  @CallMethod
  String generate(String mapperJson);

  MapperRecord getMapperRecord(String mapperJson);

  void registerDeserializer(SimpleModule mapper);
}
