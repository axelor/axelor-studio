import React from 'react';
import { Select } from '.';
import { Add, Edit } from '@material-ui/icons';
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    header: {
        width: '100%',
        display:'flex',
    },
    icon: {
        color: 'green',
        width: '1.6em',
        height: '1.2em',
    }
}));

export default function SelectComponent({ entry, element, bpmnModeler, onChange, addButton, editButton
}) {
    const classes = useStyles();
    const { edit = true,change = true,name} = entry
    return (
        <div className={classes.header}>
            <Select
                entry={entry}
                element={element}
                bpmnModeler={bpmnModeler}
                onChange={change ? onChange : null}
            />
            {edit &&
                <Add
                    className={classes.icon}
                    style={{ marginTop: 'auto', marginBottom: 4 ,cursor:"pointer"}}
                    onClick={addButton}
                />}
            {edit && element.businessObject[name] !== null &&
                <OpenInNewIcon
                    className={classes.icon}
                    style={{ marginTop: 'auto', marginBottom: 4, cursor:"pointer" }}
                    onClick={editButton}
                />
            }

        </div>
    );
}
