/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.service.constructor;

import com.axelor.db.JpaRepository;
import com.axelor.db.Model;
import com.axelor.i18n.I18n;
import com.axelor.meta.db.MetaAction;
import com.axelor.meta.db.MetaJsonField;
import com.axelor.meta.db.MetaJsonModel;
import com.axelor.meta.db.MetaView;
import com.axelor.meta.db.repo.MetaActionRepository;
import com.axelor.meta.db.repo.MetaJsonFieldRepository;
import com.axelor.meta.db.repo.MetaJsonModelRepository;
import com.axelor.meta.db.repo.MetaViewRepository;
import com.axelor.studio.db.StudioAction;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioChart;
import com.axelor.studio.db.StudioDashboard;
import com.axelor.studio.db.StudioDashlet;
import com.axelor.studio.db.StudioMenu;
import com.axelor.studio.db.StudioSelection;
import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.db.WkfModel;
import com.axelor.studio.db.WsAuthenticator;
import com.axelor.studio.db.WsConnector;
import com.axelor.studio.db.WsRequest;
import com.axelor.studio.db.WsRequestList;
import com.axelor.studio.db.repo.StudioActionRepository;
import com.axelor.studio.db.repo.StudioChartRepository;
import com.axelor.studio.db.repo.StudioDashboardRepository;
import com.axelor.studio.db.repo.StudioDashletRepository;
import com.axelor.studio.db.repo.StudioMenuRepository;
import com.axelor.studio.db.repo.StudioSelectionRepository;
import com.axelor.studio.db.repo.WkfDmnModelRepository;
import com.axelor.studio.db.repo.WkfModelRepository;
import com.axelor.studio.db.repo.WsAuthenticatorRepository;
import com.axelor.studio.db.repo.WsConnectorRepository;
import com.axelor.studio.db.repo.WsRequestListRepository;
import com.axelor.studio.db.repo.WsRequestRepository;
import com.axelor.studio.exception.StudioExceptionMessage;
import com.axelor.studio.utils.XmlUtils;
import com.google.inject.persist.Transactional;
import jakarta.inject.Inject;
import java.io.File;
import java.io.IOException;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

public class StudioAppUpdateCleanupServiceImpl implements StudioAppUpdateCleanupService {

  protected static final Logger log = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  protected final StudioSelectionRepository studioSelectionRepo;
  protected final MetaJsonModelRepository metaJsonModelRepo;
  protected final MetaJsonFieldRepository metaJsonFieldRepo;
  protected final StudioChartRepository studioChartRepo;
  protected final StudioDashboardRepository studioDashboardRepo;
  protected final StudioDashletRepository studioDashletRepo;
  protected final StudioActionRepository studioActionRepo;
  protected final StudioMenuRepository studioMenuRepo;
  protected final WsRequestRepository wsRequestRepo;
  protected final WsConnectorRepository wsConnectorRepo;
  protected final WsAuthenticatorRepository wsAuthenticatorRepo;
  protected final WsRequestListRepository wsRequestListRepo;
  protected final MetaViewRepository metaViewRepo;
  protected final MetaActionRepository metaActionRepo;
  protected final WkfModelRepository wkfModelRepo;
  protected final WkfDmnModelRepository wkfDmnModelRepo;
  protected final StudioAppDetachHelper detachHelper;

