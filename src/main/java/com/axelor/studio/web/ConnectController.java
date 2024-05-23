package com.axelor.studio.web;

import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.service.connect.ConnectService;

public class ConnectController {

  public void isConnectAndStudioInstalled(ActionRequest request, ActionResponse response) {
    try {
      response.setValue(
          "isConnectAndStudioInstalled",
          Beans.get(ConnectService.class).isConnectAndStudioProInstalled());
    } catch (Exception e) {
      response.setValue("error", e.getMessage());
    }
  }
}
