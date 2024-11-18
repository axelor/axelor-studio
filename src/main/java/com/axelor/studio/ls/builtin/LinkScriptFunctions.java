package com.axelor.studio.ls.builtin;

import com.axelor.inject.Beans;
import com.axelor.studio.db.repo.LinkScriptRepository;
import com.axelor.studio.ls.LinkScriptService;
import com.axelor.studio.ls.annotation.LinkScriptFunction;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Objects;
import java.util.stream.Collectors;

public class LinkScriptFunctions {

  @LinkScriptFunction("echo")
  public static String echo(Object... objects) {
    return Arrays.stream(objects).map(Objects::toString).collect(Collectors.joining(" "));
  }

  @LinkScriptFunction("inject")
  public static <T> T inject(Class<T> serviceClass) {
    return Beans.get(serviceClass);
  }

  @LinkScriptFunction("run")
  public static Object run(LinkedHashMap<String, Object> argument, String linkScriptName) {
    var repo = Beans.get(LinkScriptRepository.class);
    return Beans.get(LinkScriptService.class)
        .run(repo.findByName(linkScriptName), argument)
        .getFinalResult();
  }
}
