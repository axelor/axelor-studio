/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.mapper;

import com.axelor.auth.AuthUtils;
import com.axelor.db.Model;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.script.GroovyScriptHelper;
import com.axelor.studio.bpm.script.AxelorBindingsHelper;
import com.axelor.studio.bpm.utils.BpmLoggingHelper;
import com.axelor.studio.db.ValueMapper;
import com.axelor.utils.helpers.StringHelper;
import com.axelor.utils.helpers.context.FullContext;
import com.axelor.utils.helpers.context.FullContextHelper;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import javax.script.Bindings;
import javax.script.SimpleBindings;

public class ValueMapperService {

  public Object execute(ValueMapper mapper, Model model) {

    if (model == null || mapper == null) {
      return null;
    }

    String modelName = getModelVariable(model);

    Bindings bindings = new SimpleBindings();
    bindings = AxelorBindingsHelper.getBindings(bindings);
    bindings.put("__ctx__", FullContextHelper.class);
    bindings.put(modelName, new FullContext(model));
    bindings.put(modelName + "Id", model.getId());
    bindings.put("__time__", LocalDateTime.now());
    bindings.put("__datetime__", ZonedDateTime.now());
    bindings.put(
        "__studiouser__",
        AuthUtils.getUser() != null ? AuthUtils.getUser() : AuthUtils.getUser("admin"));
    bindings.put("__this__", new FullContext(model));
    bindings.put("__self__", model);
    bindings.put("__parent__", new FullContext(model).getParent());
    bindings.put("__id__", model.getId());
    bindings.put("__log__", BpmLoggingHelper.get());

    return new GroovyScriptHelper(bindings).eval(mapper.getScript());
  }

  protected String getModelVariable(Model model) {

    String modelName = null;
    if (model instanceof MetaJsonRecord metaJsonRecord) {
      modelName = metaJsonRecord.getJsonModel();
    } else {
      modelName = model.getClass().getSimpleName();
    }

    modelName = StringHelper.toFirstLower(modelName);

    return modelName;
  }
}
