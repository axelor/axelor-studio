/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.connect;

import com.axelor.studio.db.App;
import com.axelor.studio.db.repo.AppRepository;
import com.google.inject.Inject;

public class ConnectServiceImpl implements ConnectService {

  protected final AppRepository appRepository;

  @Inject
  public ConnectServiceImpl(AppRepository appRepository) {
    this.appRepository = appRepository;
  }

  @Override
  public boolean isConnectAndStudioProInstalled() {
    App connect = appRepository.findByCode("connect");
    if (connect == null || !connect.getActive()) {
      return false;
    }
    App studio = appRepository.findByCode("AxelorStudioPro");
    return studio != null && studio.getActive();
  }
}
