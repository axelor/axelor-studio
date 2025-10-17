/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.web;

import com.axelor.common.Inflector;
import com.axelor.inject.Beans;
import com.axelor.meta.db.MetaField;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.repo.MetaFieldRepository;
import com.axelor.rpc.ActionRequest;
import com.axelor.rpc.ActionResponse;
import com.axelor.studio.db.Filter;
import com.axelor.studio.service.filter.FilterSqlService;
import com.axelor.utils.helpers.ExceptionHelper;
import java.util.Map;

public class FilterController {

  public void updateTargetField(ActionRequest request, ActionResponse response) {
    try {
      Filter filter = request.getContext().asType(Filter.class);

      MetaField metaField = filter.getMetaField();
      MetaJsonField metaJson = filter.getMetaJsonField();

      boolean isJson = filter.getIsJson() != null && filter.getIsJson();

      if (!isJson && metaField != null) {
        String type =
            metaField.getRelationship() != null
                ? metaField.getRelationship()
                : metaField.getTypeName();
        response.setValue("targetType", type);
        response.setValue("targetField", metaField.getName());
        response.setValue(
            "targetTitle",
            metaField.getLabel() != null && !metaField.getLabel().isEmpty()
                ? metaField.getLabel()
                : metaField.getName());
      } else if ((isJson || !isJson) && metaJson != null) {
        response.setValue("targetType", Inflector.getInstance().camelize(metaJson.getType()));
        response.setValue("targetField", metaJson.getName());
      } else {
        response.setValue("targetField", null);
        response.setValue("targetType", null);
      }

      response.setValue("operator", null);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void updateTargetType(ActionRequest request, ActionResponse response) {
    try {
      Filter filter = request.getContext().asType(Filter.class);
      FilterSqlService filterSqlService = Beans.get(FilterSqlService.class);

      if (filter.getTargetField() == null) return;

      StringBuilder parent = new StringBuilder("self");
      String targetType =
          filterSqlService.getTargetType(
              filterSqlService.getTargetField(parent, filter, null, false));

      response.setValue("targetType", targetType);
      response.setValue("filterOperator", null);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  @SuppressWarnings("rawtypes")
  public void updateTargetMetaField(ActionRequest request, ActionResponse response) {
    try {
      Filter filter = request.getContext().asType(Filter.class);

      if (request.getContext().get("targetMetaField") != null) {
        Integer id = (Integer) ((Map) request.getContext().get("targetMetaField")).get("id");
        MetaField targetMetaField = Beans.get(MetaFieldRepository.class).find(Long.valueOf(id));

        String targetTitle =
            targetMetaField.getLabel() != null && !targetMetaField.getLabel().isEmpty()
                ? targetMetaField.getLabel()
                : targetMetaField.getName();
        response.setValue("targetField", filter.getTargetField() + "." + targetMetaField.getName());
        response.setValue("targetTitle", filter.getTargetTitle() + "." + targetTitle);
        response.setValue(
            "targetType",
            targetMetaField.getRelationship() != null
                ? targetMetaField.getRelationship()
                : targetMetaField.getTypeName());

        if (targetMetaField.getRelationship() != null) {
          response.setValue("metaTargetFieldDomain", targetMetaField.getTypeName());
          response.setValue("targetMetaField", null);
        }
      }
      response.setValue("operator", null);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }

  public void clearSelection(ActionRequest request, ActionResponse response) {
    try {
      Filter filter = request.getContext().asType(Filter.class);

      if (filter.getMetaField() != null) {
        response.setValue("targetField", filter.getMetaField().getName());
        response.setValue(
            "targetTitle",
            filter.getMetaField().getLabel() != null && !filter.getMetaField().getLabel().isEmpty()
                ? filter.getMetaField().getLabel()
                : filter.getMetaField().getName());
        response.setValue("targetType", filter.getMetaField().getRelationship());
      }
      response.setValue("metaTargetFieldDomain", null);
      response.setValue("targetMetaField", null);
      response.setValue("operator", null);
    } catch (Exception e) {
      ExceptionHelper.error(response, e);
    }
  }
}
