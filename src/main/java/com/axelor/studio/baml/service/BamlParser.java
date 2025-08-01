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
package com.axelor.studio.baml.service;

import com.axelor.studio.baml.xml.ProcessActionRootNode;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.common.io.Resources;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.Marshaller;
import jakarta.xml.bind.Unmarshaller;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import javax.xml.XMLConstants;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;

public class BamlParser {

  public static ProcessActionRootNode parse(InputStream xml) {

    try {

      JAXBContext jaxbContext = JAXBContext.newInstance(ProcessActionRootNode.class);
      Unmarshaller unmarshaller = jaxbContext.createUnmarshaller();
      SchemaFactory schemaFactory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
      Schema schema = schemaFactory.newSchema(Resources.getResource("xsd/baml.xsd"));
      unmarshaller.setSchema(schema);

      return (ProcessActionRootNode) unmarshaller.unmarshal(xml);

    } catch (Exception e) {
      ExceptionHelper.error(e);
    }

    return null;
  }

  public static String createEmptyBamlXml() {

    try {

      JAXBContext jaxbContext = JAXBContext.newInstance(ProcessActionRootNode.class);
      Marshaller marshaller = jaxbContext.createMarshaller();
      ProcessActionRootNode rootNode = new ProcessActionRootNode();

      ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
      marshaller.setProperty(Marshaller.JAXB_FRAGMENT, true);
      marshaller.marshal(rootNode, byteArrayOutputStream);

      return byteArrayOutputStream.toString();

    } catch (Exception e) {
      ExceptionHelper.error(e);
    }

    return null;
  }
}
