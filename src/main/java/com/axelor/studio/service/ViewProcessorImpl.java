/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service;

import com.axelor.auth.AuthUtils;
import com.axelor.auth.db.User;
import com.axelor.auth.db.ViewCustomizationPermission;
import com.axelor.auth.db.repo.UserRepository;
import com.axelor.meta.schema.views.AbstractView;
import com.axelor.meta.schema.views.Button;
import com.axelor.meta.schema.views.FormView;
import com.axelor.meta.service.ViewProcessor;
import com.axelor.studio.service.app.AppStudioService;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class ViewProcessorImpl implements ViewProcessor {
  protected static final String BTN_NAME = "openStudioBtn";
  protected static final String BTN_ON_CLICK = "action-studio-method-open-studio-builder";
  protected static final String BTN_IF_MODULE = "axelor-studio";
  protected static final String BTN_ICON = "magic";
  protected final UserRepository userRepository;
  protected final AppStudioService appStudioService;

  @Inject
  public ViewProcessorImpl(UserRepository userRepository, AppStudioService appStudioService) {
    this.userRepository = userRepository;
    this.appStudioService = appStudioService;
  }

  @Override
  public void process(AbstractView abstractView) {
    List<User> allowedUsers =
        userRepository
            .all()
            .filter(
                "self.group.technicalStaff = true AND (self.group.viewCustomizationPermission = ?1 OR self.group.viewCustomizationPermission = ?2) ",
                ViewCustomizationPermission.CAN_CUSTOMIZE,
                ViewCustomizationPermission.CAN_SHARE)
            .fetch();
    if (!allowedUsers.contains(AuthUtils.getUser())) {
      return;
    }
    if (!appStudioService.getAppStudio().getEnableStudioButton()) {
      return;
    }
    if (abstractView instanceof FormView formView) {
      formView.setToolbar(addOpenStudioButton(formView.getToolbar()));
    }
  }

  protected List<Button> addOpenStudioButton(List<Button> toolbar) {
    toolbar = Optional.ofNullable(toolbar).orElse(new ArrayList<>());
    Button button = new Button();
    button.setName(BTN_NAME);
    button.setOnClick(BTN_ON_CLICK);
    button.setModuleToCheck(BTN_IF_MODULE);
    button.setIcon(BTN_ICON);
    toolbar.add(button);
    return toolbar;
  }
}
