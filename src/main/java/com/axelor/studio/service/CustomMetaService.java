/*
 * Axelor Business Solutions
 *
 * Copyright (C) 2022 Axelor (<http://axelor.com>).
 *
 * This program is free software: you can redistribute it and/or  modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.axelor.studio.service;

import com.axelor.auth.AuthUtils;
import com.axelor.auth.db.User;
import com.axelor.auth.db.ViewCustomizationPermission;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.meta.schema.views.Button;
import com.axelor.meta.schema.views.FormView;
import com.axelor.meta.schema.views.GridView;
import com.axelor.meta.service.MetaService;
import com.axelor.rpc.Response;
import com.google.inject.Inject;
import java.util.ArrayList;
import java.util.List;

public class CustomMetaService extends MetaService {

  protected UserRepository userRepo;

  @Inject
  public CustomMetaService(UserRepository userRepo) {
    this.userRepo = userRepo;
  }

  @Override
  public Response findView(String model, String name, String type) {
    Response response = super.findView(model, name, type);
    List<User> allowedUsers =
        userRepo
            .all()
            .filter(
                "self.group.technicalStaff = true AND self.group.viewCustomizationPermission = ?1",
                ViewCustomizationPermission.CAN_CUSTOMIZE)
            .fetch();
    if (!allowedUsers.contains(AuthUtils.getUser())) {
      return response;
    }

    if (response.getData() instanceof FormView) {
      addOpenStudioButton((FormView) response.getData());
    } else if (response.getData() instanceof GridView) {
      addOpenStudioButton((GridView) response.getData());
    }
    return response;
  }

  protected void addOpenStudioButton(FormView formView) {
    if (formView.getToolbar() == null) {
      formView.setToolbar(new ArrayList<>());
    }

    formView.setToolbar(addOpenStudioButton(formView.getToolbar()));
  }

  protected void addOpenStudioButton(GridView gridView) {
    if (gridView.getToolbar() == null) {
      gridView.setToolbar(new ArrayList<>());
    }

    gridView.setToolbar(addOpenStudioButton(gridView.getToolbar()));
  }

  protected List<Button> addOpenStudioButton(List<Button> toolBar) {
    Button openStudioBtn = new Button();
    openStudioBtn.setTitle("Open studio");
    openStudioBtn.setName("openStudioBtn");
    openStudioBtn.setOnClick("action-studio-method-open-studio-builder");
    toolBar.add(openStudioBtn);

    return toolBar;
  }
}
