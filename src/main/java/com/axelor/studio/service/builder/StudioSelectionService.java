/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.service.builder;

import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioSelection;
import java.util.List;
import java.util.Map;

public interface StudioSelectionService {

  public static final String SELECTION_PREFIX = "custom-studio-selection-";

  public List<Map<String, String>> createSelectionText(String selectionName);

  public void removeStudioSelection(String name);

  public void removeSelection(String name, String xmlId);

  public void build(StudioSelection studioSelection);

  public String updateMetaSelectFromText(
      String selectionText, String name, StudioApp studioApp, String xmlId);

  public String generateSelectionText(List<Map<String, String>> selectOptions);

  public List<Map<String, String>> getSelectOptions(String selectionText);

  public StudioSelection createStudioSelection(
      String selectionText, String name, StudioApp studioApp);
}
