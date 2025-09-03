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

import com.axelor.inject.Beans;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.script.AxelorScriptEngineFactory;
import java.util.Arrays;
import org.camunda.bpm.application.impl.event.ProcessApplicationEventListenerPlugin;
import org.camunda.bpm.engine.impl.cfg.StandaloneProcessEngineConfiguration;
import org.camunda.spin.plugin.impl.SpinProcessEnginePlugin;

public class WkfProcessEngineConfigurationImpl extends StandaloneProcessEngineConfiguration {

  @Override
  protected void invokePreInit() {
    processEnginePlugins.add(new SpinProcessEnginePlugin());
    processEnginePlugins.add(new ProcessApplicationEventListenerPlugin());
    super.invokePreInit();
  }

  @Override
  public void init() {
    super.init();
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
