package com.axelor.studio.service.constructor.components.expressions.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RuleDto {
  private String name;
  private String combinator;
  private List<RuleDto> rules;
  private FieldDto field;
  private String fieldName;
  private String fieldType;
  private FieldValueDto fieldValue;
  private FieldValueDto fieldValue2;
  private String operator;
  private List<ElementDto> allField;

  @JsonProperty(value = "field")
  public void unpackField(Map<String, Object> fieldMap) {
    if (fieldMap != null) {
      field = new ObjectMapper().convertValue(fieldMap, FieldDto.class);
      if (this.fieldValue != null && fieldValue instanceof RelationalFieldValueDto) {
        ((RelationalFieldValueDto) fieldValue).setTargetName(field.getTargetName());
        Object valueMap = ((RelationalFieldValueDto) fieldValue).getValueMap();
        if (valueMap != null) {
          if (valueMap instanceof Map) {
            fieldType =
                ((Map) valueMap)
                    .get(field.getTargetName())
                    .getClass()
                    .getSimpleName()
                    .toUpperCase();
          }
          if (valueMap instanceof List) {
            fieldType =
                ((List<Map>) valueMap)
                    .stream()
                        .map(
                            it ->
                                it.get(field.getTargetName())
                                    .getClass()
                                    .getSimpleName()
                                    .toUpperCase())
                        .findAny()
                        .orElse(null);
          }
        }
      }
      if (this.fieldValue2 != null && fieldValue2 instanceof RelationalFieldValueDto) {
        ((RelationalFieldValueDto) fieldValue2).setTargetName(field.getTargetName());
      }
    }
  }

  @JsonProperty(value = "fieldValue")
  public void unpackFieldValue(Object fieldValueObj) {
    if (fieldValueObj != null) {
      if (fieldValueObj instanceof Map || fieldValueObj instanceof List) {
        fieldValue =
            new RelationalFieldValueDto(
                fieldValueObj, this.field != null ? this.field.getTargetName() : null);
      } else {
        fieldValue = new SimpleFieldValueDto(fieldValueObj.toString());
      }
    }
  }

  @JsonProperty(value = "fieldValue2")
  public void unpackFieldValu2e(Object fieldValueObj) {
    if (fieldValueObj != null) {
      if (fieldValueObj instanceof Map || fieldValueObj instanceof List) {
        fieldValue2 =
            new RelationalFieldValueDto(
                fieldValueObj, this.field != null ? this.field.getTargetName() : null);
      } else {
        fieldValue2 = new SimpleFieldValueDto(fieldValueObj.toString());
      }
    }
  }
}
