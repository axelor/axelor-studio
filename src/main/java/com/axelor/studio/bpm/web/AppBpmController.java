package com.axelor.studio.bpm.web;

import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.script.GroovyScriptHelper;
import com.axelor.studio.bpm.script.AxelorBindingsHelper;
import com.axelor.studio.db.AppBpm;
import com.axelor.studio.db.CustomVariable;
import com.axelor.studio.db.repo.CustomVariableRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import java.util.List;
import javax.script.Bindings;
import javax.script.SimpleBindings;

public class AppBpmController {

  public void validateCustomVars(ActionRequest request, ActionResponse response) {
    try {
      AppBpm app = request.getContext().asType(AppBpm.class);
      List<CustomVariable> customVariables = app.getCustomVariableList();

      for (CustomVariable customVariable : customVariables) {
        try {
          Bindings bindings = AxelorBindingsHelper.getBindings(new SimpleBindings());
          new GroovyScriptHelper(bindings).eval(customVariable.getExpression());
          customVariable.setStatus(CustomVariableRepository.STATUS_VALID);
        } catch (Exception e) {
          customVariable.setStatus(CustomVariableRepository.STATUS_INVALID);
        }
      }
      response.setValues(app);
    } catch (Exception e) {
      ExceptionHelper.trace(response, e);
    }
  }
}
