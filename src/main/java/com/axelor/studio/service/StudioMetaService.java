package com.axelor.studio.service;

import com.axelor.auth.db.AuditableModel;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaMenu;
import com.axelor.meta.db.MetaView;
import com.axelor.meta.schema.views.AbstractView;
import com.axelor.studio.db.StudioMenu;

public interface StudioMetaService {

  public void removeMetaActions(String xmlIds);

  public MetaAction updateMetaAction(
      String name, String actionType, String xml, String model, String xmlId);

  public MetaView generateMetaView(AbstractView view);

  public String updateAction(String oldAction, String newAction, boolean remove);

  public MetaMenu createMenu(StudioMenu studioMenu);

  public void removeMetaMenu(MetaMenu metaMenu);

  public void trackJsonField(MetaJsonModel jsonModel);

  public void trackingFields(
      AuditableModel auditableModel, String messageBody, String messageSubject);

  public void trackJsonField(MetaJsonField metaJsonField);
}
