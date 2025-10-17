/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.transformation;

import com.axelor.studio.db.Library;
import com.axelor.studio.db.Parameter;
import com.axelor.studio.db.Transformation;
import groovy.lang.GroovyShell;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.codehaus.groovy.control.CompilationFailedException;

public class TransformationServiceImpl implements TransformationService {

  public static final String PLACE_HOLDER_REGEX = "#\\{([a-zA-Z_$][A-Za-z0-10_$]*)\\}";

  @Override
  public boolean validateUniqueNameInLibrary(Transformation transformation) {
    Library library = transformation.getLibrary();
    List<Transformation> transformations = library.getTransformations();
    if (transformations == null) return true;
    for (Transformation alreadyDefinedTransformation : transformations) {
      if (alreadyDefinedTransformation.getName() != null
          && alreadyDefinedTransformation.getName().equals(transformation.getName())) return false;
    }
    return true;
  }

  @Override
  public List<Parameter> removeMatchingPlaceholdersAndReturnUnusedParameters(
      List<Parameter> parameters, List<String> placeholders) {
    List<Parameter> unusedParameters = new ArrayList<>();
    parameters.forEach(
        parameter -> {
          String parameterName = parameter.getName();
          if (!placeholders.contains(parameterName)) {
            unusedParameters.add(parameter);
          } else {
            placeholders.removeAll(Collections.singleton(parameterName));
          }
        });
    return unusedParameters;
  }

  @Override
  public List<String> getPlaceholders(String groovyTemplate) {
    Matcher matcher = Pattern.compile(PLACE_HOLDER_REGEX).matcher(groovyTemplate);
    List<String> placeholders = new ArrayList<>();
    while (matcher.find()) {
      String placeholder = matcher.group(1);
      if (!placeholders.contains(placeholder)) placeholders.add(placeholder);
    }
    return placeholders;
  }

  @Override
  public Optional<String> analyzeGroovyTemplateSyntax(String groovyTemplate) {
    Matcher matcher =
        Pattern.compile("\\{ *target *-> *.+\\} *\\( *#\\{target\\} *\\)").matcher(groovyTemplate);
    if (!matcher.find()) return Optional.of("it must be of the form {target -> ... }(#{target})");
    String groovyTemplateFilled = groovyTemplate.replaceAll(PLACE_HOLDER_REGEX, "$1");
    try {
      new GroovyShell().parse(groovyTemplateFilled);
    } catch (CompilationFailedException e) {
      return Optional.of(e.getMessage());
    }
    return Optional.empty();
  }
}
