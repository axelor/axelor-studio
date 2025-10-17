/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.mapper;

import com.axelor.utils.helpers.ExceptionHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;

public class MapperScriptGeneratorServiceImpl implements MapperScriptGeneratorService {

  @Override
  public String generate(String mapperJson) {

    MapperRecord mapperRecord = getMapperRecord(mapperJson);
    try {
      if (mapperRecord != null) {
        return mapperRecord.toScript();
      }
    } catch (Exception e) {
      ExceptionHelper.error(e);
    }

    return null;
  }

  @Override
  public MapperRecord getMapperRecord(String mapperJson) {

    ObjectMapper mapper = new ObjectMapper();
    SimpleModule module = new SimpleModule();
    registerDeserializer(module);
    mapper.registerModule(module);

    try {
      MapperRecord mapperRecord = mapper.readValue(mapperJson.getBytes(), MapperRecord.class);
      return mapperRecord;

    } catch (Exception e) {
      ExceptionHelper.error(e);
    }

    return null;
  }

  @Override
  public void registerDeserializer(SimpleModule module) {}
}
