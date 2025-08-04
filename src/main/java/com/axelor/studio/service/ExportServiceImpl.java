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

import com.axelor.meta.MetaFiles;
import com.axelor.meta.db.MetaFile;
import com.axelor.studio.db.*;
import com.axelor.studio.db.repo.StudioActionRepository;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.common.base.Strings;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import org.apache.commons.io.IOUtils;
import org.apache.commons.text.StringEscapeUtils;

public class ExportServiceImpl implements ExportService {

  @Override
  public String getImage(MetaFile metaFile) {

    if (metaFile != null) {
      File file = MetaFiles.getPath(metaFile).toFile();
      if (file != null) {
        try {
          byte[] img = IOUtils.toByteArray(new FileInputStream(file));
          return Base64.getEncoder().encodeToString(img);
        } catch (IOException e) {
          ExceptionHelper.error(e);
        }
      }
    }

    return "";
  }

  @Override
  public String exportStudioActionLines(List<StudioActionLine> lines, int count) {

    StringBuilder xml = new StringBuilder();

    String indent = "\n" + Strings.repeat("\t", count);
    String indentPlus = "\n" + Strings.repeat("\t", count + 1);
    for (StudioActionLine line : lines) {

      String source = "";
      String target = "";

      if (line.getParent() == null) {
        StudioAction studioAction = line.getStudioAction();
        if (studioAction != null) {
          target = studioAction.getTargetModel();
          source = studioAction.getModel();
          if (studioAction.getTypeSelect() == StudioActionRepository.TYPE_SELECT_UPDATE) {
            target = studioAction.getModel();
          }
        }
      } else {
        StudioActionLine parent = line.getParent();
        if (parent.getMetaField() != null) target = parent.getMetaField().getTypeName();
        if (parent.getMetaJsonField() != null && parent.getMetaJsonField().getTargetModel() != null)
          target = parent.getMetaJsonField().getTargetModel();
        if (parent.getMetaJsonField() != null
            && parent.getMetaJsonField().getTargetJsonModel() != null)
          target = parent.getMetaJsonField().getTargetJsonModel().getName();
        if (parent.getValueField() != null)
          source = parent.getValueField().getMetaModel().getFullName();
        if (parent.getValueJson() != null && parent.getValueJson().getTargetModel() != null)
          source = parent.getValueJson().getTargetModel();
        if (parent.getValueJson() != null && parent.getValueJson().getTargetJsonModel() != null)
          source = parent.getValueJson().getTargetJsonModel().getName();
      }

      xml.append(indent)
          .append("<line>")
          .append(indentPlus)
          .append("<target>")
          .append(target)
          .append("</target>")
          .append(indentPlus)
          .append("<source>")
          .append(source)
          .append("</source>")
          .append(indentPlus)
          .append("<metaJsonField>")
          .append(line.getMetaJsonField() != null ? line.getMetaJsonField().getName() : "")
          .append("</metaJsonField>")
          .append(indentPlus)
          .append("<metaField>")
          .append(line.getMetaField() != null ? line.getMetaField().getName() : "")
          .append("</metaField>")
          .append(indentPlus)
          .append("<valueJson>")
          .append(line.getValueJson() != null ? line.getValueJson().getName() : "")
          .append("</valueJson>")
          .append(indentPlus)
          .append("<valueField>")
          .append(line.getValueField() != null ? line.getValueField().getName() : "")
          .append("</valueField>")
          .append(indentPlus)
          .append("<value>")
          .append(line.getValue() != null ? line.getValue() : "")
          .append("</value>")
          .append(indentPlus)
          .append("<conditionText>")
          .append(
              line.getConditionText() != null
                  ? StringEscapeUtils.escapeXml11(
                      StringEscapeUtils.escapeXml11(line.getConditionText()))
                  : "")
          .append("</conditionText>")
          .append(indentPlus)
          .append("<filter>")
          .append(line.getFilter() != null ? line.getFilter() : "")
          .append("</filter>")
          .append(indentPlus)
          .append("<validationTypeSelect>")
          .append(line.getValidationTypeSelect() != null ? line.getValidationTypeSelect() : "")
          .append("</validationTypeSelect>")
          .append(indentPlus)
          .append("<validationMsg>")
          .append(line.getValidationMsg() != null ? line.getValidationMsg() : "")
          .append("</validationMsg>")
          .append(indentPlus)
          .append("<name>")
          .append(line.getName() != null ? line.getName() : "")
          .append("</name>")
          .append(indentPlus)
          .append("<dummy>")
          .append(line.getDummy() != null ? line.getDummy() : "")
          .append("</dummy>")
          .append(indentPlus)
          .append("<subLines>")
          .append(exportStudioActionLines(line.getSubLines(), count + 2))
          .append(indentPlus)
          .append("</subLines>")
          .append(indent)
          .append("</line>");
    }

    return StringEscapeUtils.unescapeXml(xml.toString());
  }

