import React, { useState, useEffect } from "react";
import moment from "moment";
import { nanoid } from "nanoid";
import { makeStyles } from "@material-ui/core/styles";

import { getInfo } from "../../../../../services/api";
import { COLORS } from "../../../constants";
import {
  getComments,
  addComment,
  removeComment,
  updateComment,
} from "../../../extra";
import { translate } from "../../../../../utils";
import { Button, Box, Input } from "@axelor/ui";
import { MaterialIcon } from "@axelor/ui/icons/material-icon";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 10,
  },
  groupLabel: {
    fontWeight: "bolder",
    display: "inline-block",
    verticalAlign: "middle",
    fontSize: "120%",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
  },
  label: {
    display: "inline-block",
    verticalAlign: "middle",
    margin: "10px 0px",
    transition: "margin 0.218s linear",
    fontStyle: "italic",
    color: "rgba(var(--bs-body-color-rgb),.65) !important",
    fontSize: "var(--ax-theme-panel-header-font-size, 1rem)",
  },
  comments: {
    overflowY: "auto",
    overflowX: "hidden",
  },
  reply: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    marginLeft: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  small: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    overflow: "hidden",
    fontSize: "1.25rem",
    flexShrink: 0,
    lineHeight: 1,
    userSelect: "none",
    justifyContent: "center",
    color: "var(--white)",
  },
  sublabel: {
    fontSize: 14,
    margin: "10px 0px",
    fontStyle: "italic",
  },
  buttons: {
    minWidth: 64,
    margin: theme.spacing(1),
    textTransform: "none",
  },
}));

const avatarColor = {};

const getColor = () => {
  let no = Math.round(Math.random() * 10) % COLORS.length;
  let values = Object.values(avatarColor) || [];
  if (values.includes(COLORS[no])) {
    if (values.length === COLORS.length || values.includes("gray")) {
      return "gray";
    }
    getColor();
  } else {
    return COLORS[no];
  }
};

const getAvatarColor = (id) => {
  if (avatarColor[id]) return avatarColor[id];
  let color = getColor();
  if (color) {
    return (avatarColor[id] = color);
  }
};

