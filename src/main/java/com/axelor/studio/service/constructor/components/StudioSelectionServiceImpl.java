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
package com.axelor.studio.service.constructor.components;

import com.axelor.meta.MetaStore;
import com.axelor.meta.db.MetaSelect;
import com.axelor.meta.db.MetaSelectItem;
import com.axelor.meta.db.repo.MetaSelectRepository;
import com.axelor.meta.schema.views.Selection.Option;
import com.axelor.studio.db.StudioApp;
import com.axelor.studio.db.StudioSelection;
import com.axelor.studio.db.repo.StudioSelectionRepository;
import com.google.common.base.Joiner;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

public class StudioSelectionServiceImpl implements StudioSelectionService {

  protected static final String TITLE = "title";
  protected static final String VALUE = "value";
  protected static final String COLOR = "color";
  protected static final String ICON = "icon";

  protected MetaSelectRepository metaSelectRepository;

  protected StudioSelectionRepository studioSelectionRepo;

  @Inject
  public StudioSelectionServiceImpl(
      MetaSelectRepository metaSelectRepository, StudioSelectionRepository studioSelectionRepo) {
    this.metaSelectRepository = metaSelectRepository;
    this.studioSelectionRepo = studioSelectionRepo;
  }

  @Override
  public List<Map<String, String>> createSelectionText(String selectionName) {
    List<Map<String, String>> optionMapList = new ArrayList<>();

    List<Option> options = MetaStore.getSelectionList(selectionName);
    if (CollectionUtils.isEmpty(options)) {
      return optionMapList;
    }

    options.stream()
        .filter(option -> option.getHidden() == null || !option.getHidden())
        .forEach(
            option -> {
              Map<String, String> optionMap = new LinkedHashMap<>();

              if (option.getValue().equals(option.getTitle())) {
                optionMap.put(VALUE, option.getValue());
              } else {
                optionMap.put(TITLE, option.getTitle());
                optionMap.put(VALUE, option.getValue());
              }
              if (!StringUtils.isBlank(option.getColor())) {
                optionMap.put(COLOR, option.getColor());
              }
              if (!StringUtils.isBlank(option.getIcon())) {
                optionMap.put(ICON, option.getIcon());
              }
              optionMapList.add(optionMap);
            });
    return optionMapList;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void removeStudioSelection(String name) {
    if (name == null) {
      return;
    }

    StudioSelection studioSelection = studioSelectionRepo.findByName(name);

    if (studioSelection != null) {
      studioSelectionRepo.remove(studioSelection);
    }
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public void removeSelection(String name, String xmlId) {

    if (name == null && xmlId == null) {
      return;
    }

    MetaSelect metaSelect = xmlId != null ? findMetaSelectById(xmlId) : findMetaSelectByName(name);

    if (metaSelect != null) {
      metaSelectRepository.remove(metaSelect);
    }
  }

  @Override
  public void build(StudioSelection studioSelection) {

    String xmlId = SELECTION_PREFIX + studioSelection.getName().replace(" ", "-");

    updateMetaSelectFromText(
        studioSelection.getSelectionText(),
        studioSelection.getName(),
        studioSelection.getStudioApp(),
        xmlId);
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public String updateMetaSelectFromText(
      String selectionText, String name, StudioApp studioApp, String xmlId) {

    if (name == null && xmlId == null) {
      return null;
    }

    MetaSelect metaSelect = updateSelectItems(selectionText, name, xmlId);

    metaSelect.setIsCustom(true);
    metaSelect.setStudioApp(studioApp);
    metaSelect.setName(name);

    if (xmlId != null) {
      Integer priority = getPriority(name, xmlId);
      if (priority != null) {
        metaSelect.setPriority(priority);
      }
      metaSelect.setXmlId(xmlId);
    }

    metaSelectRepository.save(metaSelect);

    return name;
  }

  @Override
  public MetaSelect updateSelectItems(String selectionText, String name, String xmlId) {

    MetaSelect metaSelect = xmlId != null ? findMetaSelectById(xmlId) : findMetaSelectByName(name);

    Map<String, MetaSelectItem> itemMap = new HashMap<>();

    if (metaSelect == null) {
      metaSelect = new MetaSelect(name);
    } else {
      metaSelect.getItems().forEach(item -> itemMap.put(item.getValue(), item));
    }
    metaSelect.clearItems();

    List<Map<String, String>> optionMapList = getSelectOptions(selectionText);

    int order = 1;
    for (Map<String, String> optionMap : optionMapList) {
      MetaSelectItem metaSelectItem = updateItem(itemMap, order, optionMap);
      metaSelect.addItem(metaSelectItem);
      order++;
    }
    return metaSelect;
  }

  @Override
  public MetaSelectItem updateItem(
      Map<String, MetaSelectItem> itemMap, int order, Map<String, String> optionMap) {

    String title = null;
    String value = null;
    if (optionMap.containsKey(TITLE)) {
      title = optionMap.get(TITLE);
      value = optionMap.get(VALUE);
    } else {
      title = optionMap.get(VALUE);
      value = title;
    }
    String color = optionMap.get(COLOR);
    String icon = optionMap.get(ICON);

    MetaSelectItem metaSelectItem = itemMap.get(value);
    if (metaSelectItem == null) {
      metaSelectItem = new MetaSelectItem();
    }

    metaSelectItem.setTitle(title);
    metaSelectItem.setValue(value);
    metaSelectItem.setOrder(order);
    metaSelectItem.setColor(color);
    metaSelectItem.setIcon(icon);

    return metaSelectItem;
  }

  @Override
  public MetaSelect findMetaSelectByName(String name) {

    return metaSelectRepository
        .all()
        .filter("self.name = ?1 and self.isCustom is true", name)
        .fetchOne();
  }

  @Override
  public MetaSelect findMetaSelectById(String xmlId) {

    return metaSelectRepository
        .all()
        .filter("self.xmlId = ?1 and self.isCustom is true", xmlId)
        .fetchOne();
  }

  @Override
  public Integer getPriority(String name, String xmlId) {

    MetaSelect metaSelect =
        metaSelectRepository
            .all()
            .filter("(self.xmlId is null OR self.xmlId != ?1) and self.name = ?2", xmlId, name)
            .fetchOne();

    if (metaSelect != null) {
      return metaSelect.getPriority() + 1;
    }

    return null;
  }

  @Override
  public String generateSelectionText(List<Map<String, String>> selectOptions) {
    List<String> options = new ArrayList<>();

    if (CollectionUtils.isEmpty(selectOptions)) {
      return Joiner.on("\n").join(options);
    }

    selectOptions.forEach(
        option -> {
          if (!option.containsKey(TITLE)) {
            options.add(option.get(VALUE));
          } else {
            options.add(option.get(VALUE) + ":" + option.get(TITLE));
          }

          String color = option.get(COLOR);
          if (StringUtils.isNotBlank(color)) {
            options.add(COLOR + ":" + color);
          }

          String icon = option.get(ICON);
          if (StringUtils.isNotBlank(icon)) {
            options.add(ICON + ":" + icon);
          }
        });
    return Joiner.on("\n").join(options);
  }

  @Override
  public List<Map<String, String>> getSelectOptions(String selectionText) {
    List<Map<String, String>> optionMapList = new ArrayList<>();

    if (StringUtils.isBlank(selectionText)) {
      return optionMapList;
    }

    String[] selection = selectionText.trim().split("\n");

    Map<String, String> optionMap = null;

    for (String option : selection) {
      option = option.trim();
      if (option.isEmpty()) {
        continue;
      }

      String key = StringUtils.substringBefore(option, ":");
      String value = StringUtils.substringAfter(option, ":");

      if (key.equals(COLOR) && optionMap != null) {
        optionMap.put(COLOR, value);

      } else if (key.equals(ICON) && optionMap != null) {
        optionMap.put(ICON, value);

      } else {
        optionMap = new LinkedHashMap<>();
        if (option.contains(":")) {
          optionMap.put(TITLE, value);
          optionMap.put(VALUE, key);
        } else {
          optionMap.put(VALUE, key);
        }
        optionMapList.add(optionMap);
      }
    }
    return optionMapList;
  }

  @Override
  @Transactional(rollbackOn = Exception.class)
  public StudioSelection createStudioSelection(
      String selectionText, String name, StudioApp studioApp) {

    StudioSelection studioSelection = studioSelectionRepo.findByName(name);
    if (studioSelection == null) {
      studioSelection = new StudioSelection();
      studioSelection.setName(name);
    }
    studioSelection.setSelectionText(selectionText);
    studioSelection.setStudioApp(studioApp);
    return studioSelectionRepo.save(studioSelection);
  }
}