  @Override
  public String exportWsKeyValueLines(List<WsKeyValue> wsKeyValues, int count, String type) {
    StringBuilder xml = new StringBuilder();

    String indent = "\n" + Strings.repeat("\t", count);
    String indentPlus = "\n" + Strings.repeat("\t", count + 1);

    for (WsKeyValue wsKeyValue : wsKeyValues) {
      xml.append(indent)
          .append("<")
          .append(type)
          .append(">")
          .append(indentPlus)
          .append("<key>")
          .append(wsKeyValue.getWsKey() != null ? wsKeyValue.getWsKey() : "")
          .append("</key>")
          .append(indentPlus)
          .append("<value>")
          .append(wsKeyValue.getWsValue() != null ? wsKeyValue.getWsValue() : "")
          .append("</value>")
          .append(indentPlus)
          .append("<isList>")
          .append(wsKeyValue.getIsList())
          .append("</isList>")
          .append(indentPlus)
          .append("<subWsKeyValues>")
          .append(exportWsKeyValueLines(wsKeyValue.getSubWsKeyValueList(), count + 2, type))
          .append(indentPlus)
          .append("</subWsKeyValues>")
          .append(indent)
          .append("</")
          .append(type)
          .append(">");
    }

    return StringEscapeUtils.unescapeXml(xml.toString());
  }

  @Override
  public String exportWsKeyValueHeadersLines(
      List<WsKeyValueSelectionHeader> wsKeyValues, int count, String type) {
    StringBuilder xml = new StringBuilder();

    String indent = "\n" + Strings.repeat("\t", count);
    String indentPlus = "\n" + Strings.repeat("\t", count + 1);

    for (WsKeyValueSelectionHeader wsKeyValue : wsKeyValues) {
      xml.append(indent)
          .append("<")
          .append(type)
          .append(">")
          .append(indentPlus)
          .append("<key>")
          .append(wsKeyValue.getWsKey() != null ? wsKeyValue.getWsKey() : "")
          .append("</key>")
          .append(indentPlus)
          .append("<value>")
          .append(wsKeyValue.getWsValue() != null ? wsKeyValue.getWsValue() : "")
          .append("</value>")
          .append(indentPlus)
          .append("<isList>")
          .append(wsKeyValue.getIsList())
          .append("</isList>")
          .append(indentPlus)
          .append("<subWsKeyValues>")
          .append(exportWsKeyValueHeadersLines(wsKeyValue.getSubWsKeyValueList(), count + 2, type))
          .append(indentPlus)
          .append("</subWsKeyValues>")
          .append(indent)
          .append("</")
          .append(type)
          .append(">");
    }

    return StringEscapeUtils.unescapeXml(xml.toString());
  }

  @Override
  public String exportRequests(List<WsRequestList> wsRequests, int count, String type) {
    StringBuilder xml = new StringBuilder();

    String indent = "\n" + Strings.repeat("\t", count);
    String indentPlus = "\n" + Strings.repeat("\t", count + 1);

    for (WsRequestList wsRequest : wsRequests) {
      xml.append(indent)
          .append("<")
          .append(type)
          .append(">")
          .append(indentPlus)
          .append("<name>")
          .append(wsRequest.getName())
          .append("</name>")
          .append(indent)
          .append("</")
          .append(type)
          .append(">");
    }

    return StringEscapeUtils.unescapeXml(xml.toString());
  }

  @Override
  public String exportConnectors(List<WsConnector> wsConnectors, int count, String type) {
    StringBuilder xml = new StringBuilder();

    String indent = "\n" + Strings.repeat("\t", count);
    String indentPlus = "\n" + Strings.repeat("\t", count + 1);

    for (WsConnector wsConnector : wsConnectors) {
      xml.append(indent)
          .append("<")
          .append(type)
          .append(">")
          .append(indentPlus)
          .append("<name>")
          .append(wsConnector.getName())
          .append("</name>")
          .append(indent)
          .append("</")
          .append(type)
          .append(">");
    }

    return StringEscapeUtils.unescapeXml(xml.toString());
  }
}