export default function Comments({ element, updateCommentsCount }) {
  const [comment, setComment] = useState("");
  const [editComment, setEditComment] = useState(null);
  const [comments, setComments] = useState(null);
  const [user, setUser] = useState(null);
  const classes = useStyles();

  const getCommentGroups = (comments) => {
    const groups = comments.reduce((groups, game) => {
      const date = game[1];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push([...game, false]);
      return groups;
    }, {});
    return groups;
  };

  const addNewComment = () => {
    addComment(
      element,
      user,
      moment().format("DD/MM/YYYY"),
      moment().format("HH.mm"),
      comment,
      nanoid()
    );
    let comments = getComments(element);
    setComments(getCommentGroups(comments));
    setComment("");
    updateCommentsCount(true);
  };

  const updateEdit = (key, id, value, valueIndex) => {
    const cloneElements = { ...comments };
    let index = cloneElements[key].findIndex((f) => f.includes(id));
    if (index > -1) {
      cloneElements[key][index][valueIndex] = value;
      setComments(cloneElements);
    }
  };

  const removeNewComment = (key, id) => {
    const cloneElements = { ...comments };
    let index = cloneElements[key].findIndex((f) => f.includes(id));
    if (index > -1) {
      cloneElements[key].splice(index, 1);
      if (cloneElements[key]?.length === 0) {
        delete cloneElements[key];
      }
      setComments(cloneElements);
    }
  };

  const renderKey = (key) => {
    if (key === moment().format("DD/MM/YYYY")) {
      return "Today";
    } else if (key === moment().subtract(1, "days").format("DD/MM/YYYY")) {
      return "Yesterday";
    } else {
      return key;
    }
  };

  useEffect(() => {
    async function getUser() {
      const info = await getInfo();
      setUser(info?.user?.name || "");
    }
    getUser();
  }, []);

  useEffect(() => {
    let comments = getComments(element);
    setComments(getCommentGroups(comments));
  }, [element]);

  return (
    <div className={classes.root}>
      {comments && Object.keys(comments).length === 0 && (
        <Box color="body" d="flex" alignItems="center">
          <div style={{ marginRight: 20 }}>
            <MaterialIcon icon="add_comment" fontSize={25} />
          </div>
          <div>
            <div className={classes.groupLabel}>
              {translate("Add comments")}
            </div>
            <div className={classes.sublabel}>
              {translate(
                "You can add comments about diagrams or specific BPMN elements."
              )}
            </div>
          </div>
        </Box>
      )}
      <div>
        <div className={classes.reply}>
          <Input
            as="textarea"
            placeholder={translate("Write your comment here")}
            onChange={(e) => setComment(e.target.value)}
            value={comment}
            rows={2}
          />
          <Button
            size="sm"
            variant="primary"
            className={classes.icon}
            onClick={addNewComment}
            disabled={!(comment || "").trim()}
          >
            {translate("Post")}
          </Button>
        </div>
        <div className={classes.comments}>
          {comments &&
            Object.entries(comments).map(([key, value]) => (
              <div key={key}>
                <Box color="body" className={classes.label}>
                  {renderKey(key)}
                </Box>
                <div>
                  {value?.length > 0 &&
                    value?.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          margin: "10px 0px",
                        }}
                      >
                        <div style={{ marginRight: 10 }}>
                          <Box
                            d="flex"
                            position="relative"
                            alignItems="center"
                            className={classes.small}
                            style={{
                              background: getAvatarColor(
                                c && c[0] && c[0].charAt(0)
                              ),
                            }}
                          >
                            {c && c[0] && c[0].charAt(0)}
                          </Box>
                        </div>
                        <div style={{ width: "calc(100% - 85px)" }}>
                          <Box color="body">
                            <Box d="flex" alignItems="center">
                              <div
                                style={{
                                  fontWeight: "bold",
                                  fontSize: 14,
                                  marginRight: 20,
                                }}
                              >
                                {(c && c[0]) || "Admin"}
                              </div>
                              <div>{c && c[2] && c[2].replace(".", ":")}</div>
                            </Box>
                            {c && c[5] ? (
                              <React.Fragment>
                                <Input
                                  as="textarea"
                                  onChange={(e) =>
                                    setEditComment(e.target.value)
                                  }
                                  defaultValue={c && c[3]}
                                  placeholder={translate("Comment")}
                                  rows={1}
                                />
                                <Button
                                  className={classes.buttons}
                                  variant="primary"
                                  onClick={() => {
                                    updateEdit(key, c && c[4], false, 5);
                                    updateEdit(key, c && c[4], editComment, 3);
                                    updateComment(element, c, editComment);
                                  }}
                                >
                                  {translate("Update comment")}
                                </Button>
                                <Button
                                  className={classes.buttons}
                                  variant="primary"
                                  onClick={() => {
                                    updateEdit(key, c && c[4], false, 5);
                                  }}
                                >
                                  {translate("Cancel")}
                                </Button>
                              </React.Fragment>
                            ) : (
                              <div
                                style={{
                                  whiteSpace: "pre-wrap",
                                  overflowWrap: "break-word",
                                }}
                              >
                                {c && c[3]}
                              </div>
                            )}
                          </Box>
                        </div>
                        <Box color="body" d="flex" alignItems="center">
                          <Button
                            size="sm"
                            variant="light"
                            className={classes.icon}
                            onClick={() => updateEdit(key, c && c[4], true, 5)}
                          >
                            <MaterialIcon icon="edit" fontSize={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            className={classes.icon}
                            onClick={() => {
                              removeNewComment(key, c && c[4]);
                              removeComment(element, c);
                              updateCommentsCount(false);
                            }}
                          >
                            <MaterialIcon icon="delete" fontSize={16} />
                          </Button>
                        </Box>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
