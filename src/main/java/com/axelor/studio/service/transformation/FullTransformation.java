package com.axelor.studio.service.transformation;

import com.axelor.studio.db.Transformation;
import com.axelor.studio.db.repo.TransformationRepository;
import com.google.inject.Inject;
import groovy.lang.GroovyShell;
import groovy.lang.Script;
import java.util.List;

public class FullTransformation {

  protected TransformationRepository transformationRepository;

  @Inject
  public FullTransformation(TransformationRepository transformationRepository) {
    this.transformationRepository = transformationRepository;
  }

  public Script transform(
      String target, List<String> parameters, String library, String transformation) {
    Transformation t = transformationRepository.findByName(transformation);
    String groovy = generateGroovy(target, parameters, t);
    return new GroovyShell().parse(groovy);
  }

  public static String generateGroovy(
      String target, List<String> parameters, Transformation transformation) {
    String groovy = transformation.getGroovyTemplate().replace("#{target}", target);
    if (transformation.getParameters().isEmpty()) return groovy;
    for (int i = 0; i < transformation.getParameters().size(); i++) {
      groovy.replace("#" + transformation.getParameters().get(i).getName(), parameters.get(i));
    }
    return groovy;
  }
}
