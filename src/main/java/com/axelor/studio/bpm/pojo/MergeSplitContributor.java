package com.axelor.studio.bpm.pojo;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MergeSplitContributor {
  private Long id;
  private String diagramXml;
  private List<String> participants;
}
