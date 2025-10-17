/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service;

import com.axelor.auth.db.AuditableModel;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaMenu;
import com.axelor.meta.db.MetaView;
import com.axelor.meta.schema.views.AbstractView;
import com.axelor.studio.db.StudioMenu;
import com.google.inject.persist.Transactional;

public interface StudioMetaService {

  @Transactional(rollbackOn = Exception.class)
  void removeMetaActions(String xmlIds);

  @Transactional(rollbackOn = Exception.class)
  MetaAction updateMetaAction(
      String name, String actionType, String xml, String model, String xmlId);

  @Transactional(rollbackOn = Exception.class)
  MetaView generateMetaView(AbstractView view);

  String updateAction(String oldAction, String newAction, boolean remove);

  MetaMenu createMenu(StudioMenu studioMenu);

  @Transactional(rollbackOn = Exception.class)
  void removeMetaMenu(MetaMenu metaMenu);

  Integer getPriority(String object, String name);

  @Transactional(rollbackOn = Exception.class)
  void trackJsonField(MetaJsonModel jsonModel);

  @Transactional(rollbackOn = Exception.class)
  void trackingFields(AuditableModel auditableModel, String messageBody, String messageSubject);

  @Transactional(rollbackOn = Exception.class)
  void trackJsonField(MetaJsonField metaJsonField);

  String computeStudioBuilderUrl(String model, String viewName, boolean isJson);
}
