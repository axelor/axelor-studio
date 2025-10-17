/*
 * SPDX-FileCopyrightText: Axelor <https://axelor.com>
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
package com.axelor.studio.bpm.service;

import com.axelor.studio.bpm.pojo.MergeSplitContributor;
import com.axelor.studio.bpm.pojo.MergeSplitResult;
import java.util.List;

public interface WkfModelMergerSplitterService {
  String merge(List<MergeSplitContributor> contributors);

  List<String> split(MergeSplitContributor contributor);

  List<Long> save(
      List<MergeSplitResult> results, List<MergeSplitContributor> contributors, boolean deploy);

  String getMergeUrl(List<Integer> ids);

  String getSplitUrl(List<Integer> ids);
}
