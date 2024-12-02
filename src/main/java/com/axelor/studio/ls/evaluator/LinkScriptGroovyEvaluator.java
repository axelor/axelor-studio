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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import javax.script.Bindings;
import org.apache.commons.collections.CollectionUtils;
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
    String patternString = "@\"(.*?)\"";
    Pattern pattern = Pattern.compile(patternString);
    Matcher matcher = pattern.matcher(script);

    StringBuilder result = new StringBuilder();
    String arguments =
        context.keySet().stream()
            .map(key -> key + ":" + key)
            .collect(Collectors.joining(","));
    while (matcher.find()) {
      matcher.appendReplacement(
          result,
          "run(\""
              + matcher.group(1)
              + "\",["
              + (StringUtils.isBlank(arguments) ? ":" : arguments)
              + "])");
    }
    matcher.appendTail(result);
    script = result.toString();

    var analysis = gsh.analyze(script);
    var variables = new HashSet<>();
    variables.addAll(context.keySet());
    variables.addAll(analysis.getExpressionVariables());

    if (!analysis.getFinalReturnPresent() && CollectionUtils.isNotEmpty(variables)) {
      script =
          script
              + "\nreturn "
              + variables.stream()
                  .map(variable -> variable + ": " + variable)
                  .collect(Collectors.joining(", ", "[", "]"));
    }

    return script;
  }

  @Override
  public Object eval(
      LinkScriptGroovyScriptHelper scriptHelper,
      LinkScriptResult result,
      LinkScript linkScript,
      LinkedHashMap<String, Object> context) {
    return TransactionHelper.runInTransaction(
        linkScript.getTransactional(),
        () -> scriptHelper.eval(preProcess(linkScript.getBody(), context)));
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
