/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor.components;

import com.axelor.meta.db.MetaSelect;
import com.axelor.meta.db.MetaSelectItem;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioSelection;
import com.google.inject.persist.Transactional;
import java.util.List;
import java.util.Map;

public interface StudioSelectionService {

  String SELECTION_PREFIX = "custom-studio-selection-";

  List<Map<String, String>> createSelectionText(String selectionName);

  @Transactional(rollbackOn = Exception.class)
  void removeStudioSelection(String name);

  @Transactional(rollbackOn = Exception.class)
  void removeSelection(String name, String xmlId);

  void build(StudioSelection studioSelection);

  @Transactional(rollbackOn = Exception.class)
  String updateMetaSelectFromText(
      String selectionText, String name, StudioApp studioApp, String xmlId);

  MetaSelect updateSelectItems(String selectionText, String name, String xmlId);

  MetaSelectItem updateItem(
      Map<String, MetaSelectItem> itemMap, int order, Map<String, String> optionMap);

  MetaSelect findMetaSelectByName(String name);

  MetaSelect findMetaSelectById(String xmlId);

  Integer getPriority(String name, String xmlId);

  String generateSelectionText(List<Map<String, String>> selectOptions);

  List<Map<String, String>> getSelectOptions(String selectionText);

  @Transactional(rollbackOn = Exception.class)
  StudioSelection createStudioSelection(String selectionText, String name, StudioApp studioApp);
}
