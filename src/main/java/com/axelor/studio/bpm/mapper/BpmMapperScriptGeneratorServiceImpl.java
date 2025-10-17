/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.mapper;

import com.axelor.studio.service.mapper.MapperDeserializer;
import com.axelor.studio.service.mapper.MapperField;
import com.axelor.studio.service.mapper.MapperRecord;
import com.axelor.studio.service.mapper.MapperScriptGeneratorServiceImpl;
import com.axelor.studio.service.mapper.MapperValue;
import com.fasterxml.jackson.databind.module.SimpleModule;

public class BpmMapperScriptGeneratorServiceImpl extends MapperScriptGeneratorServiceImpl {

  @SuppressWarnings("unchecked")
  @Override
  public void registerDeserializer(SimpleModule module) {

    module.addDeserializer(MapperRecord.class, new MapperDeserializer(BpmMapperRecord.class));
    module.addDeserializer(MapperField.class, new MapperDeserializer(BpmMapperField.class));
    module.addDeserializer(MapperValue.class, new MapperDeserializer(BpmMapperValue.class));
  }
}
