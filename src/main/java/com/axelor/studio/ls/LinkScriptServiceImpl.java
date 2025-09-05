package com.axelor.studio.ls;

import com.axelor.studio.db.LinkScript;
import com.axelor.studio.db.LinkScriptArc;
import com.axelor.studio.db.repo.LinkScriptRepository;
import com.axelor.studio.ls.evaluator.LinkScriptEvaluator;
import com.axelor.studio.ls.script.LinkScriptGroovyScriptHelper;
import com.axelor.studio.service.AppSettingsStudioService;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Singleton
public class LinkScriptServiceImpl implements LinkScriptService {
  protected static final String DEFAULT_RESULT_KEY = "result";
  protected static final String VARIABLES_MAP_NAME = "variables";
  protected final Logger log = LoggerFactory.getLogger(LinkScriptServiceImpl.class);
  protected final LinkScriptEvaluator<LinkScriptGroovyScriptHelper> groovyEvaluator;
  protected final LinkScriptRepository repo;
  protected final AppSettingsStudioService appSettingsStudioService;

  @Inject
  public LinkScriptServiceImpl(
      LinkScriptEvaluator<LinkScriptGroovyScriptHelper> groovyEvaluator,
      LinkScriptRepository repo,
      AppSettingsStudioService appSettingsStudioService) {
    this.groovyEvaluator = groovyEvaluator;
    this.repo = repo;
    this.appSettingsStudioService = appSettingsStudioService;
  }

  @Override
  public LinkScriptResult run(String linkScriptName, LinkedHashMap<String, Object> context) {
    var depth = 1;
    var result = new LinkScriptResult();
    log.debug("Call link script: {}", linkScriptName);
    run(depth, result, repo.findByName(linkScriptName), context);
    return result;
  }

  protected LinkedHashMap<String, Object> inject(
      LinkedHashMap<String, Object> context, String name, Object value) {
    var newContext = new LinkedHashMap<>(context);
    newContext.put(StringUtils.isBlank(name) ? DEFAULT_RESULT_KEY : name, value);
    newContext.remove(VARIABLES_MAP_NAME);
    return newContext;
  }

  protected void valueContext(
      LinkedHashMap<String, Object> context, String name, Object evalResult) {
    if (StringUtils.isBlank(name) && evalResult instanceof Map<?, ?> map) {
      map.entrySet().stream()
          .filter(e -> e.getKey() instanceof String)
          .forEach(e -> context.put((String) e.getKey(), e.getValue()));
    } else if (evalResult != null) {
      context.put(StringUtils.isBlank(name) ? DEFAULT_RESULT_KEY : name, evalResult);
    }
  }

  protected Object run(
      int depth,
      LinkScriptResult result,
      LinkScript linkScript,
      LinkedHashMap<String, Object> context) {
    if (depth > appSettingsStudioService.getMaximumRecursion()) {
      throw new IllegalStateException("Too many recursions.");
    }

    var gsh = groovyEvaluator.newHelper(context);

    var variables = new LinkedHashMap<String, Object>();

    for (LinkScriptArc arc :
        linkScript.getDependencyArcs().stream()
            .sorted(Comparator.comparing(LinkScriptArc::getSequence))
            .toList()) {
      if (!groovyEvaluator.test(gsh, arc.getConditionScript())) {
        continue;
      }
      var runResult = run(depth + 1, result, arc.getToLinkScript(), new LinkedHashMap<>(context));
      variables.put(
          StringUtils.isBlank(arc.getName()) ? DEFAULT_RESULT_KEY : arc.getName(), runResult);
      valueContext(context, arc.getName(), runResult);
    }

    context.put(VARIABLES_MAP_NAME, variables);

    var initialResult = groovyEvaluator.eval(gsh, result, linkScript, context);
    result.step(linkScript.getName(), initialResult);

    var finalResult = initialResult;
    for (LinkScriptArc arc :
        linkScript.getOutputArcs().stream()
            .sorted(Comparator.comparing(LinkScriptArc::getSequence))
            .toList()) {
      if (!groovyEvaluator.test(gsh, arc.getConditionScript())) {
        continue;
      }
      var outputResult =
          run(
              depth + 1,
              result,
              arc.getToLinkScript(),
              inject(context, arc.getName(), initialResult));
      if (outputResult instanceof Map<?, ?> map) {
        finalResult = map.get(arc.getName());
      } else {
        finalResult = outputResult;
      }
    }

    return finalResult;
  }
}
