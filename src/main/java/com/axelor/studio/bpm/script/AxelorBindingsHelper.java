/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2005-2023 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
package com.axelor.studio.bpm.script;

import com.axelor.app.AppSettings;
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
    bindings.put("__beans__", Beans.class);
    bindings.put(
        "__studiouser__",
        new FullContext(
            AuthUtils.getUser() != null ? AuthUtils.getUser() : AuthUtils.getUser("admin")));
    bindings.put("__date__", LocalDate.now());
    bindings.put("__time__", LocalTime.now());
    bindings.put("__datetime__", LocalDateTime.now());
    bindings.put("__transform__", WkfTransformationHelper.class);
    bindings.put("__config__", AppSettings.get());
    bindings.put("__log__", BpmLoggingHelper.get());
    bindings.put("__migration__", MigrationHelper.class);
    bindings.put("__process__", WkfProcessHelper.class);
    List<CustomVariable> customVariables =
        Beans.get(CustomVariableRepository.class).all().filter("status = '1'").fetch();
    for (CustomVariable customVariable : customVariables) {
      String variableName = customVariable.getName();
      GroovyScriptHelper helper = new GroovyScriptHelper(bindings);
      bindings.put(variableName, helper.eval(customVariable.getExpression()));
    }

    return bindings;
  }
}