  @Inject
  public StudioAppUpdateCleanupServiceImpl(
      StudioSelectionRepository studioSelectionRepo,
      MetaJsonModelRepository metaJsonModelRepo,
      MetaJsonFieldRepository metaJsonFieldRepo,
      StudioChartRepository studioChartRepo,
      StudioDashboardRepository studioDashboardRepo,
      StudioDashletRepository studioDashletRepo,
      StudioActionRepository studioActionRepo,
      StudioMenuRepository studioMenuRepo,
      WsRequestRepository wsRequestRepo,
      WsConnectorRepository wsConnectorRepo,
      WsAuthenticatorRepository wsAuthenticatorRepo,
      WsRequestListRepository wsRequestListRepo,
      MetaViewRepository metaViewRepo,
      MetaActionRepository metaActionRepo,
      WkfModelRepository wkfModelRepo,
      WkfDmnModelRepository wkfDmnModelRepo,
      StudioAppDetachHelper detachHelper) {
    this.studioSelectionRepo = studioSelectionRepo;
    this.metaJsonModelRepo = metaJsonModelRepo;
    this.metaJsonFieldRepo = metaJsonFieldRepo;
    this.studioChartRepo = studioChartRepo;
    this.studioDashboardRepo = studioDashboardRepo;
    this.studioDashletRepo = studioDashletRepo;
    this.studioActionRepo = studioActionRepo;
    this.studioMenuRepo = studioMenuRepo;
    this.wsRequestRepo = wsRequestRepo;
    this.wsConnectorRepo = wsConnectorRepo;
    this.wsAuthenticatorRepo = wsAuthenticatorRepo;
    this.wsRequestListRepo = wsRequestListRepo;
    this.metaViewRepo = metaViewRepo;
    this.metaActionRepo = metaActionRepo;
    this.wkfModelRepo = wkfModelRepo;
    this.wkfDmnModelRepo = wkfDmnModelRepo;
    this.detachHelper = detachHelper;
  }

  protected List<EntityDescriptor<?>> buildDescriptors(StudioApp studioApp) {
    Long appId = studioApp.getId();

    return Arrays.asList(
        // 1. MetaJsonField (only direct studioApp link)
        new EntityDescriptor<>(
            "json-field.xml",
            "json-field",
            MetaJsonField.class,
            metaJsonFieldRepo,
            element -> buildJsonFieldKey(element),
            "self.studioApp.id = :appId",
            appId,
            field ->
                buildJsonFieldKeyFromEntity(
                    field.getName(), field.getModel(), field.getModelField(), field.getJsonModel()),
            field -> field.setStudioApp(null)),

        // 2. StudioDashlet
        new EntityDescriptor<>(
            "studio-dashlet.xml",
            "studio-dashlet",
            StudioDashlet.class,
            studioDashletRepo,
            element -> buildDashletKey(element),
            "self.studioApp.id = :appId",
            appId,
            dashlet ->
                dashlet.getName()
                    + "|"
                    + (dashlet.getStudioDashboard() != null
                        ? dashlet.getStudioDashboard().getName()
                        : ""),
            dashlet -> dashlet.setStudioApp(null)),

        // 3. WsRequestList
        new EntityDescriptor<>(
            "ws-request-list.xml",
            "ws-request-list",
            WsRequestList.class,
            wsRequestListRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)),

        // 4. StudioMenu
        new EntityDescriptor<>(
            "studio-menu.xml",
            "studio-menu",
            StudioMenu.class,
            studioMenuRepo,
            element -> getElementText(element, "xmlId"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getXmlId(),
            entity -> entity.setStudioApp(null)),

        // 5. StudioAction
        new EntityDescriptor<>(
            "studio-action.xml",
            "studio-action",
            StudioAction.class,
            studioActionRepo,
            element -> getElementText(element, "xmlId"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getXmlId(),
            entity -> entity.setStudioApp(null)),

        // 6. MetaAction
        new EntityDescriptor<>(
            "meta-action.xml",
            "meta-action",
            MetaAction.class,
            metaActionRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)),

        // 7. MetaView
        new EntityDescriptor<>(
            "meta-view.xml",
            "meta-view",
            MetaView.class,
            metaViewRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)),

        // 8. StudioChart
        new EntityDescriptor<>(
            "studio-chart.xml",
            "studio-chart",
            StudioChart.class,
            studioChartRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)),

