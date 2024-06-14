import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import ReorderIcon from '@material-ui/icons/Reorder';
import Close from '@material-ui/icons/Close';
import AddRounded from '@material-ui/icons/AddRounded';
import { makeStyles } from '@material-ui/core/styles';
import get from 'lodash/get';
import classNames from 'classnames';

import FieldPopover from './components/Popover';
import Tooltip from './components/Tooltip';
import { Selection } from './components/form';
import { DNDRow, SearchField, ValueField } from './components/table';
import ExpressionField from './components/table/ExpressionField';

import ModelField, { isRelationalField } from './components/table/ModelField';
import {
  getOptionDisabled,
  getTargetName,
  getOptions,
  getType,
} from './DataTable.utils';
import { VALUE_FROM } from './utils';
import { translate } from './utils';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  TextField,
} from '@axelor/ui';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    paddingBottom: '10%'
  },
  table: {
    minWidth: 650,
  },
  tableCell: {
    textAlign: 'center',
    verticalAlign: 'middle',
  },
  valueInputContainer: {
    position: 'relative',
  },
  iconButton: {
    padding: '8px',
  },
  deleteIcon: {
    color: 'var(--bs-body-color)',
  },
  addFieldButton: {
    margin: theme.spacing(1),
    textTransform: 'none',
  },
  move: {
    cursor: 'move',
  },
  flex: {
    display: 'flex',
  },
}));

