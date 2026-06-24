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
import com.axelor.studio.service.constructor.components.expressions.dto.ConditionDto;
import com.axelor.studio.service.constructor.components.expressions.dto.ElementDto;
import com.axelor.studio.service.constructor.components.expressions.dto.ExpressionDto;
import com.axelor.studio.service.constructor.components.expressions.dto.FieldDto;
import com.axelor.studio.service.constructor.components.expressions.dto.FieldValueDto;
import com.axelor.studio.service.constructor.components.expressions.dto.ModelSourceDto;
import com.axelor.studio.service.constructor.components.expressions.dto.ParameterDTO;
import com.axelor.studio.service.constructor.components.expressions.dto.RelationalFieldValueDto;
import com.axelor.studio.service.constructor.components.expressions.dto.RuleDto;
import com.axelor.studio.service.constructor.components.expressions.dto.ScriptDto;
import com.axelor.studio.service.constructor.components.expressions.dto.SimpleFieldValueDto;
import com.axelor.studio.service.constructor.components.expressions.dto.TransformationDto;
import com.axelor.studio.service.constructor.components.expressions.dto.ValueDto;
import com.axelor.studio.service.ws.WsConnectorService;
import groovy.xml.XmlUtil;
import java.util.Arrays;
import java.util.List;
import org.apache.commons.text.StringEscapeUtils;
import org.camunda.bpm.engine.impl.persistence.entity.ExecutionEntity;

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
            StringEscapeUtils.class,
            ConditionDto.class,
            ElementDto.class,
            ExpressionDto.class,
            FieldDto.class,
            FieldValueDto.class,
            ModelSourceDto.class,
            ParameterDTO.class,
            RelationalFieldValueDto.class,
            RuleDto.class,
            ScriptDto.class,
            SimpleFieldValueDto.class,
            TransformationDto.class,
            ValueDto.class,
            XmlUtil.class));
  }
}
