/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.dmn.service;

import com.axelor.meta.db.MetaFile;
import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.db.WkfDmnModel;
import com.axelor.studio.db.repo.WkfDmnModelRepository;
import com.axelor.utils.service.reader.DataReader;
import com.axelor.utils.service.reader.DataReaderFactory;
import com.google.common.io.Files;
import com.google.inject.Inject;
import com.google.inject.persist.Transactional;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.Objects;
import org.apache.commons.lang3.StringUtils;
import org.camunda.bpm.model.dmn.Dmn;
import org.camunda.bpm.model.dmn.DmnModelInstance;
import org.camunda.bpm.model.dmn.instance.DecisionTable;
import org.camunda.bpm.model.dmn.instance.Description;
import org.camunda.bpm.model.dmn.instance.Input;
import org.camunda.bpm.model.dmn.instance.InputEntry;
import org.camunda.bpm.model.dmn.instance.Output;
import org.camunda.bpm.model.dmn.instance.OutputEntry;
import org.camunda.bpm.model.dmn.instance.Rule;
import org.camunda.bpm.model.dmn.instance.Text;

public class DmnImportServiceImpl implements DmnImportService {

  protected static final String SPACE_PATTERN = "(?m)^[ \t]*\r?\n";
  protected static final String RULE = "row-";
  protected static final String INPUT_ENTRY = "UnaryTests_";
  protected static final String OUTPUT_ENTRY = "LiteralExpression_";
  protected static final String EXPR_LANG = "groovy";

  protected DataReaderFactory dataReaderFactory;

  protected WkfDmnModelRepository dmnModelRepo;

  @Inject
  public DmnImportServiceImpl(
      DataReaderFactory dataReaderFactory, WkfDmnModelRepository dmnModelRepo) {
    this.dataReaderFactory = dataReaderFactory;
    this.dmnModelRepo = dmnModelRepo;
  }

  @Override
  public void importDmnTable(MetaFile dataFile, WkfDmnModel dmnModel) {

    String extension = Files.getFileExtension(dataFile.getFileName());
    if (extension == null || (!extension.equals("xlsx") && !extension.equals("xls"))) {
      throw new IllegalStateException(BpmExceptionMessage.INVALID_IMPORT_FILE);
    }

    DataReader reader = dataReaderFactory.getDataReader(extension);
    reader.initialize(dataFile, null);

    this.process(reader, dmnModel);
  }

  @Transactional(rollbackOn = Exception.class)
  public void process(DataReader reader, WkfDmnModel dmnModel) {
    DmnModelInstance dmnModelInstance =
        Dmn.readModelFromStream(new ByteArrayInputStream(dmnModel.getDiagramXml().getBytes()));

    String[] sheets = reader.getSheetNames();
    int counter = 1;

    for (String sheet : sheets) {
      DecisionTable table = this.getDecisionTable(sheet, dmnModelInstance);
      if (table == null) {
        continue;
      }

      int totalLines = reader.getTotalLines(sheet);
      if (totalLines == 0) {
        continue;
      }

      table.getRules().clear();

      String[] headerRow = reader.read(sheet, 1, 0);

      for (int i = 2; i < totalLines; i++) {
        String[] row = reader.read(sheet, i, headerRow.length);
        if (row == null || row.length == 0 || Arrays.stream(row).noneMatch(Objects::nonNull)) {
          continue;
        }
        Rule rule = dmnModelInstance.newInstance(Rule.class);
        rule.setId(RULE + i + counter);

        for (int j = 0; j < row.length; j++) {
          String value = StringUtils.isBlank(row[j]) ? null : row[j].trim();

          Object entryObj = this.checkEntry(headerRow, j, table);
          if (entryObj == null) {
            continue;
          }
          rule = this.createEntries(entryObj, value, j, i, counter, rule, dmnModelInstance);
        }

        if (rule.getOutputEntries().isEmpty()) {
          throw new IllegalStateException(BpmExceptionMessage.EMPTY_OUTPUT_COLUMN);
        }
        table.getRules().add(rule);
      }
      counter++;
    }

    String diagramXml = Dmn.convertToString(dmnModelInstance);
    diagramXml = diagramXml.replaceAll(SPACE_PATTERN, "");
    dmnModel.setDiagramXml(diagramXml);
    dmnModelRepo.save(dmnModel);
  }

  protected DecisionTable getDecisionTable(String sheet, DmnModelInstance dmnModelInstance) {
    return dmnModelInstance.getModelElementsByType(DecisionTable.class).stream()
        .filter(tbl -> tbl.getParentElement().getAttributeValue("id").equals(sheet))
        .findAny()
        .orElse(null);
  }

  protected Object checkEntry(String[] headerRow, int cellIndex, DecisionTable table) {

    if (StringUtils.isBlank(headerRow[cellIndex])) {
      throw new IllegalStateException(BpmExceptionMessage.INVALID_HEADER);
    }

    String header = headerRow[cellIndex].trim();
    String label = StringUtils.substringBefore(header, "(").trim();
    String id =
        header.contains("(") && header.contains(")")
            ? StringUtils.substringBetween(header, "(", ")").trim()
            : null;

    Input input =
        table.getInputs().stream()
            .filter(ip -> ip.getLabel().equals(label) && ip.getId().equals(id))
            .findAny()
            .orElse(null);
    if (input != null) {
      return input;
    }

    Output output =
        table.getOutputs().stream()
            .filter(op -> op.getLabel().equals(label) && op.getId().equals(id))
            .findAny()
            .orElse(null);
    if (output != null) {
      return output;
    }

    if (header.equals("Annotation")) {
      return header;
    }

    throw new IllegalStateException(BpmExceptionMessage.INVALID_HEADER);
  }

  protected Rule createEntries(
      Object entryObj,
      String value,
      int j,
      int i,
      int counter,
      Rule rule,
      DmnModelInstance dmnModelInstance) {

    if (entryObj instanceof Input) {
      InputEntry ie = dmnModelInstance.newInstance(InputEntry.class);
      ie.setId(INPUT_ENTRY + j + i + counter);
      ie.setExpressionLanguage(EXPR_LANG);
      Text text = dmnModelInstance.newInstance(Text.class);
      text.setTextContent(value);
      ie.setText(text);
      rule.getInputEntries().add(ie);

    } else if (entryObj instanceof Output) {
      OutputEntry oe = dmnModelInstance.newInstance(OutputEntry.class);
      oe.setId(OUTPUT_ENTRY + j + i + counter);
      oe.setExpressionLanguage(EXPR_LANG);
      Text text = dmnModelInstance.newInstance(Text.class);
      text.setTextContent(value);
      oe.setText(text);
      rule.getOutputEntries().add(oe);

    } else if (entryObj.equals("Annotation")) {
      Description desc = dmnModelInstance.newInstance(Description.class);
      desc.setTextContent(value);
      rule.setDescription(desc);
    }

    return rule;
  }
}
