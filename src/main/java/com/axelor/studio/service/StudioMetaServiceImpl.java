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
import com.axelor.auth.db.AuditableModel;
import com.axelor.auth.db.Group;
import com.axelor.auth.db.Role;
import com.axelor.auth.db.User;
import com.axelor.db.EntityHelper;
import com.axelor.db.JPA;
import com.axelor.db.Model;
import com.axelor.db.mapper.Mapper;
import com.axelor.inject.Beans;
import com.axelor.mail.MailConstants;
import com.axelor.message.service.MailMessageCreator;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaMenu;
import com.axelor.meta.db.MetaModel;
import com.axelor.meta.db.MetaView;
import com.axelor.meta.db.repo.MetaActionRepository;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaMenuRepository;
import com.axelor.meta.db.repo.MetaModelRepository;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.meta.loader.XMLViews;
import com.axelor.meta.schema.views.AbstractView;
import com.axelor.studio.db.StudioMenu;
import com.axelor.studio.db.repo.StudioMenuRepository;
import com.google.common.base.Preconditions;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import javax.persistence.NoResultException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StudioMetaServiceImpl implements StudioMetaService {

  protected final Logger log = LoggerFactory.getLogger(StudioMetaServiceImpl.class);

  protected final MetaActionRepository metaActionRepo;

  protected final MetaViewRepository metaViewRepo;

  protected final MetaMenuRepository metaMenuRepo;

  protected final StudioMenuRepository studioMenuRepo;

  protected final MetaModelRepository metaModelRepo;
  protected final MailMessageCreator mailMessageCreator;

  @Inject
  public StudioMetaServiceImpl(
      MetaActionRepository metaActionRepo,
      MetaViewRepository metaViewRepo,
      MetaMenuRepository metaMenuRepo,
      StudioMenuRepository studioMenuRepo,
      MetaModelRepository metaModelRepo,
      MailMessageCreator mailMessageCreator) {
    this.metaActionRepo = metaActionRepo;
    this.metaViewRepo = metaViewRepo;
    this.metaMenuRepo = metaMenuRepo;
    this.studioMenuRepo = studioMenuRepo;
    this.metaModelRepo = metaModelRepo;
    this.mailMessageCreator = mailMessageCreator;
  }

  /**
   * Removes MetaActions from comma separated names in string.
   *
   * @param xmlIds Comma separated string of action xml id.
   */
  @Override
  @Transactional(rollbackOn = Exception.class)
  public void removeMetaActions(String xmlIds) {

    log.debug("Removing actions: {}", xmlIds);
    if (xmlIds == null) {
      return;
    }

    List<MetaAction> metaActions =
        metaActionRepo
            .all()
            .filter("self.xmlId in ?1 OR self.name in ?1 ", Arrays.asList(xmlIds.split(",")))
            .fetch();

    metaActions.forEach(
        action -> {
          metaMenuRepo
              .all()
              .filter("self.action = ?1", action)
              .fetchStream()
              .forEach(
                  metaMenu -> {
                    metaMenu.setAction(null);
                    metaMenuRepo.save(metaMenu);
                  });
          metaActionRepo.remove(action);
        });
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public MetaAction updateMetaAction(
      String name, String actionType, String xml, String model, String xmlId) {

    MetaAction action = metaActionRepo.findByID(xmlId);

    if (action == null) {
      action = new MetaAction(name);
      action.setXmlId(xmlId);
      Integer priority = getPriority(MetaAction.class.getSimpleName(), name);
      action.setPriority(priority);
    }
    action.setType(actionType);
    action.setModel(model);
    action.setXml(xml);

    return metaActionRepo.save(action);
  }

  /**
   * Creates or Updates metaView from AbstractView.
   *
   * @param view AbstractView definition
   */
  @Override
  @Transactional(rollbackOn = Exception.class)
  public MetaView generateMetaView(AbstractView view) {

    String name = view.getName();
    String xmlId = view.getXmlId();
    String model = view.getModel();
    String viewType = view.getType();

    log.debug("Search view name: {}, xmlId: {}", name, xmlId);

    MetaView metaView;
    if (xmlId != null) {
      metaView =
          metaViewRepo
              .all()
              .filter(
                  "self.name = ?1 and self.xmlId = ?2 and self.type = ?3", name, xmlId, viewType)
              .fetchOne();
    } else {
      metaView =
          metaViewRepo.all().filter("self.name = ?1 and self.type = ?2", name, viewType).fetchOne();
    }

    log.debug("Meta view found: {}", metaView);

    if (metaView == null) {
      metaView =
          metaViewRepo
              .all()
              .filter("self.name = ?1 and self.type = ?2", name, viewType)
              .order("-priority")
              .fetchOne();
      Integer priority = 20;
      if (metaView != null) {
        priority = metaView.getPriority() + 1;
      }
      metaView = new MetaView();
      metaView.setName(name);
      metaView.setXmlId(xmlId);
      metaView.setModel(model);
      metaView.setPriority(priority);
      metaView.setType(viewType);
      metaView.setTitle(view.getTitle());
    }

    String viewXml = XMLViews.toXml(view, true);
    metaView.setXml(viewXml);
    return metaViewRepo.save(metaView);
  }

  @Override
  public String updateAction(String oldAction, String newAction, boolean remove) {

    if (oldAction == null) {
      return newAction;
    }
    if (newAction == null) {
      return oldAction;
    }

    if (remove) {
      oldAction = oldAction.replace(newAction, "");
    } else if (!oldAction.contains(newAction)) {
      oldAction = oldAction + "," + newAction;
    }

    oldAction = oldAction.replace(",,", ",");
    if (oldAction.isEmpty()) {
      return null;
    }

    return oldAction;
  }

  @Override
  public MetaMenu createMenu(StudioMenu studioMenu) {
    //    String xmlId = XML_ID_PREFIX + studioMenu.getName();
    String xmlId = studioMenu.getXmlId();
    MetaMenu menu = studioMenu.getMetaMenu();

    if (menu == null) {
      menu = metaMenuRepo.findByID(xmlId);
    } else {
      menu.setXmlId(xmlId);
    }

    if (menu == null) {
      menu = new MetaMenu(studioMenu.getName());
      menu.setXmlId(xmlId);
      Integer priority = getPriority(MetaMenu.class.getSimpleName(), menu.getName());
      menu.setPriority(priority);
      menu.setTitle(studioMenu.getTitle());
      menu = metaMenuRepo.save(menu);
    }

    menu.setTitle(studioMenu.getTitle());
    menu.setIcon(studioMenu.getIcon());
    menu.setIconBackground(studioMenu.getIconBackground());
    menu.setOrder(studioMenu.getOrder());
    menu.setParent(studioMenu.getParentMenu());
    menu.setArchived(studioMenu.getArchived());

    if (studioMenu.getGroups() != null) {
      Set<Group> groups = new HashSet<>();
      groups.addAll(studioMenu.getGroups());
      menu.setGroups(groups);
    }

    if (studioMenu.getRoles() != null) {
      Set<Role> roles = new HashSet<>();
      roles.addAll(studioMenu.getRoles());
      menu.setRoles(roles);
    }

    String condition = studioMenu.getConditionToCheck();
    if (studioMenu.getStudioApp() != null) {
      if (condition != null) {
        condition =
            "__config__.app?.isApp('"
                + studioMenu.getStudioApp().getCode()
                + "') && ("
                + condition
                + ")";
      } else {
        condition = "__config__.app?.isApp('" + studioMenu.getStudioApp().getCode() + "')";
      }
    }
    menu.setConditionToCheck(condition);
    menu.setModuleToCheck(studioMenu.getModuleToCheck());
    menu.setLeft(studioMenu.getLeft());
    menu.setHidden(studioMenu.getHidden());
    menu.setMobile(studioMenu.getMobile());

    menu.setTag(studioMenu.getTag());
    menu.setTagCount(studioMenu.getTagCount());
    menu.setTagGet(studioMenu.getTagGet());
    menu.setTagStyle(studioMenu.getTagStyle());

    menu.setLink(studioMenu.getLink());
    if (studioMenu.getMetaModule() != null) {
      menu.setModule(studioMenu.getMetaModule().getName());
    }

    return menu;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void removeMetaMenu(MetaMenu metaMenu) {
    Preconditions.checkNotNull(metaMenu, "metaMenu cannot be null.");

    List<MetaMenu> subMenus = metaMenuRepo.all().filter("self.parent = ?1", metaMenu).fetch();
    subMenus.forEach(subMenu -> subMenu.setParent(null));
    List<StudioMenu> subStudioMenus =
        studioMenuRepo.all().filter("self.parentMenu = ?1", metaMenu).fetch();
    subStudioMenus.forEach(
        subStudioMenu -> {
          subStudioMenu.setParentMenu(null);
          studioMenuRepo.save(subStudioMenu);
        });

    metaMenuRepo.remove(metaMenu);
  }

  @Override
  public Integer getPriority(String object, String name) {
    String query =
        String.format("SELECT MAX(obj.priority) FROM %s obj WHERE obj.name = :name", object);

    try {
      Optional<Integer> priorityOpt =
          Optional.ofNullable(
              JPA.em()
                  .createQuery(query, Integer.class)
                  .setParameter("name", name)
                  .getSingleResult());
      return priorityOpt.orElse(0) + 1;
    } catch (NoResultException e) {
      return 0;
    }
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void trackJsonField(MetaJsonModel jsonModel) {

    String messageBody = "";

    List<MetaJsonField> metaJsonFieldList = jsonModel.getFields();

    jsonModel = Beans.get(MetaJsonModelRepository.class).find(jsonModel.getId());

    List<MetaJsonField> jsonFieldList = new ArrayList<MetaJsonField>(jsonModel.getFields());

    if (metaJsonFieldList.equals(jsonFieldList)) {
      return;
    }

    List<MetaJsonField> commonJsonFieldList = new ArrayList<>(jsonFieldList);
    commonJsonFieldList.retainAll(metaJsonFieldList);

    metaJsonFieldList.removeAll(jsonFieldList);
    if (!metaJsonFieldList.isEmpty()) {
      messageBody =
          metaJsonFieldList.stream().map(list -> list.getName()).collect(Collectors.joining(", "));
      trackingFields(jsonModel, messageBody, "Field added");
    }

    jsonFieldList.removeAll(commonJsonFieldList);
    if (!jsonFieldList.isEmpty()) {
      messageBody =
          jsonFieldList.stream().map(list -> list.getName()).collect(Collectors.joining(", "));
      trackingFields(jsonModel, messageBody, "Field removed");
    }
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void trackingFields(
      AuditableModel auditableModel, String messageBody, String messageSubject) {

    User user = AuthUtils.getUser();
    Class<? extends Model> modelClass = EntityHelper.getEntityClass(auditableModel);
    Mapper mapper = Mapper.of(modelClass);

    mailMessageCreator.persist(
        user != null ? user.getId() : null,
        messageBody,
        messageSubject,
        MailConstants.MESSAGE_TYPE_NOTIFICATION,
        mailMessage -> {
          mailMessage.setRelatedId(auditableModel.getId());
          mailMessage.setRelatedModel(modelClass.getName());
          mailMessage.setRelatedName(mapper.getNameField().get(auditableModel).toString());
        });
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void trackJsonField(MetaJsonField metaJsonField) {

    MetaModel metaModel =
        metaModelRepo.all().filter("self.fullName = ?1", metaJsonField.getModel()).fetchOne();

    trackingFields(metaModel, metaJsonField.getName(), "Field added");
  }

  @Override
  public String computeStudioBuilderUrl(String model, String viewName, boolean isJson) {

    String url = "studio/?json=" + isJson + "&model=" + model;

    if (isJson) {
      return url;
    }
    url += "&view=" + viewName + "&customField=attrs";

    return url;
  }
}
