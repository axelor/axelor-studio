package com.axelor.studio.ls;

import com.axelor.studio.db.LinkScript;
import com.axelor.studio.db.LinkScriptArc;
import com.axelor.studio.ls.evaluator.LinkScriptEvaluator;
import com.axelor.studio.ls.script.LinkScriptGroovyScriptHelper;
import java.util.LinkedHashMap;
import java.util.concurrent.Callable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LinkScriptJob implements Callable<LinkScriptResult> {
  protected final Logger log = LoggerFactory.getLogger(LinkScriptJob.class);
  protected final LinkScriptEvaluator<LinkScriptGroovyScriptHelper> groovyEvaluator;
  protected final LinkScriptResult result;
  protected final LinkScript linkScript;
  protected final LinkedHashMap<String, Object> context;

  public LinkScriptJob(
      LinkScriptEvaluator<LinkScriptGroovyScriptHelper> groovyEvaluator,
      LinkScript linkScript,
      LinkedHashMap<String, Object> context) {
    this.groovyEvaluator = groovyEvaluator;
    this.linkScript = linkScript;
    this.context = context;
    this.result = new LinkScriptResult();
  }

  protected void run(
      LinkScriptResult result, LinkScript linkScript, LinkedHashMap<String, Object> context) {
    var gsh = groovyEvaluator.newHelper(context);
    groovyEvaluator.eval(gsh, result, linkScript);

    for (LinkScriptArc arc : linkScript.getArcs()) {
      if (groovyEvaluator.test(gsh, arc.getConditionScript())) {
        run(result, arc.getToLinkScript(), groovyEvaluator.transform(gsh, arc));
      }
    }
  }

  @Override
  public LinkScriptResult call() throws Exception {
    log.debug("Call link script: {}", linkScript.getName());
    run(result, linkScript, context);
    return result;
  }
}