function DataTable(props) {
  const classes = useStyles();
  const [searchText, setSearchText] = React.useState('');
  const [popover, setPopover] = React.useState(false);
  const {
    data = [],
    metaFields = [],
    sourceModel,
    targetModel,
    newRecord,
    onRowAdd,
    onRowChange,
    onReorder,
    onRemove,
    isBPMN,
    getProcesses,
    getProcessElement,
    isDMNAllow,
    getDMNValues,
  } = props;
  const isDMN = isDMNAllow && isDMNAllow();

  const openPopover = React.useCallback(() => {
    setPopover(true);
  }, []);

  const closePopover = React.useCallback(() => {
    setPopover(false);
  }, []);

  const defaultFrom = sourceModel ? VALUE_FROM.SOURCE : VALUE_FROM.NONE;

  const handleChange = React.useCallback(
    async (e, key, rowIndex, row) => {
      const nameField = e.target.nameField;
      let value = e.target.value;
      let selectedValue = value;

      const from = get(row, 'value.from', defaultFrom);

      if ((value || value === false) && key === 'selected') {
        let _value = value;
        let targetName = value
          ? getTargetName(row, value, nameField)
          : get(row, `value.${key}.targetName`);

        if (
          isRelationalField(row) &&
          (!from || from === VALUE_FROM.NONE) &&
          typeof _value === 'object'
        ) {
          if (targetName === '_selectId') {
            _value = value['id'];
          } else {
            _value = value && value[targetName];
          }
        }

        selectedValue = {
          value: _value,
        };
        if (from === VALUE_FROM.NONE && isRelationalField(row)) {
          selectedValue.targetName = targetName;
        }

        value = selectedValue;
      }

      onRowChange(e, key, value, rowIndex, row);
    },
    [onRowChange, defaultFrom]
  );

  const renderRow = React.useCallback(
    (row, index, parentRow) => {
      const values = row.value || {};
      const from = values.from || defaultFrom;

      function getOnChange(fieldName, mapper = (e) => ({ value: e })) {
        return (e) =>
          handleChange({ target: mapper(e) }, fieldName, index, row);
      }
      return (
        <DNDRow
          index={index}
          key={row.key || index}
          id={row.name}
          onMove={onReorder}
        >
          {({ style, className, handlerId, dragRef, dropRef, previewRef }) => (
            <TableRow
              data-handler-id={handlerId}
              ref={(ref) => {
                dropRef(ref);
                previewRef(ref);
              }}
              style={{ ...style }}
              className={className}
              color="body"
            >
              <TableCell
                className={classNames(classes.move, classes.tableCell)}
                ref={dragRef}
              >
                <div className={classes.flex}>
                  <ReorderIcon />
                </div>
              </TableCell>
              <TableCell className={classes.tableCell}>
                <ModelField item={row} handleAdd={onRowAdd} />
              </TableCell>
              <TableCell className={classes.tableCell}>=</TableCell>

              <TableCell
                className={classNames(
                  classes.valueInputContainer,
                  classes.addFieldButton.tableCell
                )}
              >
                <ValueField
                  classes={classes}
                  values={values}
                  row={row}
                  isBPMN={isBPMN}
                  parentRow={parentRow}
                  builderFields={data}
                  metaFields={metaFields}
                  targetModel={targetModel}
                  sourceModel={sourceModel}
                  getOnChange={getOnChange}
                  getProcesses={getProcesses}
                  getProcessElement={getProcessElement}
                  getDMNValues={getDMNValues}
                />
              </TableCell>
              {isDMN && (
                <TableCell size="small" className={classes.tableCell}>
                  {from === VALUE_FROM.DMN &&
                    ['many_to_one', 'json_many_to_one'].includes(
                      getType(row)
                    ) && (
                      <SearchField
                        row={row}
                        value={row?.searchField}
                        onChange={getOnChange('searchField')}
                      />
                    )}
                </TableCell>
              )}
              <TableCell className={classes.tableCell}>
                <ExpressionField
                  selected={row.condition}
                  onSelectedChange={getOnChange('condition')}
                  expression={row.conditionMeta}
                  onExpressionChange={getOnChange('conditionMeta')}
                />
              </TableCell>

              <TableCell size="small" className={classes.tableCell}>
                <Selection
                  disableClearable
                  options={getOptions(
                    parentRow,
                    defaultFrom,
                    isBPMN,
                    isDMN,
                    row
                  )}
                  value={from || defaultFrom}
                  getOptionDisabled={(option) =>
                    getOptionDisabled(option, parentRow, sourceModel)
                  }
                  onChange={getOnChange('from')}
                />
              </TableCell>
              <TableCell className={classes.tableCell}>
                <IconButton
                  size="medium"
                  onClick={() => onRemove(row, index)}
                  className={classes.iconButton}
                >
                  <Tooltip title="Remove field">
                    <Close fontSize="small" className={classes.deleteIcon} />
                  </Tooltip>
                </IconButton>
              </TableCell>
            </TableRow>
          )}
        </DNDRow>
      );
    },
    [
      classes,
      handleChange,
      metaFields,
      sourceModel,
      targetModel,
      defaultFrom,
      onRowAdd,
      onReorder,
      onRemove,
      isBPMN,
      getProcesses,
      getProcessElement,
      isDMN,
      getDMNValues,
      data,
    ]
  );

  const selectedFields = React.useMemo(() => {
    const builderFields = data.map((f) => f.name);
    return metaFields
      .filter(
        (item) =>
          newRecord && item.required && !builderFields.includes(item.name)
      )
      .map((item) => item.name);
  }, [data, metaFields, newRecord]);

  return (
    <Box shadow rounded={2} bgColor="body-tertiary" className={classes.root}>
      {targetModel && (
        <Box d="flex" alignItems="center" justifyContent="space-between">
          <Button
            border
            color="body"
            bgColor="body"
            className={classes.addFieldButton}
            onClick={openPopover}
            d="flex"
            alignItems="center"
            gap={4}
          >
            {translate('Add fields')}
            <AddRounded style={{ fontSize: '1.25rem' }} />
          </Button>
          <TextField
            color="body"
            size="lg"
            className={classes.searchField}
            placeholder={translate("Filter field")}
            style={{ margin: '0 8px', minWidth: 250 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Box>
      )}
      <Box overflow="auto" maxH={100} maxW={100}>
        <Table
          className={classes.table}
          aria-label="simple table"
          rounded="pill"
          overflow="auto"
        >
          <colgroup>
            <col style={{ width: '3%' }} />
            <col style={{ width: '27%', minWidth: 150 }} />
            <col style={{ width: '15px' }} />
            <col
              style={
                isBPMN
                  ? { width: '50%', minWidth: 200 }
                  : { width: '30%', minWidth: 160 }
              }
            />
            {isDMN && <col style={{ width: '10%', minWidth: 200 }} />}
            <col style={{ width: '20%', minWidth: 250 }} />
            <col style={{ width: '210px', minWidth: 230 }} />
            <col style={{ width: '5%' }} />
          </colgroup>
          <TableHead pos="sticky" position="sticky">
            <TableRow>
              <TableCell className={classes.tableCell}>&nbsp;</TableCell>
              <TableCell className={classes.tableCell}>
                {translate('Field name')}
              </TableCell>
              <TableCell className={classes.tableCell}></TableCell>
              <TableCell className={classes.tableCell}>
                {translate('Value')}
              </TableCell>
              {isDMN && (
                <TableCell className={classes.tableCell}>
                  {translate('Search field')}
                </TableCell>
              )}
              <TableCell className={classes.tableCell}>
                {translate('Condition')}
              </TableCell>
              <TableCell className={classes.tableCell}>
                {translate('Value from')}
              </TableCell>
              <TableCell className={classes.tableCell}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => {
              if (
                searchText &&
                !row.name.toLowerCase().includes(searchText.toLowerCase())
              ) {
                return null;
              }
              return renderRow(row, index);
            })}
          </TableBody>
        </Table>
      </Box>

      {popover && (
        <FieldPopover
          open
          selectItems={selectedFields}
          data={metaFields}
          onSubmit={onRowAdd}
          onClose={closePopover}
        />
      )}
    </Box>
  );
}

export default DataTable;
