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
package com.axelor.studio.db.repo;

import com.axelor.db.Model;
import com.axelor.db.Query;
import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaView;
import com.axelor.studio.db.BamlModel;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioMenu;
import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WsAuthenticator;
import com.axelor.studio.db.WsConnector;
import com.axelor.studio.db.WsRequest;
import com.axelor.studio.service.constructor.StudioAppService;
import java.util.Map;
import javax.validation.ValidationException;

public class StudioAppRepo extends StudioAppRepository {

  @Override
  public StudioApp save(StudioApp studioApp) {

    try {
      Beans.get(StudioAppService.class).build(studioApp);
    } catch (Exception e) {
      throw new ValidationException(e);
    }

    return super.save(studioApp);
  }

  @Override
  public void remove(StudioApp studioApp) {

    Beans.get(StudioAppService.class).clean(studioApp);

    super.remove(studioApp);
  }

  @Override
  public Map<String, Object> populate(Map<String, Object> json, Map<String, Object> context) {
    if (json == null || json.get("id") == null) {
      return json;
    }

    Long id = Long.parseLong(json.get("id").toString());

    // Labels
    json.put("$hasModels", hasRelated(MetaJsonModel.class, id));
    json.put(
        "$hasFields",
        hasRelatedFiltered(
            MetaJsonField.class, "self.studioApp.id = :id AND self.jsonModel IS NULL", id));
    json.put("$hasViews", hasRelated(MetaView.class, id));
    json.put("$hasMenus", hasRelated(StudioMenu.class, id));
    json.put(
        "$hasActions",
        hasRelatedFiltered(
            StudioAction.class, "self.studioApp.id = :id AND self.menuAction IS NOT TRUE", id));
    json.put("$hasMetaActions", hasRelated(MetaAction.class, id));

    // Badges
    json.put("$hasBpm", hasRelated(WkfModel.class, id));
    json.put("$hasDmn", hasRelated(WkfDmnModel.class, id));
    json.put("$hasBaml", hasRelated(BamlModel.class, id));
    json.put("$hasWsConnector", hasRelated(WsConnector.class, id));
    json.put("$hasWsRequest", hasRelated(WsRequest.class, id));
    json.put("$hasWsAuth", hasRelated(WsAuthenticator.class, id));

    return json;
  }

  private boolean hasRelated(Class<? extends Model> entityClass, Long studioAppId) {
    return Query.of(entityClass)
            .filter("self.studioApp.id = :id")
            .bind("id", studioAppId)
            .fetchOne()
        != null;
  }

  private boolean hasRelatedFiltered(
      Class<? extends Model> entityClass, String filter, Long studioAppId) {
    return Query.of(entityClass).filter(filter).bind("id", studioAppId).fetchOne() != null;
  }
}
