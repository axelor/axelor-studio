/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.web;

import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaSelect;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.StudioSelection;
import com.axelor.studio.db.repo.StudioSelectionRepository;
import com.axelor.studio.service.constructor.components.StudioSelectionService;
import com.axelor.utils.helpers.ExceptionHelper;
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
      ExceptionHelper.error(response, e);
    }
  }

  @SuppressWarnings("unchecked")
  public void generateSelectionText(ActionRequest request, ActionResponse response) {
    try {
      List<Map<String, String>> selectOptions =
          (List<Map<String, String>>) request.getContext().get("selectOptionList");

      String selectionText =
          Beans.get(StudioSelectionService.class).generateSelectionText(selectOptions);

      response.setValue(SELECTION_TEXT, selectionText);

    } catch (Exception e) {
      ExceptionHelper.error(response, e);
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
      ExceptionHelper.error(response, e);
    }
  }
}
