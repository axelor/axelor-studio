package com.axelor.studio.ls.builtin;

import com.axelor.inject.Beans;
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
  public static Object run(String linkScriptName, LinkedHashMap<String, Object> argument) {
    return Beans.get(LinkScriptService.class).run(linkScriptName, argument).getFinalResult();
  }
}
