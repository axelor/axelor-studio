package com.axelor.studio.ls;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.Spliterator;
import java.util.StringJoiner;
import java.util.function.Consumer;
import javax.annotation.Nonnull;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class LinkScriptResult implements Iterable<LinkScriptResult.Step> {
  private final LinkedList<Step> steps = new LinkedList<>();
  private Object finalResult;

  public void step(String name, LinkedHashMap<String, Object> result) {
    steps.add(new Step(name, new LinkedHashMap<>(result)));
    finalResult = result;
  }

  @Override
  @Nonnull
  public Iterator<Step> iterator() {
    return steps.iterator();
  }

  @Override
  public void forEach(Consumer<? super Step> action) {
    steps.forEach(action);
  }

  @Override
  public Spliterator<Step> spliterator() {
    return steps.spliterator();
  }

  @Override
  public String toString() {
    var stringJoiner = new StringJoiner("\n");
    var stepNumber = 1;
    for (var step : steps) {
      stringJoiner.add(stepNumber++ + ". " + step.name + ": " + step.result);
    }
    stringJoiner.add("Final result: " + finalResult);
    return stringJoiner.toString();
  }

  @Getter
  public static class Step {
    private final String name;
    private final LinkedHashMap<String, Object> result;

    public Step(String name, LinkedHashMap<String, Object> result) {
      this.name = name;
      this.result = result;
    }
  }
}
