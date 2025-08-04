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
package com.axelor.studio.bpm.service.init;

import com.axelor.db.JPA;
import com.axelor.inject.Beans;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.script.AxelorScriptEngineFactory;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.camunda.bpm.application.impl.event.ProcessApplicationEventListenerPlugin;
import org.camunda.bpm.engine.impl.cfg.StandaloneProcessEngineConfiguration;
import org.camunda.bpm.engine.impl.variable.serializer.EntityManagerSession;
import org.camunda.bpm.engine.impl.variable.serializer.JPAVariableSerializer;
import org.camunda.bpm.engine.impl.variable.serializer.JavaObjectSerializer;
import org.camunda.bpm.engine.impl.variable.serializer.TypedValueSerializer;
import org.camunda.bpm.engine.variable.type.ValueType;
import org.camunda.spin.plugin.impl.SpinProcessEnginePlugin;

public class WkfProcessEngineConfigurationImpl extends StandaloneProcessEngineConfiguration {

  @Override
  protected void invokePreInit() {
    processEnginePlugins.add(new SpinProcessEnginePlugin());
    processEnginePlugins.add(new ProcessApplicationEventListenerPlugin());
    super.invokePreInit();
  }

  // TODO finish configuration after camunda upgrade or delete if not used
  // see
  // https://github.com/camunda/camunda-bpm-platform/commit/876ae80cd30bd3a104ba901ce7a2206cfa23f6c4#diff-d281ef56daa4a10d7da2bb5410b537957ee38de097bcc0de14367c764d070c2bL122
  protected void initJpa() {
    sessionFactories.put(
        EntityManagerSession.class,
        new WkfEntityManagerSessionFactory(JPA.em().getEntityManagerFactory(), false, false));
    JPAVariableSerializer jpaType =
        (JPAVariableSerializer) variableSerializers.getSerializerByName(JPAVariableSerializer.NAME);
    // Add JPA-type
    if (jpaType == null) {
      // We try adding the variable right after byte serializer, if available
      int serializableIndex =
          variableSerializers.getSerializerIndexByName(ValueType.BYTES.getName());
      if (serializableIndex > -1) {
        variableSerializers.addSerializer(new JPAVariableSerializer(), serializableIndex);
      } else {
        variableSerializers.addSerializer(new JPAVariableSerializer());
      }
    }
    variableSerializers.addSerializer(new JavaObjectSerializer());
    @SuppressWarnings("rawtypes")
    List<TypedValueSerializer> customPreVariableTypes = new ArrayList<>();
    customPreVariableTypes.add(new JPAVariableSerializer());
    customPreVariableTypes.add(new JavaObjectSerializer());
    setCustomPreVariableSerializers(customPreVariableTypes);
  }

  @Override
  protected void initScripting() {
    super.initScripting();
    AxelorScriptEngineFactory factory = new AxelorScriptEngineFactory();
    scriptingEngines.getScriptEngineManager().registerEngineName("axelor", factory);
    scriptingEngines.addScriptEngineFactory(factory);
  }

  @Override
  protected void initBeans() {
    super.initBeans();
    beans.put("__ctx__", Beans.get(WkfContextHelper.class));
  }

  @Override
  protected void initExpressionManager() {
    super.initExpressionManager();
    Arrays.stream(WkfContextHelper.class.getDeclaredMethods())
        .forEach(m -> expressionManager.addFunction(m.getName(), m));
  }
}
