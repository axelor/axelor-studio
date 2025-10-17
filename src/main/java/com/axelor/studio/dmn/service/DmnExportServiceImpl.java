/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.dmn.service;

import com.axelor.studio.bpm.exception.BpmExceptionMessage;
import com.axelor.studio.db.WkfDmnModel;
import com.axelor.utils.helpers.ExceptionHelper;
import com.google.common.base.Strings;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Collection;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.camunda.bpm.model.dmn.Dmn;
import org.camunda.bpm.model.dmn.DmnModelInstance;
import org.camunda.bpm.model.dmn.instance.DecisionTable;
import org.camunda.bpm.model.dmn.instance.Input;
import org.camunda.bpm.model.dmn.instance.InputEntry;
import org.camunda.bpm.model.dmn.instance.Output;
import org.camunda.bpm.model.dmn.instance.OutputEntry;
import org.camunda.bpm.model.dmn.instance.Rule;

public class DmnExportServiceImpl implements DmnExportService {

  protected Workbook workbook;

  @Override
  public File exportDmnTable(WkfDmnModel wkfDmnModel) {
    if (wkfDmnModel.getDiagramXml() == null) {
      return null;
    }

    workbook = new XSSFWorkbook();
    File exportFile = null;

    try {
      exportFile = File.createTempFile(wkfDmnModel.getName(), ".xlsx");
    } catch (IOException e) {
      ExceptionHelper.error(e);
    }

    DmnModelInstance dmnModelInstance =
        Dmn.readModelFromStream(new ByteArrayInputStream(wkfDmnModel.getDiagramXml().getBytes()));

    Collection<DecisionTable> tables = dmnModelInstance.getModelElementsByType(DecisionTable.class);
    this.processTables(tables);

    FileOutputStream fout;
    try {
      fout = new FileOutputStream(exportFile);
      workbook.write(fout);
      fout.close();
    } catch (Exception e) {
      ExceptionHelper.error(e);
    }
    return exportFile;
  }

  protected void processTables(Collection<DecisionTable> tables) {
    tables.forEach(
        table -> {
          Sheet sheet = workbook.createSheet(table.getParentElement().getAttributeValue("id"));
          this.createHeaderRow(sheet, table);
          this.createDataRow(sheet, table);
        });
  }

  protected void createHeaderRow(Sheet sheet, DecisionTable table) {
    Row titleRow = sheet.createRow(sheet.getLastRowNum());
    Cell titleCell = titleRow.createCell(0);
    titleCell.setCellValue(table.getParentElement().getAttributeValue("name"));
    sheet.autoSizeColumn(0);

    Row row = sheet.createRow(sheet.getLastRowNum() + 1);
    int inputIndex = 0;
    for (Input input : table.getInputs()) {
      if (Strings.isNullOrEmpty(input.getLabel())) {
        throw new IllegalStateException(BpmExceptionMessage.MISSING_INPUT_LABEL);
      }
      Cell cell = row.createCell(inputIndex);
      cell.setCellValue(input.getLabel() + "(" + input.getId() + ")");
      sheet.autoSizeColumn(inputIndex);
      inputIndex++;
    }

    int outputIndex = row.getLastCellNum();
    for (Output output : table.getOutputs()) {
      if (Strings.isNullOrEmpty(output.getLabel())) {
        throw new IllegalStateException(BpmExceptionMessage.MISSING_OUTPUT_LABEL);
      }
      Cell cell = row.createCell(outputIndex);
      cell.setCellValue(output.getLabel() + "(" + output.getId() + ")");
      sheet.autoSizeColumn(outputIndex);
      outputIndex++;
    }

    Cell cell = row.createCell(outputIndex);
    cell.setCellValue("Annotation");
    sheet.autoSizeColumn(outputIndex);
  }

  protected void createDataRow(Sheet sheet, DecisionTable table) {
    int index = sheet.getLastRowNum() + 1;
    for (Rule rule : table.getRules()) {
      Row row = sheet.createRow(index);
      int ipCellIndex = 0;
      for (InputEntry ie : rule.getInputEntries()) {
        Cell cell = row.createCell(ipCellIndex);
        cell.setCellValue(ie.getTextContent());
        sheet.autoSizeColumn(ipCellIndex);
        ipCellIndex++;
      }

      int opCellIndex = row.getLastCellNum();
      for (OutputEntry oe : rule.getOutputEntries()) {
        Cell cell = row.createCell(opCellIndex);
        cell.setCellValue(oe.getTextContent());
        sheet.autoSizeColumn(opCellIndex);
        opCellIndex++;
      }

      Cell cell = row.createCell(opCellIndex);
      cell.setCellValue(
          rule.getDescription() != null ? rule.getDescription().getTextContent() : null);
      sheet.autoSizeColumn(opCellIndex);

      index++;
    }
  }
}
