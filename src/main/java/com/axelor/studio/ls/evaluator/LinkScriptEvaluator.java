package com.axelor.studio.ls.evaluator;

import com.axelor.script.ScriptHelper;
import com.axelor.studio.db.LinkScript;
import com.axelor.studio.db.LinkScriptArc;
import com.axelor.studio.ls.LinkScriptResult;
import java.util.LinkedHashMap;

public interface LinkScriptEvaluator<T extends ScriptHelper> {
  T newHelper(LinkedHashMap<String, Object> context);

  void eval(T scriptHelper, LinkScriptResult result, LinkScript linkScript);

  boolean test(T scriptHelper, String conditionScript);

  LinkedHashMap<String, Object> transform(T scriptHelper, LinkScriptArc linkScriptArc);
}
