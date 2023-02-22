package com.axelor.studio.bpm.transformation;

import com.axelor.studio.db.repo.TransformationRepository;
import com.axelor.studio.service.transformation.FullTransformation;
import java.util.List;

public class WkfTransformationHelper {

  public static Object transform(
      String target, List<String> parameters, String library, String transformation) {
    FullTransformation fullTransformation = new FullTransformation(new TransformationRepository());
    return fullTransformation.transform(target, parameters, library, transformation).run();
  }
}
