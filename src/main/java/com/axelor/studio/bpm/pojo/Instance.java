package com.axelor.studio.bpm.pojo;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class Instance {
  private List<String> name;
  private List<String> operations;

  public Instance() {}
}
