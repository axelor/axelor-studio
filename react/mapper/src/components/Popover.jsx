import React, { useEffect } from 'react';
import { translate } from '../utils';
import {
  Button,
  Dialog,
  DialogHeader,
  DialogContent,
  DialogFooter,
  Input,
  TextField,
  Box,
  InputLabel,
} from '@axelor/ui';
import styles from './Popover.module.css';

const getFilteredFields = (_list, text) => {
  const list = _list.sort((item1, item2) => {
    if (item1.required && !item2.required) {
      return -1;
    } else if (!item1.required && item2.required) {
      return 1;
    } else {
      return 0;
    }
  });
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
  styles;

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
    <Dialog open={open} centered>
      <DialogHeader className={styles.dialogTitle} onCloseClick={handleClose}>
        <h4>{translate('Select fields')}</h4>
      </DialogHeader>

      <DialogContent px={0}>
        <Box className={styles.subHeaderRow}>
          <Input
            fontSize={5}
            type="checkbox"
            onChange={() => handleSelectAll(!selectAll)}
            value={selectAll}
            checked={selectAll}
            style={{ marginRight: 16 }}
          />
          <Box w={100}>
            <TextField
              className={styles.searchField}
              placeholder={translate('Search fields')}
              onChange={(e) => handleFieldSearch(e)}
            />
          </Box>
        </Box>
        <div className={styles.fieldListViewContainer}>
          {getFilteredFields(data, searchText).map((field, i) => (
            <Box d="flex" alignItems="center" gap={8} key={i}>
              <Input
                type="checkbox"
                fontSize={5}
                onChange={(e) => {
                  if (!selectItems.includes(field.name)) {
                    handleCheckbox(e);
                  }
                }}
                id={field.name}
                value={field.name}
                checked={selected.indexOf(field.name) !== -1}
              />
              <Box
                d="flex"
                flexDirection="column"
                justifyContent="center"
                style={{ marginLeft: 10 }}
              >
                <InputLabel
                  htmlFor={field.name}
                  invalid={field.required}
                  style={{ marginBottom: 0, fontSize: 16 }}
                >
                  {field.title}
                </InputLabel>
                <InputLabel
                  htmlFor={field.name}
                  invalid={field.required}
                  style={{ marginBottom: 0, fontSize: 12 }}
                >
                  {field.name}
                </InputLabel>
              </Box>
            </Box>
          ))}
          {data.length === 0 && (
            <InputLabel d="flex" justifyContent="center" color="body">
              {translate('No fields available')}
            </InputLabel>
          )}
        </div>
      </DialogContent>
      <DialogFooter>
        <Button
          className={styles.save}
          variant="primary"
          onClick={handleSubmit}
        >
          {translate('OK')}
        </Button>
        <Button
          className={styles.save}
          variant="secondary"
          onClick={handleClose}
        >
          {translate('Close')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default React.memo(FieldPopoverComponent);
