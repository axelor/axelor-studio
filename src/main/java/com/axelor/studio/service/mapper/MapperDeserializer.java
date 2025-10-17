/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.mapper;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.ObjectCodec;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import java.io.IOException;

@SuppressWarnings("rawtypes")
public class MapperDeserializer extends StdDeserializer {

  protected static final long serialVersionUID = 1L;
  protected Class<?> subClass;

  @SuppressWarnings("unchecked")
  public MapperDeserializer(Class<?> subClass) {

    super(subClass);

    this.subClass = subClass;
  }

  @SuppressWarnings("unchecked")
  @Override
  public Object deserialize(JsonParser parser, DeserializationContext context) throws IOException {

    ObjectCodec codec = parser.getCodec();

    return codec.readValue(parser, subClass);
  }
}