        // 9. StudioDashboard
        new EntityDescriptor<>(
            "studio-dashboard.xml",
            "studio-dashboard",
            StudioDashboard.class,
            studioDashboardRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)),

        // 10. MetaJsonModel
        new EntityDescriptor<>(
            "json-model.xml",
            "json-model",
            MetaJsonModel.class,
            metaJsonModelRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)),

        // 11. StudioSelection
        new EntityDescriptor<>(
            "studio-selection.xml",
            "studio-selection",
            StudioSelection.class,
            studioSelectionRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)),

        // 12. WsRequest
        new EntityDescriptor<>(
            "ws-request.xml",
            "ws-request",
            WsRequest.class,
            wsRequestRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)),

        // 13. WsConnector
        new EntityDescriptor<>(
            "ws-connector.xml",
            "ws-connector",
            WsConnector.class,
            wsConnectorRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)),

        // 14. WsAuthenticator
        new EntityDescriptor<>(
            "ws-authenticator.xml",
            "ws-authenticator",
            WsAuthenticator.class,
            wsAuthenticatorRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)),

        // 15. WkfModel
        new EntityDescriptor<>(
            "wkf-model.xml",
            "wkf-model",
            WkfModel.class,
            wkfModelRepo,
            element -> getElementText(element, "code"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getCode(),
            entity -> entity.setStudioApp(null)),

        // 16. WkfDmnModel
        new EntityDescriptor<>(
            "wkf-dmn-model.xml",
            "wkf-dmn-model",
            WkfDmnModel.class,
            wkfDmnModelRepo,
            element -> getElementText(element, "name"),
            "self.studioApp.id = :appId",
            appId,
            entity -> entity.getName(),
            entity -> entity.setStudioApp(null)));
  }

  @Override
  public List<String> detectObsoleteElements(File dataDir, StudioApp studioApp) throws IOException {
    List<String> obsoleteDescriptions = new ArrayList<>();

    for (EntityDescriptor<?> descriptor : buildDescriptors(studioApp)) {
      obsoleteDescriptions.addAll(detectObsoleteForDescriptor(dataDir, descriptor));
    }

    return obsoleteDescriptions;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public List<String> detachObsoleteElements(File dataDir, StudioApp studioApp) throws IOException {
    List<String> detachLog = new ArrayList<>();
    int totalDetached = 0;

    for (EntityDescriptor<?> descriptor : buildDescriptors(studioApp)) {
      File xmlFile = new File(dataDir, descriptor.fileName);
      if (!xmlFile.exists()) {
        continue;
      }
      try {
        Set<String> zipKeys = extractKeysFromXml(dataDir, descriptor);
        totalDetached += callDetachHelper(descriptor, zipKeys, detachLog);
      } catch (Exception e) {
        detachLog.add(
            "Error detaching " + descriptor.entityClass.getSimpleName() + ": " + e.getMessage());
        log.error("Error detaching {}", descriptor.entityClass.getSimpleName(), e);
      }
    }

    if (totalDetached > 0) {
      detachLog.add(
          I18n.get(StudioExceptionMessage.ELEMENTS_DETACHED_SUMMARY).formatted(totalDetached));
    }

    return detachLog;
  }

  private <T extends Model> int callDetachHelper(
      EntityDescriptor<T> descriptor, Set<String> zipKeys, List<String> detachLog) {
    return detachHelper.detachEntities(
        descriptor.repository,
        descriptor.dbFilter,
        descriptor.appId,
        descriptor.keyExtractor,
        descriptor.detacher,
        zipKeys,
        descriptor.entityClass,
        detachLog);
  }

  protected <T extends Model> List<String> detectObsoleteForDescriptor(
      File dataDir, EntityDescriptor<T> descriptor) throws IOException {
    List<String> result = new ArrayList<>();
    File xmlFile = new File(dataDir, descriptor.fileName);

    if (!xmlFile.exists()) {
      return result;
    }

    Set<String> zipKeys = extractKeysFromXml(dataDir, descriptor);
    List<T> existingEntities = fetchExistingEntities(descriptor);

    for (T entity : existingEntities) {
      String entityKey = descriptor.keyExtractor.apply(entity);
      if (entityKey != null && !zipKeys.contains(entityKey)) {
        result.add(descriptor.entityClass.getSimpleName() + ": " + entityKey);
      }
    }

    return result;
  }

  protected <T extends Model> Set<String> extractKeysFromXml(
      File dataDir, EntityDescriptor<T> descriptor) throws IOException {
    Set<String> keys = new LinkedHashSet<>();
    File xmlFile = new File(dataDir, descriptor.fileName);

    if (!xmlFile.exists()) {
      return keys;
    }

    try {
      Document doc =
          XmlUtils.createSecureDocumentBuilderFactory().newDocumentBuilder().parse(xmlFile);
      NodeList nodes = doc.getDocumentElement().getElementsByTagName(descriptor.xmlTag);

      for (int i = 0; i < nodes.getLength(); i++) {
        Element element = (Element) nodes.item(i);
        String key = descriptor.xmlKeyExtractor.apply(element);
        if (key != null && !key.isEmpty()) {
          keys.add(key);
        }
      }
    } catch (Exception e) {
      throw new IOException("Failed to parse " + descriptor.fileName, e);
    }

    return keys;
  }

  protected <T extends Model> List<T> fetchExistingEntities(EntityDescriptor<T> descriptor) {
    return descriptor
        .repository
        .all()
        .filter(descriptor.dbFilter)
        .bind("appId", descriptor.appId)
        .fetch();
  }

  protected String getElementText(Element parent, String tagName) {
    NodeList nodes = parent.getElementsByTagName(tagName);
    if (nodes.getLength() > 0 && nodes.item(0).getTextContent() != null) {
      String text = nodes.item(0).getTextContent().trim();
      return text.isEmpty() ? null : text;
    }
    return null;
  }

  protected String buildJsonFieldKey(Element element) {
    String name = getElementText(element, "name");
    String model = getElementText(element, "model");
    String modelField = getElementText(element, "modelField");
    String jsonModel = getElementText(element, "jsonModel");
    if (name == null) {
      return null;
    }
    return name
        + "|"
        + (model != null ? model : "")
        + "|"
        + (modelField != null ? modelField : "")
        + "|"
        + (jsonModel != null ? jsonModel : "");
  }

  protected String buildJsonFieldKeyFromEntity(
      String name, String model, String modelField, MetaJsonModel jsonModel) {
    if (name == null) {
      return null;
    }
    return name
        + "|"
        + (model != null ? model : "")
        + "|"
        + (modelField != null ? modelField : "")
        + "|"
        + (jsonModel != null ? jsonModel.getName() : "");
  }

  protected String buildDashletKey(Element element) {
    String name = getElementText(element, "name");
    String dashboard = getElementText(element, "studioDashboard");
    if (name == null) {
      return null;
    }
    return name + "|" + (dashboard != null ? dashboard : "");
  }

  protected static class EntityDescriptor<T extends Model> {
    final String fileName;
    final String xmlTag;
    final Class<T> entityClass;
    final JpaRepository<T> repository;
    final Function<Element, String> xmlKeyExtractor;
    final String dbFilter;
    final Long appId;
    final Function<T, String> keyExtractor;
    final Consumer<T> detacher;

    EntityDescriptor(
        String fileName,
        String xmlTag,
        Class<T> entityClass,
        JpaRepository<T> repository,
        Function<Element, String> xmlKeyExtractor,
        String dbFilter,
        Long appId,
        Function<T, String> keyExtractor,
        Consumer<T> detacher) {
      this.fileName = fileName;
      this.xmlTag = xmlTag;
      this.entityClass = entityClass;
      this.repository = repository;
      this.xmlKeyExtractor = xmlKeyExtractor;
      this.dbFilter = dbFilter;
      this.appId = appId;
      this.keyExtractor = keyExtractor;
      this.detacher = detacher;
    }
  }
}
