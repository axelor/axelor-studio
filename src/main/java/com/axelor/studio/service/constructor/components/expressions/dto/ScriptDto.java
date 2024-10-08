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
public class ScriptDto {
  private List<ElementDto> fields;
  private String targetModel;
  private String sourceModel;
  private List<ElementDto> sourceModelList;
  private Boolean newRecord;
  private Boolean savedRecord;
  private Boolean save;
  private Boolean isJson;
  private Boolean createVariable;
  private ModelSourceDto modelFrom;
  private String processId;
}
