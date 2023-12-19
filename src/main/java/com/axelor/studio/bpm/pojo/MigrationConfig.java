
package com.axelor.studio.bpm.pojo;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class MigrationConfig {
    private List<MigrationInstance> migration;

    public MigrationConfig() {}
}