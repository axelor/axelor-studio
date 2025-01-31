package com.axelor.studio.service.constructor.components.expressions.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TransformationDto {
  private Long id;
  private String name;
  private String groovyTemplate;
  private String multiArgType;
  private String multiArg;
  private String library;
  private List<ParameterDTO> parameters;
}
