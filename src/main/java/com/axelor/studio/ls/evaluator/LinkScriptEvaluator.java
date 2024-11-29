package com.axelor.studio.ls.evaluator;

import com.axelor.script.ScriptHelper;
import com.axelor.studio.db.LinkScript;
import com.axelor.studio.ls.LinkScriptResult;
import java.util.LinkedHashMap;

public interface LinkScriptEvaluator<T extends ScriptHelper> {
  T newHelper(LinkedHashMap<String, Object> context);

  String preProcess(String script, LinkedHashMap<String, Object> context);

  Object eval(
      T scriptHelper,
      LinkScriptResult result,
      LinkScript linkScript,
      LinkedHashMap<String, Object> context);

  boolean test(T scriptHelper, String conditionScript);
}
