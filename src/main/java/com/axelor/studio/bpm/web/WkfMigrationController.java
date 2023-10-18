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
package com.axelor.studio.bpm.web;

import com.axelor.common.ObjectUtils;
import com.axelor.i18n.I18n;
import com.axelor.inject.Beans;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.bpm.service.migration.WkfMigrationService;
import com.axelor.studio.db.WkfMigration;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.repo.WkfMigrationRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

public class WkfMigrationController {

  public void generateNodeMap(ActionRequest request, ActionResponse response) {
    try {
      WkfMigration migration = request.getContext().asType(WkfMigration.class);
      if (migration.getId() != null) {
        migration = Beans.get(WkfMigrationRepository.class).find(migration.getId());
      }

      Map<String, Object> _map = Beans.get(WkfMigrationService.class).generateNodeMap(migration);
      response.setValue("mapping", new ObjectMapper().writeValueAsString(_map));

    } catch (Exception e) {
      ExceptionHelper.trace(response, e);
    }
  }

  public void getNodeMap(ActionRequest request, ActionResponse response) {
    try {
      String id =
          Optional.ofNullable(request.getData().get("id")).map(Object::toString).orElse(null);
      if (StringUtils.isEmpty(id)) {
        return;
      }

      WkfMigration migration = Beans.get(WkfMigrationRepository.class).find(Long.valueOf(id));
      if (migration == null || StringUtils.isEmpty(migration.getMapping())) {
        return;
      }
      response.setData(new ObjectMapper().readValue(migration.getMapping(), Map.class));

    } catch (Exception e) {
      ExceptionHelper.trace(response, e);
    }
  }

  public void setTargetVersionDomain(ActionRequest request, ActionResponse response) {
    try {
      WkfMigration migration = request.getContext().asType(WkfMigration.class);
      WkfModel sourceVersion = migration.getSourceVersion();
      if (sourceVersion == null) {
        response.setAttr("targetVersion", "domain", "self.id IN (0)");
        return;
      }

      List<Long> ids = Beans.get(WkfMigrationService.class).getTargetVersionIds(sourceVersion);

      response.setAttr(
          "targetVersion",
          "domain",
          CollectionUtils.isNotEmpty(ids)
              ? "self.id IN (" + StringUtils.join(ids, ",") + ")"
              : "self.id IN (0)");

    } catch (Exception e) {
      ExceptionHelper.trace(response, e);
    }
  }

  @SuppressWarnings("unchecked")
  public void migrate(ActionRequest request, ActionResponse response) {
    try {
      if (ObjectUtils.isEmpty(request.getData().get("context"))) {
        return;
      }
      Map<String, Object> contextMap = (Map<String, Object>) request.getData().get("context");
      if (ObjectUtils.isEmpty(contextMap.get("values"))
          || ObjectUtils.isEmpty(contextMap.get("wkfMigrationId"))) {
        return;
      }

      Long wkfMigrationId = Long.valueOf(contextMap.get("wkfMigrationId").toString());
      WkfMigration migration = Beans.get(WkfMigrationRepository.class).find(wkfMigrationId);

      Beans.get(WkfMigrationService.class).migrate(migration, contextMap);

      response.setReload(true);
      response.setInfo(I18n.get(BpmExceptionMessage.MIGRATION_DONE));

    } catch (Exception e) {
      ExceptionHelper.trace(e);
      response.setError(e.getMessage(), I18n.get(BpmExceptionMessage.MIGRATION_ERR));
    }
  }
}
