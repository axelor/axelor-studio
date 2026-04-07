/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.dto;

/** Reference to a linked AOS business record (MetaModel or MetaJsonModel). */
public record LinkedObjectDto(
    String modelName, String modelFullName, long recordId, String displayName) {}
