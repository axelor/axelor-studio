import React from 'react';
import classNames from 'classnames';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import TextField from '@material-ui/core/TextField';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import ReorderIcon from '@material-ui/icons/Reorder';
import Close from '@material-ui/icons/Close';
import AddRounded from '@material-ui/icons/AddRounded';
import { makeStyles } from '@material-ui/core/styles';
import get from 'lodash/get';

import FieldPopover from './components/Popover';
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

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    overflowX: 'auto',
    height: 'calc(100% - 120px)',
    overflowY: 'auto',
  },
  table: {
    minWidth: 650,
    '& td': {
      padding: '0.3rem 0.5rem !important',
    },
    '& th': {
      paddingLeft: 0,
      textAlign: 'center',
    },
  },
  tableRowRoot: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
    '& .MuiInput-underline:before': {
      borderBottom: 0,
    },
  },
  valueInputContainer: {
    position: 'relative',
  },
  iconButton: {
    padding: '8px',
  },
  deleteIcon: {
    color: '#0275d8',
  },
  addFieldButton: {
    margin: theme.spacing(1),
    textTransform: 'none',
  },
  searchField: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: '2.7%',
    '&>div': {
      marginTop: 10,
      minWidth: 230,
    },
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
              classes={{ root: classNames(classes.tableRowRoot, className) }}
            >
              <TableCell className={classes.move} align="left" ref={dragRef}>
                <div className={classes.flex}>
                  <ReorderIcon />
                </div>
              </TableCell>
              <TableCell>
                <ModelField item={row} handleAdd={onRowAdd} />
              </TableCell>
              <TableCell>=</TableCell>

              <TableCell className={classes.valueInputContainer}>
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
                <TableCell size="small">
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
              <TableCell>
                <ExpressionField
                  selected={row.condition}
                  onSelectedChange={getOnChange('condition')}
                  expression={row.conditionMeta}
                  onExpressionChange={getOnChange('conditionMeta')}
                />
              </TableCell>

              <TableCell size="small">
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
              <TableCell>
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
    <Paper className={classes.root}>
      {targetModel && (
        <Grid container style={{ backgroundColor: '#FAFAFA' }}>
          <Button
            variant="outlined"
            color="primary"
            className={classes.addFieldButton}
            style={isBPMN ? null : { marginLeft: 20 }}
            onClick={openPopover}
            endIcon={<AddRounded style={{ fontSize: '1.25rem' }} />}
          >
            {translate('Add fields')}
          </Button>
          <TextField
            classes={{ root: classes.searchField }}
            placeholder="Filter field"
            style={isBPMN ? null : { paddingRight: '4.6%' }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Grid>
      )}
      <Table
        className={classes.table}
        aria-label="simple table"
        stickyHeader={true}
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
        <TableHead>
          <TableRow>
            <TableCell align="left">&nbsp;</TableCell>
            <TableCell>{translate('Field name')}</TableCell>
            <TableCell></TableCell>
            <TableCell>{translate('Value')}</TableCell>
            {isDMN && <TableCell>{translate('Search field')}</TableCell>}
            <TableCell>{translate('Condition')}</TableCell>
            <TableCell>{translate('Value from')}</TableCell>
            <TableCell></TableCell>
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

      {popover && (
        <FieldPopover
          open
          selectItems={selectedFields}
          data={metaFields}
          onSubmit={onRowAdd}
          onClose={closePopover}
        />
      )}
    </Paper>
  );
}

export default DataTable;
