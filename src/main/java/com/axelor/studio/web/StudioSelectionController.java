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
package com.axelor.studio.web;

import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaSelect;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.StudioSelection;
import com.axelor.studio.db.repo.StudioSelectionRepository;
import com.axelor.studio.service.builder.StudioSelectionService;
import com.axelor.utils.ExceptionTool;
import java.util.List;
import java.util.Map;

public class StudioSelectionController {

  protected static final String SELECTION_TEXT = "selectionText";
  protected static final String SELECTION_OPTION_LIST = "$selectOptionList";

  public void fillSelectionText(ActionRequest request, ActionResponse response) {
    try {
      MetaSelect metaSelect = (MetaSelect) request.getContext().get("metaSelect");

      if (metaSelect != null) {
        String name = metaSelect.getName();
        List<Map<String, String>> selectOptions =
            Beans.get(StudioSelectionService.class).createSelectionText(name);

        String selectionText =
            Beans.get(StudioSelectionService.class).generateSelectionText(selectOptions);

        response.setValue(SELECTION_TEXT, selectionText);
        response.setValue(SELECTION_OPTION_LIST, selectOptions);
        response.setValue("name", name);
      } else {
        response.setValue(SELECTION_OPTION_LIST, null);
        response.setValue(SELECTION_TEXT, null);
        response.setValue("name", null);
      }
    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  @SuppressWarnings("unchecked")
  public void generateSelectionText(ActionRequest request, ActionResponse response) {
    try {
      List<Map<String, String>> selectOptions =
          (List<Map<String, String>>) request.getContext().get(SELECTION_OPTION_LIST);

      String selectionText =
          Beans.get(StudioSelectionService.class).generateSelectionText(selectOptions);

      response.setValue(SELECTION_TEXT, selectionText);

    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }

  public void fillSelectOption(ActionRequest request, ActionResponse response) {
    try {
      StudioSelection studioSelection = request.getContext().asType(StudioSelection.class);
      if (studioSelection.getId() != null) {
        studioSelection = Beans.get(StudioSelectionRepository.class).find(studioSelection.getId());
      }

      List<Map<String, String>> selectOptions =
          Beans.get(StudioSelectionService.class)
              .getSelectOptions(studioSelection.getSelectionText());

      response.setValue(SELECTION_OPTION_LIST, selectOptions);

    } catch (Exception e) {
      ExceptionTool.trace(response, e);
    }
  }
}
