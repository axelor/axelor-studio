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
package com.axelor.studio.bpm.script;

import com.axelor.inject.Beans;
import com.axelor.script.GroovyScriptHelper;
import com.axelor.studio.bpm.context.WkfContextHelper;
import com.axelor.studio.bpm.exception.AxelorScriptEngineException;
import com.axelor.studio.bpm.service.message.BpmErrorMessageService;
import com.axelor.studio.bpm.transformation.WkfTransformationHelper;
import com.axelor.utils.context.FullContext;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import com.axelor.utils.ExceptionTool;
import javax.script.Bindings;
import javax.script.CompiledScript;
import javax.script.ScriptContext;
import javax.script.ScriptEngineFactory;
import javax.script.ScriptException;
import org.camunda.bpm.engine.impl.pvm.runtime.PvmExecutionImpl;
import org.codehaus.groovy.jsr223.GroovyScriptEngineImpl;

public class AxelorScriptEngine extends GroovyScriptEngineImpl {

  protected volatile AxelorScriptEngineFactory factory;

  AxelorScriptEngine(AxelorScriptEngineFactory factory) {
    super();
    this.factory = factory;
  }

  @Override
  public Object eval(String script, ScriptContext ctx) {
    Bindings bindings = ctx.getBindings(ctx.getScopes().get(0));
    bindings = AxelorBindingsHelper.getBindings(bindings);
    Object object = null;
    try {
      object = new GroovyScriptHelper(bindings).eval(script);
    } catch (Exception e) {
      PvmExecutionImpl execution = (PvmExecutionImpl) bindings.get("execution");
      ExecutorService executor = Executors.newCachedThreadPool();
      executor.submit(
          new Callable<Boolean>() {
            @Override
            public Boolean call() throws Exception {
              Beans.get(BpmErrorMessageService.class)
                  .sendBpmErrorMessage(execution, e.getMessage(), null, null);
              return true;
            }
          });
      throw new AxelorScriptEngineException(e);
    }
    return object;
  }

  @Override
  public CompiledScript compile(String scriptSource) throws ScriptException {
    return null;
  }

  public ScriptEngineFactory getFactory() {
    if (factory == null) {
      synchronized (this) {
        if (factory == null) {
          factory = new AxelorScriptEngineFactory();
        }
      }
    }
    return factory;
  }
}
