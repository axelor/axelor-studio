/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.scripting;

import ch.qos.logback.classic.Logger;
import com.axelor.script.ScriptPolicyConfigurator;
import com.axelor.studio.app.service.ScriptAppService;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.context.WkfProcessHelper;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.bpm.transformation.WkfTransformationHelper;
import com.axelor.studio.bpm.utils.BpmLoggingHelper;
import com.axelor.studio.helper.MigrationHelper;
import com.axelor.studio.ls.LinkScriptService;
import com.axelor.studio.service.ExportService;
import com.axelor.studio.service.ScriptAppSettingsStudioService;
import com.axelor.studio.service.constructor.components.expressions.GroovyScriptBuilderService;
import com.axelor.studio.service.ws.WsConnectorService;
import org.apache.commons.text.StringEscapeUtils;
import org.camunda.bpm.engine.impl.persistence.entity.ExecutionEntity;

import java.util.Arrays;
import java.util.List;

public class StudioScriptPolicyConfigurator implements ScriptPolicyConfigurator {
  @Override
  public void configure(
      List<String> allowPackages,
      List<Class<?>> allowClasses,
      List<String> denyPackages,
      List<Class<?>> denyClasses) {

    if (allowClasses == null) {
      return;
    }

    allowClasses.addAll(
        Arrays.asList(
            WkfContextHelper.class,
            WkfProcessHelper.class,
            MigrationHelper.class,
            WkfTransformationHelper.class,
            WkfInstanceService.class,
            ExportService.class,
            ScriptAppService.class,
            LinkScriptService.class,
            ScriptAppSettingsStudioService.class,
            WsConnectorService.class,
            BpmLoggingHelper.class,
            Logger.class,
            ExecutionEntity.class,
            GroovyScriptBuilderService.class,
            StringEscapeUtils.class));
  }
}
