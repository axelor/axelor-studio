package com.axelor.studio.service.constructor.components.expressions.dto;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class RelationalFieldValueDto implements FieldValueDto {
  private Object valueMap;
  private String targetName;

  @Override
  public String getFieldValue() {
    if (valueMap != null && valueMap instanceof Map && ((Map) valueMap).containsKey(targetName)) {
      return ((Map) valueMap).get(targetName).toString();
    }
    if (valueMap != null && valueMap instanceof List) {
      List<String> values =
          ((List<Map<String, Object>>) valueMap)
              .stream().map(it -> it.get(targetName).toString()).toList();
      String valuesStr = "[";
      for (String value : values) {
        valuesStr += String.format("'%s'", value);
        if (!value.equals(values.getLast())) {
          valuesStr += ",";
        }
      }
      valuesStr += "]";
      return valuesStr;
    }
    return null;
  }

  @Override
  public String toString() {
    return getFieldValue();
  }
}
