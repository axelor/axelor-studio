import React, { useEffect } from 'react';
import classNames from 'classnames';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import CardActions from '@material-ui/core/CardActions';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import { translate } from '../utils';

const useStyles = makeStyles({
  dialogPaper: {
    minHeight: '75vh',
    maxHeight: '75vh',
  },
  cardContent: {
    height: '100%',
    minWidth: 250,
    paddingLeft: 0,
    paddingRight: 0,
  },
  cardContentItemText: {
    fontSize: 12,
    lineHeight: 0.5,
    paddingBottom: 8,
  },
  cardContentItemContainer: {
    marginLeft: 10,
  },
  cardContentItemTitle: {
    fontSize: 16,
  },
  cardActionView: {
    justifyContent: 'flex-end',
  },
  noFields: {
    textAlign: 'center',
    color: 'gray',
  },
  dialogTitle: {
    '& > h2': {
      display: 'flex',
      justifyContent: 'space-between',
    },
  },
  subHeaderRow: {
    borderBottom: '1px solid #eee',
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 8,
    display: 'flex',
  },
  fieldListViewContainer: {
    marginLeft: 16,
    marginRight: 2,
    marginTop: 8,
    overflowY: 'auto',
    height: '53.8vh',
  },
  searchField: {
    width: '75%',
    '& input': {
      padding: '8px 0 7px !important',
    },
  },
  checkbox: {
    color: '#2185D0 !important',
  },
  checkboxChecked: {
    color: '#2185D0 !important',
    backgrounColor: '#2185D0 !important',
  },
  selectButton: {
    backgroundColor: '#0275d8',
    textTransform: 'capitalize',
    '&:hover': {
      backgroundColor: '#025aa5',
      borderColor: '#014682',
    },
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#cccccc',
    textTransform: 'capitalize',
    color: '#333333',
    '&:hover': {
      backgroundColor: '#e6e6e6',
      borderColor: '#adadad',
    },
  },
  required: {
    color: '#f44336',
  },
});

const getFilteredFields = (_list, text) => {
  const list = _list.sort((item1, item2) =>
    item1.required ? (item2.required ? 0 : -1) : 1
  );
  if (!text) {
    return list;
  }
  return list.filter((item) => {
    return (
      (item.title || '').toLowerCase().includes(text.toLowerCase()) ||
      (item.name || '').toLowerCase().includes(text.toLowerCase())
    );
  });
};

const defaultSelectItems = [];

function FieldPopoverComponent({
  selectItems = defaultSelectItems,
  data,
  onSubmit,
  open,
  onClose,
}) {
  const classes = useStyles();
  const [selected, setSelected] = React.useState([]);
  const [searchText, setSearchText] = React.useState('');

  const selectAll = React.useMemo(
    () => selected.length === data.length,
    [data, selected]
  );

  useEffect(() => {
    // reset state
    if (open && selectItems) {
      setSelected(selectItems);
    }
  }, [open, selectItems]);

  const handleClose = React.useCallback(
    (e) => {
      e.stopPropagation();
      setSelected([]);
      onClose();
    },
    [onClose]
  );

  const handleSubmit = (e) => {
    e.stopPropagation();
    const list = data.filter((d, index) => selected.indexOf(d.name) !== -1);
    onSubmit && onSubmit(list);
    handleClose(e);
  };

  const handleCheckbox = (e) => {
    e.stopPropagation();
    const { value } = e.target;
    setSelected((selected) => {
      if (selected.indexOf(value) !== -1) {
        return [...selected.filter((v) => v !== value)];
      } else {
        return [...selected, value];
      }
    });
  };

  const handleSelectAll = (_selectAll) => {
    if (_selectAll) {
      setSelected(data.map((f) => f.name));
    } else {
      setSelected(selectItems);
    }
  };

  const handleFieldSearch = React.useCallback((e) => {
    setSearchText(e.target.value);
  }, []);

  useEffect(() => {
    setSearchText('');
  }, [open]);

  return (
    <React.Fragment>
      <Dialog
        fullWidth={true}
        open={open}
        classes={{ paper: classes.dialogPaper }}
        onClose={handleClose}
        aria-labelledby="scroll-dialog-title"
      >
        <DialogTitle id="scroll-dialog-title" className={classes.dialogTitle}>
          <span>{translate('Select fields')}</span>
        </DialogTitle>

        <DialogContent dividers={true} classes={{ root: classes.cardContent }}>
          <div className={classes.subHeaderRow}>
            <FormControlLabel
              control={
                <Checkbox
                  classes={{
                    root: classes.checkbox,
                    checked: classes.checkboxChecked,
                  }}
                  onChange={() => handleSelectAll(!selectAll)}
                  value={selectAll}
                  checked={selectAll}
                />
              }
            />
            <TextField
              classes={{ root: classes.searchField }}
              placeholder={translate('Search fields')}
              onChange={(e) => handleFieldSearch(e)}
            />
          </div>
          <div className={classes.fieldListViewContainer}>
            {getFilteredFields(data, searchText).map((field, i) => (
              <Grid container key={i}>
                <FormControlLabel
                  control={
                    <Checkbox
                      classes={{ root: classes.checkbox }}
                      onChange={(e) => {
                        if (!selectItems.includes(field.name)) {
                          handleCheckbox(e);
                        }
                      }}
                      value={field.name}
                      checked={selected.indexOf(field.name) !== -1}
                    />
                  }
                  label={
                    <div className={classes.cardContentItemContainer}>
                      <Typography
                        className={classNames(classes.cardContentItemTitle, {
                          [classes.required]: field.required,
                        })}
                      >
                        {field.title}
                      </Typography>
                      <Typography
                        className={classNames(classes.cardContentItemText, {
                          [classes.required]: field.required,
                        })}
                      >
                        {field.name}
                      </Typography>
                    </div>
                  }
                />
              </Grid>
            ))}
            {data.length === 0 && (
              <Typography className={classes.noFields}>
                {translate('No fields available')}
              </Typography>
            )}
          </div>
        </DialogContent>
        <CardActions className={classes.cardActionView}>
          <Button
            className={classes.cancelButton}
            variant="contained"
            color="secondary"
            onClick={handleClose}
          >
            {translate('Close')}
          </Button>
          <Button
            className={classes.selectButton}
            variant="contained"
            color="primary"
            onClick={handleSubmit}
          >
            {translate('OK')}
          </Button>
        </CardActions>
      </Dialog>
    </React.Fragment>
  );
}

export default React.memo(FieldPopoverComponent);
