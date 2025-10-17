/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service;

import com.axelor.meta.CallMethod;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.studio.service.constructor.components.StudioSelectionService;
import com.google.common.base.Strings;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import org.apache.commons.lang3.StringUtils;

public class JsonFieldServiceImpl implements JsonFieldService {

  protected StudioSelectionService studioSelectionService;

  @Inject
  public JsonFieldServiceImpl(StudioSelectionService studioSelectionService) {
    this.studioSelectionService = studioSelectionService;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void updateSelection(MetaJsonField metaJsonField) {

    String selectionText = metaJsonField.getSelectionText();

    String name = getSelectionName(metaJsonField);

    if (Strings.isNullOrEmpty(selectionText)) {
      studioSelectionService.removeStudioSelection(name);

      if (metaJsonField.getSelection() != null && metaJsonField.getSelection().equals(name)) {
        metaJsonField.setSelection(null);
      }
      return;
    }

    metaJsonField.setSelection(
        studioSelectionService
            .createStudioSelection(selectionText, name, metaJsonField.getStudioApp())
            .getName());
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void removeSelection(MetaJsonField metaJsonField) {

    String name = getSelectionName(metaJsonField);

    if (metaJsonField.getSelection() != null && metaJsonField.getSelection().equals(name)) {
      studioSelectionService.removeStudioSelection(name);
    }
  }

  @Override
  @CallMethod
  public String checkName(String name, boolean isFieldName) {
    if (name == null) {
      return "";
    }
    return StringUtils.stripAccents(name).replaceAll("[^a-zA-Z0-9 ]", "");
  }

  @Override
  public String getSelectionName(MetaJsonField metaJsonField) {

    String model =
        metaJsonField.getJsonModel() != null
            ? metaJsonField.getJsonModel().getName()
            : metaJsonField.getModel();
    model = model.contains(".") ? model.substring(model.lastIndexOf(".") + 1) : model;

    return SELECTION_PREFIX + model + "-" + metaJsonField.getName();
  }
}
