package com.axelor.studio.ls.evaluator;

import com.axelor.script.ScriptBindings;
import com.axelor.studio.db.LinkScript;
import com.axelor.studio.db.LinkScriptArc;
import com.axelor.studio.helper.TransactionHelper;
import com.axelor.studio.ls.LinkScriptBindingsService;
import com.axelor.studio.ls.LinkScriptResult;
import com.axelor.studio.ls.script.LinkScriptGroovyScriptHelper;
import com.google.inject.Inject;
import java.util.LinkedHashMap;
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

  protected String computeReturnStatement(LinkScript linkScript) {
    if (CollectionUtils.isEmpty(linkScript.getOutParams())) {
      return "[:]";
    }
    return linkScript.getOutParams().stream()
        .map(it -> it.getName() + ": " + it.getName())
        .collect(Collectors.joining(", ", "[", "]"));
  }

  @Override
  public LinkScriptGroovyScriptHelper newHelper(LinkedHashMap<String, Object> context) {
    return new LinkScriptGroovyScriptHelper(
        bindings(context), linkScriptBindingsService.getImportCustomizer());
  }

  public String preProcess(LinkScript linkScript) {
    return linkScript.getBody() + "\n" + computeReturnStatement(linkScript);
  }

  @Override
  public void eval(
      LinkScriptGroovyScriptHelper scriptHelper, LinkScriptResult result, LinkScript linkScript) {
    var body = preProcess(linkScript);
    @SuppressWarnings("unchecked")
    var evalResult =
        TransactionHelper.runInTransaction(
            linkScript.getTransactional(),
            () -> (LinkedHashMap<String, Object>) scriptHelper.eval(body));
    result.step(linkScript.getName(), evalResult);
    scriptHelper.setBindings(bindings(evalResult));
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

  @Override
  public LinkedHashMap<String, Object> transform(
      LinkScriptGroovyScriptHelper scriptHelper, LinkScriptArc linkScriptArc) {
    var mappingScript = linkScriptArc.getMappingScript();
    @SuppressWarnings("unchecked")
    var evalResult = (LinkedHashMap<String, Object>) scriptHelper.eval(mappingScript);
    return evalResult;
  }
}
