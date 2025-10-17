/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.web;

import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.repo.MetaJsonFieldRepo;
import com.axelor.studio.service.StudioMetaService;
import com.axelor.utils.helpers.ExceptionHelper;

public class MetaJsonFieldController {

  public void trackJsonField(ActionRequest request, ActionResponse response) {
    try {
      MetaJsonField metaJsonField = request.getContext().asType(MetaJsonField.class);

      MetaJsonField jsonField =
          Beans.get(MetaJsonFieldRepo.class)
              .all()
              .filter(
                  "self.name = ?1 AND self.model = ?2",
                  metaJsonField.getName(),
                  metaJsonField.getModel())
              .fetchOne();

      if (jsonField != null) {
        return;
      }

      Beans.get(StudioMetaService.class).trackJsonField(metaJsonField);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
