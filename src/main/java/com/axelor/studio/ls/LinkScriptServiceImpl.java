package com.axelor.studio.ls;

import com.axelor.studio.db.LinkScript;
import com.axelor.studio.ls.evaluator.LinkScriptEvaluator;
import com.axelor.studio.ls.script.LinkScriptGroovyScriptHelper;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.util.LinkedHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Singleton
public class LinkScriptServiceImpl implements LinkScriptService {
  protected final Logger log = LoggerFactory.getLogger(LinkScriptServiceImpl.class);
  protected final LinkScriptEvaluator<LinkScriptGroovyScriptHelper> groovyEvaluator;

  @Inject
  public LinkScriptServiceImpl(LinkScriptEvaluator<LinkScriptGroovyScriptHelper> groovyEvaluator) {
    this.groovyEvaluator = groovyEvaluator;
  }

  @Override
  public LinkScriptResult run(LinkScript linkScript, LinkedHashMap<String, Object> context) {
    var result = new LinkScriptResult();
    log.debug("Call link script: {}", linkScript.getName());
    run(result, linkScript, null, context);
    return result;
  }

  protected void run(
      LinkScriptResult result,
      LinkScript linkScript,
      String varName,
      LinkedHashMap<String, Object> context) {
    var gsh = groovyEvaluator.newHelper(context);

    linkScript.getDependencyArcs().stream()
        .filter(arc -> groovyEvaluator.test(gsh, arc.getConditionScript()))
        .forEach(arc -> run(result, arc.getToLinkScript(), arc.getVarName(), context));

    groovyEvaluator.eval(gsh, result, linkScript, varName, context);

    linkScript.getOutputArcs().stream()
        .filter(arc -> groovyEvaluator.test(gsh, arc.getConditionScript()))
        .forEach(arc -> run(result, arc.getToLinkScript(), arc.getVarName(), context));
  }
}
