/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.web;

import com.axelor.db.Model;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.schema.actions.ActionView;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.rpc.Context;
import com.axelor.studio.db.ValueMapper;
import com.axelor.studio.db.repo.ValueMapperRepository;
import com.axelor.studio.service.mapper.ValueMapperService;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.helpers.context.FullContextHelper;
import java.util.Map;

public class ValueMapperController {

  @SuppressWarnings("unchecked")
  public void execute(ActionRequest request, ActionResponse response) {
    try {
      Context context = request.getContext();

      Map<String, Object> valueMapperMap = (Map<String, Object>) context.get("valueMapper");
      if (valueMapperMap == null) {
        return;
      }

      ValueMapper mapper =
          Beans.get(ValueMapperRepository.class)
              .find(Long.parseLong(valueMapperMap.get("id").toString()));

      if (mapper == null || mapper.getScript() == null) {
        return;
      }

      String modelName = (String) context.get("modelName");
      Model model = null;
      if (context.get("recordId") != null && modelName != null) {
        Long recordId = Long.parseLong(context.get("recordId").toString());
        model = FullContextHelper.getRepository(modelName).find(recordId);
      }

      Object result = Beans.get(ValueMapperService.class).execute(mapper, model);

      if (result instanceof FullContext fullContext
          && mapper.getScript().startsWith("def rec = __ctx__.create(")) {
        Object object = fullContext.getTarget();
        String title = object.getClass().getSimpleName();
        if (object instanceof MetaJsonRecord metaJsonRecord) {
          title = metaJsonRecord.getJsonModel();
        }
        response.setView(
            ActionView.define(I18n.get(title))
                .model(object.getClass().getName())
                .add("form")
                .add("grid")
                .context("_showRecord", fullContext.get("id"))
                .map());
      }
      response.setCanClose(true);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
