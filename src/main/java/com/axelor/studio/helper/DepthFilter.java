/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.helper;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonStreamContext;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.PropertyWriter;
import com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter;
import com.google.common.collect.Lists;
import java.util.List;

public class DepthFilter extends SimpleBeanPropertyFilter {
  private final int maxDepth;
  private final List<String> ignoredFields =
      Lists.newArrayList("updatedBy", "createdBy", "hibernateLazyInitializer");

  public DepthFilter(int maxDepth) {
    super();
    this.maxDepth = maxDepth;
  }

  private int calcDepth(PropertyWriter writer, JsonGenerator jgen) {
    JsonStreamContext sc = jgen.getOutputContext();
    int depth = -1;
    while (sc != null) {
      sc = sc.getParent();
      depth++;
    }
    return depth;
  }

  @Override
  public void serializeAsField(
      Object pojo, JsonGenerator gen, SerializerProvider provider, PropertyWriter writer)
      throws Exception {

    if (!ignoredFields.contains(writer.getName())) {
      int depth = calcDepth(writer, gen);
      if (depth <= maxDepth) {
        writer.serializeAsField(pojo, gen, provider);
      }
    }
  }
}
