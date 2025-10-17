/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.transformation;

import com.axelor.studio.db.Parameter;
import com.axelor.studio.db.Transformation;
import java.util.List;
import java.util.Optional;

public interface TransformationService {

  boolean validateUniqueNameInLibrary(Transformation transformation);

  List<Parameter> removeMatchingPlaceholdersAndReturnUnusedParameters(
      List<Parameter> parameters, List<String> placeholders);

  List<String> getPlaceholders(String groovyTemplate);

  Optional<String> analyzeGroovyTemplateSyntax(String groovyTemplate);
}
