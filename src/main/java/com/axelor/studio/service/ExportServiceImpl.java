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

    String xml = "";

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

      xml +=
          indent
              + "<line>"
              + indentPlus
              + "<target>"
              + target
              + "</target>"
              + indentPlus
              + "<source>"
              + source
              + "</source>"
              + indentPlus
              + "<metaJsonField>"
              + (line.getMetaJsonField() != null ? line.getMetaJsonField().getName() : "")
              + "</metaJsonField>"
              + indentPlus
              + "<metaField>"
              + (line.getMetaField() != null ? line.getMetaField().getName() : "")
              + "</metaField>"
              + indentPlus
              + "<valueJson>"
              + (line.getValueJson() != null ? line.getValueJson().getName() : "")
              + "</valueJson>"
              + indentPlus
              + "<valueField>"
              + (line.getValueField() != null ? line.getValueField().getName() : "")
              + "</valueField>"
              + indentPlus
              + "<value>"
              + (line.getValue() != null ? line.getValue() : "")
              + "</value>"
              + indentPlus
              + "<conditionText>"
              + (line.getConditionText() != null
                  ? StringEscapeUtils.escapeXml11(
                      StringEscapeUtils.escapeXml11(line.getConditionText()))
                  : "")
              + "</conditionText>"
              + indentPlus
              + "<filter>"
              + (line.getFilter() != null ? line.getFilter() : "")
              + "</filter>"
              + indentPlus
              + "<validationTypeSelect>"
              + (line.getValidationTypeSelect() != null ? line.getValidationTypeSelect() : "")
              + "</validationTypeSelect>"
              + indentPlus
              + "<validationMsg>"
              + (line.getValidationMsg() != null ? line.getValidationMsg() : "")
              + "</validationMsg>"
              + indentPlus
              + "<name>"
              + (line.getName() != null ? line.getName() : "")
              + "</name>"
              + indentPlus
              + "<dummy>"
              + (line.getDummy() != null ? line.getDummy() : "")
              + "</dummy>"
              + indentPlus
              + "<subLines>"
              + exportStudioActionLines(line.getSubLines(), count + 2)
              + indentPlus
              + "</subLines>"
              + indent
              + "</line>";
    }

    return StringEscapeUtils.unescapeXml(xml);
  }

  @Override
  public String exportWsKeyValueLines(List<WsKeyValue> wsKeyValues, int count, String type) {
    String xml = "";

    String indent = "\n" + Strings.repeat("\t", count);
    String indentPlus = "\n" + Strings.repeat("\t", count + 1);

    for (WsKeyValue wsKeyValue : wsKeyValues) {
      xml +=
          indent
              + "<"
              + type
              + ">"
              + indentPlus
              + "<key>"
              + (wsKeyValue.getWsKey() != null ? wsKeyValue.getWsKey() : "")
              + "</key>"
              + indentPlus
              + "<value>"
              + (wsKeyValue.getWsValue() != null ? wsKeyValue.getWsValue() : "")
              + "</value>"
              + indentPlus
              + "<isList>"
              + wsKeyValue.getIsList()
              + "</isList>"
              + indentPlus
              + "<subWsKeyValues>"
              + exportWsKeyValueLines(wsKeyValue.getSubWsKeyValueList(), count + 2, type)
              + indentPlus
              + "</subWsKeyValues>"
              + indent
              + "</"
              + type
              + ">";
    }

    return StringEscapeUtils.unescapeXml(xml);
  }

  @Override
  public String exportWsKeyValueHeadersLines(
      List<WsKeyValueSelectionHeader> wsKeyValues, int count, String type) {
    String xml = "";

    String indent = "\n" + Strings.repeat("\t", count);
    String indentPlus = "\n" + Strings.repeat("\t", count + 1);

    for (WsKeyValueSelectionHeader wsKeyValue : wsKeyValues) {
      xml +=
          indent
              + "<"
              + type
              + ">"
              + indentPlus
              + "<key>"
              + (wsKeyValue.getWsKey() != null ? wsKeyValue.getWsKey() : "")
              + "</key>"
              + indentPlus
              + "<value>"
              + (wsKeyValue.getWsValue() != null ? wsKeyValue.getWsValue() : "")
              + "</value>"
              + indentPlus
              + "<isList>"
              + wsKeyValue.getIsList()
              + "</isList>"
              + indentPlus
              + "<subWsKeyValues>"
              + exportWsKeyValueHeadersLines(wsKeyValue.getSubWsKeyValueList(), count + 2, type)
              + indentPlus
              + "</subWsKeyValues>"
              + indent
              + "</"
              + type
              + ">";
    }

    return StringEscapeUtils.unescapeXml(xml);
  }

  @Override
  public String exportRequests(List<WsRequestList> wsRequests, int count, String type) {
    String xml = "";

    String indent = "\n" + Strings.repeat("\t", count);
    String indentPlus = "\n" + Strings.repeat("\t", count + 1);

    for (WsRequestList wsRequest : wsRequests) {
      xml +=
          indent
              + "<"
              + type
              + ">"
              + indentPlus
              + "<name>"
              + wsRequest.getName()
              + "</name>"
              + indent
              + "</"
              + type
              + ">";
    }

    return StringEscapeUtils.unescapeXml(xml);
  }

  @Override
  public String exportConnectors(List<WsConnector> wsConnectors, int count, String type) {
    String xml = "";

    String indent = "\n" + Strings.repeat("\t", count);
    String indentPlus = "\n" + Strings.repeat("\t", count + 1);

    for (WsConnector wsConnector : wsConnectors) {
      xml +=
          indent
              + "<"
              + type
              + ">"
              + indentPlus
              + "<name>"
              + wsConnector.getName()
              + "</name>"
              + indent
              + "</"
              + type
              + ">";
    }

    return StringEscapeUtils.unescapeXml(xml);
  }
}
