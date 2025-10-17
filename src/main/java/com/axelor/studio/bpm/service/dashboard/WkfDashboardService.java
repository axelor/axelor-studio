/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service.dashboard;

import java.time.LocalDate;
import java.util.List;

public interface WkfDashboardService {

  /**
   * Get the record of meta model or meta json model for the particular month.
   *
   * @param tableName
   * @param status
   * @param month
   * @param jsonModel
   * @return
   */
  List<Long> getStatusPerMonthRecord(
      String tableName, String status, String month, String jsonModel);

  /**
   * Get the record of meta model or meta json model for the particular day.
   *
   * @param tableName
   * @param status
   * @param day
   * @param jsonModel
   * @return
   */
  List<Long> getStatusPerDayRecord(String tableName, String status, String day, String jsonModel);

  /**
   * Get the record of meta model or meta json model for time spent on the particular status.
   *
   * @param tableName
   * @param status
   * @param fromDate
   * @param toDate
   * @param jsonModel
   * @return
   */
  List<Long> getTimespentPerStatusRecord(
      String tableName, String status, LocalDate fromDate, LocalDate toDate, String jsonModel);
}
