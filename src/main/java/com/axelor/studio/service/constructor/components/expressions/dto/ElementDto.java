package com.axelor.studio.service.constructor.components.expressions.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ElementDto {
  private Long id;
  private Long trackKey;
  private Long version;
  private String name;
  private String fullName;
  private String title;
  private String type;
  private String condition;
  private String targetName;
  private ConditionDto conditionMeta;
  private ValueDto value;
  private String processId;
}
