package com.axelor.studio.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.LinkScriptBinding;
import com.axelor.studio.ls.LinkScriptService;
import com.axelor.studio.ls.evaluator.LinkScriptGroovyEvaluator;
import com.axelor.studio.ls.script.LinkScriptGroovyScriptHelper;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.MapHelper;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;

public class LinkScriptController {

  public void setBindings(ActionRequest request, ActionResponse response) {
    try {
      var script = MapHelper.get(request.getContext(), String.class, "script");
      var evaluator = Beans.get(LinkScriptGroovyEvaluator.class);
      var gsh = Beans.get(LinkScriptGroovyEvaluator.class).newHelper(null);
      var bindings =
          gsh
              .analyze(evaluator.preProcess(script, new LinkedHashMap<>()))
              .getDynamicVariables()
              .stream()
              .map(s -> new LinkScriptBinding(s, null))
              .collect(Collectors.toList());
      response.setValue("bindings", bindings);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public Optional<LinkedHashMap<String, Object>> parseBindings(Object bindings) {
    if (!(bindings instanceof Collection<?> list)) {
      return Optional.empty();
    }
    var gsh = Beans.get(LinkScriptGroovyEvaluator.class).newHelper(null);
    return Optional.of(
        list.stream()
            .filter(Map.class::isInstance)
            .map(binding -> (Map<?, ?>) binding)
            .filter(
                it ->
                    it.get("parameter") instanceof String && it.get("expression") instanceof String)
            .map(it -> Map.entry((String) it.get("parameter"), (String) it.get("expression")))
            .collect(
                LinkedHashMap<String, Object>::new,
                (m, it) ->
                    m.put(
                        it.getKey(),
                        StringUtils.isBlank(it.getValue()) ? null : eval(gsh, it.getValue())),
                LinkedHashMap::putAll));
  }

  protected Object eval(LinkScriptGroovyScriptHelper gsh, String script) {
    return script.startsWith("eval:") ? gsh.eval(script.substring(5).trim()) : script;
  }

  public void run(ActionRequest request, ActionResponse response) {
    try {
      var context = request.getContext();
      var linkScript = MapHelper.get(context, String.class, "linkScriptName");
      var bindings = parseBindings(context.get("bindings")).orElse(new LinkedHashMap<>());
      var result = Beans.get(LinkScriptService.class).run(linkScript, bindings);
      response.setInfo(result.toString().replace("\n", "<br>"));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
