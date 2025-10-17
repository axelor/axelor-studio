/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.ls;

import jakarta.annotation.Nonnull;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.Spliterator;
import java.util.StringJoiner;
import java.util.function.Consumer;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class LinkScriptResult implements Iterable<LinkScriptResult.Step> {
  private final LinkedList<Step> steps = new LinkedList<>();
  private Object finalResult;

  public void step(String name, Object result) {
    steps.add(new Step(name, result));
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
    var stringJoiner = new StringJoiner("\n\n");
    var stepNumber = 1;
    for (var step : steps) {
      stringJoiner.add(stepNumber++ + ". " + step.name + ": " + step.result);
    }
    return stringJoiner.toString();
  }

  public record Step(String name, Object result) {}
}
