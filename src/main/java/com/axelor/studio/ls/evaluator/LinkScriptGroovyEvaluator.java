package com.axelor.studio.ls.evaluator;

import com.axelor.script.ScriptBindings;
import com.axelor.studio.db.LinkScript;
import com.axelor.studio.helper.TransactionHelper;
import com.axelor.studio.ls.LinkScriptBindingsService;
import com.axelor.studio.ls.LinkScriptResult;
import com.axelor.studio.ls.script.LinkScriptGroovyScriptHelper;
import com.google.inject.Inject;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import javax.script.Bindings;
import org.apache.commons.lang3.StringUtils;

public class LinkScriptGroovyEvaluator
    implements LinkScriptEvaluator<LinkScriptGroovyScriptHelper> {

  protected final LinkScriptBindingsService linkScriptBindingsService;

  @Inject
  public LinkScriptGroovyEvaluator(LinkScriptBindingsService linkScriptBindingsService) {
    this.linkScriptBindingsService = linkScriptBindingsService;
  }

  @Override
  public LinkScriptGroovyScriptHelper newHelper(LinkedHashMap<String, Object> context) {
    return new LinkScriptGroovyScriptHelper(
        bindings(context), linkScriptBindingsService.getImportCustomizer());
  }

  @Override
  public String preProcess(String script, LinkedHashMap<String, Object> context) {
    var gsh = newHelper(context);

    var analysis = gsh.analyze(script);
    var variables = new HashSet<>();
    variables.addAll(context.keySet());
    variables.addAll(analysis.getExpressionVariables());

    String contextMap =
        variables.stream()
            .map(variable -> variable + ": " + variable)
            .collect(Collectors.joining(", ", "[", "]"));

    if (!analysis.getFinalReturnPresent()) {
      script = script + "\nreturn " + contextMap;
    }

    return script;
  }

  @Override
  public void eval(
      LinkScriptGroovyScriptHelper scriptHelper,
      LinkScriptResult result,
      LinkScript linkScript,
      String varName,
      LinkedHashMap<String, Object> context) {
    var evalResult =
        TransactionHelper.runInTransaction(
            linkScript.getTransactional(),
            () -> scriptHelper.eval(preProcess(linkScript.getBody(), context)));
    if (varName == null && evalResult instanceof Map) {
      ((Map<?, ?>) evalResult)
          .entrySet().stream()
              .filter(e -> e.getKey() instanceof String)
              .forEach(e -> context.put((String) e.getKey(), e.getValue()));
    } else if (evalResult != null) {
      context.put(varName != null ? varName : "result", evalResult);
    }
    result.step(linkScript.getName(), context);
  }

  protected Bindings bindings(LinkedHashMap<String, Object> context) {
    var bindings = new ScriptBindings(context);
    linkScriptBindingsService.consumeBindings(bindings::put);
    return bindings;
  }

  @Override
  public boolean test(LinkScriptGroovyScriptHelper scriptHelper, String conditionScript) {
    return StringUtils.isBlank(conditionScript) || scriptHelper.test(conditionScript);
  }
}
