package com.axelor.studio.web;

import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.rpc.Context;
import com.axelor.studio.db.Parameter;
import com.axelor.studio.db.Transformation;
import com.axelor.studio.service.transformation.TransformationService;
import com.axelor.utils.ExceptionTool;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public class TransformationsLibrariesController {

  public static final String TARGET = "target";
  public static final String MULTI_ARGS = "_multiArg_";

  public void validateNewParameter(ActionRequest actionRequest, ActionResponse actionResponse) {
    try {
      Context context = actionRequest.getContext();
      if (context == null) {
        return;
      }
      Parameter parameter = context.asType(Parameter.class);
      if ("target".equals(parameter.getName())) {
        actionResponse.setValue("name", null);
        actionResponse.setAlert(
            String.format(I18n.get("Parameter %s has already been defined!"), parameter.getName()));
      }
      Transformation transformation = context.getParent().asType(Transformation.class);
      List<Parameter> parameters = transformation.getParameters();
      if (parameters == null) {
        return;
      }
      parameters.stream()
          .filter(
              alreadyDefinedParameter ->
                  alreadyDefinedParameter.getName() != null
                      && alreadyDefinedParameter.getName().equals(parameter.getName()))
          .forEach(
              it -> {
                actionResponse.setValue("name", null);
                actionResponse.setAlert(
                    String.format(
                        I18n.get("Parameter %s has Already been defined!"), parameter.getName()));
              });
    } catch (Exception e) {
      ExceptionTool.trace(actionResponse, e);
    }
  }

  public void validateTransformationOnSave(
      ActionRequest actionRequest, ActionResponse actionResponse) {
    try {
      Transformation transformation = actionRequest.getContext().asType(Transformation.class);
      String groovyTemplate = transformation.getGroovyTemplate();
      TransformationService transformationService = Beans.get(TransformationService.class);
      if (transformation.getId() == null
          && !transformationService.validateUniqueNameInLibrary(transformation)) {
        actionResponse.setAlert(
            String.format(
                I18n.get("Transformation %s has Already been defined in the library %s !"),
                transformation.getName(),
                transformation.getLibrary().getName()));
        return;
      }
      List<String> placeholders = transformationService.getPlaceholders(groovyTemplate);
      if (transformation.getMultiArg() && !placeholders.contains(MULTI_ARGS)) {
        actionResponse.setError(
            I18n.get("The groovy template is not valid")
                + ": "
                + String.format(
                    I18n.get("\nIt should contain the multiple arguments placeholder (%)!"),
                    MULTI_ARGS));
        return;
      }
      placeholders.removeAll(Collections.singleton(MULTI_ARGS));
      placeholders.removeAll(Collections.singleton(TARGET));
      List<Parameter> parameters = transformation.getParameters();
      if (parameters != null && !parameters.isEmpty()) {
        List<Parameter> unusedParameters =
            transformationService.removeMatchingPlaceholdersAndReturnUnusedParameters(
                parameters, placeholders);
        String unusedParamString =
            unusedParameters.stream().map(Parameter::getName).collect(Collectors.joining("\n"));
        if (!unusedParameters.isEmpty()) {
          actionResponse.setError(
              I18n.get("The groovy template is not valid")
                  + ": "
                  + I18n.get("\nIt should contain a placeholder for the following  parameters:\n")
                  + unusedParamString);
          return;
        }
      }
      if (!placeholders.isEmpty()) {
        String unDefinedPlaceholder = String.join("\n", placeholders);
        actionResponse.setError(
            I18n.get("The groovy template is not valid")
                + ": "
                + I18n.get("\nIt contains placeholders for non existing parameters: \n")
                + unDefinedPlaceholder);
        return;
      }
      Optional<String> errorMessage =
          transformationService.analyzeGroovyTemplateSyntax(groovyTemplate);
      errorMessage.ifPresent(
          s ->
              actionResponse.setError(
                  I18n.get("The groovy template in transformation is not valid") + ":\n" + s));
    } catch (Exception e) {
      ExceptionTool.trace(actionResponse, e);
    }
  }
}
