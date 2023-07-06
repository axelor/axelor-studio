import React from 'react';

import Input from '@material-ui/core/Input';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import CreateIcon from '@material-ui/icons/Create';
import IconButton from '@material-ui/core/IconButton';
import Close from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';

import ExpressionBuilder from 'generic-builder/src/expression-builder';
import classNames from 'classnames';
import { fetchModelByFullName } from '../../services/api';
import { translate } from '../../utils';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    cursor: 'pointer',
  },
  dialogPaper: {
    minHeight: '50%',
    maxHeight: '100%',
    minWidth: '50%',
    maxWidth: '100%',
    resize: 'both',
  },
  cancelButton: {
    margin: theme.spacing(1),
    backgroundColor: '#fff',
    borderColor: '#cccccc',
    textTransform: 'capitalize',
    color: '#333333',
    '&:hover': {
      backgroundColor: '#e6e6e6',
      borderColor: '#adadad',
    },
  },
  readOnly: {
    color: '#7E7E7E',
    backgroundColor: '#f5f5f5',
    padding: '0 0.1rem',
  },
}));

function ExpressionBuilderDummy() {
  return <p>Integrate Generic builder</p>;
}

export default function ExpressionField({
  parameters,
  target,
  selected,
  onSelectedChange,
  expression,
  onExpressionChange,
  error,
}) {
  const classes = useStyles();

  const [open, setOpen] = React.useState(false);
  const [defaultModel, setDefaultModel] = React.useState(null);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleExpression = (val, exprVal) => {
    if (val && exprVal) {
      onSelectedChange(val);
      onExpressionChange(exprVal);
      handleClose();
    }
  };

  const handleRemove = () => {
    onSelectedChange(null);
    onExpressionChange(null);
  };

  React.useEffect(() => {
    if (target) {
      (async () => {
        const data = await fetchModelByFullName(target);
        setDefaultModel(data);
      })();
    }
  }, [target]);

  return (
    <div className={classes.container}>
      <Input
        value={selected || ''}
        fullWidth={true}
        onChange={(e) => {
          onSelectedChange(e.target.value);
          onExpressionChange(null);
        }}
        className={classNames({ [classes.readOnly]: parameters })}
        disabled={parameters && true}
        disableUnderline={parameters && !error && true}
        error={error && (!selected || selected?.trim() === '')}
      />
      {selected && parameters && (
        <IconButton size="small" onClick={handleRemove}>
          <Close
            color="action"
            fontSize="small"
            titleAccess={translate('Clear')}
          />
        </IconButton>
      )}
      <IconButton size="small" onClick={handleClickOpen}>
        <CreateIcon
          color="action"
          fontSize="small"
          titleAccess={translate('Edit')}
        />
      </IconButton>
      <Dialog
        open={open}
        onClose={handleClose}
        classes={{ paper: classes.dialogPaper }}
      >
        <DialogContent>
          {ExpressionBuilder ? (
            <ExpressionBuilder
              parameters={parameters}
              defaultModel={defaultModel}
              onSave={handleExpression}
              exprVal={expression}
              isMapper={true}
              dialogActionButton={
                <Button
                  onClick={handleClose}
                  variant="contained"
                  size="small"
                  className={classes.cancelButton}
                >
                  {translate('Cancel')}
                </Button>
              }
            />
          ) : (
            <ExpressionBuilderDummy />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
