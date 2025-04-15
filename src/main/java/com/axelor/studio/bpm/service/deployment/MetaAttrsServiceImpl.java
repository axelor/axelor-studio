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
package com.axelor.studio.bpm.service.deployment;

import com.axelor.auth.db.Role;
import com.axelor.auth.db.repo.RoleRepository;
import com.axelor.db.Query;
import com.axelor.meta.db.MetaAttrs;
import com.axelor.meta.db.MetaJsonRecord;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.repo.MetaAttrsRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.studio.bpm.service.execution.WkfInstanceService;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WkfTaskConfig;
import com.axelor.studio.db.repo.WkfInstanceRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;
import org.camunda.bpm.model.bpmn.instance.camunda.CamundaProperty;
import org.camunda.bpm.model.xml.instance.ModelElementInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MetaAttrsServiceImpl implements MetaAttrsService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected static final List<String> CONDITION_ATTRIBUTES =
      Arrays.asList(
          "hidden", "hideIf", "showIf", "readonly", "readonlyIf", "required", "requiredIf");

  public static final String META_ATTRS_CONDITION =
      "com.axelor.inject.Beans.get("
          + WkfInstanceService.class.getName()
          + ").isActiveTask(processInstanceId, '%s')";

  public static final String META_ATTRS_CONDITION_PERMANENT =
      "com.axelor.inject.Beans.get("
          + WkfInstanceService.class.getName()
          + ").isActivatedTask(processInstanceId, '%s')";

  public static final String META_ATTRS_RELATED_FIELD_CONDITION =
      "com.axelor.inject.Beans.get("
          + WkfInstanceService.class.getName()
          + ").isActiveModelTask(%s, '%s')";

  public static final String META_ATTRS_RELATED_FIELD_CONDITION_PERMANENT =
      "com.axelor.inject.Beans.get("
          + WkfInstanceService.class.getName()
          + ").isActivatedModelTask(%s, '%s')";

  protected MetaModelRepository metaModelRepository;

  protected MetaAttrsRepository metaAttrsRepository;

  protected RoleRepository roleRepository;

  protected WkfModelRepository wkfModelRepository;

  protected WkfInstanceRepository wkfInstanceRepository;

  @Inject
  public MetaAttrsServiceImpl(
      MetaModelRepository metaModelRepository,
      MetaAttrsRepository metaAttrsRepository,
      RoleRepository roleRepository,
      WkfModelRepository wkfModelRepository,
      WkfInstanceRepository wkfInstanceRepository) {
    this.metaModelRepository = metaModelRepository;
    this.metaAttrsRepository = metaAttrsRepository;
    this.roleRepository = roleRepository;
    this.wkfModelRepository = wkfModelRepository;
    this.wkfInstanceRepository = wkfInstanceRepository;
  }

  @Override
  public List<MetaAttrs> createMetaAttrs(
      String taskName,
      ModelElementInstance modelElementInstance,
      WkfTaskConfig config,
      String wkfModelId) {

    List<MetaAttrs> metaAttrsList = new ArrayList<MetaAttrs>();

    Collection<CamundaProperty> properties =
        modelElementInstance.getChildElementsByType(CamundaProperty.class);

    log.debug("Extension elements: {}", properties.size());

    String model = null;
    String view = null;
    String relatedField = null;
    String item = null;
    String roles = null;
    String permanent = null;

    for (CamundaProperty property : properties) {

      String name = property.getCamundaName();
      String value = property.getCamundaValue();

      if (name == null) {
        continue;
      }
      log.debug("Processing property: {}, value: {}", name, value);

      switch (name) {
        case "model":
          model = getModel(value);
          view = null;
          relatedField = null;
          item = null;
          roles = null;
          break;
        case "view":
          view = value;
          break;
        case "relatedField":
          relatedField = value;
          break;
        case "item":
          item = value;
          break;
        case "roles":
          roles = value;
          break;
        case "modelName":
          break;
        case "modelType":
          break;
        case "modelLabel":
          break;
        case "itemType":
          break;
        case "itemLabel":
          break;
        case "permanent":
          permanent = value;
          break;
        default:
          if (model != null && item != null) {
            MetaAttrs metaAttrs = new MetaAttrs();
            metaAttrs.setModel(model);
            metaAttrs.setView(view);
            if (MetaJsonRecord.class.getName().equals(model)
                && !Pattern.matches("^.+\\\\..+$", item)) {
              metaAttrs.setField(String.format("attrs.%s", item));
            } else {
              metaAttrs.setField(item);
            }
            metaAttrs.setRoles(findRoles(roles));
            if (permanent != null && permanent.equals("true")) {
              if (!StringUtils.isEmpty(relatedField)) {
                metaAttrs.setCondition(
                    String.format(
                        META_ATTRS_RELATED_FIELD_CONDITION_PERMANENT, relatedField, taskName));
              } else {
                metaAttrs.setCondition(String.format(META_ATTRS_CONDITION_PERMANENT, taskName));
              }
            } else {
              if (!StringUtils.isEmpty(relatedField)) {
                metaAttrs.setCondition(
                    String.format(META_ATTRS_RELATED_FIELD_CONDITION, relatedField, taskName));
              } else {
                metaAttrs.setCondition(String.format(META_ATTRS_CONDITION, taskName));
              }
            }
            if (Arrays.asList("false", "true").contains(value)) {
              metaAttrs.setValue(value);
            } else {
              if (CONDITION_ATTRIBUTES.contains(name)) {
                metaAttrs.setCondition(
                    String.format("(%s)&&(%s)", value, metaAttrs.getCondition()));
                metaAttrs.setValue("true");
              } else {
                metaAttrs.setValue(value);
              }
            }
            metaAttrs.setName(checkMetaAttrsName(name));
            metaAttrs.setWkfModelId(wkfModelId);
            metaAttrsList.add(metaAttrs);
          }
          break;
      }
    }

    return metaAttrsList;
  }

  protected String getModel(String value) {

    MetaModel metaModel = metaModelRepository.findByName(value);

    if (metaModel != null) {
      return metaModel.getFullName();
    }

    return value;
  }

  protected MetaAttrs findMetaAttrs(MetaAttrs metaAttrs, Long wkfModelId) {

    MetaAttrs savedAttrs =
        metaAttrsRepository
            .all()
            .filter(
                "self.wkfModelId = ?1 "
                    + "and self.model = ?2 "
                    + "and self.view = ?3 "
                    + "and self.field = ?4 "
                    + "and self.condition = ?5 "
                    + "and self.name = ?6",
                wkfModelId,
                metaAttrs.getModel(),
                metaAttrs.getView(),
                metaAttrs.getField(),
                metaAttrs.getCondition(),
                metaAttrs.getName())
            .fetchOne();
    if (savedAttrs != null) {
      return savedAttrs;
    }

    return metaAttrs;
  }

  protected Set<Role> findRoles(String roles) {

    Set<Role> roleSet = new HashSet<Role>();

    if (roles != null) {
      roleSet.addAll(
          roleRepository.all().filter("self.name in ?1", Arrays.asList(roles.split(","))).fetch());
    }

    return roleSet;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void saveMetaAttrs(List<MetaAttrs> metaAttrsList, Long wkfModelId) {

    List<Long> metaAttrsIds = new ArrayList<Long>();
    metaAttrsIds.add(0L);

    metaAttrsList.forEach(
        metaAttrs -> {
          MetaAttrs saved = findMetaAttrs(metaAttrs, wkfModelId);
          log.debug("Creating meta attrs: {}", saved);
          saved.setValue(metaAttrs.getValue());
          saved.setRoles(metaAttrs.getRoles());
          metaAttrsRepository.save(saved);
          metaAttrsIds.add(saved.getId());
        });
    long attrsRemoved =
        Query.of(MetaAttrs.class)
            .filter(
                "self.id not in ?1 and self.wkfModelId = ?2", metaAttrsIds, wkfModelId.toString())
            .remove();

    WkfModel wkfModelPreviousVersion = wkfModelRepository.find(wkfModelId).getPreviousVersion();
    long attrsPreviousVersionRemoved = 0;
    if (wkfModelPreviousVersion != null) {
      if (wkfInstanceRepository
              .all()
              .filter("wkfProcess.id = ?1", wkfModelPreviousVersion.getId())
              .count()
          == 0) {
        attrsPreviousVersionRemoved =
            Query.of(MetaAttrs.class)
                .filter(
                    "self.id not in ?1 and self.wkfModelId = ?2",
                    metaAttrsIds,
                    wkfModelPreviousVersion.getId())
                .remove();
      }
    }
    log.debug("Total meta attrs removed: {}", attrsRemoved + attrsPreviousVersionRemoved);
  }

  protected String checkMetaAttrsName(String name) {
    switch (name) {
      case "readonlyIf":
        return "readonly";
      case "requiredIf":
        return "required";
      case "hideIf":
        return "hidden";
      default:
        return name;
    }
  }
}
