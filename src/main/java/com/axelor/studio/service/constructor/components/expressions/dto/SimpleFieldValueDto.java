package com.axelor.studio.service.constructor.components.expressions.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class SimpleFieldValueDto implements FieldValueDto {
  private String fieldValue;

  @Override
  public String toString() {
    return getFieldValue();
  }
}
