package com.axelor.studio.ls;

import com.axelor.db.JPA;
import com.axelor.studio.db.LinkScript;
import com.axelor.studio.ls.evaluator.LinkScriptEvaluator;
import com.axelor.studio.ls.script.LinkScriptGroovyScriptHelper;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import java.util.LinkedHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.stream.IntStream;

@Singleton
public class LinkScriptServiceImpl implements LinkScriptService {
  protected final LinkScriptEvaluator<LinkScriptGroovyScriptHelper> groovyEvaluator;
  protected final ExecutorService executorService;

  @Inject
  public LinkScriptServiceImpl(LinkScriptEvaluator<LinkScriptGroovyScriptHelper> groovyEvaluator) {
    this.groovyEvaluator = groovyEvaluator;
    this.executorService = Executors.newSingleThreadExecutor();
  }

  protected LinkScript find(String linkScriptName) {
    var cb = JPA.em().getCriteriaBuilder();
    var cq = cb.createQuery(LinkScript.class);
    var root = cq.from(LinkScript.class);
    cq.select(root).where(cb.equal(root.get("name"), linkScriptName));
    return JPA.em().createQuery(cq).getSingleResult();
  }

  @Override
  public Future<LinkScriptResult> run(String linkScriptName, LinkedHashMap<String, Object> context)
      throws ExecutionException, InterruptedException {
    var linkScript = find(linkScriptName);
    return run(linkScript, context);
  }

  protected LinkedHashMap<String, Object> transform(LinkScript linkScript, Object... params) {
    var linkScriptParams = linkScript.getInParams();
    return IntStream.range(0, params.length)
        .filter(i -> linkScriptParams.get(i) != null)
        .collect(
            LinkedHashMap::new,
            (m, i) -> m.put(linkScriptParams.get(i).getName(), params[i]),
            LinkedHashMap::putAll);
  }

  protected Future<LinkScriptResult> run(
      LinkScript linkScript, LinkedHashMap<String, Object> context)
      throws ExecutionException, InterruptedException {
    return executorService.submit(new LinkScriptJob(groovyEvaluator, linkScript, context));
  }
}
