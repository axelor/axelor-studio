/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.script;

import com.axelor.auth.AuthUtils;
import com.axelor.inject.Beans;
import com.axelor.script.GroovyScriptHelper;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.context.WkfProcessHelper;
import com.axelor.studio.bpm.transformation.WkfTransformationHelper;
import com.axelor.studio.bpm.utils.BpmLoggingHelper;
import com.axelor.studio.db.CustomVariable;
import com.axelor.studio.db.repo.CustomVariableRepository;
import com.axelor.studio.helper.MigrationHelper;
import com.axelor.utils.helpers.context.FullContext;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import javax.script.Bindings;

public class AxelorBindingsHelper {

  public static Bindings getBindings(Bindings bindings) {
    bindings.put("__ctx__", WkfContextHelper.class);
    bindings.put(
        "__studiouser__",
        new FullContext(
            AuthUtils.getUser() != null ? AuthUtils.getUser() : AuthUtils.getUser("admin")));
    bindings.put("__date__", LocalDate.now());
    bindings.put("__time__", LocalTime.now());
    bindings.put("__datetime__", LocalDateTime.now());
    bindings.put("__transform__", WkfTransformationHelper.class);
    bindings.put("__log__", BpmLoggingHelper.get());
    bindings.put("__migration__", MigrationHelper.class);
    bindings.put("__process__", WkfProcessHelper.class);
    List<CustomVariable> customVariables =
        Beans.get(CustomVariableRepository.class)
            .all()
            .filter("status = ?1", CustomVariableRepository.STATUS_VALID)
            .fetch();
    for (CustomVariable customVariable : customVariables) {
      String variableName = customVariable.getName();
      GroovyScriptHelper helper = new GroovyScriptHelper(bindings);
      bindings.put(variableName, helper.eval(customVariable.getExpression()));
    }

    return bindings;
  }
}
