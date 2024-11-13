package com.axelor.studio.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.ls.LinkScriptService;
import com.axelor.studio.ls.evaluator.LinkScriptGroovyEvaluator;
import com.axelor.utils.helpers.ExceptionHelper;
import com.axelor.utils.helpers.MapHelper;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.lang3.StringUtils;

public class LinkScriptController {
  public Optional<LinkedHashMap<String, Object>> parseBindings(Object bindings) {
    if (!(bindings instanceof Collection)) {
      return Optional.empty();
    }
    var gsh = Beans.get(LinkScriptGroovyEvaluator.class).newHelper(null);
    var list = (Collection<?>) bindings;
    return Optional.of(
        list.stream()
            .filter(binding -> binding instanceof Map)
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
                        StringUtils.isBlank(it.getValue()) ? null : gsh.eval(it.getValue())),
                LinkedHashMap::putAll));
  }

  public void run(ActionRequest request, ActionResponse response) {
    try {
      var context = request.getContext();
      var linkScript = MapHelper.get(context, String.class, "linkScriptName");
      var bindings = parseBindings(context.get("bindings")).orElse(new LinkedHashMap<>());
      var result = Beans.get(LinkScriptService.class).run(linkScript, bindings).get();
      response.setInfo(result.toString().replace("\n", "<br>"));
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
