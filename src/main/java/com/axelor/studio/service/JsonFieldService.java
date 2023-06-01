package com.axelor.studio.service;

import com.axelor.meta.db.MetaJsonField;

public interface JsonFieldService {

  public static final String SELECTION_PREFIX = "custom-json-select-";

  public void updateSelection(MetaJsonField metaJsonField);

  public void removeSelection(MetaJsonField metaJsonField);

  public String checkName(String name, boolean isFieldName);

  public String getSelectionName(MetaJsonField metaJsonField);
}
